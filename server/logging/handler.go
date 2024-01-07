package logging

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	ReadBufferSize:  1000,
	WriteBufferSize: 1000,
}

func webSocket(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	c.WriteJSON("Wating for logs...")

	for msg := range logsObservable.Observe() {
		c.WriteJSON(msg.V.(string))
	}
}

func ApplyRouter() func(chi.Router) {
	return func(r chi.Router) {
		if config.Instance().RequireAuth {
			r.Use(middlewares.Authenticated)
		}
		r.Get("/ws", webSocket)
	}
}
