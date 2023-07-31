package rest

import (
	"sync"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
)

var (
	service *Service
	handler *Handler

	serviceOnce sync.Once
	handlerOnce sync.Once
)

func ProvideService(db *internal.MemoryDB, mq *internal.MessageQueue) *Service {
	serviceOnce.Do(func() {
		service = &Service{
			db: db,
			mq: mq,
		}
	})
	return service
}

func ProvideHandler(svc *Service) *Handler {
	handlerOnce.Do(func() {
		handler = &Handler{
			service: svc,
		}
	})
	return handler
}
