package server

import (
	"context"
	"fmt"
	"io/fs"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/websocket/v2"
)

var db MemoryDB

func init() {
	db.New()
}

func RunBlocking(ctx context.Context) {
	fe := ctx.Value("frontend").(fs.SubFS)
	port := ctx.Value("port")

	app := fiber.New()

	app.Use("/", filesystem.New(filesystem.Config{
		Root: http.FS(fe),
	}))

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		for {
			mtype, msg, err := c.ReadMessage()
			if err != nil {
				break
			}

			switch string(msg) {
			case "send-url-format-selection":
				getFormats(c)
			case "send-url":
				download(c)
			case "abort":
				abort(c)
			case "abort-all":
				abortAll(c)
			case "status":
				status(c)
			case "update-bin":
				hotUpdate(c)
			}

			log.Printf("Read: %s", msg)

			err = c.WriteMessage(mtype, msg)
			if err != nil {
				break
			}
		}
	}))

	log.Fatal(app.Listen(fmt.Sprintf(":%s", port)))
}
