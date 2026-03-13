package telemetry

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
)

func TestMetricsClientCounterAndHistogram(t *testing.T) {
	reader := sdkmetric.NewManualReader()
	provider := sdkmetric.NewMeterProvider(sdkmetric.WithReader(reader))
	defer provider.Shutdown(context.Background())

	client := NewMetricsClient(provider.Meter("test"))
	client.Counter("requests_total").Inc(Labels{"route": "/health"})
	client.Histogram("latency_ms").Observe(Labels{"route": "/health"}, 12.4)

	rm := metricdata.ResourceMetrics{}
	require.NoError(t, reader.Collect(context.Background(), &rm))

	names := collectMetricNames(rm)
	assert.Contains(t, names, "requests_total")
	assert.Contains(t, names, "latency_ms")
}

func TestMetricsClientGaugeTTL(t *testing.T) {
	reader := sdkmetric.NewManualReader()
	provider := sdkmetric.NewMeterProvider(sdkmetric.WithReader(reader))
	defer provider.Shutdown(context.Background())

	now := time.Now()
	client := NewMetricsClient(provider.Meter("test"))
	client.nowFn = func() time.Time { return now }

	client.Gauge("queue_depth").Set(Labels{"queue": "worker"}, 3)

	var rm metricdata.ResourceMetrics
	require.NoError(t, reader.Collect(context.Background(), &rm))
	require.GreaterOrEqual(t, countDataPoints(rm, "queue_depth"), 1)

	now = now.Add(defaultGaugeTTL + time.Second)

	rm = metricdata.ResourceMetrics{}
	require.NoError(t, reader.Collect(context.Background(), &rm))
	assert.Equal(t, 0, countDataPoints(rm, "queue_depth"))
}

func TestNilHandlesDoNotPanic(t *testing.T) {
	t.Run("nil counter", func(t *testing.T) {
		assert.NotPanics(t, func() { counterHandle{}.Inc(nil) })
	})
	t.Run("nil histogram", func(t *testing.T) {
		assert.NotPanics(t, func() { histogramHandle{}.Observe(nil, 1.0) })
	})
	t.Run("nil gauge", func(t *testing.T) {
		assert.NotPanics(t, func() { gaugeHandle{}.Set(nil, 1.0) })
	})
}

func TestCounterExplicitValue(t *testing.T) {
	reader := sdkmetric.NewManualReader()
	provider := sdkmetric.NewMeterProvider(sdkmetric.WithReader(reader))
	defer provider.Shutdown(context.Background())

	client := NewMetricsClient(provider.Meter("test"))
	client.Counter("explicit_counter").Inc(Labels{"k": "v"}, 5)

	var rm metricdata.ResourceMetrics
	require.NoError(t, reader.Collect(context.Background(), &rm))
	assert.Equal(t, 1, countDataPoints(rm, "explicit_counter"))
}

func TestGaugeEviction(t *testing.T) {
	store := newGaugeStore(time.Hour, 2)
	now := time.Now()

	store.Set("a", nil, 1.0, now)
	store.Set("b", nil, 2.0, now.Add(time.Second))
	store.Set("c", nil, 3.0, now.Add(2*time.Second))

	snap := store.Snapshot(now.Add(2 * time.Second))
	assert.Len(t, snap, 2)

	keys := map[float64]bool{}
	for _, e := range snap {
		keys[e.value] = true
	}
	assert.False(t, keys[1.0], "oldest entry (a) should have been evicted")
	assert.True(t, keys[2.0])
	assert.True(t, keys[3.0])
}

func TestClose(t *testing.T) {
	reader := sdkmetric.NewManualReader()
	provider := sdkmetric.NewMeterProvider(sdkmetric.WithReader(reader))
	defer provider.Shutdown(context.Background())

	client := NewMetricsClient(provider.Meter("test"))
	client.Gauge("g").Set(Labels{"k": "v"}, 1.0)

	assert.NoError(t, client.Close())
}

func TestLabelsKeyNoCollision(t *testing.T) {
	// These two label sets previously produced the same key "a=x|b=y".
	a := labelsKey(Labels{"a": "x|b=y"})
	b := labelsKey(Labels{"a": "x", "b": "y"})
	assert.NotEqual(t, a, b)

	// A literal null byte and a literal backslash-zero must not collide.
	c := labelsKey(Labels{"k": "\x00"})
	d := labelsKey(Labels{"k": `\0`})
	assert.NotEqual(t, c, d, "null byte and backslash-zero must not collide")
}

func TestLabelsKeyEdgeCases(t *testing.T) {
	for _, test := range []struct {
		name     string
		labels   Labels
		expected string
	}{
		{name: "empty labels", labels: Labels{}, expected: ""},
		{name: "nil labels", labels: nil, expected: ""},
		{name: "null byte in value", labels: Labels{"k": "a\x00b"}, expected: "k\x00a\\0b"},
		{name: "null byte in key", labels: Labels{"k\x00y": "v"}, expected: "k\\0y\x00v"},
		{name: "backslash preserved", labels: Labels{"k": `a\0b`}, expected: "k\x00a\\\\0b"},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expected, labelsKey(test.labels))
		})
	}
}

func collectMetricNames(rm metricdata.ResourceMetrics) map[string]struct{} {
	names := map[string]struct{}{}
	for _, scopeMetrics := range rm.ScopeMetrics {
		for _, metric := range scopeMetrics.Metrics {
			names[metric.Name] = struct{}{}
		}
	}
	return names
}

func countDataPoints(rm metricdata.ResourceMetrics, metricName string) int {
	total := 0
	for _, scopeMetrics := range rm.ScopeMetrics {
		for _, metric := range scopeMetrics.Metrics {
			if metric.Name != metricName {
				continue
			}
			switch data := metric.Data.(type) {
			case metricdata.Gauge[float64]:
				total += len(data.DataPoints)
			case metricdata.Sum[int64]:
				total += len(data.DataPoints)
			case metricdata.Sum[float64]:
				total += len(data.DataPoints)
			}
		}
	}
	return total
}
