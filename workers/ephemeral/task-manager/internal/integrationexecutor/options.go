// Package integrationexecutor provides a gRPC service that allows sandboxed
// code to execute integrations. The sandbox calls this service on the
// task-manager (co-located in the same pod) which proxies the request to the
// orchestrator's ExecuteV3 endpoint, forwarding the stored JWT.
package integrationexecutor

import (
	"crypto/ecdsa"

	redisstore "workers/ephemeral/task-manager/internal/store/redis"

	"go.uber.org/zap"
	"google.golang.org/grpc"
)

// FileContextProvider is the subset of the variable store interface needed
// by the integration executor to look up stored JWT tokens and profiles.
type FileContextProvider interface {
	GetFileContext(executionID string) *redisstore.ExecutionFileContext
}

// Options holds the configuration for the IntegrationExecutorService.
type Options struct {
	server              *grpc.Server
	port                int
	logger              *zap.Logger
	orchestratorAddress string
	fileContextProvider FileContextProvider
	jwtSigningKey       *ecdsa.PublicKey
}

// Option is a functional option for configuring IntegrationExecutorService.
type Option func(*Options)

// WithServer sets the gRPC server to register the service with.
func WithServer(value *grpc.Server) Option {
	return func(o *Options) {
		o.server = value
	}
}

// WithPort sets the port the gRPC server listens on.
func WithPort(value int) Option {
	return func(o *Options) {
		o.port = value
	}
}

// WithLogger sets the logger.
func WithLogger(value *zap.Logger) Option {
	return func(o *Options) {
		o.logger = value
	}
}

// WithOrchestratorAddress sets the internal gRPC address of the orchestrator.
func WithOrchestratorAddress(value string) Option {
	return func(o *Options) {
		o.orchestratorAddress = value
	}
}

// WithFileContextProvider sets the provider used to look up execution context
// (JWT tokens and profiles) by execution ID.
func WithFileContextProvider(value FileContextProvider) Option {
	return func(o *Options) {
		o.fileContextProvider = value
	}
}

// WithJWTSigningKey sets the ECDSA public key used to validate stored JWTs
// before forwarding them to the orchestrator. If nil, JWT validation is skipped.
func WithJWTSigningKey(value *ecdsa.PublicKey) Option {
	return func(o *Options) {
		o.jwtSigningKey = value
	}
}

// ApplyOptions applies functional options and returns the resulting Options.
func ApplyOptions(opts ...Option) *Options {
	options := &Options{
		logger: zap.NewNop(),
	}

	for _, opt := range opts {
		opt(options)
	}

	return options
}
