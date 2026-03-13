package telemetry

import (
	"context"

	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

// FilteringSpanProcessor drops entire spans before they reach the batch
// processor. It checks tier hints, HTTP route denylist, and span name
// contracts (cloud-prem only). Spans that don't pass are silently dropped.
type FilteringSpanProcessor struct {
	delegate sdktrace.SpanProcessor
	contract traceContract
}

// NewFilteringSpanProcessor wraps delegate with span-level filtering
// appropriate for the given deployment type.
func NewFilteringSpanProcessor(delegate sdktrace.SpanProcessor, dt DeploymentType) *FilteringSpanProcessor {
	return &FilteringSpanProcessor{
		delegate: delegate,
		contract: getTraceContract(dt),
	}
}

func (p *FilteringSpanProcessor) OnStart(parent context.Context, s sdktrace.ReadWriteSpan) {
	p.delegate.OnStart(parent, s)
}

func (p *FilteringSpanProcessor) OnEnd(s sdktrace.ReadOnlySpan) {
	if p.shouldDrop(s) {
		return
	}
	p.delegate.OnEnd(s)
}

func (p *FilteringSpanProcessor) Shutdown(ctx context.Context) error {
	return p.delegate.Shutdown(ctx)
}

func (p *FilteringSpanProcessor) ForceFlush(ctx context.Context) error {
	return p.delegate.ForceFlush(ctx)
}

func (p *FilteringSpanProcessor) shouldDrop(s sdktrace.ReadOnlySpan) bool {
	// 1. Check tier hints.
	for _, attr := range s.Attributes() {
		if string(attr.Key) == TIER_HINT_ATTRIBUTE {
			hint := TierPolicyHint(attr.Value.AsString())
			if hint == TierPolicyHintSkipExport || hint == TierPolicyHintTier1Only {
				return true
			}
		}
	}

	// 2. Check HTTP route denylist.
	for _, attr := range s.Attributes() {
		if string(attr.Key) == "http.route" {
			if _, dropped := droppedHTTPRoutes[attr.Value.AsString()]; dropped {
				return true
			}
		}
	}

	// 3. Check span name against contract.
	if !p.contract.matches(s.Name()) {
		return true
	}

	return false
}
