package logging

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

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

	for msg := range logsObservable.Observe() {
		c.WriteJSON(msg.V)
	}
}

func sse(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	for msg := range logsObservable.Observe() {
		if msg.E != nil {
			http.Error(w, msg.E.Error(), http.StatusInternalServerError)
			return
		}

		var (
			b  bytes.Buffer
			sb strings.Builder
		)

		if err := json.NewEncoder(&b).Encode(msg.V); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		sb.WriteString("event: log\n")
		sb.WriteString("data: ")
		sb.WriteString(b.String())
		sb.WriteRune('\n')
		sb.WriteRune('\n')

		fmt.Fprint(w, sb.String())

		flusher.Flush()
	}
}

func ApplyRouter() func(chi.Router) {
	return func(r chi.Router) {
		if config.Instance().RequireAuth {
			r.Use(middlewares.Authenticated)
		}
		r.Get("/ws", webSocket)
		r.Get("/sse", sse)
	}
}
