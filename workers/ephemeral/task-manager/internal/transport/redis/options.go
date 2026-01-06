package redis

import (
	"time"

	r "github.com/redis/go-redis/v9"

	"workers/ephemeral/task-manager/internal/plugin_executor"
	redisstore "workers/ephemeral/task-manager/internal/store/redis"

	"go.uber.org/zap"
)

// Options for creating a RedisTransport
type Options struct {
	RedisClient         *r.Client
	StreamKeys          []string
	Logger              *zap.Logger
	BlockDuration       time.Duration
	MessageCount        int64
	WorkerId            string
	ConsumerGroup       string
	PluginExecutor      plugin_executor.PluginExecutor
	ExecutionPool       int64
	FileContextProvider redisstore.FileContextProvider
	Ephemeral           bool
	EphemeralTimeout    time.Duration // Timeout for ephemeral job execution (0 = no timeout)
	AgentKey            string        // Agent key for file server authentication
}

// Option is a function that modifies Options
type Option func(*Options)

// WithRedisClient sets the Redis client
func WithRedisClient(value *r.Client) Option {
	return func(o *Options) {
		o.RedisClient = value
	}
}

// WithStreamKeys sets the stream keys (multiple streams supported)
func WithStreamKeys(value []string) Option {
	return func(o *Options) {
		o.StreamKeys = value
	}
}

// WithLogger sets the logger
func WithLogger(value *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = value
	}
}

// WithBlockDuration sets the block duration for XReadGroup
func WithBlockDuration(value time.Duration) Option {
	return func(o *Options) {
		o.BlockDuration = value
	}
}

// WithMessageCount sets the max message count per poll
func WithMessageCount(value int64) Option {
	return func(o *Options) {
		o.MessageCount = value
	}
}

// WithWorkerId sets the worker ID
func WithWorkerId(value string) Option {
	return func(o *Options) {
		o.WorkerId = value
	}
}

// WithConsumerGroup sets the consumer group
func WithConsumerGroup(value string) Option {
	return func(o *Options) {
		o.ConsumerGroup = value
	}
}

// WithPluginExecutor sets the plugin executor
func WithPluginExecutor(value plugin_executor.PluginExecutor) Option {
	return func(o *Options) {
		o.PluginExecutor = value
	}
}

// WithExecutionPool sets the execution pool size
func WithExecutionPool(value int64) Option {
	return func(o *Options) {
		o.ExecutionPool = value
	}
}

// WithFileContextProvider sets the file context provider
func WithFileContextProvider(value redisstore.FileContextProvider) Option {
	return func(o *Options) {
		o.FileContextProvider = value
	}
}

// WithEphemeral sets ephemeral mode (process one job and exit)
func WithEphemeral(value bool) Option {
	return func(o *Options) {
		o.Ephemeral = value
	}
}

// WithEphemeralTimeout sets the timeout for ephemeral job execution
func WithEphemeralTimeout(value time.Duration) Option {
	return func(o *Options) {
		o.EphemeralTimeout = value
	}
}

// WithAgentKey sets the agent key for file server authentication
func WithAgentKey(value string) Option {
	return func(o *Options) {
		o.AgentKey = value
	}
}

// NewOptions creates Options with the given options applied
func NewOptions(opts ...Option) *Options {
	options := &Options{
		ExecutionPool: 50,
		BlockDuration: 5 * time.Second,
		MessageCount:  10,
	}
	for _, opt := range opts {
		opt(options)
	}
	return options
}
