package options

import (
	"context"
	"time"

	"github.com/superblocksteam/agent/pkg/store/gc"
	"github.com/superblocksteam/agent/pkg/worker"
	"github.com/superblocksteam/agent/pkg/worker/options"
)

type Options struct {
	Jitter time.Duration

	// If a block return an error, it will not propogate through the stack.
	IgnoreError bool

	// Do not add blocks to the global waiter.
	Async bool

	GC gc.GC

	BufferSize int

	Worker []options.Option

	Breaker context.CancelCauseFunc
	Signal  <-chan struct{}

	Queue chan *worker.ExecuteRequest
}

type Option func(*Options)

func Copy(options ...Option) []Option {
	new := make([]Option, len(options))
	copy(new, options)

	return new
}

func Apply(options ...Option) *Options {
	// Defaults...
	ops := &Options{
		BufferSize: 10,
	}

	for _, op := range options {
		op(ops)
	}

	return ops
}

func IgnoreError() Option {
	return func(o *Options) {
		o.IgnoreError = true
	}
}

func Async() Option {
	return func(o *Options) {
		o.Async = true
	}
}

func BufferSize(n int) Option {
	return func(o *Options) {
		o.BufferSize = n
	}
}

func Breaker(cancel context.CancelCauseFunc) Option {
	return func(o *Options) {
		o.Breaker = cancel
	}
}

func Worker(ops ...options.Option) Option {
	return func(o *Options) {
		o.Worker = ops
	}
}

func Signal(signal <-chan struct{}) Option {
	return func(o *Options) {
		o.Signal = signal
	}
}

func Jitter(max time.Duration) Option {
	return func(o *Options) {
		o.Jitter = max
	}
}

func GC(collector gc.GC) Option {
	return func(o *Options) {
		o.GC = collector
	}
}

func Queue(queue chan *worker.ExecuteRequest) Option {
	return func(o *Options) {
		o.Queue = queue
	}
}
