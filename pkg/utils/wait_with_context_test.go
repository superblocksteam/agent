package utils

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWaitWithContext_waitsUntilDone(t *testing.T) {
	t.Parallel()

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		time.Sleep(20 * time.Millisecond)
		wg.Done()
	}()

	err := WaitWithContext(context.Background(), &wg)
	require.NoError(t, err)
}

func TestWaitWithContext_zeroWaitGroupReturnsImmediately(t *testing.T) {
	t.Parallel()

	var wg sync.WaitGroup
	err := WaitWithContext(context.Background(), &wg)
	require.NoError(t, err)
}

func TestWaitWithContext_returnsContextErrorWhenAlreadyCanceled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	var wg sync.WaitGroup
	wg.Add(1)
	err := WaitWithContext(ctx, &wg)
	assert.True(t, errors.Is(err, context.Canceled))

	// Unblock the goroutine WaitWithContext started so it can exit.
	wg.Done()
}

func TestWaitWithContext_returnsDeadlineExceededOnTimeout(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Millisecond)
	defer cancel()

	var wg sync.WaitGroup
	wg.Add(1)
	err := WaitWithContext(ctx, &wg)
	assert.True(t, errors.Is(err, context.DeadlineExceeded))

	wg.Done()
}

func TestWaitWithContext_prefersWaitGroupWhenBothCouldFire(t *testing.T) {
	t.Parallel()

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		time.Sleep(5 * time.Millisecond)
		wg.Done()
	}()

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	err := WaitWithContext(ctx, &wg)
	require.NoError(t, err)
}
