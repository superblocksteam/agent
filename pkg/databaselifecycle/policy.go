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
			Mode string `json:"mode"`
			Type string `json:"type"`
		} `json:"resource_changes"`
	}
	if err := json.Unmarshal([]byte(planJSON), &plan); err != nil {
		return fmt.Errorf("decode database lifecycle plan JSON: %w", err)
	}

	for _, change := range plan.ResourceChanges {
		// Data sources are intentionally exempt from the resource-type
		// allowlist: they are read-only, so the blast radius the allowlist
		// constrains (creating/mutating cloud resources) does not apply.
		// The trust boundary for what a module may read is the module-source
		// allowlist plus the worker's IAM (IRSA) scoping. Note that data
		// source reads can still land in Terraform state, so state storage
		// must be treated as sensitive regardless of this policy.
		if change.Mode == "data" {
			continue
		}
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
