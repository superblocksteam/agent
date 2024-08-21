package runfx

import (
	"context"
	"errors"
	"sync"

	"github.com/superblocksteam/run"
)

// forceStop is a way for outside runtimes (like fx) to signal the `run.Group`
// shutdown/stop/close. It is itself a Runnable that shuts down normally or
// when an outside system calls `Close()` on it.
type forceStop struct {
	done      chan struct{}
	force     chan struct{}
	forceDone func()

	run.ForwardCompatibility
}

func newForceStop() *forceStop {
	fs := &forceStop{
		done:  make(chan struct{}),
		force: make(chan struct{}),
	}
	fs.forceDone = sync.OnceFunc(func() {
		close(fs.force)
	})
	return fs
}

func (f *forceStop) Run(ctx context.Context) error {
	defer close(f.done)

	select {
	case <-f.force:
		return errors.New("forceStop.Run")
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (f *forceStop) Close(ctx context.Context) error {
	f.forceDone()

	select {
	case <-f.done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (f *forceStop) Name() string {
	return "forcestop"
}
