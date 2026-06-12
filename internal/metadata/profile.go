package metadata

import (
	"fmt"

	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/utils"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

const (
	ProfileTagKey  = "profile"
	EnvironmentAll = "*"
)

// ProfileSupported reports whether targetProfile is allowed on an agent configured
// with agent.tags profile values and the legacy agent.environment fallback.
// Semantics mirror packages/ui isProfileSupported.
func ProfileSupported(agentTags map[string]*utils.Set[string], legacyEnvironment string, targetProfile string) bool {
	if targetProfile == "" {
		return true
	}

	supportedProfiles := agentTags[ProfileTagKey]
	if supportedProfiles.Contains(EnvironmentAll) {
		return true
	}

	if supportedProfiles.IsEmpty() {
		return legacyEnvironment == EnvironmentAll || legacyEnvironment == targetProfile
	}

	return supportedProfiles.Contains(targetProfile)
}

// executionProfileKey returns the profile key used for agent tag matching.
// Prefers name, then the deprecated Profile.environment field.
func executionProfileKey(profile *commonv1.Profile) string {
	if profile == nil {
		return ""
	}

	if name := profile.GetName(); name != "" {
		return name
	}

	return profile.GetEnvironment()
}

// ValidateExecutionProfile rejects execution when the request profile is not
// covered by this agent's configured data tags.
func ValidateExecutionProfile(agentTags map[string]*utils.Set[string], legacyEnvironment string, profile *commonv1.Profile) error {
	if profile == nil {
		return nil
	}

	profileKey := executionProfileKey(profile)
	if profileKey == "" {
		if profile.GetId() != "" {
			return sberrors.AuthorizationError(fmt.Errorf(
				"profile %q is not supported by this agent: profile name is required for data tag validation",
				profile.GetId(),
			))
		}
		return nil
	}

	if ProfileSupported(agentTags, legacyEnvironment, profileKey) {
		return nil
	}

	return sberrors.AuthorizationError(fmt.Errorf(
		"profile %q is not supported by this agent",
		profileKey,
	))
}
