package databaselifecycle

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
)

// worker_iam_ready_tofu_test.go proves the standard aws_iam_role config's
// end-to-end contract — physical reservation from an empty pool, a logical
// root that reaches a passwordless "ready" callback, and a fresh IAM
// migration DSN — by driving real production code
// (PhysicalDatabaseInstanceLifecycle, MaterializeResolvedJob, Runner,
// ReadyCallbackFromTerraformOutput, NewDSNBuilder) against real OpenTofu
// output. Nothing here re-implements those functions; the stub modules only
// supply realistic outputs for OpenTofu to evaluate. The AWS signer is
// mocked (matching iam_auth_test.go's existing pattern) so no STS call, RDS
// IAM login, or live database is required — see contract_proof_test.go for
// the (network-only, still no live AWS) pinned-module validation, and
// physical_credential_output_tofu_test.go for the physical credential
// contract in isolation.
//
// tofu init still needs network to fetch the hashicorp/aws and
// cyrilgdn/postgresql providers materialize.go declares for every
// shared-mode root; that is the same cost the pre-existing pinned contract
// proof already pays, not a new one.

func logicalIAMStubModuleSource(t *testing.T) string {
	t.Helper()
	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	source, err := filepath.Abs(filepath.Join(filepath.Dir(filename), "testdata", "contract_modules", "postgres-managed-database-stub"))
	require.NoError(t, err)
	return source
}

