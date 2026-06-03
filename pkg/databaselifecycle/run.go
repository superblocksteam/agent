package databaselifecycle

import (
	"context"
	"time"

	"github.com/superblocksteam/agent/pkg/clients"
	"go.uber.org/zap"
)

type PollLoop interface {
	Run(context.Context, Poller, string, time.Duration) error
}

type PollLoopFunc func(context.Context, Poller, string, time.Duration) error

func (f PollLoopFunc) Run(ctx context.Context, poller Poller, agentID string, interval time.Duration) error {
	return f(ctx, poller, agentID, interval)
}

// NewPollLoop binds RunPollLoop to the given logger so loop output flows
// through the caller's logging pipeline. A nil logger discards loop logs.
func NewPollLoop(logger *zap.Logger) PollLoop {
	return PollLoopFunc(func(ctx context.Context, poller Poller, agentID string, interval time.Duration) error {
		return RunPollLoop(ctx, poller, agentID, interval, logger)
	})
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
		loop = NewPollLoop(nil)
	}
	worker, interval, err := BootstrapWorker(config, client, executor, locker)
	if err != nil {
		return err
	}
	return loop.Run(ctx, worker, config.AgentID, interval)
}
