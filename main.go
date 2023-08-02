package main

import (
	"embed"
	"flag"
	"io/fs"
	"log"
	"runtime"

	"github.com/marcopeocchi/yt-dlp-web-ui/server"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/cli"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

var (
	port           int
	queueSize      int
	configFile     string
	downloadPath   string
	downloaderPath string

	requireAuth bool
	rpcSecret   string

	//go:embed frontend/dist
	frontend embed.FS
)

func init() {
	flag.IntVar(&port, "port", 3033, "Port where server will listen at")
	flag.IntVar(&queueSize, "qs", runtime.NumCPU(), "Download queue size")

	flag.StringVar(&configFile, "conf", "./config.yml", "Config file path")
	flag.StringVar(&downloadPath, "out", ".", "Where files will be saved")
	flag.StringVar(&downloaderPath, "driver", "yt-dlp", "yt-dlp executable path")

	flag.BoolVar(&requireAuth, "auth", false, "Enable RPC authentication")
	flag.StringVar(&rpcSecret, "secret", "", "Secret required for auth")

	flag.Parse()
}

func main() {
	frontend, err := fs.Sub(frontend, "frontend/dist")

	if err != nil {
		log.Fatalln(err)
	}

	c := config.Instance()

	c.SetPort(port)
	c.QueueSize(queueSize)
	c.DownloadPath(downloadPath)
	c.DownloaderPath(downloaderPath)

	c.RequireAuth(requireAuth)
	c.RPCSecret(rpcSecret)

	// if config file is found it will be merged with the current config struct
	if _, err := c.TryLoadFromFile(configFile); err != nil {
		log.Println(cli.BgRed, "config", cli.Reset, "no config file found")
	}

	server.RunBlocking(port, frontend)
}
