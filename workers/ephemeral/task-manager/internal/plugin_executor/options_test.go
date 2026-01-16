package plugin_executor

import (
	"testing"

	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap"
)

func TestWithLogger(t *testing.T) {
	logger := zap.NewNop()
	opts := NewOptions(WithLogger(logger))

	if opts.Logger != logger {
		t.Errorf("Logger was not set correctly")
	}
}

func TestWithStore(t *testing.T) {
	memStore := store.Memory()
	opts := NewOptions(WithStore(memStore))

	if opts.Store != memStore {
		t.Errorf("Store was not set correctly")
	}
}

func TestOptionsChaining(t *testing.T) {
	logger := zap.NewNop()
	memStore := store.Memory()

	opts := NewOptions(
		WithStore(memStore),
		WithLogger(logger),
	)

	if opts.Store != memStore {
		t.Errorf("Store was not set correctly")
	}

	if opts.Logger != logger {
		t.Errorf("Logger was not set correctly")
	}
}

func TestNewOptionsEmpty(t *testing.T) {
	opts := NewOptions()

	if opts.Store != nil {
		t.Errorf("Store should be nil by default")
	}

	if opts.Logger == nil || opts.Logger.Name() != "" {
		t.Errorf("Logger should be No-op logger by default")
	}
}
