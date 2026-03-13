package telemetry

import (
	"encoding/hex"
	"strings"
)

type PolicyDecision struct {
	RetainLocal bool
	Export      bool
	Sampled     bool
	BlockReason string
}

type PolicyEvaluator struct {
	policy TelemetryPolicy
}

func NewPolicyEvaluator(policy TelemetryPolicy) *PolicyEvaluator {
	return &PolicyEvaluator{policy: clonePolicy(policy)}
}

func (e *PolicyEvaluator) GetPolicy() TelemetryPolicy {
	return clonePolicy(e.policy)
}

func (e *PolicyEvaluator) IsExportEnabled(tier TelemetryTier, orgID ...string) bool {
	effective := e.getEffectivePolicy(orgID...)
	tierCfg, ok := effective.Tiers[tier]
	if !ok {
		return false
	}
	return tierCfg.Enabled && tierCfg.ExportEnabled
}

func (e *PolicyEvaluator) CanExport(tier TelemetryTier, traceID string, orgID ...string) bool {
	decision := e.Evaluate(tier, traceID, orgID...)
	return decision.Export
}

func (e *PolicyEvaluator) Evaluate(tier TelemetryTier, traceID string, orgID ...string) PolicyDecision {
	effective := e.getEffectivePolicy(orgID...)
	tierCfg, ok := effective.Tiers[tier]
	if !ok {
		return PolicyDecision{
			RetainLocal: false,
			Export:      false,
			Sampled:     false,
			BlockReason: "tier configuration missing",
		}
	}

	if !tierCfg.Enabled {
		return PolicyDecision{
			RetainLocal: false,
			Export:      false,
			Sampled:     false,
			BlockReason: "tier disabled",
		}
	}

	sampled := sampleByTraceID(traceID, tierCfg.SampleRate)
	if traceID == "" {
		// Conservative fallback for non-trace signals.
		sampled = tierCfg.SampleRate >= 1.0
	}

	exportAllowed := tierCfg.ExportEnabled && sampled
	blockReason := ""
	if !tierCfg.ExportEnabled {
		blockReason = "export disabled"
	} else if !sampled {
		blockReason = "not sampled"
	}

	return PolicyDecision{
		RetainLocal: true,
		Export:      exportAllowed,
		Sampled:     sampled,
		BlockReason: blockReason,
	}
}

func (e *PolicyEvaluator) CanExportTier3Content(orgID ...string) bool {
	effective := e.getEffectivePolicy(orgID...)
	if !effective.Tier3Content.ContentExportEnabled {
		return false
	}
	return e.IsExportEnabled(Tier3AIExperience, orgID...)
}

func (e *PolicyEvaluator) getEffectivePolicy(orgID ...string) TelemetryPolicy {
	if len(orgID) == 0 || orgID[0] == "" || e.policy.OrgOverrides == nil {
		return e.policy
	}

	override, ok := e.policy.OrgOverrides[orgID[0]]
	if !ok {
		return e.policy
	}

	merged := clonePolicy(e.policy)

	if override.EnforcementMode != nil {
		merged.EnforcementMode = *override.EnforcementMode
	}

	if override.Tiers != nil {
		if merged.Tiers == nil {
			merged.Tiers = map[TelemetryTier]TierConfig{}
		}
		for tier, cfg := range override.Tiers {
			base := merged.Tiers[tier]
			if cfg.Enabled != nil {
				base.Enabled = *cfg.Enabled
			}
			if cfg.ExportEnabled != nil {
				base.ExportEnabled = *cfg.ExportEnabled
			}
			if cfg.SampleRate != nil {
				base.SampleRate = *cfg.SampleRate
			}
			merged.Tiers[tier] = base
		}
	}

	if override.Tier3Content != nil {
		if override.Tier3Content.ContentExportEnabled != nil {
			merged.Tier3Content.ContentExportEnabled = *override.Tier3Content.ContentExportEnabled
		}
		if override.Tier3Content.MaxPromptBytes != nil {
			merged.Tier3Content.MaxPromptBytes = *override.Tier3Content.MaxPromptBytes
		}
		if override.Tier3Content.MaxResponseBytes != nil {
			merged.Tier3Content.MaxResponseBytes = *override.Tier3Content.MaxResponseBytes
		}
		if override.Tier3Content.SecretRedactionEnabled != nil {
			merged.Tier3Content.SecretRedactionEnabled = *override.Tier3Content.SecretRedactionEnabled
		}
		if override.Tier3Content.ToolOutputFilteringEnabled != nil {
			merged.Tier3Content.ToolOutputFilteringEnabled = *override.Tier3Content.ToolOutputFilteringEnabled
		}
	}

	return merged
}

func sampleByTraceID(traceID string, sampleRate float64) bool {
	if sampleRate <= 0.0 {
		return false
	}
	if sampleRate >= 1.0 {
		return true
	}

	traceID = strings.TrimSpace(traceID)
	if len(traceID) < 8 {
		return false
	}

	last := traceID[len(traceID)-8:]
	b, err := hex.DecodeString(last)
	if err != nil || len(b) != 4 {
		return false
	}

	v := uint32(b[0])<<24 | uint32(b[1])<<16 | uint32(b[2])<<8 | uint32(b[3])
	ratio := float64(v) / float64(uint64(1)<<32)
	return ratio < sampleRate
}
