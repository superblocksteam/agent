package run

import (
	"context"

	"github.com/superblocksteam/agent/pkg/telemetry"
	"github.com/superblocksteam/run"
)

type telemetryRunnable struct {
	instance *telemetry.Instance

	run.ForwardCompatibility
}

func Telemetry(instance *telemetry.Instance) run.Runnable {
	return &telemetryRunnable{instance: instance}
}

func (*telemetryRunnable) Name() string { return "telemetry" }
func (*telemetryRunnable) Alive() bool  { return true }

func (t *telemetryRunnable) Run(ctx context.Context) error {
	<-ctx.Done()
	return nil
}

func (t *telemetryRunnable) Close(ctx context.Context) error {
	return t.instance.Shutdown(ctx)
}
