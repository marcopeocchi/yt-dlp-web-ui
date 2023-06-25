package internal

import (
	"log"
	"os"
	"runtime"
	"strconv"
)

type MessageQueue struct {
	ch         chan Process
	consumerCh chan struct{}
}

// Creates a new message queue.
// By default it will be created with a size equals to nthe number of logical
// CPU cores.
// The queue size can be set via the QUEUE_SIZE environmental variable.
func NewMessageQueue() *MessageQueue {
	size := runtime.NumCPU()

	sizeEnv := os.Getenv("QUEUE_SIZE")
	if sizeEnv != "" {
		_size, err := strconv.Atoi(sizeEnv)
		if err != nil {
			log.Fatalln("invalid queue size")
		}
		size = _size
	}

	return &MessageQueue{
		ch:         make(chan Process, size),
		consumerCh: make(chan struct{}, size),
	}
}

// Publish a message to the queue and set the task to a peding state.
func (m *MessageQueue) Publish(p Process) {
	p.SetPending()
	m.ch <- p
}

// Setup the consumer listened which "subscribes" to the queue events.
func (m *MessageQueue) SetupConsumer() {
	for msg := range m.ch {
		m.consumerCh <- struct{}{}
		go func(i Process) {
			i.Start()
			<-m.consumerCh
		}(msg)
	}
}
