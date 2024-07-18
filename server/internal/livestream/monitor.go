package livestream

import (
	"log/slog"
	"time"
)

type Monitor struct {
	logger  *slog.Logger
	streams map[string]*LiveStream // keeps track of the livestreams
	done    chan *LiveStream       // to signal individual processes completition
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
	ls := New(url, m.done)

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
	return nil
}
