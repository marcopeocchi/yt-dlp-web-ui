package rx

import "time"

/*
	Package rx contains:
	-	Definitions for common reactive programming functions/patterns
*/

// ReactiveX inspired debounce function.
//
// Debounce emits a string from the source channel only after a particular
// time span determined a Go Interval
// --A--B--CD--EFG-------|>
//
//	-t->                 |>
//	       -t->          |>   t is a timer tick
//	             -t->    |>
//
// --A-----C-----G-------|>
func Debounce(interval time.Duration, source chan string, cb func(emit string)) {
	var item string
	timer := time.NewTimer(interval)
	for {
		select {
		case item = <-source:
			timer.Reset(interval)
		case <-timer.C:
			if item != "" {
				cb(item)
			}
		}
	}
}

// ReactiveX inspired sample function.
//
// Debounce emits the most recently emitted value from the source
// withing the timespan set by the span time.Duration
func Sample[T any](span time.Duration, source chan T, cb func(emit T)) {
	timer := time.NewTimer(span)
	for {
		<-timer.C
		cb(<-source)
		timer.Reset(span)
	}
}
