package internal

import (
	"context"
	"errors"
	"log/slog"

	evbus "github.com/asaskevich/EventBus"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"golang.org/x/sync/semaphore"
)

const queueName = "process:pending"

type MessageQueue struct {
	concurrency int
	eventBus    evbus.Bus
	logger      *slog.Logger
}

// Creates a new message queue.
// By default it will be created with a size equals to nthe number of logical
// CPU cores -1.
// The queue size can be set via the qs flag.
func NewMessageQueue(l *slog.Logger) (*MessageQueue, error) {
	qs := config.Instance().QueueSize

	if qs <= 0 {
		return nil, errors.New("invalid queue size")
	}

	return &MessageQueue{
		concurrency: qs,
		eventBus:    evbus.New(),
		logger:      l,
	}, nil
}

// Publish a message to the queue and set the task to a peding state.
func (m *MessageQueue) Publish(p *Process) {
	// needs to have an id set before
	p.SetPending()

	m.eventBus.Publish(queueName, p)
}

func (m *MessageQueue) SetupConsumers() {
	go m.downloadConsumer()
	go m.metadataSubscriber()
}

// Setup the consumer listener which subscribes to the changes to the producer
// channel and triggers the "download" action.
func (m *MessageQueue) downloadConsumer() {
	sem := semaphore.NewWeighted(int64(m.concurrency))

	m.eventBus.SubscribeAsync(queueName, func(p *Process) {
		//TODO: provide valid context
		sem.Acquire(context.Background(), 1)
		defer sem.Release(1)

		m.logger.Info("received process from event bus",
			slog.String("bus", queueName),
			slog.String("consumer", "downloadConsumer"),
			slog.String("id", p.getShortId()),
		)

		p.Start()

		m.logger.Info("started process",
			slog.String("bus", queueName),
			slog.String("id", p.getShortId()),
		)
	}, false)
}

// Setup the metadata consumer listener which subscribes to the changes to the
// producer channel and adds metadata to each download.
func (m *MessageQueue) metadataSubscriber() {
	// How many concurrent metadata fetcher jobs are spawned
	// Since there's ongoing downloads, 1 job at time seems a good compromise
	sem := semaphore.NewWeighted(1)

	m.eventBus.SubscribeAsync(queueName, func(p *Process) {
		//TODO: provide valid context
		sem.Acquire(context.TODO(), 1)
		defer sem.Release(1)

		m.logger.Info("received process from event bus",
			slog.String("bus", queueName),
			slog.String("consumer", "metadataConsumer"),
			slog.String("id", p.getShortId()),
		)

		if err := p.SetMetadata(); err != nil {
			m.logger.Error("failed to retrieve metadata",
				slog.String("id", p.getShortId()),
				slog.String("err", err.Error()),
			)
		}
	}, false)
}
