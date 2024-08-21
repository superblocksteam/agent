package metrics

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/internal/metrics"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

func TestObserve(t *testing.T) {
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

	assert.Equal(t, observations[metrics.QueueRequestDuration], float64(99))
	assert.Equal(t, observations[metrics.QueueResponseDuration], float64(100))
	assert.Equal(t, observations[metrics.PluginExecutionDuration], float64(100))
	assert.Equal(t, observations[metrics.StepOverhead], float64(199))
	assert.Equal(t, observations[metrics.StepEstimateErrorPercentage], float64(50))
	assert.Equal(t, observations[metrics.TotalDuration], float64(299))
}
