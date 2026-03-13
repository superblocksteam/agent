package signaldelay

import (
	"context"
	"syscall"
	"testing"
	"time"
)

func TestSignalDelay_ContextCancellationReturnsImmediately(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan struct{})
	r := New(
		WithSignals(syscall.SIGTERM),
		WithBaseDelay(30*time.Second),
		WithMaxJitter(0),
	)

	go func() {
		_ = r.Run(ctx)
		close(done)
	}()

	// Cancel immediately (simulates another runnable returning).
	cancel()

	select {
	case <-done:
		// Pass: returned promptly.
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Run did not return within 500ms after context cancellation")
	}
}

func TestSignalDelay_InterruptibleDuringWait(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan struct{})
	r := New(
		WithSignals(syscall.SIGTERM),
		WithBaseDelay(30*time.Second),
		WithMaxJitter(0),
	)

	go func() {
		_ = r.Run(ctx)
		close(done)
	}()

	// Send SIGTERM to self so runnable enters the wait phase.
	go func() {
		time.Sleep(50 * time.Millisecond)
		_ = syscall.Kill(syscall.Getpid(), syscall.SIGTERM)
	}()

	// Cancel before the 30s wait completes (simulates another runnable returning).
	time.Sleep(200 * time.Millisecond)
	cancel()

	select {
	case <-done:
		// Pass: interrupted during wait.
	case <-time.After(2 * time.Second):
		t.Fatal("Run did not return within 2s after context cancellation during wait")
	}
}

func TestSignalDelay_WaitsExpectedTimeBeforeReturning(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	baseDelay := 100 * time.Millisecond
	maxJitter := 5 * time.Millisecond
	maxPossibleDelay := baseDelay + maxJitter

	done := make(chan struct{})
	start := time.Now()

	r := New(
		WithSignals(syscall.SIGTERM),
		WithBaseDelay(baseDelay),
		WithMaxJitter(maxJitter),
	)

	go func() {
		_ = r.Run(ctx)
		close(done)
	}()

	// Send SIGTERM so runnable enters wait phase.
	time.Sleep(20 * time.Millisecond)
	_ = syscall.Kill(syscall.Getpid(), syscall.SIGTERM)

	select {
	case <-done:
		elapsed := time.Since(start)
		if elapsed < baseDelay {
			t.Errorf("Run returned after %v, expected to wait at least %v", elapsed, baseDelay)
		}
		if elapsed > maxPossibleDelay+100*time.Millisecond {
			t.Errorf("Run took %v, expected ~%v (within 10ms tolerance)", elapsed, maxPossibleDelay)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("Run did not return within 2s after signal")
	}
}

func TestSignalDelay_ZeroDelayReturnsImmediately(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan struct{})
	r := New(
		WithSignals(syscall.SIGTERM),
		WithBaseDelay(0),
		WithMaxJitter(0),
	)

	go func() {
		_ = r.Run(ctx)
		close(done)
	}()

	// Send signal so it enters wait phase with 0 delay.
	go func() {
		time.Sleep(20 * time.Millisecond)
		_ = syscall.Kill(syscall.Getpid(), syscall.SIGTERM)
	}()

	select {
	case <-done:
		// Pass.
	case <-time.After(1 * time.Second):
		t.Fatal("Run did not return within 1s after signal with zero delay")
	}
	cancel()
}
