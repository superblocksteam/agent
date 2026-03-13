package telemetry

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/attribute"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	"go.opentelemetry.io/otel/trace"
)

func TestSanitizingExporterStripsCloudPremForbiddenAttributes(t *testing.T) {
	recorder := tracetest.NewInMemoryExporter()
	exporter := NewSanitizingExporter(recorder, DeploymentTypeCloudPrem)

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSyncer(exporter),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	_, span := tp.Tracer("test").Start(context.Background(), "api.execute")
	span.SetAttributes(
		attribute.String("api.status", "success"),
		attribute.String("user-email", "leak@superblocks.com"),
		attribute.String("db.statement", "SELECT * FROM users"),
		attribute.String("auth_token", "Bearer secret123"),
		attribute.String("binding_keys", "key1,key2"),
		attribute.String("view-mode", "edit"),
	)
	span.End()

	require.NoError(t, tp.ForceFlush(context.Background()))

	spans := recorder.GetSpans()
	require.Len(t, spans, 1)

	attrs := spans[0].Attributes
	attrMap := make(map[string]string)
	for _, a := range attrs {
		attrMap[string(a.Key)] = a.Value.AsString()
	}

	// Allowed attributes should survive
	assert.Equal(t, "success", attrMap["api.status"])
	assert.Equal(t, "edit", attrMap["view-mode"])

	// Forbidden attributes should be stripped
	assert.NotContains(t, attrMap, "user-email")
	assert.NotContains(t, attrMap, "db.statement")
	assert.NotContains(t, attrMap, "auth_token")
	assert.NotContains(t, attrMap, "binding_keys")
}

func TestSanitizingExporterCloudModeStripsOnlySecrets(t *testing.T) {
	recorder := tracetest.NewInMemoryExporter()
	exporter := NewSanitizingExporter(recorder, DeploymentTypeCloud)

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSyncer(exporter),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	_, span := tp.Tracer("test").Start(context.Background(), "api.execute")
	span.SetAttributes(
		attribute.String("api.status", "success"),
		attribute.String("user-email", "user@example.com"),
		attribute.String("auth_token", "Bearer secret123"),
		attribute.String("llmobs.input", "sensitive prompt"),
		attribute.String("db.statement", "SELECT 1"),
	)
	span.End()

	require.NoError(t, tp.ForceFlush(context.Background()))

	spans := recorder.GetSpans()
	require.Len(t, spans, 1)

	attrMap := make(map[string]string)
	for _, a := range spans[0].Attributes {
		attrMap[string(a.Key)] = a.Value.AsString()
	}

	// Cloud mode: auth/secrets/AI content stripped
	assert.NotContains(t, attrMap, "auth_token")
	assert.NotContains(t, attrMap, "llmobs.input")

	// Cloud mode: PII identifiers preserved (collector handles hashing)
	assert.Equal(t, "user@example.com", attrMap["user-email"])

	// Cloud mode: db.statement preserved (relaxed policy)
	assert.Equal(t, "SELECT 1", attrMap["db.statement"])

	// Allowed attributes always survive
	assert.Equal(t, "success", attrMap["api.status"])
}

func TestSanitizingExporterPassesThroughCleanSpans(t *testing.T) {
	recorder := tracetest.NewInMemoryExporter()
	exporter := NewSanitizingExporter(recorder, DeploymentTypeCloudPrem)

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSyncer(exporter),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	_, span := tp.Tracer("test").Start(context.Background(), "clean.span")
	span.SetAttributes(
		attribute.String("http.method", "GET"),
		attribute.Int("http.status_code", 200),
	)
	span.End()

	require.NoError(t, tp.ForceFlush(context.Background()))

	spans := recorder.GetSpans()
	require.Len(t, spans, 1)

	// All attributes should pass through unchanged
	attrMap := make(map[string]string)
	for _, a := range spans[0].Attributes {
		attrMap[string(a.Key)] = a.Value.Emit()
	}
	assert.Equal(t, "GET", attrMap["http.method"])
	assert.Equal(t, "200", attrMap["http.status_code"])
}

func TestSanitizingExporterShutdownDelegates(t *testing.T) {
	recorder := tracetest.NewInMemoryExporter()
	exporter := NewSanitizingExporter(recorder, DeploymentTypeCloud)
	assert.NoError(t, exporter.Shutdown(context.Background()))
}

