package internal

type Pool []*Worker

func (h Pool) Len() int           { return len(h) }
func (h Pool) Less(i, j int) bool { return h[i].index < h[j].index }
func (h Pool) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *Pool) Push(x any)        { *h = append(*h, x.(*Worker)) }

func (h *Pool) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[0 : n-1]
	return x
}
