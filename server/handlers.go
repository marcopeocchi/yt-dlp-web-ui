package server

import (
	"log"

	"github.com/goccy/go-json"
	"github.com/gofiber/websocket/v2"
)

// Websocket handlers

func download(c *websocket.Conn) {
	req := DownloadRequest{}
	c.ReadJSON(&req)

	p := Process{mem: &db, url: req.Url, params: req.Params}
	p.Start()

	c.WriteJSON(req)
}

func getFormats(c *websocket.Conn) {
	log.Println("Requesting formats")
	mtype, msg, _ := c.ReadMessage()

	req := DownloadRequest{}
	json.Unmarshal(msg, &req)

	p := Process{mem: &db, url: req.Url}
	p.GetFormatsSync()

	c.WriteMessage(mtype, msg)
}

func status(c *websocket.Conn) {
	mtype, _, _ := c.ReadMessage()

	all := db.All()
	msg, _ := json.Marshal(all)

	c.WriteMessage(mtype, msg)
}

func abort(c *websocket.Conn) {
	mtype, msg, _ := c.ReadMessage()

	req := AbortRequest{}
	json.Unmarshal(msg, &req)

	p := db.Get(req.Id)
	p.Kill()

	c.WriteMessage(mtype, msg)
}

func abortAll(c *websocket.Conn) {
	keys := db.Keys()
	for _, key := range keys {
		proc := db.Get(key)
		if proc != nil {
			proc.Kill()
		}
	}
}

func hotUpdate(c *websocket.Conn) {

}
