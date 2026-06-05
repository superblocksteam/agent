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
