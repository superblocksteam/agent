package databaselifecycle

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

func TestRunPollLoopPollsUntilContextCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	polls := make(chan string, 3)
	worker := PollOnceFunc(func(ctx context.Context, agentID string) (PollResult, error) {
		polls <- agentID
		if len(polls) == 2 {
			cancel()
		}
		return PollResult{}, nil
	})

	err := RunPollLoop(ctx, worker, "agent-1", time.Millisecond, nil)

	require.ErrorIs(t, err, context.Canceled)
	require.Equal(t, "agent-1", <-polls)
	require.Equal(t, "agent-1", <-polls)
}

func TestRunPollLoopRejectsInvalidIntervals(t *testing.T) {
	err := RunPollLoop(context.Background(), PollOnceFunc(func(ctx context.Context, agentID string) (PollResult, error) {
		return PollResult{}, nil
	}), "agent-1", 0, nil)

	require.ErrorContains(t, err, "poll interval must be positive")
}

func TestRunPollLoopContinuesAfterTransientPollError(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	polls := 0
	worker := PollOnceFunc(func(ctx context.Context, agentID string) (PollResult, error) {
		polls++
		if polls == 1 {
			return PollResult{}, errors.New("temporary control-plane failure")
		}
		cancel()
		return PollResult{}, nil
	})

	err := RunPollLoop(ctx, worker, "agent-1", time.Millisecond, nil)

	require.ErrorIs(t, err, context.Canceled)
	require.Equal(t, 2, polls)
}

func TestRunPollLoopLogsTransientPollError(t *testing.T) {
	core, logs := observer.New(zap.WarnLevel)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	polls := 0
	worker := PollOnceFunc(func(ctx context.Context, agentID string) (PollResult, error) {
		polls++
		if polls == 1 {
			return PollResult{}, errors.New("temporary control-plane failure")
		}
		cancel()
		return PollResult{}, nil
	})

	err := RunPollLoop(ctx, worker, "agent-1", time.Millisecond, zap.New(core))

	require.ErrorIs(t, err, context.Canceled)
	require.Equal(t, 2, polls)
	entries := logs.FilterMessage("database lifecycle poll failed").All()
	require.Len(t, entries, 1)
	fields := entries[0].ContextMap()
	require.Equal(t, "agent-1", fields["agent_id"])
	require.Equal(t, "temporary control-plane failure", fields["error"])
}

func TestRunPollLoopLogsDispatchErrors(t *testing.T) {
	core, logs := observer.New(zap.WarnLevel)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	worker := PollOnceFunc(func(ctx context.Context, agentID string) (PollResult, error) {
		cancel()
		return PollResult{
			Claimed:   1,
			Processed: 0,
			Errors: []PollError{
				{
					BindingKey: "profile:postgres",
					Err:        errors.New("terraform apply failed"),
					RequestID:  "req-1",
					Retryable:  true,
				},
			},
		}, nil
	})

	err := RunPollLoop(ctx, worker, "agent-1", time.Millisecond, zap.New(core))

	require.ErrorIs(t, err, context.Canceled)
	entries := logs.FilterMessage("database lifecycle dispatch failed").All()
	require.Len(t, entries, 1)
	fields := entries[0].ContextMap()
	require.Equal(t, "agent-1", fields["agent_id"])
	require.Equal(t, "profile:postgres", fields["binding_key"])
	require.Equal(t, "req-1", fields["request_id"])
	require.Equal(t, true, fields["retryable"])
	require.Equal(t, "terraform apply failed", fields["error"])
}

func TestRunPollLoopReturnsContextCancellationBeforeFirstPoll(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := RunPollLoop(ctx, PollOnceFunc(func(ctx context.Context, agentID string) (PollResult, error) {
		t.Fatal("unexpected poll")
		return PollResult{}, nil
	}), "agent-1", time.Millisecond, nil)

	require.ErrorIs(t, err, context.Canceled)
}
