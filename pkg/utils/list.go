package utils

import (
	"sync"
)

type List[K any] interface {
	Add(...K)
	Get(int) (K, bool)
	Set([]K)
	Clear()
	Contents() []K
	Size() int
}

type listType[K any] struct {
	data  []K
	mutex *sync.RWMutex
}

func NewList[K any]() List[K] {
	return &listType[K]{
		data:  []K{},
		mutex: &sync.RWMutex{},
	}
}

func (l *listType[K]) Add(items ...K) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	l.data = append(l.data, items...)
}

func (l *listType[K]) Set(items []K) {
	l.mutex.Lock()
	defer l.mutex.Unlock()
	l.data = items
}

func (l *listType[K]) Clear() {
	l.mutex.Lock()
	defer l.mutex.Unlock()
	l.data = []K{}
}

func (l *listType[K]) Contents() []K {
	l.mutex.RLock()
	defer l.mutex.RUnlock()

	return l.data
}

func (l *listType[K]) Get(i int) (K, bool) {
	l.mutex.RLock()
	defer l.mutex.RUnlock()

	if i < 0 || i >= len(l.data) {
		return Zero[K](), false
	}

	return l.data[i], true
}

func (l *listType[K]) Size() int {
	l.mutex.RLock()
	defer l.mutex.RUnlock()

	return len(l.data)
}
