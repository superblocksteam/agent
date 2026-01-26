package redis

import (
	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

type Options struct {
	kvStore store.Store
	server  *grpc.Server
	logger  *zap.Logger
	port    int
}

type Option func(*Options)

func WithKvStore(value store.Store) Option {
	return func(o *Options) {
		o.kvStore = value
	}
}

func WithServer(value *grpc.Server) Option {
	return func(o *Options) {
		o.server = value
	}
}

func WithLogger(value *zap.Logger) Option {
	return func(o *Options) {
		o.logger = value
	}
}

func WithPort(value int) Option {
	return func(o *Options) {
		o.port = value
	}
}

func ApplyOptions(opts ...Option) *Options {
	options := &Options{
		logger: zap.NewNop(),
	}

	for _, opt := range opts {
		opt(options)
	}

	return options
}
