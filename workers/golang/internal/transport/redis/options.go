package redis

import (
	"time"

	r "github.com/redis/go-redis/v9"

	"workers/golang/internal/plugin_executor"

	"go.uber.org/zap"
)

type Options struct {
	RedisClient    *r.Client
	StreamKeys     []string
	Logger         *zap.Logger
	BlockDuration  time.Duration
	MessageCount   int64
	WorkerId       string
	ConsumerGroup  string
	MaxBytes       int64
	PluginExecutor plugin_executor.PluginExecutor
	ExecutionPool  int64
}

type Option func(*Options)

func WithRedisClient(value *r.Client) Option {
	return func(o *Options) {
		o.RedisClient = value
	}
}

func WithStreamKeys(value []string) Option {
	return func(o *Options) {
		o.StreamKeys = value
	}
}

func WithLogger(value *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = value
	}
}

func WithBlockDuration(value time.Duration) Option {
	return func(o *Options) {
		o.BlockDuration = value
	}
}

func WithMessageCount(value int64) Option {
	return func(o *Options) {
		o.MessageCount = value
	}
}

func WithWorkerId(value string) Option {
	return func(o *Options) {
		o.WorkerId = value
	}
}

func WithConsumerGroup(value string) Option {
	return func(o *Options) {
		o.ConsumerGroup = value
	}
}

func WithMaxBytes(value int64) Option {
	return func(o *Options) {
		o.MaxBytes = value
	}
}

func WithPluginExecutor(value plugin_executor.PluginExecutor) Option {
	return func(o *Options) {
		o.PluginExecutor = value
	}
}

func WithExecutionPool(value int64) Option {
	return func(o *Options) {
		o.ExecutionPool = value
	}
}

func NewOptions(opts ...Option) *Options {
	options := &Options{
		ExecutionPool: 50,
	}
	for _, opt := range opts {
		opt(options)
	}
	return options
}
