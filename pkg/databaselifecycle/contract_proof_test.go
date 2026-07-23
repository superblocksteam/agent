package databaselifecycle

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestPinnedLifecycleConfigMaterializesValidTerraformModules(t *testing.T) {
	if os.Getenv("NATIVE_DB_RUN_TERRAFORM_CONTRACT_PROOF") != "1" {
		t.Skip("set NATIVE_DB_RUN_TERRAFORM_CONTRACT_PROOF=1 to run the pinned module contract proof")
	}

	pins := nativeDBContractProofModulePins()
	moduleRoot := nativeDBTerraformModuleRoot(t, pins)
	logicalSource := fmt.Sprintf("git::file://%s//%s?ref=%s", moduleRoot, pins.LogicalPath, pins.Ref)
	physicalSource := fmt.Sprintf("git::file://%s//%s?ref=%s", moduleRoot, pins.PhysicalPath, pins.Ref)
	// The standard config under proof is whatever the OPA Helm chart renders
	// for its standard (password-mode) fixture, not a config hand-authored
	// in this test — the chart is the single source of truth for what a
	// deployed standard config looks like. Only the module source pins are
	// overridden, to the exact commit the pinned checkout above verified,
	// so the proof runs against real Terraform instead of GitHub network.
	config := helmRenderedContractProofConfig(t, logicalSource, physicalSource)
	require.Equal(t, map[string][]string{
		"databaseLifecycle:engines":             {"postgres"},
		"databaseLifecycle:environmentProfiles": {"deployed:production", "edit:*", "preview:*"},
		"databaseLifecycle:operations":          {"ensure_database", "migrate_schema", "retire_database"},
	}, config.LifecycleConfig.CapabilityTags())

	logical, err := config.LifecycleConfig.Resolve("deployed", "production", "ensure_database", "postgres")
	require.NoError(t, err)
	require.Equal(t, 1, logical.PhysicalDatabase.CapacityMax)
	require.Equal(t, "standard", logical.PhysicalDatabase.SecurityClass)
	logical, err = ResolveWithPhysicalDatabaseInstance(logical, PhysicalDatabaseInstance{
		Endpoint: "database.internal:5432",
		MasterCredentialRef: map[string]any{
			"field":    "password",
			"ref":      "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!db-example",
			"resolver": "aws_secrets_manager",
		},
	})
	require.NoError(t, err)
	logicalJob := contractProofJob(t, "logical")
	require.NoError(t, MaterializeResolvedJob(logicalJob, DispatchPayload{
		BindingKey:      "binding-logical",
		DesiredSpec:     DatabaseRequirement{Engine: "postgres", LogicalName: "Orders"},
		DesiredSpecHash: "hash-logical",
		Environment:     "deployed",
		Operation:       "ensure_database",
		Profile:         "production",
		RequestID:       "request-logical",
		ResourceKey:     "resource/logical",
	}, logical, ProviderSSLOptions{
		Mode:               "require",
		AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!"},
	}))
	validateTofuRoot(t, logicalJob.WorkingDir)

	physical, err := config.LifecycleConfig.Resolve("deployed", "production", operationEnsurePhysicalDatabaseInstance, "postgres")
	require.NoError(t, err)
	// The physical provisioner clears the logical credential resolver before
	// materializing any configured physical operation.
	physical.CredentialResolver = nil
	physicalJob := contractProofJob(t, "physical")
	require.NoError(t, MaterializeResolvedJob(physicalJob, DispatchPayload{
		BindingKey:      "binding-physical",
		DesiredSpec:     DatabaseRequirement{Engine: "postgres"},
		DesiredSpecHash: "hash-physical",
		Environment:     "deployed",
		Operation:       operationEnsurePhysicalDatabaseInstance,
		Profile:         "production",
		RequestID:       "request-physical",
		ResourceKey:     "resource/physical",
	}, physical, ProviderSSLOptions{Mode: "require"}))
	validateTofuRoot(t, physicalJob.WorkingDir)
}

func TestPinnedIAMModuleAcceptsV1DescriptorRetirement(t *testing.T) {
	if os.Getenv("NATIVE_DB_RUN_TERRAFORM_CONTRACT_PROOF") != "1" {
		t.Skip("set NATIVE_DB_RUN_TERRAFORM_CONTRACT_PROOF=1 to run the pinned module contract proof")
	}

	pins := nativeDBContractProofModulePins()
	moduleRoot := nativeDBTerraformModuleRoot(t, pins)
	logicalSource := fmt.Sprintf("git::file://%s//%s?ref=%s", moduleRoot, pins.LogicalPath, pins.Ref)
	resolved, err := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
		Module: TerraformModule{
			Source: logicalSource,
			Inputs: map[string]any{
				"auth_mode":          iamAuthMode,
				"connector_role_arn": validIAMConnectorRoleARN,
				deploymentTokenInput: validIAMDeploymentToken,
			},
		},
		Backend: map[string]any{"stateBackend": "local"},
	}, PhysicalDatabaseInstance{
		MasterCredentialRef: map[string]any{
			"ref":      "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!cluster",
			"resolver": "aws_secrets_manager",
		},
		Metadata: map[string]any{
			"aws_account_id":      "123456789012",
			"cluster_resource_id": "db-ABCDEF0123456789-1",
			"host":                "orders.abc123.us-east-1.rds.amazonaws.com",
			"port":                5432,
			"region":              "us-east-1",
		},
	})
	require.NoError(t, err)

	job := contractProofJob(t, "iam-v1-retire")
	require.NoError(t, MaterializeResolvedJob(job, DispatchPayload{
		ApplicationID:      validIAMApplicationID,
		BindingID:          validIAMBindingID,
		BindingKey:         "app:prod:orders",
		ConnectionMetadata: validIAMMetadata(),
		Environment:        "deployed",
		Operation:          operationRetireDatabase,
		Profile:            "production",
		RequestID:          "request-retire",
		ResourceKey:        "resource/logical",
	}, resolved, ProviderSSLOptions{
		AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!"},
		Mode:               sslModeVerifyFull,
		RootCert:           "/etc/ssl/certs/aws-rds-global-bundle.pem",
	}))

	var vars map[string]any
	require.NoError(t, readJSONFile(job.VarsFile, &vars))
	require.Equal(t, validIAMV2Username, vars["runtime_role_name"])
	planTofuDestroyRoot(t, job.WorkingDir)
}

