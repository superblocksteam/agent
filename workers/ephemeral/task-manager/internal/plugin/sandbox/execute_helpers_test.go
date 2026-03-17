package sandbox

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

var errRetriable = errors.New("retriable")
var errNonRetriable = errors.New("non-retriable")

func TestDoWithRetry_SuccessOnFirstAttempt(t *testing.T) {
	t.Parallel()

	logger := zap.NewNop()
	ctx := context.Background()
	callCount := 0

	resp, err := DoWithRetry(ctx, logger, 3, 10*time.Millisecond,
		func() (int, error) {
			callCount++
			return 42, nil
		},
		func(err error) bool { return true },
	)

	require.NoError(t, err)
	assert.Equal(t, 42, resp)
	assert.Equal(t, 1, callCount)
}

func TestDoWithRetry_SuccessOnRetry(t *testing.T) {
	t.Parallel()

	logger := zap.NewNop()
	ctx := context.Background()
	callCount := 0

	resp, err := DoWithRetry(ctx, logger, 3, 5*time.Millisecond,
		func() (string, error) {
			callCount++
			if callCount < 2 {
				return "", errRetriable
			}
			return "ok", nil
		},
		func(err error) bool { return errors.Is(err, errRetriable) },
	)

	require.NoError(t, err)
	assert.Equal(t, "ok", resp)
	assert.Equal(t, 2, callCount)
}

func TestDoWithRetry_NonRetriableError_ReturnsImmediately(t *testing.T) {
	t.Parallel()

	logger := zap.NewNop()
	ctx := context.Background()
	callCount := 0

	_, err := DoWithRetry(ctx, logger, 3, 10*time.Millisecond,
		func() (int, error) {
			callCount++
			return 0, errNonRetriable
		},
		func(err error) bool { return errors.Is(err, errRetriable) },
	)

	require.Error(t, err)
	assert.ErrorIs(t, err, errNonRetriable)
	assert.Equal(t, 1, callCount, "should not retry when shouldRetry returns false")
}

func TestDoWithRetry_MaxAttemptsExhausted_ReturnsLastError(t *testing.T) {
	t.Parallel()

	logger := zap.NewNop()
	ctx := context.Background()
	callCount := 0

	_, err := DoWithRetry(ctx, logger, 3, 5*time.Millisecond,
		func() (int, error) {
			callCount++
			return 0, errRetriable
		},
		func(err error) bool { return true },
	)

	require.Error(t, err)
	assert.ErrorIs(t, err, errRetriable)
	assert.Equal(t, 3, callCount)
}

func TestDoWithRetry_ContextCancelledDuringBackoff_ReturnsContextError(t *testing.T) {
	t.Parallel()

	logger := zap.NewNop()
	ctx, cancel := context.WithCancel(context.Background())
	callCount := 0

	// Cancel context after first failure, during backoff
	go func() {
		time.Sleep(15 * time.Millisecond)
		cancel()
	}()

	_, err := DoWithRetry(ctx, logger, 3, 20*time.Millisecond,
		func() (int, error) {
			callCount++
			if callCount == 1 {
				return 0, errRetriable
			}
			return 0, errRetriable
		},
		func(err error) bool { return true },
	)

	require.Error(t, err)
	assert.ErrorIs(t, err, context.Canceled)
	assert.Equal(t, 1, callCount)
}

func TestDoWithRetry_ContextAlreadyCancelled_ReturnsContextError(t *testing.T) {
	t.Parallel()

	logger := zap.NewNop()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	callCount := 0
	_, err := DoWithRetry(ctx, logger, 3, 10*time.Millisecond,
		func() (int, error) {
			callCount++
			return 0, errRetriable
		},
		func(err error) bool { return true },
	)

	require.Error(t, err)
	assert.ErrorIs(t, err, context.Canceled)
	assert.Equal(t, 1, callCount)
}

func TestDoWithRetry_ExponentialBackoff(t *testing.T) {
	t.Parallel()

	logger := zap.NewNop()
	ctx := context.Background()
	baseBackoff := 10 * time.Millisecond
	attempts := 0
	var lastBackoffStart time.Time

	// Track approximate timing: fail twice, succeed on third
	_, err := DoWithRetry(ctx, logger, 3, baseBackoff,
		func() (int, error) {
			attempts++
			if attempts < 3 {
				lastBackoffStart = time.Now()
				return 0, errRetriable
			}
			return 99, nil
		},
		func(err error) bool { return true },
	)

	require.NoError(t, err)
	// First backoff: 10ms * 2^0 = 10ms. Second backoff: 10ms * 2^1 = 20ms.
	// Total backoff ~30ms. Allow some variance for scheduling.
	elapsed := time.Since(lastBackoffStart)
	assert.GreaterOrEqual(t, elapsed.Milliseconds(), int64(5),
		"backoff should have run; first backoff is 10ms")
}
