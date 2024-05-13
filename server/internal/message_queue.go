package internal

import (
	"log/slog"
	"runtime"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

type MessageQueue struct {
	producerCh chan *Process
	consumerCh chan struct{}
	metadataCh chan struct{}
	logger     *slog.Logger
}

// Creates a new message queue.
// By default it will be created with a size equals to nthe number of logical
// CPU cores.
// The queue size can be set via the qs flag.
func NewMessageQueue(l *slog.Logger) *MessageQueue {
	size := config.Instance().QueueSize

	if size <= 0 {
		panic("invalid queue size")
	}

	return &MessageQueue{
		producerCh: make(chan *Process, size),
		consumerCh: make(chan struct{}, size),
		metadataCh: make(chan struct{}, runtime.NumCPU()),
		logger:     l,
	}
}

// Publish a message to the queue and set the task to a peding state.
func (m *MessageQueue) Publish(p *Process) {
	p.SetPending()
	m.metadataCh <- struct{}{}

	go func() {
		if err := p.SetMetadata(); err != nil {
			m.logger.Error(
				"failed to retrieve metadata",
				slog.String("err", err.Error()),
			)
		}
		<-m.metadataCh
	}()

	m.producerCh <- p
}

// Setup the consumer listener which subscribes to the changes to the producer
// channel and triggers the "download" action.
func (m *MessageQueue) Subscriber() {
	for msg := range m.producerCh {
		m.consumerCh <- struct{}{}
		go func(p *Process) {
			p.Start()
			<-m.consumerCh
		}(msg)
	}
}

// Empties the message queue
func (m *MessageQueue) Empty() {
	for range m.producerCh {
		<-m.producerCh
	}
	for range m.consumerCh {
		<-m.consumerCh
	}
}
