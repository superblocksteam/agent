package databaselifecycle

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
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

	err := RunPollLoop(ctx, worker, "agent-1", time.Millisecond)

	require.NoError(t, err)
	require.Equal(t, "agent-1", <-polls)
	require.Equal(t, "agent-1", <-polls)
}

func TestRunPollLoopRejectsInvalidIntervals(t *testing.T) {
	err := RunPollLoop(context.Background(), PollOnceFunc(func(ctx context.Context, agentID string) (PollResult, error) {
		return PollResult{}, nil
	}), "agent-1", 0)

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

	err := RunPollLoop(ctx, worker, "agent-1", time.Millisecond)

	require.NoError(t, err)
	require.Equal(t, 2, polls)
}

func TestRunPollLoopLogsTransientPollError(t *testing.T) {
	var logs bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&logs, nil))
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

	err := RunPollLoopWithLogger(ctx, worker, "agent-1", time.Millisecond, logger)

	require.NoError(t, err)
	require.Equal(t, 2, polls)
	require.Contains(t, logs.String(), "database lifecycle poll failed")
	require.Contains(t, logs.String(), "temporary control-plane failure")
}

func TestRunPollLoopLogsDispatchErrors(t *testing.T) {
	var logs bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&logs, nil))
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

	err := RunPollLoopWithLogger(ctx, worker, "agent-1", time.Millisecond, logger)

	require.NoError(t, err)
	logOutput := logs.String()
	for _, expected := range []string{
		"database lifecycle dispatch failed",
		"agent-1",
		"profile:postgres",
		"req-1",
		"terraform apply failed",
	} {
		require.True(t, strings.Contains(logOutput, expected), "expected log output to contain %q: %s", expected, logOutput)
	}
}

func TestRunPollLoopReturnsContextCancellationBeforeFirstPoll(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := RunPollLoop(ctx, PollOnceFunc(func(ctx context.Context, agentID string) (PollResult, error) {
		t.Fatal("unexpected poll")
		return PollResult{}, nil
	}), "agent-1", time.Millisecond)

	require.NoError(t, err)
}
