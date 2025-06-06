package reconciler

import (
	"time"

	"github.com/cenkalti/backoff"
	"github.com/jonboulle/clockwork"
)

type Option func(o *options)

type options struct {
	backoff backoff.BackOff
	clock   clockwork.Clock
}

func defaults() options {
	b := backoff.NewExponentialBackOff()
	b.MaxElapsedTime = 0 // never stop retrying
	b.MaxInterval = 30 * time.Second

	return options{
		backoff: b,
		clock:   clockwork.NewRealClock(),
	}
}

func WithClock(clock clockwork.Clock) Option {
	return func(options *options) {
		options.clock = clock
	}
}
