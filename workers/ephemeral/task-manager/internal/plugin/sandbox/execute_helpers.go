package sandbox

import (
	"context"
	"time"

	"go.uber.org/zap"
)

func DoWithRetry[K any](
	ctx context.Context,
	logger *zap.Logger,
	maxAttempts int,
	baseBackoff time.Duration,
	fn func() (K, error),
	shouldRetry func(error) bool,
) (K, error) {
	var lastErr error
	var resp K

	var err error
	for attempt := 0; attempt < maxAttempts; attempt++ {
		resp, err = fn()
		if err == nil {
			return resp, nil
		}

		lastErr = err
		if !shouldRetry(err) {
			return resp, lastErr
		}

		if attempt == maxAttempts-1 {
			return resp, lastErr
		}

		backoff := baseBackoff * time.Duration(1<<attempt)
		logger.Debug("error executing request, retrying after backoff",
			zap.Error(err),
			zap.Int("attempt", attempt+1),
			zap.Duration("backoff", backoff),
		)

		select {
		case <-ctx.Done():
			return resp, ctx.Err()
		case <-time.After(backoff):
			continue
		}
	}

	return resp, lastErr
}
