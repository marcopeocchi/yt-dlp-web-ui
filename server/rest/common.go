package rest

import (
	"database/sql"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
)

type ContainerArgs struct {
	DB  *sql.DB
	MDB *internal.MemoryDB
	MQ  *internal.MessageQueue
}
