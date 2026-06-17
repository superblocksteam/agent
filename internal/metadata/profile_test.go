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
			// The wildcard must short-circuit before any key comparison: an
			// arbitrary profile that is not otherwise listed is still allowed.
			name:              "wildcard profile tag supports an unknown profile",
			agentTags:         profileTagSets(EnvironmentAll),
			legacyEnvironment: "",
			targetProfile:     "some-brand-new-profile",
			expected:          true,
		},
		{
			// Wildcard present alongside explicit keys still allows a profile
			// that is not in the explicit set, proving "*" wins over key matching.
			name:              "wildcard wins over explicit profile tags",
			agentTags:         profileTagSets("production", EnvironmentAll),
			legacyEnvironment: "",
			targetProfile:     "staging",
			expected:          true,
		},
		{
			name:              "wildcard profile tag is case-insensitive on the target",
			agentTags:         profileTagSets(EnvironmentAll),
			legacyEnvironment: "",
			targetProfile:     "PRODUCTION",
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
		{
			name:              "profile tag match is case-insensitive (display name vs key)",
			agentTags:         profileTagSets("production"),
			legacyEnvironment: "*",
			targetProfile:     "Production",
			expected:          true,
		},
		{
			name:              "profile tag match ignores target surrounding whitespace and case",
			agentTags:         profileTagSets("staging"),
			legacyEnvironment: "*",
			targetProfile:     "  staging ",
			expected:          true,
		},
		{
			name:              "case-insensitive match still rejects different profiles",
			agentTags:         profileTagSets("production"),
			legacyEnvironment: "*",
			targetProfile:     "Staging",
			expected:          false,
		},
		{
			name:              "legacy environment match is case-insensitive",
			agentTags:         map[string]*utils.Set[string]{},
			legacyEnvironment: "Production",
			targetProfile:     "production",
			expected:          true,
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
	displayProfileName := "Production"
	profileKey := "production"
	blankProfileKey := "   "

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
		{
			name:      "display-name profile matches lowercase key tag",
			agentTags: profileTagSets("production"),
			profile:   &commonv1.Profile{Name: &displayProfileName},
		},
		{
			name:      "profile key is preferred over display name",
			agentTags: profileTagSets("production"),
			profile:   &commonv1.Profile{Name: &displayProfileName, Key: &profileKey},
		},
		{
			name:      "blank profile key falls back to display name",
			agentTags: profileTagSets("production"),
			profile:   &commonv1.Profile{Name: &displayProfileName, Key: &blankProfileKey},
		},
		{
			name:        "unsupported profile key is rejected even when display name matches",
			agentTags:   profileTagSets("production"),
			profile:     &commonv1.Profile{Name: &displayProfileName, Key: &profileName},
			expectError: true,
		},
		{
			// Agent tagged with profile:* accepts any requested profile,
			// short-circuiting before the key comparison.
			name:      "wildcard profile tag allows any requested profile",
			agentTags: profileTagSets(EnvironmentAll),
			profile:   &commonv1.Profile{Name: &displayProfileName, Key: &profileKey},
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
