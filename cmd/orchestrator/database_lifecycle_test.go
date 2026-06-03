package main

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
	"go.uber.org/zap"
)

func TestDatabaseLifecycleWorkerRunnableRequiresAgentID(t *testing.T) {
	runnable := databaseLifecycleWorkerRunnable(clients.ServerClientOptions{}, "", zap.NewNop())

	err := runnable.Run(context.Background())

	require.ErrorContains(t, err, "database lifecycle agent id is required")
}

func TestDatabaseLifecycleWorkerRunnableThreadsAgentID(t *testing.T) {
	// With an agent id supplied, bootstrap proceeds past the identity check
	// and fails on the next required setting instead — proving the id from
	// the orchestrator process reaches the worker config.
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES", "")
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES", "")
	runnable := databaseLifecycleWorkerRunnable(clients.ServerClientOptions{}, "agent-1", zap.NewNop())

	err := runnable.Run(context.Background())

	require.ErrorContains(t, err, "allowed resource types are required")
}

func TestDatabaseLifecycleWorkerRunnableStopsCleanlyOnContextCancellation(t *testing.T) {
	// run.Group shutdown contract: the poll loop returns ctx.Err() on
	// cancellation and the runnable adapter converts that into a nil return,
	// so a SIGTERM-driven group stop is not reported as a worker failure.
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ROOT_DIR", t.TempDir())
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES", "aws_db_instance")
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES", "registry.example.com/modules")
	runnable := databaseLifecycleWorkerRunnable(clients.ServerClientOptions{}, "agent-1", zap.NewNop())
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := runnable.Run(ctx)

	require.NoError(t, err)
}
