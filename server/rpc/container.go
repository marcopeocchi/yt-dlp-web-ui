package rpc

import (
	"log/slog"

	"github.com/go-chi/chi/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal/livestream"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
)

// Dependency injection container.
func Container(
	db *internal.MemoryDB,
	mq *internal.MessageQueue,
	lm *livestream.Monitor,
	logger *slog.Logger,
) *Service {
	return &Service{
		db:     db,
		mq:     mq,
		lm:     lm,
		logger: logger,
	}
}

// RPC service must be registered before applying this router!
func ApplyRouter() func(chi.Router) {
	return func(r chi.Router) {
		if config.Instance().RequireAuth {
			r.Use(middlewares.Authenticated)
		}
		r.Get("/ws", WebSocket)
		r.Post("/http", Post)
	}
}
