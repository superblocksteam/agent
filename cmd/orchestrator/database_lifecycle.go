package main

import (
	"context"
	"os"

	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/databaselifecycle"
	runfx "github.com/superblocksteam/agent/pkg/run/fx"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

// databaseLifecycleWorkerRunnable runs the database lifecycle worker as a
// goroutine in the same process as the API servers (added to main()'s
// run.Group, so it shares the process's signal-driven shutdown). agentID is
// the orchestrator's own per-boot agent id: the registrar publishes this
// process's environment profiles under that id, so the worker claims
// dispatches as the same identity — no separate agent id configuration.
// logger is the process logger so worker logs flow through the orchestrator's
// zap pipeline (including remote emitters) rather than a process-global
// default.
func databaseLifecycleWorkerRunnable(serverClientOptions clients.ServerClientOptions, agentID string, logger *zap.Logger) run.Runnable {
	return runfx.AdaptRunCtxAsRunnable(func(ctx context.Context) error {
		return databaselifecycle.RunOrchestratorWorker(ctx, os.Getenv, serverClientOptions, agentID, logger)
	})
}
