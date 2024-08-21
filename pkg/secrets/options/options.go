package options

import (
	"github.com/superblocksteam/agent/pkg/crypto/cipher"
	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap"
)

type Options struct {
	Logger *zap.Logger
	Region string
	Cache  store.Store
	Cipher cipher.Cipher
}

type Option func(*Options)

func Apply(opts ...Option) *Options {
	options := &Options{
		Logger: zap.NewNop(),
		Cache:  store.Memory(),
		Cipher: cipher.Plaintext(),
	}

	for _, opt := range opts {
		opt(options)
	}

	return options
}

func WithLogger(logger *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = logger
	}
}

func WithRegion(region string) Option {
	return func(o *Options) {
		o.Region = region
	}
}

func WithCache(cache store.Store) Option {
	return func(o *Options) {
		o.Cache = cache
	}
}

func WithCipher(cipher cipher.Cipher) Option {
	return func(o *Options) {
		o.Cipher = cipher
	}
}
