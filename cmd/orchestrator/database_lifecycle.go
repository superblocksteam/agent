package main

import (
	"context"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/databaselifecycle"
)

type databaseLifecycleRuntime struct {
	config   databaselifecycle.Config
	executor databaselifecycle.CommandExecutor
	locker   databaselifecycle.ResourceLocker
}

func newDatabaseLifecycleRuntime(getenv func(string) string) (*databaseLifecycleRuntime, error) {
	config, err := databaselifecycle.ConfigFromEnv(getenv)
	if err != nil {
		return nil, err
	}
	return &databaseLifecycleRuntime{
		config:   config,
		executor: databaselifecycle.NewBinaryCommandExecutor(config.TerraformBin),
		locker:   databaselifecycle.NewFileLocker(filepath.Join(config.RootDir, "locks")),
	}, nil
}

func runDatabaseLifecycleWorker(ctx context.Context, client clients.ServerClient) error {
	runtime, err := newDatabaseLifecycleRuntime(os.Getenv)
	if err != nil {
		return err
	}
	return databaselifecycle.RunFromConfig(ctx, runtime.config, client, runtime.executor, runtime.locker, nil)
}

func databaseLifecycleWorkerContext(parent context.Context) (context.Context, context.CancelFunc) {
	return signal.NotifyContext(parent, os.Interrupt, syscall.SIGTERM)
}
