package metadata

import (
	"fmt"
	"strings"

	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/utils"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

const (
	ProfileTagKey  = "profile"
	EnvironmentAll = "*"
)

// normalizeProfile canonicalizes a profile identifier for comparison.
//
// Profiles are keyed everywhere else in the platform by their lowercase
// `key` (e.g. "production"), and the control plane resolves profiles
// case-insensitively (profilesByName[profile.toLowerCase()]). Execution
// requests, however, can carry the human-facing profile name (e.g.
// "Production"), so matching here must be case-insensitive to stay
// consistent with the server.
func normalizeProfile(profile string) string {
	return strings.ToLower(strings.TrimSpace(profile))
}

// ProfileSupported reports whether targetProfile is allowed on an agent configured
// with agent.tags profile values and the legacy agent.environment fallback.
// Semantics mirror packages/ui isProfileSupported, with case-insensitive
// matching to mirror the control plane's profile resolution.
//
// supportedProfiles holds the agent's configured `profile:` data-tag values
// (parsed in parseTagsString). These are profile *keys* (e.g. "production"),
// not display names.
func ProfileSupported(agentTags map[string]*utils.Set[string], legacyEnvironment string, targetProfile string) bool {
	if targetProfile == "" {
		return true
	}

	target := normalizeProfile(targetProfile)

	supportedProfiles := agentTags[ProfileTagKey]
	if supportedProfiles.Contains(EnvironmentAll) {
		return true
	}

	if supportedProfiles.IsEmpty() {
		return legacyEnvironment == EnvironmentAll || normalizeProfile(legacyEnvironment) == target
	}

	return supportedProfiles.Contains(target)
}

// ProfileKeyOrName returns the canonical profile key when present, falling back
// to the legacy Profile.name field for older callers.
func ProfileKeyOrName(profile *commonv1.Profile) string {
	if profile == nil {
		return ""
	}

	if key := strings.TrimSpace(profile.GetKey()); key != "" {
		return key
	}

	return strings.TrimSpace(profile.GetName())
}

// executionProfileKey returns the profile key used for agent tag matching.
// New callers send both Profile.key and the human-facing Profile.name; older
// callers only sent name, so keep name as the fallback before the deprecated
// Profile.environment field.
func executionProfileKey(profile *commonv1.Profile) string {
	if profileKey := ProfileKeyOrName(profile); profileKey != "" {
		return profileKey
	}
	return strings.TrimSpace(profile.GetEnvironment())
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
				"profile %q is not supported by this agent: profile key or name is required for data tag validation",
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
