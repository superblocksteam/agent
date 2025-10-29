package redis

import (
	"time"

	redis "github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Options struct {
	redis             *redis.Client
	logger            *zap.Logger
	buckets           Buckets
	heartbeatInterval time.Duration
	heartbeatMisses   int
	timeout           time.Duration
	metadataTimeout   time.Duration
}

func WithHeartbeatInterval(interval time.Duration) func(*Options) error {
	return func(o *Options) error {
		o.heartbeatInterval = interval
		return nil
	}
}

func WithLogger(logger *zap.Logger) func(*Options) error {
	return func(o *Options) error {
		o.logger = logger
		return nil
	}
}

func WithTimeout(timeout time.Duration) func(*Options) error {
	return func(o *Options) error {
		o.timeout = timeout
		return nil
	}
}

func WithMetadataTimeout(timeout time.Duration) func(*Options) error {
	return func(o *Options) error {
		o.metadataTimeout = timeout
		return nil
	}
}

func WithHeartbeatMisses(misses int) func(*Options) error {
	return func(o *Options) error {
		o.heartbeatMisses = misses
		return nil
	}
}

func WithRedisClient(client *redis.Client) func(*Options) error {
	return func(o *Options) error {
		o.redis = client
		return nil
	}
}

func WithBuckets(buckets Buckets) func(*Options) error {
	return func(o *Options) error {
		o.buckets = buckets
		return nil
	}
}
