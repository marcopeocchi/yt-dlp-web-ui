// a stupid package name...
package server

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"net/rpc"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/dbutil"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/handlers"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal/livestream"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/logging"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/openid"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/rest"
	ytdlpRPC "github.com/marcopeocchi/yt-dlp-web-ui/server/rpc"

	_ "modernc.org/sqlite"
)

type RunConfig struct {
	Host        string
	Port        int
	DBPath      string
	LogFile     string
	FileLogging bool
	App         fs.FS
	Swagger     fs.FS
}

type serverConfig struct {
	frontend fs.FS
	swagger  fs.FS
	host     string
	port     int
	mdb      *internal.MemoryDB
	db       *sql.DB
	mq       *internal.MessageQueue
}

func RunBlocking(cfg *RunConfig) {
	var mdb internal.MemoryDB

	logWriters := []io.Writer{
		os.Stdout,
		logging.NewObservableLogger(), // for web-ui
	}

	// file based logging
	if cfg.FileLogging {
		logger, err := logging.NewRotableLogger(cfg.LogFile)
		if err != nil {
			panic(err)
		}

		go func() {
			for {
				time.Sleep(time.Hour * 24)
				logger.Rotate()
			}
		}()

		logWriters = append(logWriters, logger)
	}

	logger := slog.New(slog.NewTextHandler(io.MultiWriter(logWriters...), &slog.HandlerOptions{
		Level: slog.LevelInfo, // TODO: detect when launched in debug mode -> slog.LevelDebug
	}))

	// make the new logger the default one with all the new writers
	slog.SetDefault(logger)

	db, err := sql.Open("sqlite", cfg.DBPath)
	if err != nil {
		slog.Error("failed to open database", slog.String("err", err.Error()))
	}

	if err := dbutil.Migrate(context.Background(), db); err != nil {
		slog.Error("failed to init database", slog.String("err", err.Error()))
	}

	mq, err := internal.NewMessageQueue()
	if err != nil {
		panic(err)
	}
	mq.SetupConsumers()

	go mdb.Restore(mq)

	srv := newServer(serverConfig{
		frontend: cfg.App,
		swagger:  cfg.Swagger,
		host:     cfg.Host,
		port:     cfg.Port,
		mdb:      &mdb,
		mq:       mq,
		db:       db,
	})

	go gracefulShutdown(srv, &mdb)
	go autoPersist(time.Minute*5, &mdb)

	var (
		network = "tcp"
		address = fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	)

	// support unix sockets
	if strings.HasPrefix(cfg.Host, "/") {
		network = "unix"
		address = cfg.Host
	}

	listener, err := net.Listen(network, address)
	if err != nil {
		slog.Error("failed to listen", slog.String("err", err.Error()))
		return
	}

	slog.Info("yt-dlp-webui started", slog.String("address", address))

	if err := srv.Serve(listener); err != nil {
		slog.Warn("http server stopped", slog.String("err", err.Error()))
	}
}

func newServer(c serverConfig) *http.Server {
	lm := livestream.NewMonitor()
	go lm.Schedule()
	go lm.Restore()

	go func() {
		for {
			lm.Persist()
			time.Sleep(time.Minute * 5)
		}
	}()

	service := ytdlpRPC.Container(c.mdb, c.mq, lm)
	rpc.Register(service)

	r := chi.NewRouter()

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{
			http.MethodHead,
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
		},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	r.Use(corsMiddleware.Handler)
	// use in dev
	// r.Use(middleware.Logger)

	baseUrl := config.Instance().BaseURL
	r.Mount(baseUrl+"/", http.StripPrefix(baseUrl, http.FileServerFS(c.frontend)))

	// swagger
	r.Mount("/openapi", http.FileServerFS(c.swagger))

	// Archive routes
	r.Route("/archive", func(r chi.Router) {
		if config.Instance().RequireAuth {
			r.Use(middlewares.Authenticated)
		}
		if config.Instance().UseOpenId {
			r.Use(openid.Middleware)
		}
		r.Post("/downloaded", handlers.ListDownloaded)
		r.Post("/delete", handlers.DeleteFile)
		r.Get("/d/{id}", handlers.DownloadFile)
		r.Get("/v/{id}", handlers.SendFile)
		r.Get("/bulk", handlers.BulkDownload(c.mdb))
	})

	// Authentication routes
	r.Route("/auth", func(r chi.Router) {
		r.Post("/login", handlers.Login)
		r.Get("/logout", handlers.Logout)

		r.Route("/openid", func(r chi.Router) {
			r.Get("/login", openid.Login)
			r.Get("/signin", openid.SingIn)
			r.Get("/logout", openid.Logout)
		})
	})

	// RPC handlers
	r.Route("/rpc", ytdlpRPC.ApplyRouter())

	// REST API handlers
	r.Route("/api/v1", rest.ApplyRouter(&rest.ContainerArgs{
		DB:  c.db,
		MDB: c.mdb,
		MQ:  c.mq,
	}))

	// Logging
	r.Route("/log", logging.ApplyRouter())

	return &http.Server{Handler: r}
}

func gracefulShutdown(srv *http.Server, db *internal.MemoryDB) {
	ctx, stop := signal.NotifyContext(context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
		syscall.SIGQUIT,
	)

	go func() {
		<-ctx.Done()
		slog.Info("shutdown signal received")

		defer func() {
			db.Persist()
			stop()
			srv.Shutdown(context.Background())
		}()
	}()
}

func autoPersist(d time.Duration, db *internal.MemoryDB) {
	for {
		if err := db.Persist(); err != nil {
			slog.Warn(
				"failed to persisted session",
				slog.String("err", err.Error()),
			)
		}
		slog.Debug("sucessfully persisted session")
		time.Sleep(d)
	}
}
