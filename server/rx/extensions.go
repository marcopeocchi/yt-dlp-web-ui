package rx

import "time"

// ReactiveX inspired sample function.
//
// Debounce emits the most recently emitted value from the source
// withing the timespan set by the span time.Duration
//
// Soon it will be deprecated since it doesn't add anything useful.
// (It lowers the CPU usage by a negligible margin)
func Sample(span time.Duration, source chan []byte, done chan struct{}, fn func(e []byte)) {
	var (
		item   []byte
		ticker = time.NewTicker(span)
	)

	for {
		select {
		case <-ticker.C:
			if item != nil {
				fn(item)
			}
		case <-source:
			item = <-source
		case <-done:
			ticker.Stop()
			return
		}
	}
}
