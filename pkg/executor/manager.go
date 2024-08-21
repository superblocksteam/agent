package executor

import "sync"

type exit struct {
	// key holds the block name holding the results, if any.
	key string

	// until propogates the exit signal until the given parent secop.
	until string
}

func (e *exit) empty() bool {
	return e.key == "" && e.until == ""
}

type manager struct {
	mutex   sync.RWMutex
	exiters map[string]chan *exit
}

func (m *manager) scope(name string) (exiter chan *exit) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	exiter = make(chan *exit, 1)
	m.exiters[name] = exiter
	return
}
