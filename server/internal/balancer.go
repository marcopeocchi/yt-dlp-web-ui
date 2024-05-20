package internal

import (
	"container/heap"
)

type LoadBalancer struct {
	pool Pool
	done chan *Worker
}

func (b *LoadBalancer) Balance(work chan Process) {
	for {
		select {
		case req := <-work:
			b.dispatch(req)
		case w := <-b.done:
			b.completed(w)
		}
	}
}

func (b *LoadBalancer) dispatch(req Process) {
	w := heap.Pop(&b.pool).(*Worker)
	w.requests <- req
	w.pending++
	heap.Push(&b.pool, w)
}

func (b *LoadBalancer) completed(w *Worker) {
	w.pending--
	heap.Remove(&b.pool, w.index)
	heap.Push(&b.pool, w)
}
