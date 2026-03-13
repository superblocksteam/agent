package signaldelay

import (
	"os"
	"time"
)

// Option configures the signal delay runnable.
type Option func(*runnable)

// WithSignals sets the signals to listen for. Defaults to os.Interrupt and
// syscall.SIGTERM if empty.
func WithSignals(signals ...os.Signal) Option {
	return func(r *runnable) {
		r.signals = append([]os.Signal{}, signals...)
	}
}

// WithBaseDelay sets the base delay after signal receipt before returning.
func WithBaseDelay(d time.Duration) Option {
	return func(r *runnable) {
		r.baseDelay = d
	}
}

// WithMaxJitter sets the maximum random jitter added to the base delay.
// The actual jitter is a random value in [0, maxJitter).
func WithMaxJitter(d time.Duration) Option {
	return func(r *runnable) {
		r.maxJitter = d
	}
}
