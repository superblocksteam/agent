package runfx

import (
	"context"
	"errors"

	"github.com/superblocksteam/run"
)

type adaptRunCtx struct {
	run func(ctx context.Context) error

	run.ForwardCompatibility
}

func (a *adaptRunCtx) Run(ctx context.Context) error {
	err := a.run(ctx)
	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return nil
		} else {
			return err
		}
	}
	return errors.New("Run didnt return an error which is unexpected")
}

// AdaptRunCtxAsRunnable takes a typical Run(ctx) function which only returns
// when the context is canceled and makes it a Runnable. If the Run function
// disobeys its contract to return non-context errors (Canceled or Deadline),
// it will return an actual error to bubble it up into Runnable.
func AdaptRunCtxAsRunnable(run func(ctx context.Context) error) run.Runnable {
	return &adaptRunCtx{
		run: run,
	}
}
