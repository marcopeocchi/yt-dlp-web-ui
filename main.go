package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"os"

	"github.com/marcopeocchi/yt-dlp-web-ui/server"
)

type ContextKey interface{}

var (
	port = os.Getenv("PORT")
	//go:embed dist/frontend
	frontend embed.FS
)

func init() {
	if port == "" {
		port = "3033"
	}
}

func main() {
	frontend, err := fs.Sub(frontend, "dist/frontend")

	if err != nil {
		log.Fatalln(err)
	}

	ctx := context.Background()
	ctx = context.WithValue(ctx, ContextKey("port"), port)
	ctx = context.WithValue(ctx, ContextKey("frontend"), frontend)

	server.RunBlocking(ctx)
}
