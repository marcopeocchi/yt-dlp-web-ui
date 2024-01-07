package logging

import (
	"time"

	"github.com/reactivex/rxgo/v2"
)

var (
	logsChan       = make(chan rxgo.Item)
	logsObservable = rxgo.
			FromEventSource(logsChan).
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
