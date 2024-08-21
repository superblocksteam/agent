package remote

import (
	"net/http"
	"time"
)

type Option func(*Options)

func apply(options ...Option) *Options {
	// Here are the defaults.
	ops := &Options{
		enabled:          false,
		flushMaxItems:    100,
		flushMaxDuration: 1 * time.Minute,
		flushMaxSize:     1000000,
		maxRetries:       3,
		whitelist:        map[string]bool{},
	}

	for _, op := range options {
		op(ops)
	}

	return ops
}

// Enabled controls whether this emmiter is enabled.
func Enabled(enabled bool) Option {
	return func(o *Options) {
		o.enabled = enabled
	}
}

// The maximum number of retries we will attempt to flush a batch of items.
func MaxRetries(max int) Option {
	return func(o *Options) {
		o.maxRetries = max
	}
}

func FlushMaxItems(max int) Option {
	return func(o *Options) {
		o.flushMaxItems = max
	}
}

func FlushMaxDuration(max time.Duration) Option {
	return func(o *Options) {
		o.flushMaxDuration = max
	}
}

// Headers will be sent with each flush request.
func Headers(headers http.Header) Option {
	return func(o *Options) {
		o.headers = headers
	}
}

// Whitelist is the set of fields that will be emitted.
func Whitelist(whitelist ...string) Option {
	return func(o *Options) {
		if o.whitelist == nil {
			o.whitelist = map[string]bool{}
		}

		for _, item := range whitelist {
			o.whitelist[item] = true
		}
	}
}
