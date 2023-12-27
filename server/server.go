package server

import (
	"context"
	"database/sql"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"net/rpc"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/dbutils"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/handlers"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/rest"
	ytdlpRPC "github.com/marcopeocchi/yt-dlp-web-ui/server/rpc"

	_ "modernc.org/sqlite"
)

type serverConfig struct {
	frontend fs.FS
	host     string
	port     int
	mdb      *internal.MemoryDB
	db       *sql.DB
	mq       *internal.MessageQueue
}

func RunBlocking(host string, port int, frontend fs.FS, dbPath string) {
	var mdb internal.MemoryDB
	mdb.Restore()

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalln(err)
	}

	err = dbutils.AutoMigrate(context.Background(), db)
	if err != nil {
		log.Fatalln(err)
	}

	mq := internal.NewMessageQueue()
	go mq.Subscriber()

	srv := newServer(serverConfig{
		frontend: frontend,
		host:     host,
		port:     port,
		mdb:      &mdb,
		mq:       mq,
		db:       db,
	})

	go gracefulShutdown(srv, &mdb)
	go autoPersist(time.Minute*5, &mdb)

	log.Fatal(srv.ListenAndServe())
}

func newServer(c serverConfig) *http.Server {
	service := ytdlpRPC.Container(c.mdb, c.mq)
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
	r.Use(middleware.Logger)

	app := http.FileServer(http.FS(c.frontend))

	r.Mount("/", app)

	// Archive routes
	r.Route("/archive", func(r chi.Router) {
		if config.Instance().RequireAuth {
			r.Use(middlewares.Authenticated)
		}
		r.Post("/downloaded", handlers.ListDownloaded)
		r.Post("/delete", handlers.DeleteFile)
		r.Get("/d/{id}", handlers.SendFile)
	})

	// Authentication routes
	r.Route("/auth", func(r chi.Router) {
		r.Post("/login", handlers.Login)
		r.Get("/logout", handlers.Logout)
	})

	// RPC handlers
	r.Route("/rpc", ytdlpRPC.ApplyRouter())

	// REST API handlers
	r.Route("/api/v1", rest.ApplyRouter(c.db, c.mdb, c.mq))

	return &http.Server{
		Addr:    fmt.Sprintf("%s:%d", c.host, c.port),
		Handler: r,
	}
}

func gracefulShutdown(srv *http.Server, db *internal.MemoryDB) {
	ctx, stop := signal.NotifyContext(context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
		syscall.SIGQUIT,
	)

	go func() {
		<-ctx.Done()
		log.Println("shutdown signal received")

		defer func() {
			db.Persist()
			stop()
			srv.Shutdown(context.TODO())
		}()
	}()
}

func autoPersist(d time.Duration, db *internal.MemoryDB) {
	for {
		db.Persist()
		time.Sleep(d)
	}
}
