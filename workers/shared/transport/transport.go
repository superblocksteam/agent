// Package transport defines common transport interfaces for workers.
package transport

import (
	"github.com/superblocksteam/run"
)

// Transport defines the interface for worker transport implementations.
// Both the golang and ephemeral workers implement this interface.
type Transport interface {
	run.Runnable
}