func TestWorkerIAMReadyContractFromRealOpenTofu(t *testing.T) {
	// Unlike physical_credential_output_tofu_test.go's provider-free
	// fixtures, this shared-mode IAM root unconditionally declares
	// hashicorp/aws and cyrilgdn/postgresql in required_providers
	// (materialize.go rootModuleHCL), even though IAM mode never configures
	// or uses either. `tofu init` needs network to fetch them (~20s
	// uncached), so this is gated the same as the pre-existing pinned
	// contract proof rather than running on every `go test`.
	if os.Getenv("NATIVE_DB_RUN_TERRAFORM_CONTRACT_PROOF") != "1" {
		t.Skip("set NATIVE_DB_RUN_TERRAFORM_CONTRACT_PROOF=1 to run the IAM worker-ready contract proof")
	}
	if _, err := exec.LookPath("tofu"); err != nil {
		t.Skip("tofu is not installed")
	}

	const (
		region           = "us-east-1"
		connectorRoleARN = "arn:aws:iam::123456789012:role/superblocks-native-db-connector"
		sslRootCert      = "/etc/rds/global-bundle.pem"
	)
	rootDir := tempRoot(t)

	// --- Physical: an empty pool must provision, register, and reserve a
	// new instance through real OpenTofu before any logical work happens.
	physicalConfig := LifecycleConfig{Entries: []LifecycleConfigEntry{{
		Environment: "deployed",
		Profiles:    []string{"production"},
		Engines:     []string{"postgres"},
		Operations: map[string]LifecycleOperation{
			operationEnsurePhysicalDatabaseInstance: terraformOperationWithBackend(
				map[string]any{"stateBackend": "local"},
				map[string]TerraformModule{
					"postgres": {
						Source: physicalCredentialOutputStubModuleSource(t),
						Inputs: map[string]any{
							"host":                        "pool." + region + ".rds.amazonaws.com",
							"region":                      region,
							"emit_credential_refs":        true,
							"emit_master_user_secret_arn": false,
						},
					},
				},
			),
		},
	}}}
	provisioner := newTerraformPhysicalDatabaseInstanceProvisioner(
		physicalConfig,
		[]string{physicalCredentialOutputStubModuleSource(t)},
		rootDir,
		NewRunner(NewBinaryCommandExecutor("tofu")),
		ProviderSSLOptions{Mode: "disable"},
	)
	physicalClient := &recordingPhysicalDatabaseInstanceLifecycleClient{}
	physicalLifecycle := NewPhysicalDatabaseInstanceLifecycle(physicalClient, provisioner)

	instance, err := physicalLifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      region,
		Environment: "deployed",
		Profile:     "production",
		Engine:      "postgres",
	})
	require.NoError(t, err)
	require.Len(t, physicalClient.registered, 1, "empty pool must provision and register a new instance")
	require.Equal(t, []string{instance.ID}, physicalClient.reserved)

	// --- Logical: materialize the IAM root against the reserved instance and
	// apply it through real OpenTofu.
	dispatch := DispatchPayload{
		ApplicationID:   "application-1",
		BindingID:       "binding-1",
		BindingKey:      "app:prod:orders",
		DesiredSpec:     DatabaseRequirement{Engine: "postgres"},
		DesiredSpecHash: "hash-logical",
		Environment:     "deployed",
		Operation:       "ensure_database",
		Profile:         "production",
		RequestID:       "request-logical",
		ResourceKey:     "resource/logical",
	}
	resolved, err := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
		Module: TerraformModule{
			Source: logicalIAMStubModuleSource(t),
			Inputs: map[string]any{
				"auth_mode":          iamAuthMode,
				"connector_role_arn": connectorRoleARN,
				"deployment_token":   "012345abcdef",
			},
		},
		Backend: map[string]any{"stateBackend": "local"},
	}, instance)
	require.NoError(t, err)

	job := Job{
		BindingKey:  "logical",
		WorkingDir:  filepath.Join(rootDir, "logical"),
		MainFile:    filepath.Join(rootDir, "logical", "main.tf"),
		BackendFile: filepath.Join(rootDir, "logical", "backend.tfbackend"),
		VarsFile:    filepath.Join(rootDir, "logical", "terraform.tfvars.json"),
		Runtime:     &JobRuntime{},
	}
	sslOpts := ProviderSSLOptions{
		Mode:     sslModeVerifyFull,
		RootCert: sslRootCert,
		AllowedRefPrefixes: []string{
			"arn:aws:secretsmanager:" + region + ":123456789012:secret:rds!",
		},
	}
	require.NoError(t, MaterializeResolvedJob(job, dispatch, resolved, sslOpts))

	logicalRunner := NewRunnerWithPolicyAndMasterCredentials(
		NewBinaryCommandExecutor("tofu"),
		nil,
		MasterCredentialResolverFunc(func(context.Context, refresolver.Ref) (MasterCredentials, error) {
			return MasterCredentials{Username: "admin", Password: "unused"}, nil
		}),
	)
	result, err := logicalRunner.Run(context.Background(), job)
	require.NoError(t, err, "%v", result.Logs)

	callback, err := ReadyCallbackFromTerraformOutput(dispatch, result)
	require.NoError(t, err)
	require.Equal(t, "ready", callback.LifecycleState)
	require.Equal(t, iamAuthMode, callback.ConnectionMetadata["auth_mode"])
	require.Equal(t, "application-1", callback.ConnectionMetadata["application_id"])
	require.Equal(t, "binding-1", callback.ConnectionMetadata["binding_id"])
	// No runtime password ever gets materialized into the callback: IAM mode
	// must be passwordless end to end.
	require.Empty(t, callback.RuntimeCredentialRefs)
	require.Empty(t, callback.MigrationCredentialRefs)

	// --- Migration DSN: mint a fresh token from the real callback output
	// through a mocked AWS signer. No STS call, no RDS IAM login, no
	// persisted password anywhere in this path.
	var signedUsername string
	build := NewDSNBuilder(DSNOptions{
		ExpectedConnectorRoleARN: connectorRoleARN,
		SSLMode:                  sslModeVerifyFull,
		SSLRootCert:              sslRootCert,
		AWSConfigLoader: func(_ context.Context, region string) (aws.Config, error) {
			return aws.Config{Region: region}, nil
		},
		AssumeRoleProviderFactory: func(aws.Config, string, string, string) (aws.CredentialsProvider, error) {
			return staticCredentialProvider{accessKeyID: "assumed"}, nil
		},
		RDSAuthTokenGenerator: func(_ context.Context, _ string, _ string, username string, _ aws.CredentialsProvider) (string, error) {
			signedUsername = username
			return "signed-iam-token", nil
		},
	})
	dsn, err := build(context.Background(), callback)
	require.NoError(t, err)
	require.Contains(t, dsn, "signed-iam-token")
	require.Equal(t, callback.ConnectionMetadata["username"], signedUsername)
}
