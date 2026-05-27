package databaselifecycle

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestResourceTypePolicyAllowsOnlyConfiguredPlanResourceTypes(t *testing.T) {
	policy := NewResourceTypePolicy([]string{"aws_db_instance", "aws_rds_cluster"})

	err := policy.Check(context.Background(), `{
		"resource_changes": [
			{"type": "aws_db_instance"},
			{"type": "aws_rds_cluster"}
		]
	}`)

	require.NoError(t, err)
}

func TestResourceTypePolicyRejectsUnsupportedPlanResourceTypes(t *testing.T) {
	policy := NewResourceTypePolicy([]string{"aws_db_instance"})

	err := policy.Check(context.Background(), `{
		"resource_changes": [
			{"type": "aws_db_instance"},
			{"type": "aws_iam_role"}
		]
	}`)

	var lifecycleErr *LifecycleError
	require.ErrorAs(t, err, &lifecycleErr)
	require.Equal(t, ErrorCodeUnsupportedShape, lifecycleErr.Code)
	require.False(t, lifecycleErr.Retryable)
	require.ErrorContains(t, lifecycleErr, "unsupported Terraform resource type aws_iam_role")
}

func TestResourceTypePolicyRejectsInvalidPlanJSON(t *testing.T) {
	policy := NewResourceTypePolicy([]string{"aws_db_instance"})

	err := policy.Check(context.Background(), `{`)

	require.ErrorContains(t, err, "decode database lifecycle plan JSON")
}
