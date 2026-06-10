package databaselifecycle

import "fmt"

// TerraformModuleShape describes the input variables declared by a Terraform module.
type TerraformModuleShape struct {
	Variables []string
}

var systemTerraformVariables = []string{
	"binding_key",
	"desired_spec_hash",
	"environment_class",
	"environment_name",
	"operation",
	"profile_id",
	"request_id",
	"resource_key",
	"credential_resolver",
}

// ValidateLifecycleConfigModuleShapes verifies local lifecycle config only selects modules that declare every system variable and configured input.
func ValidateLifecycleConfigModuleShapes(config LifecycleConfig, shapes map[string]TerraformModuleShape) error {
	for _, entry := range config.Entries {
		for operation, byEngine := range entry.terraformOperations() {
			for engine, module := range byEngine {
				shape, ok := shapes[module.Source]
				if !ok {
					return fmt.Errorf("database lifecycle config %s profiles=%s %s/%s module shape for %q is required", entry.Environment, formatStringList(entry.Profiles), operation, engine, module.Source)
				}
				variables := variableSet(shape.Variables)
				for _, variable := range systemTerraformVariables {
					if _, ok := variables[variable]; !ok {
						return fmt.Errorf("database lifecycle config %s profiles=%s %s/%s module %q does not declare system variable %q", entry.Environment, formatStringList(entry.Profiles), operation, engine, module.Source, variable)
					}
				}
				for input := range module.Inputs {
					if _, ok := variables[input]; !ok {
						return fmt.Errorf("database lifecycle config %s profiles=%s %s/%s module input %q is not declared by %q", entry.Environment, formatStringList(entry.Profiles), operation, engine, input, module.Source)
					}
				}
			}
		}
	}
	return nil
}

func variableSet(values []string) map[string]struct{} {
	set := make(map[string]struct{}, len(values))
	for _, value := range values {
		set[value] = struct{}{}
	}
	return set
}
