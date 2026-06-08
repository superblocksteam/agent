package databaselifecycle

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLifecycleConfigCapabilityTagsDeriveSortedUniqueTags(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{
			{
				Environment: "preview",
				Profiles:    []string{"production", "qa"},
				Engines:     []string{"postgres", "mysql"},
				ModuleSelectors: map[string]map[string]TerraformModule{
					"ensure_database": {
						"postgres": {Source: "registry.example.com/postgres"},
						"mysql":    {Source: "registry.example.com/mysql"},
					},
					"promote_database": {
						"postgres": {Source: "registry.example.com/postgres"},
						"mysql":    {Source: "registry.example.com/mysql"},
					},
				},
			},
			{
				Environment: "edit",
				Profiles:    []string{"staging"},
				Engines:     []string{"postgres"},
				ModuleSelectors: map[string]map[string]TerraformModule{
					"ensure_database": {
						"postgres": {Source: "registry.example.com/postgres"},
					},
				},
			},
		},
	}

	require.Equal(t, map[string][]string{
		"databaseLifecycle:operations":          {"ensure_database", "promote_database"},
		"databaseLifecycle:engines":             {"mysql", "postgres"},
		"databaseLifecycle:environmentProfiles": {"edit:staging", "preview:production", "preview:qa"},
	}, config.CapabilityTags())
}

func TestCapabilityTagsFromEnvValidatesModuleShapes(t *testing.T) {
	tags, err := CapabilityTagsFromEnv(func(key string) string {
		switch key {
		case envConfig:
			return `{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"backend": {"stateBackend": "s3"},
						"credentialResolver": {"runtime": "aws_secrets_manager"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {
									"source": "registry.example.com/postgres",
									"inputs": {"storage_gb": 20}
								}
							}
						}
					}
				]
			}`
		case envModuleShapes:
			return `{
				"registry.example.com/postgres": {
					"variables": ["binding_key", "desired_spec_hash", "environment_class", "environment_name", "operation", "profile_id", "request_id", "resource_key", "credential_resolver", "storage_gb"]
				}
			}`
		default:
			return ""
		}
	})

	require.NoError(t, err)
	require.Equal(t, map[string][]string{
		"databaseLifecycle:operations":          {"ensure_database"},
		"databaseLifecycle:engines":             {"postgres"},
		"databaseLifecycle:environmentProfiles": {"deployed:production"},
	}, tags)
}

func TestCapabilityTagsFromEnvRejectsMissingModuleShapes(t *testing.T) {
	_, err := CapabilityTagsFromEnv(func(key string) string {
		if key == envConfig {
			return `{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"backend": {"stateBackend": "s3"},
						"credentialResolver": {"runtime": "aws_secrets_manager"},
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
	})

	require.ErrorContains(t, err, "database lifecycle module shapes are required")
}

func TestCapabilityTagsFromEnvRejectsInvalidModuleShapes(t *testing.T) {
	_, err := CapabilityTagsFromEnv(func(key string) string {
		switch key {
		case envConfig:
			return `{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"backend": {"stateBackend": "s3"},
						"credentialResolver": {"runtime": "aws_secrets_manager"},
						"moduleSelectors": {
							"ensure_database": {
								"postgres": {"source": "registry.example.com/postgres"}
							}
						}
					}
				]
			}`
		case envModuleShapes:
			return `{"registry.example.com/postgres": {"variables": ["binding_key"]}}`
		default:
			return ""
		}
	})

	require.ErrorContains(t, err, `does not declare system variable "desired_spec_hash"`)
}

func TestMergeCapabilityTagsReplacesStaleLifecycleTags(t *testing.T) {
	tags := map[string][]string{
		"profile":                               {"production"},
		"region":                                {"us-east-1"},
		"databaseLifecycle:operations":          {"retire_database"},
		"databaseLifecycle:engines":             {"mysql"},
		"databaseLifecycle:environmentProfiles": {"deployed:production"},
		"databaseLifecycle:custom":              {"legacy"},
	}

	merged := MergeCapabilityTags(tags, map[string][]string{
		"databaseLifecycle:operations":          {"ensure_database", "promote_database"},
		"databaseLifecycle:engines":             {"postgres"},
		"databaseLifecycle:environmentProfiles": {"edit:staging"},
	})

	require.Equal(t, map[string][]string{
		"profile":                               {"production"},
		"region":                                {"us-east-1"},
		"databaseLifecycle:operations":          {"ensure_database", "promote_database"},
		"databaseLifecycle:engines":             {"postgres"},
		"databaseLifecycle:environmentProfiles": {"edit:staging"},
		"databaseLifecycle:custom":              {"legacy"},
	}, merged)
}
