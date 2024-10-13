package rest

import (
	"context"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/rest/ogen"
)

var _ ogen.SecurityHandler = &secHandler{}

type secHandler struct{}

func (s secHandler) HandleAPIKey(ctx context.Context, operationName string, t ogen.APIKey) (context.Context, error) {
	// We ignore this, since is handled by the chi middleware
	return ctx, nil
}
