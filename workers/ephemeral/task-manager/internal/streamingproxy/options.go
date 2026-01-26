package streamingproxy

import (
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

type Options struct {
	server      *grpc.Server
	redisClient *redis.Client
	port        int
	logger      *zap.Logger
}

type Option func(*Options)

func WithServer(value *grpc.Server) Option {
	return func(o *Options) {
		o.server = value
	}
}

func WithRedisClient(value *redis.Client) Option {
	return func(o *Options) {
		o.redisClient = value
	}
}

func WithPort(value int) Option {
	return func(o *Options) {
		o.port = value
	}
}

func WithLogger(value *zap.Logger) Option {
	return func(o *Options) {
		o.logger = value
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
