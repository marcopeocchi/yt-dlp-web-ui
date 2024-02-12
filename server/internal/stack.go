package internal

type Stack[T any] struct {
	Elements []*T
	count    int
}

func NewStack[T any]() *Stack[T] {
	return &Stack[T]{
		Elements: make([]*T, 10),
	}
}

func (s *Stack[T]) Push(val T) {
	if s.count >= len(s.Elements) {
		Elements := make([]*T, len(s.Elements)*2)
		copy(Elements, s.Elements)
		s.Elements = Elements
	}
	s.Elements[s.count] = &val
	s.count++
}

func (s *Stack[T]) Pop() *T {
	if s.count == 0 {
		return nil
	}
	Element := s.Elements[s.count-1]
	s.count--
	return Element
}

func (s *Stack[T]) IsEmpty() bool {
	return s.count == 0
}

func (s *Stack[T]) IsNotEmpty() bool {
	return s.count != 0
}
