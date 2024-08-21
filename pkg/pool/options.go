package pool

import (
	"go.uber.org/zap"
)

type Option func(*Options)

type Options struct {
	size   int
	logger *zap.Logger
}

func apply(opts ...Option) *Options {
	options := new(Options)

	for _, opt := range opts {
		opt(options)
	}

	return options
}

func (o *Options) Validate() error {
	return nil
}

func Size(size int) Option {
	return func(options *Options) {
		options.size = size
	}
}

func Logger(logger *zap.Logger) Option {
	return func(options *Options) {
		options.logger = logger
	}
}
