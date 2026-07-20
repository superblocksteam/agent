package databaselifecycle

import (
	"context"
	"encoding/json"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/stretchr/testify/require"
)

// physical_credential_output_tofu_test.go proves the physical root's
// credential re-export (materialize.go rootModuleHCL) by running real
// OpenTofu against a provider-free stub module
// (testdata/contract_modules/aws-rds-managed-instance-stub), instead of
// re-implementing the HCL try() fallback chain in Go. The stub module
// creates no resources and declares no provider, so init/apply need no
// network access or cloud credentials; only the local `tofu` binary. Tests
// skip (rather than fail) when it is not installed, matching the existing
// pinned contract proof's tofu-optional pattern (contract_proof_test.go).

func physicalCredentialOutputStubModuleSource(t *testing.T) string {
	t.Helper()
	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	source, err := filepath.Abs(filepath.Join(filepath.Dir(filename), "testdata", "contract_modules", "aws-rds-managed-instance-stub"))
	require.NoError(t, err)
	return source
}

func runPhysicalCredentialOutputContract(t *testing.T, name string, moduleInputs map[string]any) Result {
	t.Helper()
	if _, err := exec.LookPath("tofu"); err != nil {
		t.Skip("tofu is not installed")
	}

	workingDir := filepath.Join(tempRoot(t), name)
	job := Job{
		BindingKey:  name,
		WorkingDir:  workingDir,
		MainFile:    filepath.Join(workingDir, "main.tf"),
		BackendFile: filepath.Join(workingDir, "backend.tfbackend"),
		VarsFile:    filepath.Join(workingDir, "terraform.tfvars.json"),
	}
	dispatch := DispatchPayload{
		BindingKey:       name,
		DesiredSpec:      DatabaseRequirement{Engine: "postgres"},
		DesiredSpecHash:  "hash-" + name,
		Environment:      "deployed",
		Operation:        operationEnsurePhysicalDatabaseInstance,
		Profile:          "production",
		RequestID:        "request-" + name,
		ResourceKey:      "resource/" + name,
		TerraformBackend: map[string]any{"stateBackend": "local"},
		TerraformModule: TerraformModule{
			Source: physicalCredentialOutputStubModuleSource(t),
			Inputs: moduleInputs,
		},
	}
	require.NoError(t, MaterializeJob(job, dispatch, ProviderSSLOptions{Mode: "disable"}))

	result, err := NewRunner(NewBinaryCommandExecutor("tofu")).Run(context.Background(), job)
	require.NoError(t, err, "%v", result.Logs)
	return result
}

func TestPhysicalCredentialOutputRegistersRealOpenTofuRDSShape(t *testing.T) {
	// aws-rds-managed-instance publishes only credential_refs today; the
	// generated root must fall back to credential_refs.password for both
	// legacy master_* aliases (ENG-4889).
	result := runPhysicalCredentialOutputContract(t, "rds", map[string]any{
		"emit_credential_refs":        true,
		"emit_master_user_secret_arn": false,
	})

	instance, err := physicalDatabaseInstanceFromTerraformOutput(result, PhysicalDatabaseInstanceSelector{}, map[string]any{})
	require.NoError(t, err)
	require.Equal(t, "pool.example.com:5432", instance.Endpoint)
	require.Equal(t, map[string]any{
		"field":    "password",
		"ref":      "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool",
		"resolver": "aws_secrets_manager",
	}, instance.MasterCredentialRef)
	// Registration can succeed via master_credential_ref alone. Also assert
	// the root's master_user_secret_arn output itself falls through when the
	// child publishes that output as null (try() does not; coalesce does).
	require.Equal(t,
		"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool",
		stringTerraformOutputValue(t, result, "master_user_secret_arn"),
	)
}

func stringTerraformOutputValue(t *testing.T, result Result, key string) string {
	t.Helper()
	outputs := map[string]terraformOutputValue{}
	require.NoError(t, json.Unmarshal([]byte(result.OutputJSON), &outputs))
	value, err := stringTerraformOutput(outputs, key)
	require.NoError(t, err)
	return value
}

func TestPhysicalCredentialOutputRegistersRealOpenTofuAuroraShape(t *testing.T) {
	// aws-aurora-managed-cluster publishes both credential_refs and
	// master_user_secret_arn; the worker still prefers master_credential_ref,
	// which the root fills from credential_refs.password since no physical
	// module publishes master_credential_ref directly today.
	result := runPhysicalCredentialOutputContract(t, "aurora", map[string]any{
		"emit_credential_refs":        true,
		"emit_master_user_secret_arn": true,
	})

	instance, err := physicalDatabaseInstanceFromTerraformOutput(result, PhysicalDatabaseInstanceSelector{}, map[string]any{})
	require.NoError(t, err)
	require.Equal(t, map[string]any{
		"field":    "password",
		"ref":      "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool",
		"resolver": "aws_secrets_manager",
	}, instance.MasterCredentialRef)
}

func TestPhysicalCredentialOutputRejectsRealOpenTofuOutputWithNoRecognizedMasterSecret(t *testing.T) {
	result := runPhysicalCredentialOutputContract(t, "broken", map[string]any{
		"emit_credential_refs":        false,
		"emit_master_user_secret_arn": false,
	})

	_, err := physicalDatabaseInstanceFromTerraformOutput(result, PhysicalDatabaseInstanceSelector{}, map[string]any{})
	require.ErrorContains(t, err, "master_user_secret_arn, master_credential_ref, or credential_refs.password is required")
}
