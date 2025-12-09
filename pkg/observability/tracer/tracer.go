package tracer

import (
	"context"
	"fmt"

	"github.com/superblocksteam/agent/pkg/observability/obsup"
	"github.com/superblocksteam/run"
	sdklog "go.opentelemetry.io/otel/sdk/log"

	"go.uber.org/zap"
)

type tracer struct {
	cancel   context.CancelFunc
	ctx      context.Context
	shutdown func(context.Context) error

	run.ForwardCompatibility
}

// PrepareResult contains the result of Prepare, including the LoggerProvider for OTEL logs.
type PrepareResult struct {
	Runnable       run.Runnable
	LoggerProvider *sdklog.LoggerProvider
}

func Prepare(logger *zap.Logger, options obsup.Options) (*PrepareResult, error) {
	result, shutdown, err := obsup.Setup(logger, options)
	if err != nil {
		return nil, fmt.Errorf("obsup.Setup error : %w", err)
	}

	tracer := &tracer{
		shutdown: shutdown,
	}
	tracer.ctx, tracer.cancel = context.WithCancel(context.Background())

	return &PrepareResult{
		Runnable:       tracer,
		LoggerProvider: result.LoggerProvider,
	}, nil
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
