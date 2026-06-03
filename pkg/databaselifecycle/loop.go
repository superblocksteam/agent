package databaselifecycle

import (
	"context"
	"errors"
	"time"

	"go.uber.org/zap"
)

type Poller interface {
	PollOnce(context.Context, string) (PollResult, error)
}

type PollOnceFunc func(context.Context, string) (PollResult, error)

func (f PollOnceFunc) PollOnce(ctx context.Context, agentID string) (PollResult, error) {
	return f(ctx, agentID)
}

func RunPollLoop(ctx context.Context, poller Poller, agentID string, interval time.Duration, logger *zap.Logger) error {
	if interval <= 0 {
		return errors.New("database lifecycle poll interval must be positive")
	}
	if logger == nil {
		logger = zap.NewNop()
	}

	// On cancellation the loop returns ctx.Err(): run-group adapters
	// (runfx.AdaptRunCtxAsRunnable) treat context errors as a graceful stop
	// and a nil return as a contract violation.
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		result, err := poller.PollOnce(ctx, agentID)
		if err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			logger.Warn("database lifecycle poll failed", zap.String("agent_id", agentID), zap.Error(err))
		} else {
			logPollResult(logger, agentID, result)
		}

		timer := time.NewTimer(interval)
		select {
		case <-ctx.Done():
			if !timer.Stop() {
				<-timer.C
			}
			return ctx.Err()
		case <-timer.C:
		}
	}
}

func logPollResult(logger *zap.Logger, agentID string, result PollResult) {
	for _, pollErr := range result.Errors {
		logger.Warn(
			"database lifecycle dispatch failed",
			zap.String("agent_id", agentID),
			zap.String("binding_key", pollErr.BindingKey),
			zap.String("request_id", pollErr.RequestID),
			zap.Bool("retryable", pollErr.Retryable),
			zap.Error(pollErr.Err),
		)
	}
}
