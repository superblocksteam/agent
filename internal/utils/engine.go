package utils

import (
	"context"

	"github.com/superblocksteam/agent/internal/metrics"
	"go.opentelemetry.io/otel/attribute"
)

// NOTE(frank): It's important that this util is in the internal package,
// because it relies on metrics that are registered in the internal package.
func EngineAfterFunc(err error) {
	ctx := context.Background()
	if err != nil {
		metrics.AddCounter(ctx, metrics.BindingsTotal, attribute.String("result", "failed"))
	} else {
		metrics.AddCounter(ctx, metrics.BindingsTotal, attribute.String("result", "succeeded"))
	}
}
