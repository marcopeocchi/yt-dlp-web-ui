package livestream

import (
	"encoding/gob"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

type Monitor struct {
	logger  *slog.Logger
	streams map[string]*LiveStream // keeps track of the livestreams
	done    chan *LiveStream       // to signal individual processes completition
	logs    chan []byte            // to signal individual processes completition
}

func NewMonitor(logger *slog.Logger) *Monitor {
	return &Monitor{
		logger:  logger,
		streams: make(map[string]*LiveStream),
		done:    make(chan *LiveStream),
	}
}

func (m *Monitor) Schedule() {
	for l := range m.done {
		delete(m.streams, l.url)
	}
}

func (m *Monitor) Add(url string) {
	ls := New(url, m.logs, m.done)

	go ls.Start()
	m.streams[url] = ls
}

func (m *Monitor) Remove(url string) error {
	return m.streams[url].Kill()
}

func (m *Monitor) RemoveAll() error {
	for _, v := range m.streams {
		if err := v.Kill(); err != nil {
			return err
		}
	}
	return nil
}

func (m *Monitor) Status() LiveStreamStatus {
	status := make(LiveStreamStatus)

	for k, v := range m.streams {
		// wt, ok := <-v.WaitTime()
		// if !ok {
		// 	continue
		// }

		status[k] = struct {
			Status   int
			WaitTime time.Duration
		}{
			Status:   v.status,
			WaitTime: v.waitTime,
		}
	}

	return status
}

func (m *Monitor) Persist() error {
	fd, err := os.Open(filepath.Join(config.Instance().Dir(), "livestreams.dat"))
	if err != nil {
		return err
	}

	defer fd.Close()

	return gob.NewEncoder(fd).Encode(m.streams)
}

func (m *Monitor) Restore() error {
	fd, err := os.Open(filepath.Join(config.Instance().Dir(), "livestreams.dat"))
	if err != nil {
		return err
	}

	defer fd.Close()

	restored := make(map[string]*LiveStream)

	if err := gob.NewDecoder(fd).Decode(&restored); err != nil {
		return err
	}

	for k := range restored {
		m.Add(k)
	}

	return nil
}

func (m *Monitor) Logs() <-chan []byte {
	return m.logs
}
