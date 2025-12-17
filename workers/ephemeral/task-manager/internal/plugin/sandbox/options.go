package sandbox

import (
	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap"
)

// Options for creating a SandboxPlugin
type Options struct {
	Address              string
	Language             string
	Logger               *zap.Logger
	VariableStoreAddress string
	Store                store.Store // Redis store for reading context bindings
}

// Option is a function that modifies Options
type Option func(*Options)

// WithAddress sets the sandbox server address
func WithAddress(address string) Option {
	return func(o *Options) {
		o.Address = address
	}
}

// WithLanguage sets the language for this sandbox
func WithLanguage(language string) Option {
	return func(o *Options) {
		o.Language = language
	}
}

// WithLogger sets the logger
func WithLogger(logger *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = logger
	}
}

// WithVariableStoreAddress sets the variable store gRPC address
func WithVariableStoreAddress(address string) Option {
	return func(o *Options) {
		o.VariableStoreAddress = address
	}
}

// WithStore sets the Redis store for reading context bindings
func WithStore(s store.Store) Option {
	return func(o *Options) {
		o.Store = s
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
