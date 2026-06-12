package metadata

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/utils"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

func profileTagSets(values ...string) map[string]*utils.Set[string] {
	if len(values) == 0 {
		return map[string]*utils.Set[string]{}
	}

	return map[string]*utils.Set[string]{
		ProfileTagKey: utils.NewSet(values...),
	}
}

func TestProfileSupported(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name              string
		agentTags         map[string]*utils.Set[string]
		legacyEnvironment string
		targetProfile     string
		expected          bool
	}{
		{
			name:          "empty target profile is always supported",
			targetProfile: "",
			expected:      true,
		},
		{
			name:              "wildcard profile tag supports any profile",
			agentTags:         profileTagSets(EnvironmentAll),
			legacyEnvironment: "staging",
			targetProfile:     "production",
			expected:          true,
		},
		{
			name:              "explicit profile tag match",
			agentTags:         profileTagSets("staging", "production"),
			legacyEnvironment: "*",
			targetProfile:     "staging",
			expected:          true,
		},
		{
			name:              "explicit profile tag mismatch",
			agentTags:         profileTagSets("production"),
			legacyEnvironment: "*",
			targetProfile:     "staging",
			expected:          false,
		},
		{
			name:              "legacy environment wildcard with no profile tags",
			agentTags:         map[string]*utils.Set[string]{},
			legacyEnvironment: EnvironmentAll,
			targetProfile:     "staging",
			expected:          true,
		},
		{
			name:              "legacy environment exact match with no profile tags",
			agentTags:         map[string]*utils.Set[string]{},
			legacyEnvironment: "staging",
			targetProfile:     "staging",
			expected:          true,
		},
		{
			name:              "legacy environment mismatch with no profile tags",
			agentTags:         map[string]*utils.Set[string]{},
			legacyEnvironment: "production",
			targetProfile:     "staging",
			expected:          false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			assert.Equal(t, test.expected, ProfileSupported(test.agentTags, test.legacyEnvironment, test.targetProfile))
		})
	}
}

func TestValidateExecutionProfile(t *testing.T) {
	t.Parallel()

	profileName := "staging"
	profileID := "profile-id"

	tests := []struct {
		name        string
		agentTags   map[string]*utils.Set[string]
		profile     *commonv1.Profile
		expectError bool
	}{
		{
			name:    "nil profile is allowed",
			profile: nil,
		},
		{
			name:    "empty profile is allowed",
			profile: &commonv1.Profile{},
		},
		{
			name:        "profile id without name is rejected",
			agentTags:   profileTagSets("production"),
			profile:     &commonv1.Profile{Id: &profileID},
			expectError: true,
		},
		{
			name:      "legacy profile environment is validated",
			agentTags: profileTagSets("staging"),
			profile:   &commonv1.Profile{Environment: &profileName},
		},
		{
			name:        "legacy profile environment mismatch is rejected",
			agentTags:   profileTagSets("production"),
			profile:     &commonv1.Profile{Environment: &profileName},
			expectError: true,
		},
		{
			name:      "supported profile is allowed",
			agentTags: profileTagSets("staging"),
			profile:   &commonv1.Profile{Name: &profileName},
		},
		{
			name:        "unsupported profile is rejected",
			agentTags:   profileTagSets("production"),
			profile:     &commonv1.Profile{Name: &profileName},
			expectError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			err := ValidateExecutionProfile(test.agentTags, "*", test.profile)
			if test.expectError {
				require.Error(t, err)
				assert.True(t, sberrors.IsAuthorizationError(err))
				return
			}
			require.NoError(t, err)
		})
	}
}
