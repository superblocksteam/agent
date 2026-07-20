package metrics

import (
	"context"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/attribute"
	metricnoop "go.opentelemetry.io/otel/metric/noop"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
)

func TestRegisterMetricsWithMeter_RegistersLifecycleHistogram(t *testing.T) {
	meter := metricnoop.NewMeterProvider().Meter("sandbox-test")

	err := RegisterMetricsWithMeter(meter)
	require.NoError(t, err)
	assert.NotNil(t, SandboxLifecycleDuration)
	assert.NotNil(t, WorkerDegradedModeTransitions)
	assert.NotNil(t, WorkerDegradedMode)
}

func TestWorkerDegradedModeObservableGauge(t *testing.T) {
	reader := metric.NewManualReader()
	provider := metric.NewMeterProvider(metric.WithReader(reader))
	meter := provider.Meter("sandbox-test")
	require.NoError(t, RegisterMetricsWithMeter(meter))

	var (
		mu       sync.Mutex
		degraded bool
	)
	_, err := RegisterWorkerDegradedModeCallback(meter, func() int64 {
		mu.Lock()
		defer mu.Unlock()
		if degraded {
			return 1
		}
		return 0
	}, func() []attribute.KeyValue {
		return []attribute.KeyValue{AttrFleet.String("test-fleet")}
	})
	require.NoError(t, err)

	ctx := context.Background()

	mu.Lock()
	degraded = true
	mu.Unlock()
	require.Equal(t, int64(1), collectWorkerDegradedModeGauge(t, reader, ctx))

	mu.Lock()
	degraded = false
	mu.Unlock()
	require.Equal(t, int64(0), collectWorkerDegradedModeGauge(t, reader, ctx))
}

func collectWorkerDegradedModeGauge(t *testing.T, reader *metric.ManualReader, ctx context.Context) int64 {
	t.Helper()

	var collected metricdata.ResourceMetrics
	require.NoError(t, reader.Collect(ctx, &collected))

	var total int64
	for _, scope := range collected.ScopeMetrics {
		for _, m := range scope.Metrics {
			if m.Name != "worker_degraded_mode" {
				continue
			}
			for _, dp := range m.Data.(metricdata.Gauge[int64]).DataPoints {
				total += dp.Value
			}
		}
	}
	return total
}

func TestRecordWorkerRedisReadStats(t *testing.T) {
	reader := metric.NewManualReader()
	provider := metric.NewMeterProvider(metric.WithReader(reader))
	require.NoError(t, RegisterMetricsWithMeter(provider.Meter("sandbox-test")))

	ctx := context.Background()
	RecordWorkerRedisReadStats(ctx, 1, 2, 3, 4, AttrFleet.String("test-fleet"))

	var collected metricdata.ResourceMetrics
	require.NoError(t, reader.Collect(ctx, &collected))

	var messagesTotal int64
	var cacheSize int64
	for _, scope := range collected.ScopeMetrics {
		for _, m := range scope.Metrics {
			switch m.Name {
			case "worker_redis_messages_read_total":
				for _, dp := range m.Data.(metricdata.Sum[int64]).DataPoints {
					messagesTotal += dp.Value
				}
			case "worker_redis_read_cache_size":
				for _, dp := range m.Data.(metricdata.Gauge[int64]).DataPoints {
					cacheSize = dp.Value
				}
			}
		}
	}
	require.Equal(t, int64(6), messagesTotal)
	require.Equal(t, int64(4), cacheSize)
}

func TestRecordWorkerRedisAckSkipped(t *testing.T) {
	reader := metric.NewManualReader()
	provider := metric.NewMeterProvider(metric.WithReader(reader))
	require.NoError(t, RegisterMetricsWithMeter(provider.Meter("sandbox-test")))

	ctx := context.Background()
	RecordWorkerRedisAckSkipped(ctx, RedisAckSkipReasonAlreadyAcked, attribute.String("fleet", "test"))

	var collected metricdata.ResourceMetrics
	require.NoError(t, reader.Collect(ctx, &collected))

	var ackSkipped int64
	for _, scope := range collected.ScopeMetrics {
		for _, m := range scope.Metrics {
			if m.Name == "worker_redis_ack_skipped_total" {
				for _, dp := range m.Data.(metricdata.Sum[int64]).DataPoints {
					ackSkipped += dp.Value
				}
			}
		}
	}
	require.Equal(t, int64(1), ackSkipped)
}
