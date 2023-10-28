package rx

import "time"

// ReactiveX inspired sample function.
//
// Debounce emits the most recently emitted value from the source
// withing the timespan set by the span time.Duration
func Sample[T any](span time.Duration, source chan T, done chan struct{}, fn func(e T)) {
	ticker := time.NewTicker(span)
	for {
		select {
		case <-ticker.C:
			fn(<-source)
		case <-done:
			ticker.Stop()
			return
		}
	}
}
