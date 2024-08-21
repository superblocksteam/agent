package tracer

import (
	"context"
	"fmt"

	"github.com/superblocksteam/agent/pkg/observability/obsup"
	"github.com/superblocksteam/run"

	"go.uber.org/zap"
)

type tracer struct {
	cancel   context.CancelFunc
	ctx      context.Context
	shutdown func(context.Context) error

	run.ForwardCompatibility
}

func Prepare(logger *zap.Logger, options obsup.Options) (run.Runnable, error) {
	_, shutdown, err := obsup.Setup(logger, options)
	if err != nil {
		return nil, fmt.Errorf("obsup.Setup error : %w", err)
	}

	tracer := &tracer{
		shutdown: shutdown,
	}
	tracer.ctx, tracer.cancel = context.WithCancel(context.Background())

	return tracer, nil
}

func (t *tracer) Run(context.Context) error {
	<-t.ctx.Done()

	return nil
}

func (*tracer) Alive() bool { return true }

func (*tracer) Name() string {
	return "tracer"
}

func (t *tracer) Close(context.Context) error {
	t.cancel()

	return t.shutdown(context.Background())
}
