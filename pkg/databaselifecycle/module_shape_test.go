package databaselifecycle

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestValidateLifecycleConfigModuleShapesRejectsUnknownModuleInput(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				"ensure_database": terraformOperation(map[string]TerraformModule{
					"postgres": {
						Source: "registry.example.com/postgres",
						Inputs: map[string]any{
							"unexpected_input": "value",
						},
					},
				}),
			},
		}},
	}

	err := ValidateLifecycleConfigModuleShapes(config, map[string]TerraformModuleShape{
		"registry.example.com/postgres": {
			Variables: systemTerraformVariables,
		},
	})

	require.ErrorContains(t, err, `module input "unexpected_input" is not declared`)
}

func TestValidateLifecycleConfigModuleShapesAcceptsDeclaredInputs(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				"ensure_database": terraformOperation(map[string]TerraformModule{
					"postgres": {
						Source: "registry.example.com/postgres",
						Inputs: map[string]any{
							"storage_gb": 20,
						},
					},
				}),
			},
		}},
	}

	err := ValidateLifecycleConfigModuleShapes(config, map[string]TerraformModuleShape{
		"registry.example.com/postgres": {
			Variables: append(systemTerraformVariables, "storage_gb"),
		},
	})

	require.NoError(t, err)
}

func TestValidateLifecycleConfigModuleShapesRejectsMissingModuleShape(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				"ensure_database": terraformOperation(map[string]TerraformModule{
					"postgres": {Source: "registry.example.com/postgres"},
				}),
			},
		}},
	}

	err := ValidateLifecycleConfigModuleShapes(config, map[string]TerraformModuleShape{})

	require.ErrorContains(t, err, `module shape for "registry.example.com/postgres" is required`)
}

func TestValidateLifecycleConfigModuleShapesRejectsMissingSystemVariable(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				"ensure_database": terraformOperation(map[string]TerraformModule{
					"postgres": {Source: "registry.example.com/postgres"},
				}),
			},
		}},
	}
	withoutResourceKey := []string{"binding_key", "desired_spec_hash", "environment_class", "environment_name", "operation", "profile_id", "request_id"}

	err := ValidateLifecycleConfigModuleShapes(config, map[string]TerraformModuleShape{
		"registry.example.com/postgres": {
			Variables: withoutResourceKey,
		},
	})

	require.ErrorContains(t, err, `does not declare system variable "resource_key"`)
}

func TestValidateLifecycleConfigModuleShapesRejectsMissingCredentialResolverVariable(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				"ensure_database": terraformOperation(map[string]TerraformModule{
					"postgres": {Source: "registry.example.com/postgres"},
				}),
			},
		}},
	}
	withoutCredentialResolver := []string{
		"binding_key",
		"desired_spec_hash",
		"environment_class",
		"environment_name",
		"operation",
		"profile_id",
		"request_id",
		"resource_key",
	}

	err := ValidateLifecycleConfigModuleShapes(config, map[string]TerraformModuleShape{
		"registry.example.com/postgres": {
			Variables: withoutCredentialResolver,
		},
	})

	require.ErrorContains(t, err, `does not declare system variable "credential_resolver"`)
}
