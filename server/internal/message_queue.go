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
	metadataCh chan struct{}
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

	mqs := 1

	return &MessageQueue{
		eventBus:   evbus.New(),
		consumerCh: make(chan struct{}, qs),
		metadataCh: make(chan struct{}, mqs),
		logger:     l,
	}
}

// Publish a message to the queue and set the task to a peding state.
func (m *MessageQueue) Publish(p *Process) {
	p.SetPending()

	m.eventBus.Publish(queueName, p)
}

// Setup the consumer listener which subscribes to the changes to the producer
// channel and triggers the "download" action.
func (m *MessageQueue) Subscriber() {
	go m.metadataSubscriber()

	m.eventBus.SubscribeAsync(queueName, func(p *Process) {
		m.logger.Info("received process from event bus",
			slog.String("bus", queueName),
			slog.String("consumer", "downloadConsumer"),
			slog.String("id", p.Id),
		)

		go func() {
			m.consumerCh <- struct{}{}
			p.Start()

			m.logger.Info("started process",
				slog.String("bus", queueName),
				slog.String("id", p.Id),
			)

			<-m.consumerCh
		}()
	}, false)
}

// Empties the message queue
func (m *MessageQueue) Empty() {
	for range m.consumerCh {
		<-m.consumerCh
	}
}

// Setup the metadata consumer listener which subscribes to the changes to the
// producer channel and adds metadata to each download.
func (m *MessageQueue) metadataSubscriber() {
	m.eventBus.SubscribeAsync(queueName, func(p *Process) {
		m.metadataCh <- struct{}{}

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

		<-m.metadataCh
	}, false)
}
