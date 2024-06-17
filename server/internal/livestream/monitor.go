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

func (s *Monitor) Schedule() {
	for l := range s.done {
		delete(s.streams, l.url)
	}
}

func (s *Monitor) Add(url string) {
	ls := &LiveStream{
		url:  url,
		done: s.done,
	}

	go ls.Start()

	s.streams[url] = ls
}

func (s *Monitor) Remove(url string) error {
	return s.streams[url].Kill()
}

func (s *Monitor) Status() LiveStreamStatus {
	status := make(LiveStreamStatus)

	for k, v := range s.streams {
		wt, ok := <-v.WaitTime()
		if !ok {
			continue
		}

		status[k] = struct {
			Status   int
			WaitTime time.Duration
		}{
			Status:   v.status,
			WaitTime: wt,
		}
	}

	return status
}
