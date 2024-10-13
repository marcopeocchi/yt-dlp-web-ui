package rest

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	middlewares "github.com/marcopeocchi/yt-dlp-web-ui/server/middleware"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/openid"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/rest/ogen"
)

func Container(args *ContainerArgs) *Handler {
	var (
		service = ProvideService(args)
		handler = ProvideHandler(service)
	)
	return handler
}

func ApplyRouter(args *ContainerArgs) http.Handler {
	h := Container(args)

	srv, err := ogen.NewServer(h, &secHandler{}, ogen.WithPathPrefix("/api/v1"))
	if err != nil {
		slog.Error("create the REST server",
			slog.String("err", err.Error()))

		os.Exit(1)
	}

	var hand http.Handler = srv
	if config.Instance().RequireAuth {
		hand = middlewares.Authenticated(hand)
	}

	if config.Instance().UseOpenId {
		hand = openid.Middleware(hand)
	}

	return hand
}
