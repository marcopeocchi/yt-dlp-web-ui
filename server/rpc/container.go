package rpc

import (
	"log/slog"

	"github.com/go-chi/chi/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/openid"
)

// Dependency injection container.
func Container(
	db *internal.MemoryDB,
	mq *internal.MessageQueue,
	logger *slog.Logger,
) *Service {
	return &Service{
		db:     db,
		mq:     mq,
		logger: logger,
	}
}

// RPC service must be registered before applying this router!
func ApplyRouter() func(chi.Router) {
	return func(r chi.Router) {
		if config.Instance().RequireAuth {
			r.Use(middlewares.Authenticated)
		}
		if config.Instance().UseOpenId {
			r.Use(openid.Middleware)
		}
		r.Get("/ws", WebSocket)
		r.Post("/http", Post)
	}
}
