package iam

import (
	"context"
	"time"
)

type config struct {
	// persisting a context on a struct is bad, but redis.CredentialProvider
	// does not give us a choice
	ctx    context.Context
	now    func() time.Time
	signer Signer
}

type Option func(*config)

func WithCtx(ctx context.Context) Option {
	return func(c *config) {
		c.ctx = ctx
	}
}

func WithNow(now func() time.Time) Option {
	return func(c *config) {
		c.now = now
	}
}

func WithSigner(signer Signer) Option {
	return func(c *config) {
		c.signer = signer
	}
}
