package flagsclient

import (
	"go.uber.org/zap"
)

type Options struct {
	Config *string
	Logger *zap.Logger
}

type Option func(*Options)

func WithLocal(config string) Option {
	return func(d *Options) {
		d.Config = &config
	}
}

func WithLogger(logger *zap.Logger) Option {
	return func(d *Options) {
		d.Logger = logger
	}
}

func Apply(opts ...Option) Options {
	d := Options{
		Config: nil,
		Logger: zap.NewNop(),
	}

	for _, opt := range opts {
		opt(&d)
	}
	return d
}
