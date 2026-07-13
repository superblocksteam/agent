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
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperation(map[string]TerraformModule{
						"postgres": {Source: "registry.example.com/postgres"},
						"mysql":    {Source: "registry.example.com/mysql"},
					}),
					"promote_database": terraformOperation(map[string]TerraformModule{
						"postgres": {Source: "registry.example.com/postgres"},
						"mysql":    {Source: "registry.example.com/mysql"},
					}),
				},
			},
			{
				Environment: "edit",
				Profiles:    []string{"staging"},
				Engines:     []string{"postgres"},
				Operations: map[string]LifecycleOperation{
					"ensure_database": terraformOperation(map[string]TerraformModule{
						"postgres": {Source: "registry.example.com/postgres"},
					}),
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

func TestLifecycleConfigCapabilityTagsDoNotPublishInternalPhysicalProvisionOperation(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{
			{
				Environment: "deployed",
				Profiles:    []string{"production"},
				Engines:     []string{"postgres"},
				Operations: map[string]LifecycleOperation{
					"ensure_database": {
						Backend: "terraform",
						PhysicalDatabase: &PhysicalDatabasePolicy{
							Mode:               "shared_pool",
							ProvisionOperation: "ensure_physical_database_instance",
							OnExhausted:        "provision",
						},
					},
					"ensure_physical_database_instance": terraformOperation(map[string]TerraformModule{
						"postgres": {Source: "registry.example.com/physical-postgres"},
					}),
					"migrate_schema": {
						Backend: "native_runner",
					},
				},
			},
		},
	}

	require.Equal(t, []string{"ensure_database", "migrate_schema"}, config.CapabilityTags()[capabilityTagOperations])
}

func TestCapabilityTagsFromEnvDerivesTagsWithoutModuleShapes(t *testing.T) {
	tags, err := CapabilityTagsFromEnv(func(key string) string {
		switch key {
		case envConfig:
			return `{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"operations": {
							"ensure_database": {
								"backend": "terraform",
								"terraform": {
									"backend": {"stateBackend": "s3"},
									"credentialResolver": {"runtime": "aws_secrets_manager"},
									"moduleSelectors": {
										"postgres": {
											"source": "registry.example.com/postgres",
											"inputs": {"storage_gb": 20}
										}
									}
								}
							}
						}
					}
				]
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

func TestCapabilityTagsFromEnvPublishesNativeRunnerOperations(t *testing.T) {
	tags, err := CapabilityTagsFromEnv(func(key string) string {
		switch key {
		case envConfig:
			return `{
				"entries": [
					{
						"environment": "deployed",
						"profiles": ["production"],
						"engines": ["postgres"],
						"operations": {
							"ensure_database": {
								"backend": "terraform",
								"terraform": {
									"backend": {"stateBackend": "s3"},
									"credentialResolver": {"runtime": "aws_secrets_manager"},
									"moduleSelectors": {
										"postgres": {
											"source": "registry.example.com/postgres",
											"inputs": {"storage_gb": 20}
										}
									}
								}
							},
							"migrate_schema": {
								"backend": "native_runner"
							}
						}
					}
				]
			}`
		default:
			return ""
		}
	})

	require.NoError(t, err)
	require.Equal(t, map[string][]string{
		"databaseLifecycle:operations":          {"ensure_database", "migrate_schema"},
		"databaseLifecycle:engines":             {"postgres"},
		"databaseLifecycle:environmentProfiles": {"deployed:production"},
	}, tags)
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
