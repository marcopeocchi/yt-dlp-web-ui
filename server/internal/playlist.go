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

func PlaylistDetect(req DownloadRequest, mq *MessageQueue, db *MemoryDB) error {
	cmd := exec.Command(cfg.GetConfig().DownloaderPath, req.URL, "-J")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}

	m := metadata{}

	err = cmd.Start()
	if err != nil {
		return err
	}

	log.Println(cli.BgRed, "Decoding metadata", cli.Reset, req.URL)

	err = json.NewDecoder(stdout).Decode(&m)
	if err != nil {
		return err
	}

	log.Println(cli.BgGreen, "Decoded metadata", cli.Reset, req.URL)

	if m.Type == "" {
		cmd.Wait()
		return errors.New("probably not a valid URL")
	}

	if m.Type == "playlist" {
		log.Println(
			cli.BgGreen, "Playlist detected", cli.Reset, m.Count, "entries",
		)

		for _, meta := range m.Entries {
			proc := &Process{
				Url:      meta.OriginalURL,
				Progress: DownloadProgress{},
				Output:   DownloadOutput{},
				Info:     meta,
				Params:   req.Params,
			}

			proc.Info.URL = meta.OriginalURL
			proc.Info.CreatedAt = time.Now().Add(time.Second)

			db.Set(proc)
			proc.SetPending()
			mq.PublishPlaylistEntry(proc)
		}

		err = cmd.Wait()
		return err
	}

	proc := &Process{Url: req.URL, Params: req.Params}

	mq.Publish(proc)
	log.Println("Sending new process to message queue", proc.Url)

	err = cmd.Wait()
	return err
}
