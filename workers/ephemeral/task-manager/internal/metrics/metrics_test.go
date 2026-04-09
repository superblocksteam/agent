package metrics

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metricnoop "go.opentelemetry.io/otel/metric/noop"
)

func TestRegisterMetricsWithMeter_RegistersLifecycleHistogram(t *testing.T) {
	meter := metricnoop.NewMeterProvider().Meter("sandbox-test")

	err := RegisterMetricsWithMeter(meter)
	require.NoError(t, err)
	assert.NotNil(t, SandboxLifecycleDuration)
	assert.NotNil(t, WorkerDegradedModeTransitions)
}
