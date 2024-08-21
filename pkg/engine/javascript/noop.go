package javascript

import (
	"context"

	pkgengine "github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/utils"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

var _ pkgengine.Engine = &noopEngine{}

type noopEngine struct {
	err error
}

func newNoopEngine(err error) *noopEngine {
	return &noopEngine{
		err: err,
	}
}

func (n *noopEngine) Resolve(_ context.Context, _ string, _ utils.Map[*transportv1.Variable], _ ...pkgengine.ResolveOption) pkgengine.Value {
	return n.Failed(n.err)
}

func (n *noopEngine) Failed(err error) pkgengine.Value {
	return &noopValue{
		err: err,
	}
}

func (n *noopEngine) Close() {
	// noop
}

type noopValue struct {
	err error
}

func (n *noopValue) Result(_ ...pkgengine.ResultOption) (any, error) {
	return nil, n.err
}

func (n *noopValue) JSON() (string, error) {
	return "", n.err
}

func (n *noopValue) Err() error {
	return n.err
}

func (n *noopValue) Console() *pkgengine.Console {
	return nil
}
