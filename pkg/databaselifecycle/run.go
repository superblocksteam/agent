package databaselifecycle

import (
	"context"
	"time"

	"github.com/superblocksteam/agent/pkg/clients"
)

type PollLoop interface {
	Run(context.Context, Poller, string, time.Duration) error
}

type PollLoopFunc func(context.Context, Poller, string, time.Duration) error

func (f PollLoopFunc) Run(ctx context.Context, poller Poller, agentID string, interval time.Duration) error {
	return f(ctx, poller, agentID, interval)
}

func RunFromConfig(
	ctx context.Context,
	config Config,
	client clients.ServerClient,
	executor CommandExecutor,
	locker ResourceLocker,
	loop PollLoop,
) error {
	if loop == nil {
		loop = PollLoopFunc(RunPollLoop)
	}
	worker, interval, err := BootstrapWorker(config, client, executor, locker)
	if err != nil {
		return err
	}
	return loop.Run(ctx, worker, config.AgentID, interval)
}
