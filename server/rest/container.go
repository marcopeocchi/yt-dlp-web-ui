package rest

import (
	"github.com/go-chi/chi/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
)

func Container(db *internal.MemoryDB, mq *internal.MessageQueue) *Handler {
	var (
		service = ProvideService(db, mq)
		handler = ProvideHandler(service)
	)
	return handler
}

func ApplyRouter(db *internal.MemoryDB, mq *internal.MessageQueue) func(chi.Router) {
	h := Container(db, mq)

	return func(r chi.Router) {
		r.Use(middlewares.Authenticated)
		r.Post("/exec", h.Exec())
		r.Get("/running", h.Running())
		r.Post("/cookies", h.SetCookies())
	}
}
