package main

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

func TestDatabaseLifecycleWorkerRunnableRequiresAgentID(t *testing.T) {
	runnable := databaseLifecycleWorkerRunnable(clients.ServerClientOptions{}, "", zap.NewNop())

	err := runnable.Run(context.Background())

	require.ErrorContains(t, err, "database lifecycle agent id is required")
}

func TestDatabaseLifecycleWorkerRunnableThreadsAgentID(t *testing.T) {
	// With an agent id supplied, bootstrap proceeds past the identity check
	// and fails on the next required setting instead — proving the id from
	// the orchestrator process reaches the worker config.
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES", "")
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES", "")
	runnable := databaseLifecycleWorkerRunnable(clients.ServerClientOptions{}, "agent-1", zap.NewNop())

	err := runnable.Run(context.Background())

	require.ErrorContains(t, err, "allowed resource types are required")
}

func TestDatabaseLifecycleWorkerRunnableStopsCleanlyOnContextCancellation(t *testing.T) {
	// run.Group shutdown contract: the poll loop returns ctx.Err() on
	// cancellation and the runnable adapter converts that into a nil return,
	// so a SIGTERM-driven group stop is not reported as a worker failure.
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ROOT_DIR", t.TempDir())
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES", "aws_db_instance")
	t.Setenv("SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES", "registry.example.com/modules")
	runnable := databaseLifecycleWorkerRunnable(clients.ServerClientOptions{}, "agent-1", zap.NewNop())
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := runnable.Run(ctx)

	require.NoError(t, err)
}

func TestDatabaseLifecycleRegistrationTagsMergeLifecycleCapabilities(t *testing.T) {
	getenv := databaseLifecycleRegistrationTestGetenv(`{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production", "staging"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`)

	tags, err := databaseLifecycleRegistrationTags("profile:staging,profile:production,region:us-east-1", true, getenv)

	require.NoError(t, err)
	require.Equal(t, map[string][]string{
		"profile":                               {"staging", "production"},
		"region":                                {"us-east-1"},
		"databaseLifecycle:operations":          {"ensure_database"},
		"databaseLifecycle:engines":             {"postgres"},
		"databaseLifecycle:environmentProfiles": {"deployed:production", "deployed:staging"},
	}, tags)
}

func TestDatabaseLifecycleRegistrationTagsRejectsLifecycleEnvironmentProfileNotCoveredByProfileTag(t *testing.T) {
	getenv := databaseLifecycleRegistrationTestGetenv(`{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production", "staging"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`)

	_, err := databaseLifecycleRegistrationTags("profile:production", true, getenv)

	require.ErrorContains(t, err, `database lifecycle environment profile "deployed:staging" references profile "staging" not covered by agent.tags profile values [production]`)
}

func TestDatabaseLifecycleRegistrationTagsAllowsProfileTagSuperset(t *testing.T) {
	getenv := databaseLifecycleRegistrationTestGetenv(`{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`)

	tags, err := databaseLifecycleRegistrationTags("profile:production,profile:staging", true, getenv)

	require.NoError(t, err)
	require.Equal(t, []string{"deployed:production"}, tags["databaseLifecycle:environmentProfiles"])
	require.Equal(t, []string{"production", "staging"}, tags["profile"])
}

func TestDatabaseLifecycleRegistrationTagsAllowsWildcardProfileCoverage(t *testing.T) {
	getenv := databaseLifecycleRegistrationTestGetenv(`{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`)

	tags, err := databaseLifecycleRegistrationTags("profile:*", true, getenv)

	require.NoError(t, err)
	require.Equal(t, []string{"deployed:production"}, tags["databaseLifecycle:environmentProfiles"])
	require.Equal(t, []string{"*"}, tags["profile"])
}

func TestDatabaseLifecycleRegistrationTagsAllowsWildcardLifecycleProfileWhenProfileTagIsWildcard(t *testing.T) {
	getenv := databaseLifecycleRegistrationTestGetenv(`{
				"entries": [
					{
						"environment": "edit",
						"profiles": ["*"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`)

	tags, err := databaseLifecycleRegistrationTags("profile:*", true, getenv)

	require.NoError(t, err)
	require.Equal(t, []string{"edit:*"}, tags["databaseLifecycle:environmentProfiles"])
}

func TestDatabaseLifecycleRegistrationTagsRejectsWildcardLifecycleProfileWithoutWildcardProfileTag(t *testing.T) {
	getenv := databaseLifecycleRegistrationTestGetenv(`{
				"entries": [
					{
						"environment": "edit",
						"profiles": ["*"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`)

	_, err := databaseLifecycleRegistrationTags("profile:production", true, getenv)

	require.ErrorContains(t, err, `database lifecycle environment profile "edit:*" references profile "*" not covered by agent.tags profile values [production]`)
}

func TestDatabaseLifecycleRegistrationTagsSupportsNonRectangularEnvironmentProfiles(t *testing.T) {
	getenv := databaseLifecycleRegistrationTestGetenv(`{
				"entries": [
					{
						"environment": "edit",
						"profiles": ["staging-us", "staging-eu"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					},
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`)

	tags, err := databaseLifecycleRegistrationTags("profile:staging-us,profile:staging-eu,profile:production", true, getenv)

	require.NoError(t, err)
	require.Equal(t, []string{"deployed:production", "edit:staging-eu", "edit:staging-us"}, tags["databaseLifecycle:environmentProfiles"])
}