// helmRenderedContractProofConfig renders the OPA chart's standard config
// fixture (helm/agent/tests/fixtures/database-lifecycle-config-values.yaml —
// the same file the helmtests package's TestOPAChartRendersLifecycleWorkerConfigFromNamedGroups
// treats as canonical) with the module source pins overridden to the local,
// commit-verified checkout, and parses SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG
// out of the rendered Deployment the same way the worker does at startup
// (ConfigFromEnv). This keeps a single source of truth for what the standard
// config looks like — this test proves the pinned modules materialize and
// validate against exactly that config, not a config hand-authored here.
func helmRenderedContractProofConfig(t *testing.T, logicalSource string, physicalSource string) Config {
	t.Helper()

	// This helper is only reached when NATIVE_DB_RUN_TERRAFORM_CONTRACT_PROOF=1
	// (CI's run-database-lifecycle-contract-proof.sh). Skipping here would make
	// that job report green without validating the pinned modules against the
	// Helm-rendered standard config.
	_, err := exec.LookPath("helm")
	require.NoError(t, err, "helm must be installed to render the lifecycle contract-proof config")
	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	chartDir := filepath.Join(filepath.Dir(filename), "..", "..", "helm", "agent")
	baseFixture := filepath.Join(chartDir, "tests", "fixtures", "database-lifecycle-config-values.yaml")

	command := exec.Command("helm", "template", "lifecycle-contract-proof", chartDir,
		"-f", baseFixture,
		"--set-string", "databaseLifecycle.modules.logical.source="+logicalSource,
		"--set-string", "databaseLifecycle.modules.physical.source="+physicalSource,
	)
	rendered, err := command.CombinedOutput()
	require.NoError(t, err, "%s\n%s", command.String(), rendered)

	env := contractProofDeploymentEnv(t, rendered)
	config, err := ConfigFromEnv(func(key string) string { return env[key] })
	require.NoError(t, err)
	return config
}

func contractProofDeploymentEnv(t *testing.T, rendered []byte) map[string]string {
	t.Helper()

	decoder := yaml.NewDecoder(bytes.NewReader(rendered))
	for {
		var doc map[string]any
		if err := decoder.Decode(&doc); err != nil {
			break
		}
		if doc["kind"] != "Deployment" {
			continue
		}
		spec, _ := doc["spec"].(map[string]any)
		template, _ := spec["template"].(map[string]any)
		podSpec, _ := template["spec"].(map[string]any)
		containers, _ := podSpec["containers"].([]any)
		require.NotEmpty(t, containers)
		container, _ := containers[0].(map[string]any)
		items, _ := container["env"].([]any)

		env := make(map[string]string, len(items))
		for _, item := range items {
			entry, _ := item.(map[string]any)
			name, _ := entry["name"].(string)
			value, _ := entry["value"].(string)
			env[name] = value
		}
		return env
	}

	t.Fatal("Deployment not found in rendered chart")
	return nil
}

func contractProofJob(t *testing.T, name string) Job {
	t.Helper()
	workingDir := filepath.Join(tempRoot(t), name)
	return Job{
		BindingKey:  name,
		WorkingDir:  workingDir,
		MainFile:    filepath.Join(workingDir, "main.tf"),
		BackendFile: filepath.Join(workingDir, "backend.tfbackend"),
		VarsFile:    filepath.Join(workingDir, "terraform.tfvars.json"),
	}
}

func validateTofuRoot(t *testing.T, workingDir string) {
	t.Helper()
	if _, err := exec.LookPath("tofu"); err != nil {
		t.Skip("tofu is not installed")
	}
	for _, args := range [][]string{
		{"init", "-backend=false", "-input=false", "-no-color"},
		{"validate", "-no-color"},
	} {
		command := exec.Command("tofu", args...)
		command.Dir = workingDir
		output, err := command.CombinedOutput()
		require.NoError(t, err, "%s\n%s", command.String(), output)
	}
}

func planTofuDestroyRoot(t *testing.T, workingDir string) {
	t.Helper()
	if _, err := exec.LookPath("tofu"); err != nil {
		t.Skip("tofu is not installed")
	}
	for _, args := range [][]string{
		{"init", "-input=false", "-no-color"},
		{"plan", "-destroy", "-input=false", "-lock=false", "-no-color", "-refresh=false"},
	} {
		command := exec.Command("tofu", args...)
		command.Dir = workingDir
		output, err := command.CombinedOutput()
		require.NoError(t, err, "%s\n%s", command.String(), output)
	}
}
