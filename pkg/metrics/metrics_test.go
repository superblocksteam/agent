package metrics

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/metrics"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
)

func TestObserve(t *testing.T) {
	// Need to register metrics so the histogram instruments are non-nil
	// (otherwise all map keys would be nil)
	metrics.ResetForTesting()
	provider := sdkmetric.NewMeterProvider()
	defer provider.Shutdown(context.Background())
	meter := provider.Meter("test")
	require.NoError(t, metrics.RegisterMetrics(meter))

	perf := &transportv1.Performance{
		QueueRequest: &transportv1.Performance_Observable{
			End: float64(100),
		},
		QueueResponse: &transportv1.Performance_Observable{
			Start: float64(200),
		},
		PluginExecution: &transportv1.Performance_Observable{
			Start: float64(100),
			End:   float64(200),
		},
	}

	observations := observe(perf, int64(1), int64(300), int64(50))

	assert.Equal(t, float64(99), observations[metrics.QueueRequestDuration])
	assert.Equal(t, float64(100), observations[metrics.QueueResponseDuration])
	assert.Equal(t, float64(100), observations[metrics.PluginExecutionDuration])
	assert.Equal(t, float64(199), observations[metrics.StepOverhead])
	assert.Equal(t, float64(50), observations[metrics.StepEstimateErrorPercentage])
	assert.Equal(t, float64(299), observations[metrics.TotalDuration])
}
