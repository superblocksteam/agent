package databaselifecycle

import (
	"context"
	"encoding/json"
	"fmt"
)

type ResourceTypePolicy struct {
	allowed map[string]struct{}
}

func NewResourceTypePolicy(resourceTypes []string) *ResourceTypePolicy {
	allowed := make(map[string]struct{}, len(resourceTypes))
	for _, resourceType := range resourceTypes {
		if resourceType != "" {
			allowed[resourceType] = struct{}{}
		}
	}
	return &ResourceTypePolicy{allowed: allowed}
}

func (p *ResourceTypePolicy) Check(ctx context.Context, planJSON string) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	var plan struct {
		ResourceChanges []struct {
			Type string `json:"type"`
		} `json:"resource_changes"`
	}
	if err := json.Unmarshal([]byte(planJSON), &plan); err != nil {
		return fmt.Errorf("decode database lifecycle plan JSON: %w", err)
	}

	for _, change := range plan.ResourceChanges {
		if change.Type == "" {
			continue
		}
		if _, ok := p.allowed[change.Type]; !ok {
			return &LifecycleError{
				Code:      ErrorCodeUnsupportedShape,
				Retryable: false,
				Err:       fmt.Errorf("unsupported Terraform resource type %s", change.Type),
			}
		}
	}
	return nil
}
