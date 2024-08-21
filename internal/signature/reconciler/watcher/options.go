package ssewatcher

import (
	"crypto/tls"
	"time"

	"github.com/cenkalti/backoff/v4"
)

type Option func(o *options)

type options struct {
	backoff   backoff.BackOff
	tlsConfig *tls.Config
}

func defaults() options {
	b := backoff.NewExponentialBackOff()
	b.MaxElapsedTime = 0
	b.MaxInterval = 30 * time.Second

	return options{
		backoff: b,
	}
}

func WithTlsConfig(config *tls.Config) Option {
	return func(o *options) {
		o.tlsConfig = config
	}
}
