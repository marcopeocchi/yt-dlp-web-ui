package logging

import (
	"time"

	"github.com/reactivex/rxgo/v2"
)

var (
	logsChan       = make(chan rxgo.Item, 100)
	logsObservable = rxgo.
			FromChannel(logsChan, rxgo.WithBackPressureStrategy(rxgo.Drop)).
			BufferWithTime(rxgo.WithDuration(time.Millisecond * 500))
)

type ObservableLogger struct{}

func NewObservableLogger() *ObservableLogger {
	return &ObservableLogger{}
}

func (o *ObservableLogger) Write(p []byte) (n int, err error) {
	go func() {
		logsChan <- rxgo.Of(string(p))
	}()

	n = len(p)
	err = nil

	return
}
