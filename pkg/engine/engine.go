package engine

import (
	"context"
	"io"

	"github.com/superblocksteam/agent/pkg/utils"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

type Console struct {
	Stdout io.ReadWriter
	Stderr io.ReadWriter
}

//go:generate mockery --name=Value --output ./mock --filename value.go --outpkg engine --structname Value
type Value interface {
	Result(...ResultOption) (any, error)
	JSON() (string, error)
	Err() error
	Console() *Console
}

//go:generate mockery --name=Engine --output ./mock --filename engine.go --outpkg engine --structname Engine
type Engine interface {
	Resolve(context.Context, string, utils.Map[*transportv1.Variable], ...ResolveOption) Value

	// Create a failed value.
	Failed(error) Value

	// Close gracefully terminates the engine.
	Close()
}

//go:generate mockery --name=Sandbox --output ./mock --filename sandbox.go --outpkg engine --structname Sandbox
type Sandbox interface {
	// Engine returns an execution instance within the sandbox.
	Engine(context.Context) (Engine, error)

	// Close gracefully terminates the sandox.
	Close()
}
