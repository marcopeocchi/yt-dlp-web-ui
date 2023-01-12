package server

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"net/rpc"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/websocket/v2"
)

var db MemoryDB

func init() {
	db.New()
}

func RunBlocking(ctx context.Context) {
	fe := ctx.Value("frontend").(fs.SubFS)
	port := ctx.Value("port").(int)

	service := new(Service)
	rpc.Register(service)

	app := fiber.New()

	app.Use(cors.New())
	app.Use("/", filesystem.New(filesystem.Config{
		Root: http.FS(fe),
	}))

	// RPC handlers
	// websocket
	app.Get("/ws-rpc", websocket.New(func(c *websocket.Conn) {
		for {
			mtype, reader, err := c.NextReader()
			if err != nil {
				break
			}
			res := NewRPCRequest(reader).Call()

			writer, err := c.NextWriter(mtype)
			if err != nil {
				break
			}
			io.Copy(writer, res)
		}
	}))
	// http-post
	app.Post("/http-rpc", func(c *fiber.Ctx) error {
		reader := c.Context().RequestBodyStream()
		writer := c.Response().BodyWriter()
		res := NewRPCRequest(reader).Call()
		io.Copy(writer, res)
		return nil
	})

	app.Server().StreamRequestBody = true

	log.Fatal(app.Listen(fmt.Sprintf(":%d", port)))
}
