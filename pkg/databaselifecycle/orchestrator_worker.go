package databaselifecycle

import (
	"context"
	"path/filepath"

	"github.com/superblocksteam/agent/pkg/clients"
	"go.uber.org/zap"
)

type orchestratorRuntime struct {
	Config   Config
	Executor CommandExecutor
	Locker   ResourceLocker
}

type runFromConfigFunc func(
	context.Context,
	Config,
	clients.ServerClient,
	CommandExecutor,
	ResourceLocker,
	PollLoop,
) error

func newOrchestratorRuntime(getenv func(string) string, agentID string) (*orchestratorRuntime, error) {
	config, err := ConfigFromEnv(getenv)
	if err != nil {
		return nil, err
	}
	config.AgentID = agentID
	return &orchestratorRuntime{
		Config:   config,
		Executor: NewBinaryCommandExecutor(config.TerraformBin),
		Locker:   NewFileLocker(filepath.Join(config.RootDir, "locks")),
	}, nil
}

func newOrchestratorServerClient(options clients.ServerClientOptions, agentID string) clients.ServerClient {
	headers := make(map[string]string, len(options.Headers)+1)
	for key, value := range options.Headers {
		headers[key] = value
	}
	headers["x-superblocks-agent-id"] = agentID
	options.Headers = headers
	return clients.NewServerClient(&options)
}

// RunOrchestratorWorker builds the database lifecycle worker dependencies from
// orchestrator process configuration and runs the shared lifecycle poll loop.
// agentID is the orchestrator's own (per-boot) agent id: the registrar
// publishes this process's environment profiles under that id, so the worker
// claims dispatches as the same identity without any separate configuration.
// logger is the orchestrator's process logger, so worker output flows through
// the same pipeline (and remote emitters) as every other subsystem.
func RunOrchestratorWorker(ctx context.Context, getenv func(string) string, serverClientOptions clients.ServerClientOptions, agentID string, logger *zap.Logger) error {
	return runOrchestratorWorker(ctx, getenv, serverClientOptions, agentID, logger, RunFromConfig)
}

func runOrchestratorWorker(
	ctx context.Context,
	getenv func(string) string,
	serverClientOptions clients.ServerClientOptions,
	agentID string,
	logger *zap.Logger,
	runFromConfig runFromConfigFunc,
) error {
	runtime, err := newOrchestratorRuntime(getenv, agentID)
	if err != nil {
		return err
	}
	client := newOrchestratorServerClient(serverClientOptions, runtime.Config.AgentID)
	return runFromConfig(ctx, runtime.Config, client, runtime.Executor, runtime.Locker, NewPollLoop(logger))
}
