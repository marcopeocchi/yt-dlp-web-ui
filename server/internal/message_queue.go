package internal

import (
	"log/slog"

	evbus "github.com/asaskevich/EventBus"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

const queueName = "process:pending"

type MessageQueue struct {
	eventBus   evbus.Bus
	consumerCh chan struct{}
	logger     *slog.Logger
}

// Creates a new message queue.
// By default it will be created with a size equals to nthe number of logical
// CPU cores -1.
// The queue size can be set via the qs flag.
func NewMessageQueue(l *slog.Logger) *MessageQueue {
	qs := config.Instance().QueueSize

	if qs <= 0 {
		panic("invalid queue size")
	}

	return &MessageQueue{
		eventBus:   evbus.New(),
		consumerCh: make(chan struct{}, qs),
		logger:     l,
	}
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
	m.eventBus.SubscribeAsync(queueName, func(p *Process) {
		m.consumerCh <- struct{}{}

		m.logger.Info("received process from event bus",
			slog.String("bus", queueName),
			slog.String("consumer", "downloadConsumer"),
			slog.String("id", p.Id),
		)

		p.Start()

		m.logger.Info("started process",
			slog.String("bus", queueName),
			slog.String("id", p.Id),
		)

		<-m.consumerCh
	}, false)
}

// Setup the metadata consumer listener which subscribes to the changes to the
// producer channel and adds metadata to each download.
func (m *MessageQueue) metadataSubscriber() {
	// How many concurrent metadata fetcher jobs are spawned
	// Since there's ongoing downloads, 1 job at time seems a good compromise
	m.eventBus.Subscribe(queueName, func(p *Process) {
		m.logger.Info("received process from event bus",
			slog.String("bus", queueName),
			slog.String("consumer", "metadataConsumer"),
			slog.String("id", p.Id),
		)

		if err := p.SetMetadata(); err != nil {
			m.logger.Error("failed to retrieve metadata",
				slog.String("id", p.Id),
				slog.String("err", err.Error()),
			)
		}
	})
}

// Empties the message queue
func (m *MessageQueue) Empty() {
	for range m.consumerCh {
		<-m.consumerCh
	}
}
