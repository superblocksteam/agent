package databaselifecycle

import (
	"context"
	"errors"
	"log/slog"
	"time"
)

type Poller interface {
	PollOnce(context.Context, string) (PollResult, error)
}

type PollOnceFunc func(context.Context, string) (PollResult, error)

func (f PollOnceFunc) PollOnce(ctx context.Context, agentID string) (PollResult, error) {
	return f(ctx, agentID)
}

func RunPollLoop(ctx context.Context, poller Poller, agentID string, interval time.Duration) error {
	return RunPollLoopWithLogger(ctx, poller, agentID, interval, slog.Default())
}

func RunPollLoopWithLogger(ctx context.Context, poller Poller, agentID string, interval time.Duration, logger *slog.Logger) error {
	if interval <= 0 {
		return errors.New("database lifecycle poll interval must be positive")
	}
	if logger == nil {
		logger = slog.Default()
	}

	for {
		select {
		case <-ctx.Done():
			return nil
		default:
		}
		result, err := poller.PollOnce(ctx, agentID)
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			logger.Warn("database lifecycle poll failed", "agent_id", agentID, "error", err)
		} else {
			logPollResult(logger, agentID, result)
		}

		timer := time.NewTimer(interval)
		select {
		case <-ctx.Done():
			if !timer.Stop() {
				<-timer.C
			}
			return nil
		case <-timer.C:
		}
	}
}

func logPollResult(logger *slog.Logger, agentID string, result PollResult) {
	for _, pollErr := range result.Errors {
		logger.Warn(
			"database lifecycle dispatch failed",
			"agent_id", agentID,
			"binding_key", pollErr.BindingKey,
			"request_id", pollErr.RequestID,
			"retryable", pollErr.Retryable,
			"error", pollErr.Err,
		)
	}
}
