package internal

import (
	"encoding/json"
	"errors"
	"log/slog"
	"os/exec"
	"strings"
	"time"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

type metadata struct {
	Entries       []DownloadInfo `json:"entries"`
	Count         int            `json:"playlist_count"`
	PlaylistTitle string         `json:"title"`
	Type          string         `json:"_type"`
}

func PlaylistDetect(req DownloadRequest, mq *MessageQueue, db *MemoryDB, logger *slog.Logger) error {
	var (
		downloader = config.Instance().DownloaderPath
		cmd        = exec.Command(downloader, req.URL, "-J")
	)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}

	m := metadata{}

	err = cmd.Start()
	if err != nil {
		return err
	}

	logger.Info("decoding metadata", slog.String("url", req.URL))

	err = json.NewDecoder(stdout).Decode(&m)
	if err != nil {
		return err
	}

	logger.Info("decoded metadata", slog.String("url", req.URL))

	if m.Type == "" {
		cmd.Wait()
		return errors.New("probably not a valid URL")
	}

	if m.Type == "playlist" {
		logger.Info(
			"playlist detected",
			slog.String("url", req.URL),
			slog.Int("count", m.Count),
		)

		for i, meta := range m.Entries {
			delta := time.Second.Microseconds() * int64(i+1)

			// detect playlist title from metadata since each playlist entry will be
			// treated as an individual download
			req.Rename = strings.Replace(
				req.Rename,
				"%(playlist_title)s",
				m.PlaylistTitle,
				1,
			)

			proc := &Process{
				Url:      meta.OriginalURL,
				Progress: DownloadProgress{},
				Output: DownloadOutput{
					Filename: req.Rename,
				},
				Info:   meta,
				Params: req.Params,
			}

			proc.Info.URL = meta.OriginalURL
			proc.Info.CreatedAt = time.Now().Add(time.Duration(delta))

			db.Set(proc)
			proc.SetPending()
			mq.PublishPlaylistEntry(proc)
		}

		err = cmd.Wait()
		return err
	}

	proc := &Process{Url: req.URL, Params: req.Params}

	mq.Publish(proc)
	logger.Info("sending new process to message queue", slog.String("url", proc.Url))

	return cmd.Wait()
}
