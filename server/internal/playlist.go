package internal

import (
	"errors"
	"log"
	"os/exec"
	"time"

	"github.com/goccy/go-json"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/cli"
)

type metadata struct {
	Entries []DownloadInfo `json:"entries"`
	Count   int            `json:"playlist_count"`
	Type    string         `json:"_type"`
}

func PlaylistDetect(p *Process, mq *MessageQueue) error {
	cmd := exec.Command(cfg.GetConfig().DownloaderPath, p.Url, "-J")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}

	m := metadata{}

	err = cmd.Start()
	if err != nil {
		return err
	}

	log.Println(cli.BgRed, "Decoding metadata", cli.Reset, p.Url)

	err = json.NewDecoder(stdout).Decode(&m)
	if err != nil {
		return err
	}

	log.Println(cli.BgGreen, "Decoded metadata", cli.Reset, p.Url)

	if m.Type == "" {
		cmd.Wait()
		return errors.New("probably not a valid URL")
	}

	if m.Type == "playlist" {
		log.Println(
			cli.BgGreen, "Playlist detected", cli.Reset, m.Count, "entries",
		)

		for _, meta := range m.Entries {
			p.Url = meta.OriginalURL
			p.Info = meta
			p.Info.URL = meta.OriginalURL
			p.Info.CreatedAt = time.Now()
			log.Println("Sending new process to message queue", p.Url)
			mq.PublishPlaylistEntry(p)
		}

		err = cmd.Wait()
		return err
	}

	mq.Publish(p)
	log.Println("Sending new process to message queue", p.Url)

	err = cmd.Wait()
	return err
}
