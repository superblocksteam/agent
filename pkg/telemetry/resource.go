package telemetry

import (
	"fmt"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.39.0"
)

const (
	resourceAttrDeploymentEnvironmentName = "deployment.environment.name"
	resourceAttrSuperblocksEnvironment    = "superblocks.environment"
)

var (
	requiredResourceAttributes = []string{
		string(semconv.ServiceNameKey),
		string(semconv.ServiceVersionKey),
		resourceAttrDeploymentEnvironmentName,
	}

	resourceOnlyAttributes = map[string]struct{}{
		resourceAttrDeploymentEnvironmentName: {},
		resourceAttrSuperblocksEnvironment:    {},
		string(semconv.ServiceNameKey):        {},
		string(semconv.ServiceVersionKey):     {},
	}
)

func BuildResource(cfg Config) (*resource.Resource, error) {
	base := resource.NewWithAttributes(
		semconv.SchemaURL,
		semconv.ServiceName(cfg.ServiceName),
		semconv.ServiceVersion(cfg.ServiceVersion),
		attribute.String(resourceAttrDeploymentEnvironmentName, cfg.Environment),
		attribute.String(resourceAttrSuperblocksEnvironment, cfg.Environment),
	)

	merged, err := resource.Merge(resource.Default(), base)
	if err != nil {
		return nil, fmt.Errorf("merge resources: %w", err)
	}

	if err := ValidateResource(merged); err != nil {
		return nil, err
	}
	return merged, nil
}

func ValidateResource(res *resource.Resource) error {
	if res == nil {
		return fmt.Errorf("resource is nil")
	}
	set := res.Set()
	for _, key := range requiredResourceAttributes {
		v, ok := set.Value(attribute.Key(key))
		if !ok || v.AsString() == "" {
			return fmt.Errorf("missing required resource attribute: %s", key)
		}
	}
	return nil
}

func AssertNoResourceAttributes(attrs map[string]any) error {
	for key := range attrs {
		if _, ok := resourceOnlyAttributes[key]; ok {
			return fmt.Errorf("attribute %q must be a resource attribute, not a span attribute", key)
		}
	}
	return nil
}
