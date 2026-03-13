package telemetry

import "fmt"

var tier3ContentPolicyDefault = Tier3ContentPolicy{
	ContentExportEnabled:       true,
	MaxPromptBytes:             32768,
	MaxResponseBytes:           65536,
	SecretRedactionEnabled:     true,
	ToolOutputFilteringEnabled: true,
}

func DefaultCloudPolicy() TelemetryPolicy {
	return TelemetryPolicy{
		DeploymentType:  DeploymentTypeCloud,
		EnforcementMode: EnforcementModeEnforce,
		Tiers: map[TelemetryTier]TierConfig{
			Tier1Local: {
				Enabled:       true,
				ExportEnabled: true,
				SampleRate:    1.0,
			},
			Tier2Operational: {
				Enabled:       true,
				ExportEnabled: true,
				SampleRate:    1.0,
			},
			Tier3AIExperience: {
				Enabled:       true,
				ExportEnabled: true,
				SampleRate:    1.0,
			},
		},
		Tier3Content: tier3ContentPolicyDefault,
	}
}

func DefaultCloudPremPolicy() TelemetryPolicy {
	return TelemetryPolicy{
		DeploymentType:  DeploymentTypeCloudPrem,
		EnforcementMode: EnforcementModeEnforce,
		Tiers: map[TelemetryTier]TierConfig{
			Tier1Local: {
				Enabled:       true,
				ExportEnabled: false,
				SampleRate:    1.0,
			},
			Tier2Operational: {
				Enabled:       true,
				ExportEnabled: true,
				SampleRate:    1.0,
			},
			Tier3AIExperience: {
				Enabled:       true,
				ExportEnabled: true,
				SampleRate:    1.0,
			},
		},
		Tier3Content: tier3ContentPolicyDefault,
	}
}

func clonePolicy(policy TelemetryPolicy) TelemetryPolicy {
	cloned := policy
	if policy.Tiers != nil {
		cloned.Tiers = make(map[TelemetryTier]TierConfig, len(policy.Tiers))
		for tier, cfg := range policy.Tiers {
			cloned.Tiers[tier] = cfg
		}
	}
	if policy.OrgOverrides != nil {
		cloned.OrgOverrides = make(map[string]PartialPolicy, len(policy.OrgOverrides))
		for orgID, override := range policy.OrgOverrides {
			clonedOverride := override
			if override.EnforcementMode != nil {
				v := *override.EnforcementMode
				clonedOverride.EnforcementMode = &v
			}
			if override.Tiers != nil {
				clonedOverride.Tiers = make(map[TelemetryTier]PartialTierConfig, len(override.Tiers))
				for tier, cfg := range override.Tiers {
					clonedOverride.Tiers[tier] = clonePartialTierConfig(cfg)
				}
			}
			if override.Tier3Content != nil {
				clonedOverride.Tier3Content = clonePartialTier3Content(override.Tier3Content)
			}
			cloned.OrgOverrides[orgID] = clonedOverride
		}
	}
	return cloned
}

func clonePartialTierConfig(cfg PartialTierConfig) PartialTierConfig {
	out := cfg
	if cfg.Enabled != nil {
		v := *cfg.Enabled
		out.Enabled = &v
	}
	if cfg.ExportEnabled != nil {
		v := *cfg.ExportEnabled
		out.ExportEnabled = &v
	}
	if cfg.SampleRate != nil {
		v := *cfg.SampleRate
		out.SampleRate = &v
	}
	return out
}

func clonePartialTier3Content(src *PartialTier3ContentPolicy) *PartialTier3ContentPolicy {
	out := *src
	if src.ContentExportEnabled != nil {
		v := *src.ContentExportEnabled
		out.ContentExportEnabled = &v
	}
	if src.MaxPromptBytes != nil {
		v := *src.MaxPromptBytes
		out.MaxPromptBytes = &v
	}
	if src.MaxResponseBytes != nil {
		v := *src.MaxResponseBytes
		out.MaxResponseBytes = &v
	}
	if src.SecretRedactionEnabled != nil {
		v := *src.SecretRedactionEnabled
		out.SecretRedactionEnabled = &v
	}
	if src.ToolOutputFilteringEnabled != nil {
		v := *src.ToolOutputFilteringEnabled
		out.ToolOutputFilteringEnabled = &v
	}
	return &out
}

func validatePolicy(policy TelemetryPolicy) error {
	switch policy.DeploymentType {
	case DeploymentTypeCloud, DeploymentTypeCloudPrem:
	default:
		return fmt.Errorf("invalid deployment type: %q", policy.DeploymentType)
	}

	switch policy.EnforcementMode {
	case EnforcementModeAudit, EnforcementModeEnforce:
	default:
		return fmt.Errorf("invalid enforcement mode: %q", policy.EnforcementMode)
	}

	if policy.Tiers == nil {
		return fmt.Errorf("policy tiers are required")
	}

	for _, tier := range []TelemetryTier{Tier1Local, Tier2Operational, Tier3AIExperience} {
		cfg, ok := policy.Tiers[tier]
		if !ok {
			return fmt.Errorf("policy missing tier config for %s", tier)
		}
		if cfg.SampleRate < 0.0 || cfg.SampleRate > 1.0 {
			return fmt.Errorf("tier %s sample rate must be in [0.0,1.0], got %f", tier, cfg.SampleRate)
		}
	}

	if policy.Tier3Content.MaxPromptBytes < 0 {
		return fmt.Errorf("tier3 max prompt bytes must be >= 0")
	}
	if policy.Tier3Content.MaxResponseBytes < 0 {
		return fmt.Errorf("tier3 max response bytes must be >= 0")
	}

	for orgID, override := range policy.OrgOverrides {
		for tier, cfg := range override.Tiers {
			if tier != Tier1Local && tier != Tier2Operational && tier != Tier3AIExperience {
				return fmt.Errorf("org override %q has invalid tier %q", orgID, tier)
			}
			if cfg.SampleRate != nil && (*cfg.SampleRate < 0.0 || *cfg.SampleRate > 1.0) {
				return fmt.Errorf("org override %q tier %s sample rate must be in [0.0,1.0], got %f", orgID, tier, *cfg.SampleRate)
			}
		}
	}

	return nil
}
