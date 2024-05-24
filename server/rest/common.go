package rest

import (
	"database/sql"
	"log/slog"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
)

type ContainerArgs struct {
	DB     *sql.DB
	MDB    *internal.MemoryDB
	MQ     *internal.MessageQueue
	Logger *slog.Logger
}
