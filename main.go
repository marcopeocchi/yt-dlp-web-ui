package main

import (
	"embed"
	"flag"
	"io/fs"
	"log"

	"github.com/marcopeocchi/yt-dlp-web-ui/server"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

var (
	port           int
	configFile     string
	downloadPath   string
	downloaderPath string

	//go:embed frontend/dist
	frontend embed.FS
)

func init() {
	flag.IntVar(&port, "port", 3033, "Port where server will listen at")
	flag.StringVar(&configFile, "conf", "", "yt-dlp-WebUI config file path")
	flag.StringVar(&downloadPath, "out", ".", "Directory where files will be saved")
	flag.StringVar(&downloaderPath, "driver", "yt-dlp", "yt-dlp executable path")
	flag.Parse()
}

func main() {
	frontend, err := fs.Sub(frontend, "frontend/dist")

	if err != nil {
		log.Fatalln(err)
	}

	c := config.Instance()

	c.SetPort(port)
	c.DownloadPath(downloadPath)
	c.DownloaderPath(downloaderPath)

	if configFile != "" {
		c.LoadFromFile(configFile)
	}

	server.RunBlocking(port, frontend)
}
