package utils

import (
	"context"
	"sync"
)

// WaitWithContext waits for the WaitGroup to finish while allowing for early return if the context is done.
// Returns the context error if the context is done before the WaitGroup finishes, nil otherwise.
//
// If the context finishes first, the goroutine blocked on wg.Wait continues until the group completes;
// callers should ensure wg is eventually unblocked (e.g. by the same shutdown path that cancels ctx)
// to avoid leaving that goroutine parked indefinitely.
func WaitWithContext(ctx context.Context, wg *sync.WaitGroup) error {
	waitDone := make(chan struct{})
	go func() {
		wg.Wait()
		close(waitDone)
	}()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-waitDone:
	}

	return nil
}