func TestDatabaseLifecycleRegistrationTagsWorkerDisabledUsesAgentTagsOnly(t *testing.T) {
	getenv := func(string) string {
		t.Fatal("worker-disabled registration should not read lifecycle config")
		return ""
	}

	tags, err := databaseLifecycleRegistrationTags("profile:staging,region:us-east-1", false, getenv)

	require.NoError(t, err)
	require.Equal(t, map[string][]string{
		"profile": {"staging"},
		"region":  {"us-east-1"},
	}, tags)
}

func TestDatabaseLifecycleRegistrationTagsEmptyConfigDoesNotError(t *testing.T) {
	tags, err := databaseLifecycleRegistrationTags("profile:staging", true, func(string) string { return "" })

	require.NoError(t, err)
	require.Equal(t, map[string][]string{"profile": {"staging"}}, tags)
}

func TestDatabaseLifecycleRegistrationTagsInvalidConfigReturnsError(t *testing.T) {
	getenv := func(key string) string {
		if key == "SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG" {
			return `{invalid json`
		}
		return ""
	}

	_, err := databaseLifecycleRegistrationTags("profile:staging", true, getenv)

	require.ErrorContains(t, err, "database lifecycle config")
}

func TestDatabaseLifecycleRegistrationTagsRejectsMissingModuleShapes(t *testing.T) {
	getenv := func(key string) string {
		if key == "SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG" {
			return `{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`
		}
		return ""
	}

	_, err := databaseLifecycleRegistrationTags("profile:production", true, getenv)

	require.ErrorContains(t, err, "database lifecycle module shapes are required")
}

func TestDatabaseLifecycleRegistrationTagsRejectsInvalidModuleShape(t *testing.T) {
	getenv := func(key string) string {
		switch key {
		case "SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG":
			return `{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"backend": {"bucket": "native-db"},
						"credentialResolver": {"type": "aws"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`
		case "SUPERBLOCKS_DATABASE_LIFECYCLE_MODULE_SHAPES":
			return `{
				"registry.example.com/postgres": {
					"variables": ["binding_key", "desired_spec_hash", "environment_class", "environment_name", "operation", "profile_id", "request_id", "resource_key"]
				}
			}`
		default:
			return ""
		}
	}

	_, err := databaseLifecycleRegistrationTags("profile:production", true, getenv)

	require.ErrorContains(t, err, `does not declare system variable "credential_resolver"`)
}

func databaseLifecycleRegistrationTestGetenv(config string) func(string) string {
	return func(key string) string {
		switch key {
		case "SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG":
			return config
		case "SUPERBLOCKS_DATABASE_LIFECYCLE_MODULE_SHAPES":
			return `{
				"registry.example.com/postgres": {
					"variables": ["binding_key", "desired_spec_hash", "environment_class", "environment_name", "operation", "profile_id", "request_id", "resource_key", "credential_resolver"]
				}
			}`
		default:
			return ""
		}
	}
}

func TestLogDatabaseLifecycleRegistrationTagsIncludesMergedTagSummary(t *testing.T) {
	core, logs := observer.New(zap.InfoLevel)
	logger := zap.New(core)

	logDatabaseLifecycleRegistrationTags(logger, map[string][]string{
		"profile":                               {"production", "staging"},
		"databaseLifecycle:operations":          {"ensure_database"},
		"databaseLifecycle:engines":             {"postgres"},
		"databaseLifecycle:environmentProfiles": {"deployed:production", "deployed:staging"},
	})

	entry := logs.FilterMessage("registered with database lifecycle capability tags").TakeAll()
	require.Len(t, entry, 1)
	require.ElementsMatch(t, []any{"production", "staging"}, entry[0].ContextMap()["profiles"])
	require.ElementsMatch(t, []any{"ensure_database"}, entry[0].ContextMap()["operations"])
	require.ElementsMatch(t, []any{"postgres"}, entry[0].ContextMap()["engines"])
	require.ElementsMatch(t, []any{"deployed:production", "deployed:staging"}, entry[0].ContextMap()["environment_profiles"])
}

func TestLogDatabaseLifecycleRegistrationTagErrorIncludesConfigFingerprint(t *testing.T) {
	core, logs := observer.New(zap.ErrorLevel)
	logger := zap.New(core)
	rawConfig := `{"entries":[{"environment":"deployed"}]}`
	getenv := func(key string) string {
		if key == "SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG" {
			return rawConfig
		}
		return ""
	}

	logDatabaseLifecycleRegistrationTagError(logger, getenv, errors.New("boom"))

	entry := logs.FilterMessage("failed to parse database lifecycle config for capability tags").TakeAll()
	require.Len(t, entry, 1)
	require.Equal(t, int64(len(rawConfig)), entry[0].ContextMap()["config_length_bytes"])
	require.Equal(t, "f1eb1ac724e04ffb806844fbf9aa5efee1e6490211b24db3a6edb18dd0a882f1", entry[0].ContextMap()["config_sha256"])
	require.NotContains(t, entry[0].ContextMap(), "config_preview")
}
