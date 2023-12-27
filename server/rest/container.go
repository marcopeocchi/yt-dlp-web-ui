package rest

import (
	"database/sql"

	"github.com/go-chi/chi/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
)

func Container(db *sql.DB, mdb *internal.MemoryDB, mq *internal.MessageQueue) *Handler {
	var (
		service = ProvideService(db, mdb, mq)
		handler = ProvideHandler(service)
	)
	return handler
}

func ApplyRouter(db *sql.DB, mdb *internal.MemoryDB, mq *internal.MessageQueue) func(chi.Router) {
	h := Container(db, mdb, mq)

	return func(r chi.Router) {
		if config.Instance().RequireAuth {
			r.Use(middlewares.Authenticated)
		}
		r.Post("/exec", h.Exec())
		r.Get("/running", h.Running())
		r.Post("/cookies", h.SetCookies())
		r.Post("/template", h.AddTemplate())
		r.Get("/template/all", h.GetTemplates())
		r.Delete("/template/{id}", h.DeleteTemplate())
	}
}
