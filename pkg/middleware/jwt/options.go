package jwt

import (
	"crypto/ecdsa"
	"crypto/rsa"

	"go.uber.org/zap"
)

type Option func(*options)

type options struct {
	logger *zap.Logger
	key    string

	hmacSigningKey       []byte
	rsaSigningKey        *rsa.PublicKey
	ecdsaSigningKey      *ecdsa.PublicKey
	claimsFactory        ClaimsFactory
	additionalValidators []JwtValidator
}

func newOptions(opts ...Option) *options {
	opt := options{
		logger:        zap.NewNop(),
		key:           "authorization",
		claimsFactory: defaultClaimsFactory,
	}

	for _, o := range opts {
		o(&opt)
	}

	return &opt
}

func WithLogger(logger *zap.Logger) Option {
	return func(o *options) {
		o.logger = logger
	}
}

func WithMetadataKey(key string) Option {
	return func(o *options) {
		o.key = key
	}
}

// DEPRECATED: Use WithSigningKeyHMAC.
func WithSigningKey(key []byte) Option {
	return WithSigningKeyHMAC(key)
}

func WithSigningKeyHMAC(key []byte) Option {
	return func(o *options) {
		o.hmacSigningKey = key
	}
}

func WithSigningKeyRSA(key *rsa.PublicKey) Option {
	return func(o *options) {
		o.rsaSigningKey = key
	}
}

func WithSigningKeyECDSA(key *ecdsa.PublicKey) Option {
	return func(o *options) {
		o.ecdsaSigningKey = key
	}
}

func WithClaimsFactory(factory ClaimsFactory) Option {
	return func(o *options) {
		o.claimsFactory = factory
	}
}

func WithAdditionalValidators(validators ...JwtValidator) Option {
	return func(o *options) {
		o.additionalValidators = validators
	}
}
