package server

type MessageQueue struct {
	ch chan Process
}

func NewMessageQueue() *MessageQueue {
	return &MessageQueue{
		ch: make(chan Process, 1),
	}
}

func (m *MessageQueue) Publish(p Process) {
	p.SetPending()
	m.ch <- p
}

func (m *MessageQueue) SetupConsumer() {
	for msg := range m.ch {
		msg.Start()
	}
}
