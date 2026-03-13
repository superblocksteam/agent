package telemetry

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPolicyEvaluatorCloudAndCloudPremDefaults(t *testing.T) {
	cloud := NewPolicyEvaluator(DefaultCloudPolicy())
	assert.True(t, cloud.CanExport(Tier1Local, "0123456789abcdef0123456789abcdef"))
	assert.True(t, cloud.CanExport(Tier2Operational, "0123456789abcdef0123456789abcdef"))
	assert.True(t, cloud.CanExport(Tier3AIExperience, "0123456789abcdef0123456789abcdef"))

	cloudPrem := NewPolicyEvaluator(DefaultCloudPremPolicy())
	assert.False(t, cloudPrem.CanExport(Tier1Local, "0123456789abcdef0123456789abcdef"))
	assert.True(t, cloudPrem.CanExport(Tier2Operational, "0123456789abcdef0123456789abcdef"))
	assert.True(t, cloudPrem.CanExport(Tier3AIExperience, "0123456789abcdef0123456789abcdef"))
}

func TestPolicyEvaluatorDeterministicSampling(t *testing.T) {
	policy := DefaultCloudPolicy()
	cfg := policy.Tiers[Tier2Operational]
	cfg.SampleRate = 0.5
	policy.Tiers[Tier2Operational] = cfg

	evaluator := NewPolicyEvaluator(policy)
	traceID := "0123456789abcdef0123456789abcdef"
	a := evaluator.Evaluate(Tier2Operational, traceID)
	b := evaluator.Evaluate(Tier2Operational, traceID)
	assert.Equal(t, a.Sampled, b.Sampled)
}

func TestPolicyEvaluatorEdgeSampling(t *testing.T) {
	policy := DefaultCloudPolicy()
	cfg := policy.Tiers[Tier2Operational]
	cfg.SampleRate = 0.9999999999
	policy.Tiers[Tier2Operational] = cfg

	evaluator := NewPolicyEvaluator(policy)
	assert.True(t, evaluator.Evaluate(Tier2Operational, "0123456789abcdef01234567ffffffff").Sampled)

	cfg.SampleRate = 0.0001
	policy.Tiers[Tier2Operational] = cfg
	evaluator = NewPolicyEvaluator(policy)
	assert.True(t, evaluator.Evaluate(Tier2Operational, "0123456789abcdef0123456700000000").Sampled)
}

func TestPolicyEvaluatorIsExportEnabledIgnoresSampling(t *testing.T) {
	policy := DefaultCloudPolicy()
	cfg := policy.Tiers[Tier2Operational]
	cfg.SampleRate = 0.1
	policy.Tiers[Tier2Operational] = cfg

	evaluator := NewPolicyEvaluator(policy)
	assert.True(t, evaluator.IsExportEnabled(Tier2Operational))
	assert.False(t, evaluator.CanExport(Tier2Operational, ""))
}

func TestPolicyEvaluatorOrgOverrides(t *testing.T) {
	policy := DefaultCloudPolicy()
	rate := 0.5
	policy.OrgOverrides = map[string]PartialPolicy{
		"org-123": {
			Tiers: map[TelemetryTier]PartialTierConfig{
				Tier2Operational: {
					SampleRate: &rate,
				},
			},
		},
	}

	evaluator := NewPolicyEvaluator(policy)
	assert.True(t, evaluator.IsExportEnabled(Tier2Operational, "org-123"))
	assert.True(t, evaluator.CanExport(Tier2Operational, "0000000000000000000000001fffffff", "org-123"))
	assert.False(t, evaluator.CanExport(Tier2Operational, "00000000000000000000000090000000", "org-123"))
}

func TestPolicyEvaluatorCanExportTier3Content(t *testing.T) {
	policy := DefaultCloudPolicy()
	evaluator := NewPolicyEvaluator(policy)
	assert.True(t, evaluator.CanExportTier3Content())

	policy.Tier3Content.ContentExportEnabled = false
	evaluator = NewPolicyEvaluator(policy)
	assert.False(t, evaluator.CanExportTier3Content())
}

