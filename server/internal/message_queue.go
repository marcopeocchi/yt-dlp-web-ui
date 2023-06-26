package internal

import (
	"log"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

type MessageQueue struct {
	ch         chan *Process
	consumerCh chan struct{}
}

// Creates a new message queue.
// By default it will be created with a size equals to nthe number of logical
// CPU cores.
// The queue size can be set via the qs flag.
func NewMessageQueue() *MessageQueue {
	size := config.Instance().GetConfig().QueueSize

	if size <= 0 {
		log.Fatalln("invalid queue size")
	}

	return &MessageQueue{
		ch:         make(chan *Process, size),
		consumerCh: make(chan struct{}, size),
	}
}

// Publish a message to the queue and set the task to a peding state.
func (m *MessageQueue) Publish(p *Process) {
	go p.SetPending()
	m.ch <- p
}

// Setup the consumer listened which "subscribes" to the queue events.
func (m *MessageQueue) SetupConsumer() {
	for msg := range m.ch {
		m.consumerCh <- struct{}{}
		go func(p *Process) {
			p.Start()
			<-m.consumerCh
		}(msg)
	}
}
