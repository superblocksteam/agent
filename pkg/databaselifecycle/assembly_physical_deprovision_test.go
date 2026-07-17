package databaselifecycle

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestAttachPhysicalDatabaseInstanceForDeprovisionResolvesInstanceFromConnectionMetadata(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:       "pool-1",
			Endpoint: "pool.example.com:5432",
			MasterCredentialRef: map[string]any{
				"resolver": "aws_secrets_manager",
				"ref":      "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool",
			},
		}},
	}
	dispatch := DispatchPayload{
		ConnectionMetadata: map[string]any{
			physicalDatabaseInstanceRefMetadataKey: "pool-1",
		},
		DesiredSpec: DatabaseRequirement{Engine: "postgres"},
		Environment: "edit",
		Operation:   operationRetireDatabase,
		Profile:     "dev",
	}
	resolved := ResolvedLifecycleConfig{
		Backend: map[string]any{"region": "us-east-1"},
		Module: TerraformModule{
			Source: "git::https://github.com/example/terraform.git//modules/postgres-managed-database",
			Inputs: map[string]any{
				credentialSecretPrefixInput: "superblocks/native-db/local",
			},
		},
	}

	err := attachPhysicalDatabaseInstanceForDeprovision(context.Background(), client, &dispatch, &resolved)

	require.NoError(t, err)
	require.Equal(t, "pool-1", dispatch.PhysicalDatabaseInstanceID)
	require.Equal(t, "pool.example.com", resolved.Module.Inputs["host"])
	require.Equal(t, 5432, resolved.Module.Inputs["port"])
}

func TestAttachPhysicalDatabaseInstanceForDeprovisionResolvesIAMInstanceWithoutCredentialSecretPrefix(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID: "pool-iam-1",
			MasterCredentialRef: map[string]any{
				"resolver": "aws_secrets_manager",
				"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!cluster",
			},
			Metadata: map[string]any{
				"aws_account_id":      "361919038798",
				"cluster_resource_id": "cluster-ABC123DEF456EXAMPLE",
				"host":                "pool.cluster-abc.us-east-1.rds.amazonaws.com",
				"port":                5432,
				"region":              "us-east-1",
			},
		}},
	}
	dispatch := DispatchPayload{
		ConnectionMetadata: map[string]any{
			physicalDatabaseInstanceRefMetadataKey: "pool-iam-1",
		},
		DesiredSpec: DatabaseRequirement{Engine: "postgres"},
		Environment: "edit",
		Operation:   operationRetireDatabase,
		Profile:     "dev",
	}
	resolved := ResolvedLifecycleConfig{
		Backend: map[string]any{"region": "us-east-1"},
		Module: TerraformModule{
			Source: "git::https://github.com/example/terraform.git//modules/postgres-managed-database",
			Inputs: map[string]any{
				"auth_mode": iamAuthMode,
			},
		},
	}

	err := attachPhysicalDatabaseInstanceForDeprovision(context.Background(), client, &dispatch, &resolved)

	require.NoError(t, err)
	require.Equal(t, "pool-iam-1", dispatch.PhysicalDatabaseInstanceID)
	require.False(t, dispatch.PhysicalDatabaseInstanceReserved)
	require.Equal(t, "pool.cluster-abc.us-east-1.rds.amazonaws.com", resolved.Module.Inputs["host"])
	require.Equal(t, 5432, resolved.Module.Inputs["port"])
	require.Equal(t, "361919038798", resolved.Module.Inputs["aws_account_id"])
	require.Equal(t, "cluster-ABC123DEF456EXAMPLE", resolved.Module.Inputs["cluster_resource_id"])
	require.Equal(t, "us-east-1", resolved.Module.Inputs["region"])
	require.Equal(t, map[string]any{
		"resolver": "aws_secrets_manager",
		"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!cluster",
	}, resolved.Module.Inputs[postgresAdminCredentialInput])
}

func TestAttachPhysicalDatabaseInstanceForDeprovisionSkipsNonSharedPostgresModules(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{ID: "pool-1", Endpoint: "pool.example.com:5432"}},
	}
	dispatch := DispatchPayload{
		ConnectionMetadata: map[string]any{
			physicalDatabaseInstanceRefMetadataKey: "pool-1",
		},
		DesiredSpec: DatabaseRequirement{Engine: "postgres"},
		Environment: "edit",
		Operation:   operationRetireDatabase,
		Profile:     "dev",
	}
	resolved := ResolvedLifecycleConfig{
		Module: TerraformModule{
			Source: "git::https://github.com/example/terraform.git//modules/aws-rds-managed-instance",
		},
	}

	err := attachPhysicalDatabaseInstanceForDeprovision(context.Background(), client, &dispatch, &resolved)

	require.NoError(t, err)
	require.Empty(t, dispatch.PhysicalDatabaseInstanceID)
}

func TestAttachPhysicalDatabaseInstanceForDeprovisionReturnsErrorWhenInstanceNotFound(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{instances: nil}
	dispatch := DispatchPayload{
		ConnectionMetadata: map[string]any{
			physicalDatabaseInstanceRefMetadataKey: "pool-missing",
		},
		DesiredSpec: DatabaseRequirement{Engine: "postgres"},
		Environment: "edit",
		Operation:   operationRetireDatabase,
		Profile:     "dev",
	}
	resolved := ResolvedLifecycleConfig{
		Backend: map[string]any{"region": "us-east-1"},
		Module: TerraformModule{
			Source: "git::https://github.com/example/terraform.git//modules/postgres-managed-database",
			Inputs: map[string]any{
				credentialSecretPrefixInput: "superblocks/native-db/local",
			},
		},
	}

	err := attachPhysicalDatabaseInstanceForDeprovision(context.Background(), client, &dispatch, &resolved)

	require.Error(t, err)
	require.ErrorContains(t, err, "pool-missing")
	var lifecycleErr *LifecycleError
	require.ErrorAs(t, err, &lifecycleErr)
	require.Equal(t, ErrorCodeInternal, lifecycleErr.Code)
	require.False(t, lifecycleErr.Retryable)
	// reportFailure defaults unclassified errors to terraform_failed; attach
	// misses must surface as internal so operators don't chase a destroy that
	// never started (cursor r3582030573).
	callback := FailedCallbackFromError(dispatch, err)
	require.Equal(t, "internal", callback.Error.Code)
}
