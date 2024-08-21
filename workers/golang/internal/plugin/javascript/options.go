package javascript

import (
	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap"
)

type Options struct {
	Logger            *zap.Logger
	Headers           map[string][]string
	StoreClient       store.Store
	V8MaxOldSpaceSize int
	V8MaxHeapSize     int
}

type Option func(*Options)

func WithStoreClient(value store.Store) Option {
	return func(o *Options) {
		o.StoreClient = value
	}
}

func WithHeaders(value map[string][]string) Option {
	return func(o *Options) {
		o.Headers = value
	}
}

func WithLogger(value *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = value
	}
}

func WithV8MaxOldSpaceSize(value int) Option {
	return func(o *Options) {
		o.V8MaxOldSpaceSize = value
	}
}

func WithV8MaxHeapSize(value int) Option {
	return func(o *Options) {
		o.V8MaxHeapSize = value
	}
}

func NewOptions(opts ...Option) *Options {
	options := &Options{}
	for _, opt := range opts {
		opt(options)
	}
	return options
}
