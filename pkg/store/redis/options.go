package redis

import "time"

var defaults config = config{}

var emptyDuration time.Duration

type config struct {
	defaultTtl time.Duration
}

type Option func(c *config)

func WithDefaultTtl(ttl time.Duration) Option {
	return func(c *config) {
		c.defaultTtl = ttl
	}
}
