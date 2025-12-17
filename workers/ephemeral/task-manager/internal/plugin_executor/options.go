package plugin_executor

import (
	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap"
)

// Options for creating a PluginExecutor
type Options struct {
	Logger   *zap.Logger
	Language string      // Required: the language this executor handles (e.g., "python", "javascript")
	Store    store.Store // Required: KV store for output storage
}

// Option is a function that modifies Options
type Option func(*Options)

// WithLogger sets the logger
func WithLogger(logger *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = logger
	}
}

// WithLanguage sets the language for single-language mode
func WithLanguage(language string) Option {
	return func(o *Options) {
		o.Language = language
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
	options := &Options{}
	for _, opt := range opts {
		opt(options)
	}
	return options
}
