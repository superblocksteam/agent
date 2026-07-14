package sandbox

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSandboxPool_Ready(t *testing.T) {
	p := &SandboxPool{}
	require.False(t, p.Ready(), "a freshly-constructed pool is not ready")

	p.poolReady.Store(true)
	require.True(t, p.Ready(), "pool reports ready once poolReady is set")
}
