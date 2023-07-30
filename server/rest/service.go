package rest

import (
	"context"
	"errors"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
)

type Service struct {
	db *internal.MemoryDB
	mq *internal.MessageQueue
}

func (s *Service) Exec(req internal.DownloadRequest) (string, error) {
	p := &internal.Process{
		Url:    req.URL,
		Params: req.Params,
		Output: internal.DownloadOutput{
			Path:     req.Path,
			Filename: req.Rename,
		},
	}

	id := s.db.Set(p)
	s.mq.Publish(p)

	return id, nil
}

func (s *Service) Running(ctx context.Context) (*[]internal.ProcessResponse, error) {
	select {
	case <-ctx.Done():
		return nil, errors.New("context cancelled")
	default:
		return s.db.All(), nil
	}
}
