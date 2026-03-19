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

// collectingProcessor records spans forwarded to it.
type collectingProcessor struct {
	spans []sdktrace.ReadOnlySpan
}

func (p *collectingProcessor) OnStart(context.Context, sdktrace.ReadWriteSpan) {}
func (p *collectingProcessor) OnEnd(s sdktrace.ReadOnlySpan)                   { p.spans = append(p.spans, s) }
func (p *collectingProcessor) Shutdown(context.Context) error                  { return nil }
func (p *collectingProcessor) ForceFlush(context.Context) error                { return nil }

func makeSpan(t *testing.T, name string, attrs ...attribute.KeyValue) sdktrace.ReadOnlySpan {
	t.Helper()
	exporter := tracetest.NewInMemoryExporter()
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSyncer(exporter),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)
	_, span := tp.Tracer("test").Start(context.Background(), name, trace.WithAttributes(attrs...))
	span.End()
	require.Len(t, exporter.GetSpans(), 1)
	return exporter.GetSpans()[0].Snapshot()
}

func TestFilteringProcessorTierHintSkipExport(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloud)

	span := makeSpan(t, "api.execute", attribute.String(TIER_HINT_ATTRIBUTE, string(TierPolicyHintSkipExport)))
	proc.OnEnd(span)
	assert.Len(t, collector.spans, 0)
}

func TestFilteringProcessorTierHintTier1Only(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloud)

	span := makeSpan(t, "api.execute", attribute.String(TIER_HINT_ATTRIBUTE, string(TierPolicyHintTier1Only)))
	proc.OnEnd(span)
	assert.Len(t, collector.spans, 0)
}

func TestFilteringProcessorTierHintIncludeTier3Passes(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloud)

	span := makeSpan(t, "api.execute", attribute.String(TIER_HINT_ATTRIBUTE, string(TierPolicyHintIncludeTier3)))
	proc.OnEnd(span)
	assert.Len(t, collector.spans, 1)
}

func TestFilteringProcessorDroppedHTTPRoute(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloud)

	for _, route := range []string{"/health", "/health/liveness", "/metrics", "/readiness"} {
		span := makeSpan(t, "HTTP GET "+route, attribute.String("http.route", route))
		proc.OnEnd(span)
	}
	assert.Len(t, collector.spans, 0)
}

func TestFilteringProcessorAllowsNonDroppedRoute(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloud)

	span := makeSpan(t, "HTTP GET /api/v1/users", attribute.String("http.route", "/api/v1/users"))
	proc.OnEnd(span)
	assert.Len(t, collector.spans, 1)
}

func TestFilteringProcessorCloudPassesAll(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloud)

	for _, name := range []string{"random.span", "unknown.operation", "api.execute", "plugin.rest"} {
		proc.OnEnd(makeSpan(t, name))
	}
	assert.Len(t, collector.spans, 4)
}

func TestFilteringProcessorCloudPremContractFilters(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloudPrem)

	// Allowed spans
	proc.OnEnd(makeSpan(t, "api.execute"))
	proc.OnEnd(makeSpan(t, "plugin.postgres"))
	proc.OnEnd(makeSpan(t, "grpc.server.request"))
	proc.OnEnd(makeSpan(t, "GET /api/v1/foo")) // normalized to HTTP GET
	assert.Len(t, collector.spans, 4)

	// Rejected spans
	proc.OnEnd(makeSpan(t, "random.operation"))
	proc.OnEnd(makeSpan(t, "internal.cleanup"))
	assert.Len(t, collector.spans, 4) // still 4
}

func TestFilteringProcessorCloudPremDropsHealthRouteEvenIfContractMatches(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloudPrem)

	// HTTP GET matches the contract, but /health is in the denylist.
	span := makeSpan(t, "HTTP GET /health", attribute.String("http.route", "/health"))
	proc.OnEnd(span)
	assert.Len(t, collector.spans, 0)
}

func TestFilteringProcessorOnPremAllowsAllSpans(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeOnPrem)

	// on-prem uses wildcard-all contract — arbitrary span names should pass
	for _, name := range []string{"some.internal.span", "plugin.postgres", "custom.thing", "HTTP GET /foo"} {
		span := makeSpan(t, name)
		proc.OnEnd(span)
	}
	assert.Len(t, collector.spans, 4)
}

func TestFilteringProcessorShutdownDelegates(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloud)
	assert.NoError(t, proc.Shutdown(context.Background()))
}

func TestFilteringProcessorForceFlushDelegates(t *testing.T) {
	collector := &collectingProcessor{}
	proc := NewFilteringSpanProcessor(collector, DeploymentTypeCloud)
	assert.NoError(t, proc.ForceFlush(context.Background()))
}
