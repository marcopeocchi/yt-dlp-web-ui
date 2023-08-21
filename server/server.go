package server

import (
	"context"
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
	"github.com/marcopeocchi/yt-dlp-web-ui/server/handlers"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/rest"
	ytdlpRPC "github.com/marcopeocchi/yt-dlp-web-ui/server/rpc"
)

type serverConfig struct {
	frontend fs.FS
	port     int
	db       *internal.MemoryDB
	mq       *internal.MessageQueue
}

func RunBlocking(port int, frontend fs.FS) {
	var db internal.MemoryDB
	db.Restore()

	mq := internal.NewMessageQueue()
	go mq.Subscriber()

	srv := newServer(serverConfig{
		frontend: frontend,
		port:     port,
		db:       &db,
		mq:       mq,
	})

	go gracefulShutdown(srv, &db)
	go autoPersist(time.Minute*5, &db)

	log.Fatal(srv.ListenAndServe())
}

func newServer(c serverConfig) *http.Server {
	service := ytdlpRPC.Container(c.db, c.mq)
	rpc.Register(service)

	r := chi.NewRouter()

	r.Use(cors.AllowAll().Handler)
	r.Use(middleware.Logger)

	app := http.FileServer(http.FS(c.frontend))

	r.Mount("/", app)

	// Archive routes
	r.Route("/archive", func(r chi.Router) {
		r.Use(middlewares.Authenticated)
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
	r.Route("/api/v1", rest.ApplyRouter(c.db, c.mq))

	return &http.Server{
		Addr:    fmt.Sprintf(":%d", c.port),
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