func TestPolicyEvaluatorTier3ContentPartialOverride(t *testing.T) {
	policy := DefaultCloudPolicy()
	disableRedaction := false
	policy.OrgOverrides = map[string]PartialPolicy{
		"org-partial": {
			Tier3Content: &PartialTier3ContentPolicy{
				SecretRedactionEnabled: &disableRedaction,
			},
		},
	}

	evaluator := NewPolicyEvaluator(policy)
	effective := evaluator.getEffectivePolicy("org-partial")

	// SecretRedactionEnabled should be overridden to false.
	assert.False(t, effective.Tier3Content.SecretRedactionEnabled)
	// Other fields should retain the base defaults, not be zeroed.
	assert.True(t, effective.Tier3Content.ContentExportEnabled)
	assert.Equal(t, 32768, effective.Tier3Content.MaxPromptBytes)
	assert.Equal(t, 65536, effective.Tier3Content.MaxResponseBytes)
	assert.True(t, effective.Tier3Content.ToolOutputFilteringEnabled)
}

func TestPolicyEvaluatorMissingTier(t *testing.T) {
	policy := DefaultCloudPolicy()
	evaluator := NewPolicyEvaluator(policy)

	decision := evaluator.Evaluate(TelemetryTier("nonexistent"), "0123456789abcdef0123456789abcdef")
	assert.False(t, decision.Export)
	assert.False(t, decision.Sampled)
	assert.False(t, decision.RetainLocal)
	assert.Equal(t, "tier configuration missing", decision.BlockReason)
}

func TestSampleByTraceIDEdgeCases(t *testing.T) {
	for _, test := range []struct {
		name     string
		traceID  string
		rate     float64
		expected bool
	}{
		{name: "empty traceID at sub-1.0 rate", traceID: "", rate: 0.5, expected: false},
		{name: "short traceID (<8 chars)", traceID: "abc", rate: 0.5, expected: false},
		{name: "invalid hex traceID", traceID: "zzzzzzzz", rate: 0.5, expected: false},
		{name: "whitespace-padded traceID", traceID: "  0123456789abcdef0123456700000000  ", rate: 0.5, expected: true},
	} {
		t.Run(test.name, func(t *testing.T) {
			result := sampleByTraceID(test.traceID, test.rate)
			assert.Equal(t, test.expected, result)
		})
	}
}

func TestPolicyEvaluatorTierDisabled(t *testing.T) {
	policy := DefaultCloudPolicy()
	cfg := policy.Tiers[Tier2Operational]
	cfg.Enabled = false
	policy.Tiers[Tier2Operational] = cfg

	evaluator := NewPolicyEvaluator(policy)
	decision := evaluator.Evaluate(Tier2Operational, "0123456789abcdef0123456789abcdef")
	require.False(t, decision.Export)
	assert.Equal(t, "tier disabled", decision.BlockReason)
}

func TestPolicyEvaluatorExportDisabledBlockReason(t *testing.T) {
	policy := DefaultCloudPolicy()
	cfg := policy.Tiers[Tier2Operational]
	cfg.ExportEnabled = false
	policy.Tiers[Tier2Operational] = cfg

	evaluator := NewPolicyEvaluator(policy)
	decision := evaluator.Evaluate(Tier2Operational, "0123456789abcdef0123456789abcdef")
	require.False(t, decision.Export)
	assert.Equal(t, "export disabled", decision.BlockReason)
}

func TestClonePolicyDeepCopiesPointers(t *testing.T) {
	rate := 0.5
	enabled := true
	redact := true
	policy := DefaultCloudPolicy()
	policy.OrgOverrides = map[string]PartialPolicy{
		"org-1": {
			Tiers: map[TelemetryTier]PartialTierConfig{
				Tier2Operational: {SampleRate: &rate, Enabled: &enabled},
			},
			Tier3Content: &PartialTier3ContentPolicy{
				SecretRedactionEnabled: &redact,
			},
		},
	}

	evaluator := NewPolicyEvaluator(policy)

	// Mutate the original pointers after creating the evaluator.
	rate = 0.0
	enabled = false
	redact = false

	// Evaluator should be unaffected -- it holds deep copies.
	effective := evaluator.getEffectivePolicy("org-1")
	assert.Equal(t, 0.5, effective.Tiers[Tier2Operational].SampleRate)
	assert.True(t, effective.Tiers[Tier2Operational].Enabled)
	assert.True(t, effective.Tier3Content.SecretRedactionEnabled)
}
