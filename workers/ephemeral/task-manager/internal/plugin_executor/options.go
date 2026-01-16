package plugin_executor

import (
	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap"
)

// Options for creating a PluginExecutor
type Options struct {
	Logger *zap.Logger
	Store  store.Store // KV store for writing output results to
}

// Option is a function that modifies Options
type Option func(*Options)

// WithLogger sets the logger
func WithLogger(logger *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = logger
	}
}

// WithStore sets the KV store
func WithStore(store store.Store) Option {
	return func(o *Options) {
		o.Store = store
	}
}

// NewOptions creates Options with the given options applied
func NewOptions(opts ...Option) *Options {
	options := &Options{Logger: zap.NewNop()}
	for _, opt := range opts {
		opt(options)
	}
	return options
}
