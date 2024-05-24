package rest

import (
	"github.com/go-chi/chi/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
)

func Container(args *ContainerArgs) *Handler {
	var (
		service = ProvideService(args)
		handler = ProvideHandler(service)
	)
	return handler
}

func ApplyRouter(args *ContainerArgs) func(chi.Router) {
	h := Container(args)

	return func(r chi.Router) {
		if config.Instance().RequireAuth {
			r.Use(middlewares.Authenticated)
		}
		r.Post("/exec", h.Exec())
		r.Get("/running", h.Running())
		r.Get("/version", h.GetVersion())
		r.Post("/cookies", h.SetCookies())
		r.Post("/template", h.AddTemplate())
		r.Get("/template/all", h.GetTemplates())
		r.Delete("/template/{id}", h.DeleteTemplate())
	}
}
