package main

import (
	"context"
	"crypto/sha256"
	"fmt"
	"os"
	"slices"
	"sort"
	"strings"

	"github.com/superblocksteam/agent/internal/metadata"
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/databaselifecycle"
	runfx "github.com/superblocksteam/agent/pkg/run/fx"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

const (
	registrationTagProfile                              = "profile"
	registrationTagDatabaseLifecycleCapabilities        = "databaseLifecycle:capabilities"
	registrationTagDatabaseLifecycleEnvironmentProfiles = "databaseLifecycle:environmentProfiles"
	registrationTagDatabaseLifecycleEngines             = "databaseLifecycle:engines"
	registrationTagDatabaseLifecycleOps                 = "databaseLifecycle:operations"
)

// databaseLifecycleWorkerRunnable runs the database lifecycle worker as a
// goroutine in the same process as the API servers (added to main()'s
// run.Group, so it shares the process's signal-driven shutdown). agentID is
// the orchestrator's own per-boot agent id: the registrar publishes this
// process's environment profiles under that id, so the worker claims
// dispatches as the same identity — no separate agent id configuration.
// logger is the process logger so worker logs flow through the orchestrator's
// zap pipeline (including remote emitters) rather than a process-global
// default.
func databaseLifecycleWorkerRunnable(serverClientOptions clients.ServerClientOptions, agentID string, logger *zap.Logger) run.Runnable {
	return runfx.AdaptRunCtxAsRunnable(func(ctx context.Context) error {
		return databaselifecycle.RunOrchestratorWorker(ctx, os.Getenv, serverClientOptions, agentID, logger)
	})
}

func databaseLifecycleRegistrationTags(agentTags string, lifecycleWorkerEnabled bool, getenv func(string) string) (map[string][]string, error) {
	tags := metadata.GetTagsMap(agentTags)
	// This is an implementation-derived capability. Never trust an operator-
	// supplied agent tag to advertise it when the required runtime and
	// lifecycle configuration are unavailable.
	delete(tags, registrationTagDatabaseLifecycleCapabilities)
	if !lifecycleWorkerEnabled {
		return tags, nil
	}

	capabilityTags, err := databaselifecycle.CapabilityTagsFromEnv(getenv)
	if err != nil {
		return nil, err
	}
	if len(capabilityTags) == 0 {
		return tags, nil
	}

	capability := databaseLifecycleRegistrationCapability{
		agentTags:     tags,
		lifecycleTags: capabilityTags,
	}
	if err := capability.Validate(); err != nil {
		return nil, err
	}
	return capability.Tags(), nil
}

type databaseLifecycleRegistrationCapability struct {
	agentTags     map[string][]string
	lifecycleTags map[string][]string
}

func (capability databaseLifecycleRegistrationCapability) Validate() error {
	coverage := databaseLifecycleEnvironmentProfileCoverage{
		agentProfiles:       sortedUniqueRegistrationValues(capability.agentTags[registrationTagProfile]),
		environmentProfiles: sortedUniqueRegistrationValues(capability.lifecycleTags[registrationTagDatabaseLifecycleEnvironmentProfiles]),
	}
	return coverage.Validate()
}

func (capability databaseLifecycleRegistrationCapability) Tags() map[string][]string {
	return databaselifecycle.MergeCapabilityTags(capability.agentTags, capability.lifecycleTags)
}

type databaseLifecycleEnvironmentProfileCoverage struct {
	agentProfiles       []string
	environmentProfiles []string
}

func (coverage databaseLifecycleEnvironmentProfileCoverage) Validate() error {
	if len(coverage.environmentProfiles) == 0 {
		return fmt.Errorf("database lifecycle config environmentProfiles are required")
	}
	if len(coverage.agentProfiles) == 0 {
		return fmt.Errorf("database lifecycle worker requires agent.tags %s values for lifecycle environment profile coverage", registrationTagProfile)
	}

	for _, environmentProfile := range coverage.environmentProfiles {
		_, profile, ok := strings.Cut(environmentProfile, ":")
		if !ok || profile == "" {
			return fmt.Errorf("database lifecycle environment profile %q must use environment:profile format", environmentProfile)
		}
		if !coverage.SupportsProfile(profile) {
			return fmt.Errorf("database lifecycle environment profile %q references profile %q not covered by agent.tags profile values %v", environmentProfile, profile, coverage.agentProfiles)
		}
	}
	return nil
}

func (coverage databaseLifecycleEnvironmentProfileCoverage) SupportsProfile(profile string) bool {
	return slices.Contains(coverage.agentProfiles, profile) || slices.Contains(coverage.agentProfiles, "*")
}

func sortedUniqueRegistrationValues(values []string) []string {
	unique := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		unique = append(unique, value)
	}
	sort.Strings(unique)
	return unique
}

func logDatabaseLifecycleRegistrationTags(logger *zap.Logger, tags map[string][]string) {
	if len(tags[registrationTagDatabaseLifecycleOps]) == 0 &&
		len(tags[registrationTagDatabaseLifecycleEngines]) == 0 &&
		len(tags[registrationTagDatabaseLifecycleEnvironmentProfiles]) == 0 {
		return
	}

	logger.Info("registered with database lifecycle capability tags",
		zap.Strings("profiles", tags[registrationTagProfile]),
		zap.Strings("operations", tags[registrationTagDatabaseLifecycleOps]),
		zap.Strings("engines", tags[registrationTagDatabaseLifecycleEngines]),
		zap.Strings("environment_profiles", tags[registrationTagDatabaseLifecycleEnvironmentProfiles]),
		zap.Strings("capabilities", tags[registrationTagDatabaseLifecycleCapabilities]),
	)
}

func logDatabaseLifecycleRegistrationTagError(logger *zap.Logger, getenv func(string) string, err error) {
	rawConfig := getenv("SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG")
	logger.Error("failed to parse database lifecycle config for capability tags",
		zap.Error(err),
		zap.Int("config_length_bytes", len(rawConfig)),
		zap.String("config_sha256", hashDatabaseLifecycleConfig(rawConfig)),
	)
}

func hashDatabaseLifecycleConfig(rawConfig string) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(rawConfig)))
}
