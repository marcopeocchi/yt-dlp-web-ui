package internal

import (
	"log"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

type MessageQueue struct {
	producerCh chan *Process
	consumerCh chan struct{}
}

// Creates a new message queue.
// By default it will be created with a size equals to nthe number of logical
// CPU cores.
// The queue size can be set via the qs flag.
func NewMessageQueue() *MessageQueue {
	size := config.Instance().QueueSize

	if size <= 0 {
		log.Fatalln("invalid queue size")
	}

	return &MessageQueue{
		producerCh: make(chan *Process, size),
		consumerCh: make(chan struct{}, size),
	}
}

// Publish a message to the queue and set the task to a peding state.
func (m *MessageQueue) Publish(p *Process) {
	p.SetPending()
	go p.SetMetadata()
	m.producerCh <- p
}

// Publish a message to the queue and set the task to a peding state.
// ENSURE P IS PART OF A PLAYLIST
// Needs a further review
func (m *MessageQueue) PublishPlaylistEntry(p *Process) {
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
