package plugin_executor

import (
	store "github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap"
)

type Options struct {
	Logger  *zap.Logger
	KVStore store.Store
}

type Option func(*Options)

func WithLogger(value *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = value
	}
}

func WithStore(value store.Store) Option {
	return func(o *Options) {
		o.KVStore = value
	}
}

func NewOptions(opts ...Option) *Options {
	options := &Options{}
	for _, opt := range opts {
		opt(options)
	}
	return options
}
