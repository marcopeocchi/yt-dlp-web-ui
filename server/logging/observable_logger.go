package logging

import (
	"time"

	"github.com/reactivex/rxgo/v2"
)

/*
	Logger implementation using the observable pattern.
	Implements io.Writer interface.

	The observable is an event source which drops everythigng unless there's
	a subscriber connected.

	The observer implementatios are a http ServerSentEvents handler and a
	websocket one in handler.go
*/

var (
	logsChan       = make(chan rxgo.Item, 100)
	logsObservable = rxgo.
			FromEventSource(logsChan, rxgo.WithBackPressureStrategy(rxgo.Drop)).
			BufferWithTime(rxgo.WithDuration(time.Millisecond * 500))
)

type ObservableLogger struct{}

func NewObservableLogger() *ObservableLogger {
	return &ObservableLogger{}
}

func (o *ObservableLogger) Write(p []byte) (n int, err error) {
	logsChan <- rxgo.Of(string(p))

	n = len(p)
	err = nil

	return
}
