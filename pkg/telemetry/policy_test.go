package telemetry

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDefaultPolicies(t *testing.T) {
	cloud := DefaultCloudPolicy()
	require.NoError(t, validatePolicy(cloud))
	assert.True(t, cloud.Tiers[Tier1Local].ExportEnabled)

	cloudPrem := DefaultCloudPremPolicy()
	require.NoError(t, validatePolicy(cloudPrem))
	assert.False(t, cloudPrem.Tiers[Tier1Local].ExportEnabled)
	assert.True(t, cloudPrem.Tiers[Tier2Operational].ExportEnabled)
}

func TestValidatePolicyRejectsInvalidSampleRate(t *testing.T) {
	policy := DefaultCloudPolicy()
	cfg := policy.Tiers[Tier2Operational]
	cfg.SampleRate = 1.5
	policy.Tiers[Tier2Operational] = cfg
	require.Error(t, validatePolicy(policy))
}

func TestValidatePolicyBranches(t *testing.T) {
	rate := 2.0
	for _, test := range []struct {
		name    string
		policy  TelemetryPolicy
		wantErr string
	}{
		{
			name:    "invalid deployment type",
			policy:  TelemetryPolicy{DeploymentType: "bad", EnforcementMode: EnforcementModeEnforce, Tiers: DefaultCloudPolicy().Tiers},
			wantErr: "invalid deployment type",
		},
		{
			name:    "invalid enforcement mode",
			policy:  TelemetryPolicy{DeploymentType: DeploymentTypeCloud, EnforcementMode: "bad", Tiers: DefaultCloudPolicy().Tiers},
			wantErr: "invalid enforcement mode",
		},
		{
			name:    "nil tiers",
			policy:  TelemetryPolicy{DeploymentType: DeploymentTypeCloud, EnforcementMode: EnforcementModeEnforce},
			wantErr: "policy tiers are required",
		},
		{
			name: "missing tier config",
			policy: TelemetryPolicy{
				DeploymentType:  DeploymentTypeCloud,
				EnforcementMode: EnforcementModeEnforce,
				Tiers: map[TelemetryTier]TierConfig{
					Tier1Local:       {SampleRate: 1.0},
					Tier2Operational: {SampleRate: 1.0},
				},
			},
			wantErr: "policy missing tier config",
		},
		{
			name: "negative MaxPromptBytes",
			policy: func() TelemetryPolicy {
				p := DefaultCloudPolicy()
				p.Tier3Content.MaxPromptBytes = -1
				return p
			}(),
			wantErr: "tier3 max prompt bytes must be >= 0",
		},
		{
			name: "negative MaxResponseBytes",
			policy: func() TelemetryPolicy {
				p := DefaultCloudPolicy()
				p.Tier3Content.MaxResponseBytes = -1
				return p
			}(),
			wantErr: "tier3 max response bytes must be >= 0",
		},
		{
			name: "org override invalid tier",
			policy: func() TelemetryPolicy {
				p := DefaultCloudPolicy()
				p.OrgOverrides = map[string]PartialPolicy{
					"org1": {Tiers: map[TelemetryTier]PartialTierConfig{"bad_tier": {}}},
				}
				return p
			}(),
			wantErr: "invalid tier",
		},
		{
			name: "org override sample rate out of range",
			policy: func() TelemetryPolicy {
				p := DefaultCloudPolicy()
				p.OrgOverrides = map[string]PartialPolicy{
					"org1": {Tiers: map[TelemetryTier]PartialTierConfig{
						Tier2Operational: {SampleRate: &rate},
					}},
				}
				return p
			}(),
			wantErr: "sample rate must be in [0.0,1.0]",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			err := validatePolicy(test.policy)
			require.Error(t, err)
			assert.Contains(t, err.Error(), test.wantErr)
		})
	}
}

func TestClonePolicyNilTiers(t *testing.T) {
	policy := TelemetryPolicy{DeploymentType: DeploymentTypeCloud, EnforcementMode: EnforcementModeEnforce}
	cloned := clonePolicy(policy)
	assert.Nil(t, cloned.Tiers)
}
