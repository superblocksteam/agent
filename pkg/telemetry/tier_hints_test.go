package telemetry

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

func TestTierHintsSetAttribute(t *testing.T) {
	exporter := &InMemorySpanExporter{}
	provider := sdktrace.NewTracerProvider(
		sdktrace.WithSpanProcessor(sdktrace.NewSimpleSpanProcessor(exporter)),
	)
	defer provider.Shutdown(context.Background())

	tracer := provider.Tracer("test")
	_, span := tracer.Start(context.Background(), "hinted")
	MarkSensitive(span)
	span.End()

	spans := exporter.GetSpans()
	require.Len(t, spans, 1)
	assert.Equal(t, "tier1_only", getAttribute(spans[0], TIER_HINT_ATTRIBUTE))
}

func TestTierHintConvenienceHelpers(t *testing.T) {
	for _, tc := range []struct {
		name     string
		markFunc func(span trace.Span)
		wantHint string
	}{
		{
			name: "mark sensitive",
			markFunc: func(span trace.Span) {
				MarkSensitive(span)
			},
			wantHint: "tier1_only",
		},
		{
			name: "mark ai analysis",
			markFunc: func(span trace.Span) {
				MarkForAIAnalysis(span)
			},
			wantHint: "include_tier3",
		},
		{
			name: "mark debug only",
			markFunc: func(span trace.Span) {
				MarkDebugOnly(span)
			},
			wantHint: "skip_export",
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			exporter := &InMemorySpanExporter{}
			provider := sdktrace.NewTracerProvider(
				sdktrace.WithSpanProcessor(sdktrace.NewSimpleSpanProcessor(exporter)),
			)
			defer provider.Shutdown(context.Background())

			tracer := provider.Tracer("test")
			_, span := tracer.Start(context.Background(), "hinted")
			// sdktrace.ReadWriteSpan implements trace.Span.
			tc.markFunc(span)
			span.End()

			spans := exporter.GetSpans()
			require.Len(t, spans, 1)
			assert.Equal(t, tc.wantHint, getAttribute(spans[0], TIER_HINT_ATTRIBUTE))
		})
	}
}

func getAttribute(span sdktrace.ReadOnlySpan, key string) string {
	for _, attr := range span.Attributes() {
		if string(attr.Key) == key {
			return attr.Value.AsString()
		}
	}
	return ""
}
