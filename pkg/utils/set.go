package utils

type Set[T comparable] struct {
	items map[T]bool
}

func NewSet[T comparable](items ...T) *Set[T] {
	set := &Set[T]{
		items: make(map[T]bool),
	}
	set.Add(items...)
	return set
}

func (s *Set[T]) Add(items ...T) {
	for _, item := range items {
		s.items[item] = true
	}
}

func (s *Set[T]) Remove(items ...T) {
	for _, item := range items {
		delete(s.items, item)
	}
}

func (s *Set[T]) Contains(item T) bool {
	return s.getItems()[item]
}

func (s *Set[T]) Clear() {
	if s == nil {
		return
	}

	s.items = make(map[T]bool)
}

func (s *Set[T]) Size() int {
	return len(s.getItems())
}

func (s *Set[T]) IsEmpty() bool {
	return s.Size() == 0
}

func (s *Set[T]) ToSlice() []T {
	list := make([]T, 0, len(s.getItems()))
	for item := range s.getItems() {
		list = append(list, item)
	}
	return list
}

func (s *Set[T]) Union(other *Set[T]) *Set[T] {
	result := NewSet[T]()
	for item := range s.getItems() {
		result.Add(item)
	}
	for item := range other.getItems() {
		result.Add(item)
	}
	return result
}

func (s *Set[T]) Intersection(other *Set[T]) *Set[T] {
	result := NewSet[T]()
	for item := range s.getItems() {
		if other.Contains(item) {
			result.Add(item)
		}
	}
	return result
}

func (s *Set[T]) Difference(other *Set[T]) *Set[T] {
	result := NewSet[T]()
	for item := range s.getItems() {
		if !other.Contains(item) {
			result.Add(item)
		}
	}
	return result
}

func (s *Set[T]) IsSubset(other *Set[T]) bool {
	for item := range s.getItems() {
		if !other.Contains(item) {
			return false
		}
	}
	return true
}

func (s *Set[T]) IsSuperset(other *Set[T]) bool {
	for item := range other.getItems() {
		if !s.Contains(item) {
			return false
		}
	}
	return true
}

func (s *Set[T]) IsDisjoint(other *Set[T]) bool {
	for item := range s.getItems() {
		if other.Contains(item) {
			return false
		}
	}
	return true
}

func (s *Set[T]) IsEqual(other *Set[T]) bool {
	if s == nil && other == nil {
		return true
	}

	if s == nil || other == nil {
		return false
	}

	if s.Size() != other.Size() {
		return false
	}

	for item := range s.getItems() {
		if !other.Contains(item) {
			return false
		}
	}

	return true
}

func (s *Set[T]) Clone() *Set[T] {
	if s == nil {
		return nil
	}

	result := NewSet[T]()
	for item := range s.getItems() {
		result.Add(item)
	}
	return result
}

func (s *Set[T]) getItems() map[T]bool {
	if s == nil {
		return nil
	}

	return s.items
}
