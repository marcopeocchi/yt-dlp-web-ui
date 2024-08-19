package livestream

import "time"

type LiveStreamStatus = map[string]Status

type Status = struct {
	Status   int
	WaitTime time.Duration
	LiveDate time.Time
}
