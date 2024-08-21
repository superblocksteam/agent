package utils

import (
	"sync"
)

type Map[K any] interface {
	Put(string, K)
	Get(key string) (K, bool)
	Del(string)
	Keys() List[string]
	Values() List[K]
	Entries() (List[string], List[K])
	Size() int
	Clone() Map[K]
	Merge(Map[K]) Map[K]
	ToGoMap() map[string]K
	Iterator() Iterator[K]
}

type mapType[K any] struct {
	data  map[string]K
	mutex *sync.RWMutex
	keys  []string
}

type mapIterator[K any] struct {
	m     *mapType[K]
	index int
}

func NewMap[K any]() Map[K] {
	return &mapType[K]{
		data:  map[string]K{},
		mutex: &sync.RWMutex{},
	}
}

func NewMapFromGoMap[K any](m map[string]K) Map[K] {
	result := NewMap[K]()
	for k, v := range m {
		result.Put(k, v)
	}
	return result
}

func (m *mapType[K]) Size() int {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	return len(m.data)
}

func (m *mapType[K]) Entries() (List[string], List[K]) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	keys := NewList[string]()
	values := NewList[K]()

	for k, v := range m.data {
		keys.Add(k)
		values.Add(v)
	}

	return keys, values
}

func (m *mapType[K]) Values() List[K] {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	list := NewList[K]()

	for _, v := range m.data {
		list.Add(v)
	}

	return list
}

func (m *mapType[K]) Put(key string, item K) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.data[key] = item
}

func (m *mapType[K]) Get(key string) (K, bool) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	val, ok := m.data[key]
	return val, ok
}

func (m *mapType[K]) Del(key string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	delete(m.data, key)
}

func (m *mapType[K]) Clone() Map[K] {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	cloned := NewMap[K]()

	for k, v := range m.data {
		cloned.Put(k, v)
	}

	return cloned
}

func (m *mapType[K]) Merge(other Map[K]) Map[K] {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	for _, item := range other.Keys().Contents() {
		val, _ := other.Get(item)
		m.data[item] = val
	}

	return m
}

func (m *mapType[K]) Keys() List[string] {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	list := NewList[string]()

	for k := range m.data {
		list.Add(k)
	}

	return list
}

func (m *mapType[K]) ToGoMap() map[string]K {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	return m.data
}

// Iterator returns an iterator for the map.
// It will not throw a CME but is subject to its side effects.
func (m *mapType[K]) Iterator() Iterator[K] {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.keys = make([]string, 0, len(m.data))
	for k := range m.data {
		m.keys = append(m.keys, k)
	}

	return &mapIterator[K]{m: m, index: 0}
}

func (mi *mapIterator[K]) HasNext() bool {
	mi.m.mutex.Lock()
	defer mi.m.mutex.Unlock()

	return mi.index < len(mi.m.keys)
}

// Next returns the next key/value pair in the map.
// You MUST call HasNext before calling this method.
func (mi *mapIterator[K]) Next() (string, K) {
	mi.m.mutex.Lock()
	defer mi.m.mutex.Unlock()

	k := mi.m.keys[mi.index]
	v := mi.m.data[k]
	mi.index++
	return k, v
}

func CopyGoMap[K comparable, V any](m map[K]V) map[K]V {
	result := make(map[K]V)
	for k, v := range m {
		result[k] = v
	}

	return result
}
