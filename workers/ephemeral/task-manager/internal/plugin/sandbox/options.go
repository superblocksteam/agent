package sandbox

import (
	"workers/ephemeral/task-manager/internal/sandboxmanager"

	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap"
)

// Options configures the SandboxPlugin
type Options struct {
	// Connection mode
	ConnectionMode SandboxConnectionMode

	// Static mode: connect to existing sandbox at this address
	SandboxAddress string
	// Dynamic mode: create new sandbox on-demand (requires SandboxManager and SandboxId)
	SandboxManager sandboxmanager.SandboxManager
	SandboxId      string // Used to name the sandbox (for dynamic mode)

	// Common options
	Logger               *zap.Logger
	VariableStoreAddress string
	KvStore              store.Store
	IpFilterSetter       IpFilterSetter // Optional - set allowed IP on variable store (only used in dynamic mode)
}

type Option func(*Options)

func WithConnectionMode(connectionMode SandboxConnectionMode) Option {
	return func(o *Options) {
		o.ConnectionMode = connectionMode
	}
}

func WithSandboxAddress(address string) Option {
	return func(o *Options) {
		o.SandboxAddress = address
	}
}

func WithSandboxManager(sandboxManager sandboxmanager.SandboxManager) Option {
	return func(o *Options) {
		o.SandboxManager = sandboxManager
	}
}

func WithSandboxId(sandboxId string) Option {
	return func(o *Options) {
		o.SandboxId = sandboxId
	}
}

func WithLogger(logger *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = logger
	}
}

func WithVariableStoreAddress(variableStoreAddress string) Option {
	return func(o *Options) {
		o.VariableStoreAddress = variableStoreAddress
	}
}

func WithKvStore(kvStore store.Store) Option {
	return func(o *Options) {
		o.KvStore = kvStore
	}
}

func WithIpFilterSetter(ipFilterSetter IpFilterSetter) Option {
	return func(o *Options) {
		o.IpFilterSetter = ipFilterSetter
	}
}

func ApplyOptions(opts ...Option) *Options {
	options := &Options{
		Logger:  zap.NewNop(),
		KvStore: store.Memory(),
	}

	for _, opt := range opts {
		opt(options)
	}
	return options
}
