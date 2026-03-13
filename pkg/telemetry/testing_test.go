package telemetry

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	otellog "go.opentelemetry.io/otel/log"
	otelmetric "go.opentelemetry.io/otel/metric"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

func TestInitTestTelemetryCapturesSpansLogsAndMetrics(t *testing.T) {
	tt, err := InitTestTelemetry(context.Background(), Config{
		ServiceName:    "test-service",
		ServiceVersion: "0.0.1",
		Environment:    "test",
	}, DefaultCloudPolicy(), nil)
	require.NoError(t, err)
	defer tt.Shutdown(context.Background())

	tracer := GetTestTracer("tests")
	_, span := tracer.Start(context.Background(), "test-span")
	span.End()

	logger := GetTestLogger("tests")
	record := otellog.Record{}
	record.SetSeverity(otellog.SeverityInfo)
	record.SetBody(otellog.StringValue("hello"))
	logger.Emit(context.Background(), record)

	meter := tt.MeterProvider.Meter("tests", otelmetric.WithInstrumentationVersion("0.0.1"))
	counter, err := meter.Int64Counter("test_counter")
	require.NoError(t, err)
	counter.Add(context.Background(), 1)

	require.NoError(t, tt.LoggerProvider.ForceFlush(context.Background()))
	require.NoError(t, tt.TracerProvider.ForceFlush(context.Background()))

	assert.Len(t, tt.SpanExporter.GetSpans(), 1)
	assert.Len(t, tt.LogExporter.GetRecords(), 1)

	rm, err := tt.CollectMetrics(context.Background())
	require.NoError(t, err)
	assert.NotEmpty(t, collectMetricNames(rm))
}

func TestTestTelemetryReset(t *testing.T) {
	tt, err := InitTestTelemetry(context.Background(), Config{}, DefaultCloudPolicy(), nil)
	require.NoError(t, err)
	defer tt.Shutdown(context.Background())

	tracer := GetTestTracer("tests")
	_, span := tracer.Start(context.Background(), "test-span")
	span.End()
	require.Len(t, tt.SpanExporter.GetSpans(), 1)

	tt.Reset()
	assert.Len(t, tt.SpanExporter.GetSpans(), 0)
	assert.Len(t, tt.LogExporter.GetRecords(), 0)
}

func TestInMemorySpanExporterAfterShutdown(t *testing.T) {
	exporter := &InMemorySpanExporter{}

	// Export before shutdown.
	err := exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil})
	require.NoError(t, err)
	assert.Len(t, exporter.GetSpans(), 1)

	// Shutdown, then export again.
	require.NoError(t, exporter.Shutdown(context.Background()))
	err = exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil})
	require.NoError(t, err)
	// Second batch should be dropped.
	assert.Len(t, exporter.GetSpans(), 1)
}

func TestInMemoryLogExporterAfterShutdown(t *testing.T) {
	exporter := &InMemoryLogExporter{}

	record := sdklog.Record{}
	record.SetBody(otellog.StringValue("hello"))

	// Export before shutdown.
	err := exporter.Export(context.Background(), []sdklog.Record{record})
	require.NoError(t, err)
	assert.Len(t, exporter.GetRecords(), 1)

	// Shutdown, then export again.
	require.NoError(t, exporter.Shutdown(context.Background()))
	err = exporter.Export(context.Background(), []sdklog.Record{record})
	require.NoError(t, err)
	// Second batch should be dropped.
	assert.Len(t, exporter.GetRecords(), 1)
}

func TestTestTelemetryNilShutdown(t *testing.T) {
	var tt *TestTelemetry
	err := tt.Shutdown(context.Background())
	assert.NoError(t, err)
}

func TestTestTelemetryNilReset(t *testing.T) {
	var tt *TestTelemetry
	// Should not panic.
	assert.NotPanics(t, func() { tt.Reset() })
}

func TestTestTelemetryCollectMetricsNil(t *testing.T) {
	var tt *TestTelemetry
	_, err := tt.CollectMetrics(context.Background())
	assert.Error(t, err)
}
