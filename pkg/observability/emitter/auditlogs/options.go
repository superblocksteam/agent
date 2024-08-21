package auditlogs

import (
	"time"

	"github.com/superblocksteam/agent/pkg/clients"
)

type Option func(*Options)

func apply(options ...Option) *Options {
	ops := &Options{
		//FlushMaxDuration: 5 * time.Minute,
		FlushMaxDuration: 5 * time.Second,
		FlushMaxItems:    100,
	}

	for _, op := range options {
		op(ops)
	}

	return ops
}

func ServerClient(serverClient clients.ServerClient) Option {
	return func(o *Options) {
		o.ServerClient = serverClient
	}
}

// Enabled controls whether this emmiter is enabled.
func Enabled(enabled bool) Option {
	return func(o *Options) {
		o.Enabled = enabled
	}
}

func FlushMaxItems(max int) Option {
	return func(o *Options) {
		o.FlushMaxItems = max
	}
}

func FlushMaxDuration(max time.Duration) Option {
	return func(o *Options) {
		o.FlushMaxDuration = max
	}
}
func AgentId(agentId string) Option {
	return func(o *Options) {
		o.AgentId = agentId
	}
}
