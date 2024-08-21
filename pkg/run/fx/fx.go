package runfx

import (
	"context"

	"github.com/superblocksteam/run"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("runfx",
	fx.Provide(
		provideDefaultOptions,
		provide,
	),
)

func provideDefaultOptions() []run.Option {
	return []run.Option{}
}

func provide(lc fx.Lifecycle, shutdowner fx.Shutdowner, logger *zap.Logger, options []run.Option) *run.Group {
	fs := newForceStop()

	g := run.New(options...)
	g.Always(fs)

	done := make(chan struct{})
	lc.Append(fx.Hook{
		OnStart: func(context.Context) error {
			go func() {
				defer close(done)

				sdopt := fx.ExitCode(0)

				err := g.Run()
				if err != nil {
					logger.Error("run.Group returned error", zap.Error(err))
					sdopt = fx.ExitCode(1)
				}

				err = shutdowner.Shutdown(sdopt)
				if err != nil {
					logger.Error("shutdowner.Shutdown error", zap.Error(err))
				}
			}()
			return nil
		},
		OnStop: func(ctx context.Context) error {
			err := fs.Close(ctx)
			<-done
			return err
		},
	})

	return g
}
