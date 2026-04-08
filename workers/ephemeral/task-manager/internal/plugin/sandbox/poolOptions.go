package sandbox

import (
	"time"

	"go.uber.org/zap"
)

type PoolOptions struct {
	SandboxOptions []Option

	WorkerId           string
	SandboxPoolSize    int
	SandboxAddresses   []string
	EphemeralExecution bool

	Logger *zap.Logger

	DrainCompleteCh <-chan struct{}

	// SandboxRecoveryTimeout is how long a sandbox may stay unhealthy with TRANSIENT degradation
	// before it is torn down and recreated. In task-manager this is set from
	// transport.redis.degraded.mode.max.time (same as Redis transport max degraded duration).
	// Zero disables timed replacement (FATAL still replaces immediately in dynamic mode).
	// In static mode (sandbox.address), NewSandboxPool forces this to zero and does not replace sandboxes on FATAL.
	SandboxRecoveryTimeout time.Duration
}

type PoolOption func(*PoolOptions)

func WithWorkerId(id string) PoolOption {
	return func(o *PoolOptions) {
		o.WorkerId = id
	}
}

func WithSandboxPoolSize(size int) PoolOption {
	return func(o *PoolOptions) {
		o.SandboxPoolSize = size
	}
}

func WithSandboxAddresses(addresses []string) PoolOption {
	return func(o *PoolOptions) {
		o.SandboxAddresses = addresses
	}
}

func WithEphemeralExecution(ephemeral bool) PoolOption {
	return func(o *PoolOptions) {
		o.EphemeralExecution = ephemeral
	}
}

func WithSandboxOptions(opts ...Option) PoolOption {
	return func(o *PoolOptions) {
		o.SandboxOptions = opts
	}
}

func WithPoolLogger(logger *zap.Logger) PoolOption {
	return func(o *PoolOptions) {
		o.Logger = logger
	}
}

func WithDrainCompleteCh(ch <-chan struct{}) PoolOption {
	return func(o *PoolOptions) {
		o.DrainCompleteCh = ch
	}
}

func WithSandboxRecoveryTimeout(d time.Duration) PoolOption {
	return func(o *PoolOptions) {
		o.SandboxRecoveryTimeout = d
	}
}

func ApplyPoolOptions(opts ...PoolOption) *PoolOptions {
	poolOpts := &PoolOptions{
		SandboxPoolSize: 1,
		SandboxOptions:  []Option{},
		Logger:          zap.NewNop(),
	}
	for _, opt := range opts {
		if opt == nil {
			continue
		}
		opt(poolOpts)
	}
	return poolOpts
}
