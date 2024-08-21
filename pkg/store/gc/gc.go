package gc

import (
	"context"
	"sync"
	"time"

	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
)

type GC interface {
	Record(...string)
	Run(context.Context) error
	Contents() []string
	Schedule(time.Duration) error
}

type Options struct {
	Store store.Store
}

type gc struct {
	store store.Store
	data  utils.List[string]
	mutex sync.RWMutex
}

func New(options *Options) GC {
	return &gc{
		store: options.Store,
		data:  utils.NewList[string](),
		mutex: sync.RWMutex{},
	}
}

func (collector *gc) Record(keys ...string) {
	collector.mutex.Lock()
	defer collector.mutex.Unlock()

	for _, key := range keys {
		if key == "" {
			continue
		}

		collector.data.Add(key)
	}
}

func (collector *gc) Run(ctx context.Context) error {
	collector.mutex.RLock()
	defer collector.mutex.RUnlock()

	return collector.store.Delete(context.Background(), collector.data.Contents()...)
}

func (collector *gc) Schedule(duration time.Duration) error {
	collector.mutex.Lock()
	collector.mutex.RLock()
	defer collector.mutex.RUnlock()

	return collector.store.Expire(context.Background(), duration, collector.Contents()...)
}

func (collector *gc) Contents() []string {
	collector.mutex.RLock()
	defer collector.mutex.RUnlock()

	return collector.data.Contents()
}