func TestSanitizingExporterForceFlushDelegates(t *testing.T) {
	recorder := tracetest.NewInMemoryExporter()
	exporter := NewSanitizingExporter(recorder, DeploymentTypeCloud)

	// InMemoryExporter doesn't implement ForceFlush, so this should be a no-op.
	assert.NoError(t, exporter.ForceFlush(context.Background()))

	// Wrap in ResilientExporter to verify the flush chain propagates through.
	resilient := NewResilientExporter(ResilientExporterConfig{
		Delegate: exporter,
		OnDrop:   func(int, DropReason) {},
	})
	assert.NoError(t, resilient.ForceFlush(context.Background()))
}

func TestSanitizingExporterStripsLinkAttributes(t *testing.T) {
	recorder := tracetest.NewInMemoryExporter()
	exporter := NewSanitizingExporter(recorder, DeploymentTypeCloudPrem)

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSyncer(exporter),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	// Create a linked span context.
	linkedCtx := trace.NewSpanContext(trace.SpanContextConfig{
		TraceID:    [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
		SpanID:     [8]byte{1, 2, 3, 4, 5, 6, 7, 8},
		TraceFlags: trace.FlagsSampled,
	})

	link := trace.Link{
		SpanContext: linkedCtx,
		Attributes: []attribute.KeyValue{
			attribute.String("http.method", "GET"),
			attribute.String("auth_token", "Bearer secret"),
			attribute.String("binding_keys", "key1"),
		},
	}

	_, span := tp.Tracer("test").Start(context.Background(), "api.execute",
		trace.WithLinks(link),
	)
	span.End()

	require.NoError(t, tp.ForceFlush(context.Background()))

	spans := recorder.GetSpans()
	require.Len(t, spans, 1)
	require.Len(t, spans[0].Links, 1)

	attrMap := make(map[string]string)
	for _, a := range spans[0].Links[0].Attributes {
		attrMap[string(a.Key)] = a.Value.AsString()
	}

	// Allowed attribute should survive.
	assert.Equal(t, "GET", attrMap["http.method"])

	// Forbidden attributes should be stripped.
	assert.NotContains(t, attrMap, "auth_token")
	assert.NotContains(t, attrMap, "binding_keys")
}

func TestSanitizedSpanDroppedAttributesCount(t *testing.T) {
	recorder := tracetest.NewInMemoryExporter()
	exporter := NewSanitizingExporter(recorder, DeploymentTypeCloudPrem)

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSyncer(exporter),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	_, span := tp.Tracer("test").Start(context.Background(), "api.execute")
	span.SetAttributes(
		attribute.String("http.method", "GET"),
		attribute.String("auth_token", "secret"),
		attribute.String("db.statement", "SELECT 1"),
	)
	span.End()
	require.NoError(t, tp.ForceFlush(context.Background()))

	spans := recorder.GetSpans()
	require.Len(t, spans, 1)
	// 2 forbidden attributes stripped -> DroppedAttributes should include them.
	assert.Equal(t, 2, spans[0].DroppedAttributes)
}

func TestSanitizingExporterStripsEventAttributes(t *testing.T) {
	recorder := tracetest.NewInMemoryExporter()
	exporter := NewSanitizingExporter(recorder, DeploymentTypeCloudPrem)

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSyncer(exporter),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	_, span := tp.Tracer("test").Start(context.Background(), "api.execute")
	span.SetAttributes(attribute.String("http.method", "POST"))
	// RecordError adds an "exception" event with exception.stacktrace.
	span.RecordError(assert.AnError)
	span.End()

	require.NoError(t, tp.ForceFlush(context.Background()))

	spans := recorder.GetSpans()
	require.Len(t, spans, 1)

	// Span-level attribute should survive.
	attrMap := make(map[string]string)
	for _, a := range spans[0].Attributes {
		attrMap[string(a.Key)] = a.Value.AsString()
	}
	assert.Equal(t, "POST", attrMap["http.method"])

	// exception.stacktrace on the event should be stripped.
	for _, event := range spans[0].Events {
		for _, a := range event.Attributes {
			assert.NotEqual(t, "exception.stacktrace", string(a.Key),
				"exception.stacktrace should be stripped from events")
		}
	}
}
