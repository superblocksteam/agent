package runfx

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/superblocksteam/run"

	"github.com/stretchr/testify/require"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
	"go.uber.org/zap/zaptest"
)

type Fake interface {
}

type testFake struct {
	cancel context.CancelFunc
	ctx    context.Context
	done   chan struct{}
	err    error

	run.ForwardCompatibility
}

func newTestFake(ctx context.Context, err error) *testFake {
	ctx, cancel := context.WithCancel(ctx)
	return &testFake{
		cancel: cancel,
		ctx:    ctx,
		done:   make(chan struct{}),
		err:    err,
	}
}

func (f *testFake) Alive() bool {
	return f.ctx.Err() == nil
}

func (f *testFake) Close(ctx context.Context) error {
	f.cancel()
	select {
	case <-f.done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (f *testFake) Run(ctx context.Context) error {
	defer close(f.done)
	if f.err != nil {
		return f.err
	}
	select {
	case <-f.ctx.Done():
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

type args struct {
	err      error
	options  []run.Option
	provider func(ctx context.Context) func(g *run.Group) Fake
}

func validArgs(t *testing.T) *args {
	t.Helper()
	t.Parallel()

	args := &args{}
	args.provider = func(ctx context.Context) func(g *run.Group) Fake {
		return func(g *run.Group) Fake {
			f := newTestFake(ctx, args.err)
			g.Always(f)
			return f
		}
	}
	return args
}

func verifyStart(t *testing.T, args *args) (*fxtest.App, context.CancelFunc) {
	ctx, cancel := context.WithCancel(context.Background())
	logger := zaptest.NewLogger(t)
	app := fxtest.New(t,
		fx.Supply(logger),
		Module,
		fx.Replace(args.options),
		fx.Provide(
			args.provider(ctx),
		),
		fx.Invoke(func(Fake) {}),
		fx.Invoke(func(g *run.Group) {
			require.True(t, g.Alive())
		}),
	)
	app.RequireStart()
	return app, cancel
}

func verifyShutdown(t *testing.T, app *fxtest.App, exitCode int) {
	ss := <-app.Wait()
	require.Equal(t, exitCode, ss.ExitCode)
}

func TestFxOk(t *testing.T) {
	args := validArgs(t)
	app, cancel := verifyStart(t, args)

	cancel()
	verifyShutdown(t, app, 0)
}

func TestFxOkAdapted(t *testing.T) {
	args := validArgs(t)
	args.provider = func(ctx context.Context) func(g *run.Group) Fake {
		return func(g *run.Group) Fake {
			r := AdaptRunCtxAsRunnable(func(ctx context.Context) error {
				t.Logf("running adapted run")
				<-ctx.Done()
				return ctx.Err()
			})
			g.Always(r)
			return r
		}
	}
	app, cancel := verifyStart(t, args)

	defer cancel()
	err := app.Stop(context.Background())
	require.NoError(t, err)
}

func TestFxOkForceStop(t *testing.T) {
	args := validArgs(t)
	app, cancel := verifyStart(t, args)

	defer cancel()
	err := app.Stop(context.Background())
	require.NoError(t, err)
}

func TestFxErr(t *testing.T) {
	args := validArgs(t)
	args.err = errors.New("broken")
	app, cancel := verifyStart(t, args)

	defer cancel()
	verifyShutdown(t, app, 1)
}

func TestFxErrAdapted(t *testing.T) {
	args := validArgs(t)
	args.provider = func(ctx context.Context) func(g *run.Group) Fake {
		return func(g *run.Group) Fake {
			r := AdaptRunCtxAsRunnable(func(ctx context.Context) error {
				t.Logf("running adapted run")
				return errors.New("broken")
			})
			g.Always(r)
			return r
		}
	}
	app, cancel := verifyStart(t, args)

	defer cancel()
	verifyShutdown(t, app, 1)
}

func TestFxErrAdaptedRunReturnsNilErroroneously(t *testing.T) {
	args := validArgs(t)
	args.provider = func(ctx context.Context) func(g *run.Group) Fake {
		return func(g *run.Group) Fake {
			r := AdaptRunCtxAsRunnable(func(ctx context.Context) error {
				return nil
			})
			g.Always(r)
			return r
		}
	}
	app, cancel := verifyStart(t, args)

	defer cancel()
	verifyShutdown(t, app, 1)
}

func TestFxErrAdaptedCloseTimeout(t *testing.T) {
	args := validArgs(t)
	args.options = append(args.options, run.WithCloseTimeout(time.Nanosecond))
	args.provider = func(ctx context.Context) func(g *run.Group) Fake {
		return func(g *run.Group) Fake {
			r := AdaptRunCtxAsRunnable(func(ctx context.Context) error {
				<-ctx.Done()
				time.Sleep(time.Millisecond) // too long to shutdown
				return ctx.Err()
			})
			g.Always(r)
			return r
		}
	}
	app, cancel := verifyStart(t, args)

	defer cancel()
	err := app.Stop(context.Background())
	require.NoError(t, err)
}
