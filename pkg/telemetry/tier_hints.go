package telemetry

import (
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

func SetTierHint(span trace.Span, hint TierPolicyHint) {
	if span == nil {
		return
	}
	span.SetAttributes(attribute.String(TIER_HINT_ATTRIBUTE, string(hint)))
}

func MarkSensitive(span trace.Span) {
	SetTierHint(span, TierPolicyHintTier1Only)
}

func MarkForAIAnalysis(span trace.Span) {
	SetTierHint(span, TierPolicyHintIncludeTier3)
}

func MarkDebugOnly(span trace.Span) {
	SetTierHint(span, TierPolicyHintSkipExport)
}
