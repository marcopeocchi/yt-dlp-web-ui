package utils

import (
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

func LogRotate() (*os.File, error) {
	logs := findLogs()

	for _, log := range logs {
		logfd, err := os.Open(log)
		if err != nil {
			return nil, err
		}

		gzWriter, err := os.Create(log + ".gz")
		if err != nil {
			return nil, err
		}

		_, err = io.Copy(gzWriter, logfd)
		if err != nil {
			return nil, err
		}
	}

	logfile := time.Now().String() + ".log"
	config.Instance().CurrentLogFile = logfile

	return os.Create(logfile)
}

func findLogs() []string {
	var (
		logfiles []string
		root     = config.Instance().LogPath
	)

	filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if filepath.Ext(d.Name()) == ".log" {
			logfiles = append(logfiles, path)
		}
		return nil
	})
	return logfiles
}
