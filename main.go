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
	downloadPath   string
	downloaderPath string
	configFile     string

	//go:embed frontend/dist
	frontend embed.FS
)

func init() {
	flag.IntVar(&port, "port", 3033, "Port where server will listen at")
	flag.StringVar(&downloadPath, "out", ".", "Directory where files will be saved")
	flag.StringVar(&downloaderPath, "driver", "yt-dlp", "yt-dlp executable path")
	flag.StringVar(&configFile, "conf", "", "yt-dlp-WebUI config file path")
	flag.Parse()
}

func main() {
	frontend, err := fs.Sub(frontend, "frontend/dist")

	if err != nil {
		log.Fatalln(err)
	}

	cfg := config.Instance()

	if configFile != "" {
		cfg.LoadFromFile(configFile)
	}

	cfg.SetPort(port)
	cfg.DownloadPath(downloadPath)
	cfg.DownloaderPath(downloaderPath)

	server.RunBlocking(port, frontend)
}
