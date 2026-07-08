package databaselifecycle

import (
	"context"
	"errors"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

type recordingPhysicalDatabaseInstanceTerraformRunner struct {
	destroyed []Job
	runResult Result
}

func (r *recordingPhysicalDatabaseInstanceTerraformRunner) Run(ctx context.Context, job Job) (Result, error) {
	return r.runResult, nil
}

func (r *recordingPhysicalDatabaseInstanceTerraformRunner) Destroy(ctx context.Context, job Job) (Result, error) {
	r.destroyed = append(r.destroyed, job)
	return Result{}, nil
}

func TestTerraformPhysicalDatabaseInstanceProvisionerUsesConfiguredProvisionOperation(t *testing.T) {
	var materializedVars map[string]any
	runner := &recordingPhysicalDatabaseInstanceTerraformRunner{
		runResult: Result{OutputJSON: `{
			"connection_metadata":{"value":{"host":"new-pool.example.com","port":5432}},
			"credential_refs":{"value":{"password":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!new-pool","field":"password"}}}
		}`},
	}
	rootDir := tempRoot(t)
	const provisionOperation = "provision_physical_database"
	provisioner := newTerraformPhysicalDatabaseInstanceProvisioner(
		LifecycleConfig{Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				provisionOperation: terraformOperationWithBackend(
					map[string]any{"stateBackend": "s3", "bucket": "physical-state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"},
					map[string]TerraformModule{
						"postgres": {
							Source: "github.com/superblocksteam/terraform//modules/native-database/aws-rds-managed-instance",
							Inputs: map[string]any{"capacity_max": 4},
						},
					},
				),
			},
		}}},
		[]string{"github.com/superblocksteam/terraform//modules/native-database/aws-rds-managed-instance"},
		rootDir,
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			require.NoError(t, readJSONFile(filepath.Join(job.WorkingDir, "terraform.tfvars.json"), &materializedVars))
			return runner.runResult, nil
		}),
		ProviderSSLOptions{Mode: "disable"},
	)
	provisioner.newProvisionID = func() (string, error) {
		return "provision-1", nil
	}

	instance, err := provisioner.ProvisionPhysicalDatabaseInstance(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:             "us-east-1",
		Environment:        "deployed",
		Profile:            "production",
		Engine:             "postgres",
		ProvisionOperation: provisionOperation,
	})

	require.NoError(t, err)
	require.Equal(t, "new-pool.example.com:5432", instance.Endpoint)
	require.Equal(t, provisionOperation, materializedVars["operation"])
}

func TestTerraformPhysicalDatabaseInstanceProvisionerDeprovisionsWhenOutputParsingFails(t *testing.T) {
	runner := &recordingPhysicalDatabaseInstanceTerraformRunner{
		runResult: Result{OutputJSON: `{}`},
	}
	rootDir := tempRoot(t)
	provisioner := newTerraformPhysicalDatabaseInstanceProvisioner(
		LifecycleConfig{Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				operationEnsurePhysicalDatabaseInstance: terraformOperationWithBackend(
					map[string]any{"stateBackend": "s3", "bucket": "physical-state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"},
					map[string]TerraformModule{
						"postgres": {
							Source: testAWSRDSManagedInstanceModuleSource,
							Inputs: map[string]any{"capacity_max": 4},
						},
					},
				),
			},
		}}},
		[]string{testAWSRDSManagedInstanceModuleSource},
		rootDir,
		runner,
		ProviderSSLOptions{Mode: "disable"},
	)
	provisioner.newProvisionID = func() (string, error) {
		return "provision-1", nil
	}

	_, err := provisioner.ProvisionPhysicalDatabaseInstance(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Profile:     "production",
		Engine:      "postgres",
	})

	require.ErrorContains(t, err, "connection_metadata.host is required")
	require.Len(t, runner.destroyed, 1)
	require.Contains(t, runner.destroyed[0].BindingKey, "physical-database-instance:deployed:production:us-east-1:postgres:provision-1")
}

func TestTerraformPhysicalDatabaseInstanceProvisionerDeprovisionsWhenRegistrationFails(t *testing.T) {
	runner := &recordingPhysicalDatabaseInstanceTerraformRunner{
		runResult: Result{OutputJSON: `{
			"connection_metadata":{"value":{"host":"new-pool.example.com","port":5432}},
			"credential_refs":{"value":{"password":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!new-pool","field":"password"}}}
		}`},
	}
	rootDir := tempRoot(t)
	provisioner := newTerraformPhysicalDatabaseInstanceProvisioner(
		LifecycleConfig{Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				operationEnsurePhysicalDatabaseInstance: terraformOperationWithBackend(
					map[string]any{"stateBackend": "s3", "bucket": "physical-state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"},
					map[string]TerraformModule{
						"postgres": {
							Source: testAWSRDSManagedInstanceModuleSource,
							Inputs: map[string]any{"capacity_max": 4},
						},
					},
				),
			},
		}}},
		[]string{testAWSRDSManagedInstanceModuleSource},
		rootDir,
		runner,
		ProviderSSLOptions{Mode: "disable"},
	)
	provisioner.newProvisionID = func() (string, error) {
		return "provision-2", nil
	}
	registerErr := errors.New("register physical database instance")
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(
		&recordingPhysicalDatabaseInstanceLifecycleClient{registerErr: registerErr},
		provisioner,
	)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Profile:     "production",
		Engine:      "postgres",
	})

	require.ErrorIs(t, err, registerErr)
	require.Len(t, runner.destroyed, 1)
	require.Contains(t, runner.destroyed[0].BindingKey, "physical-database-instance:deployed:production:us-east-1:postgres:provision-2")
}

func TestTerraformPhysicalDatabaseInstanceProvisionerReusesContinuationResourceKey(t *testing.T) {
	runner := &recordingPhysicalDatabaseInstanceTerraformRunner{
		runResult: Result{OutputJSON: `{
			"connection_metadata":{"value":{"host":"new-pool.example.com","port":5432}},
			"credential_refs":{"value":{"password":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!new-pool","field":"password"}}}
		}`},
	}
	rootDir := tempRoot(t)
	provisioner := newTerraformPhysicalDatabaseInstanceProvisioner(
		LifecycleConfig{Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				operationEnsurePhysicalDatabaseInstance: terraformOperationWithBackend(
					map[string]any{"stateBackend": "s3", "bucket": "physical-state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"},
					map[string]TerraformModule{
						"postgres": {
							Source: "github.com/superblocksteam/terraform//modules/native-database/aws-rds-managed-instance",
							Inputs: map[string]any{"capacity_max": 4},
						},
					},
				),
			},
		}}},
		[]string{"github.com/superblocksteam/terraform//modules/native-database/aws-rds-managed-instance"},
		rootDir,
		runner,
		ProviderSSLOptions{Mode: "disable"},
	)
	provisioner.newProvisionID = func() (string, error) {
		t.Fatal("continuation resource key must avoid generating a new physical provision id")
		return "", nil
	}

	instance, err := provisioner.ProvisionPhysicalDatabaseInstance(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:                       "us-east-1",
		Environment:                  "deployed",
		Profile:                      "production",
		Engine:                       "postgres",
		PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
	})

	require.NoError(t, err)
	require.Equal(t, "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision", instance.ProvisionResourceKey)
}

func TestTerraformPhysicalDatabaseInstanceProvisionerDerivesStableResourceKeyFromParentDispatch(t *testing.T) {
	runner := &recordingPhysicalDatabaseInstanceTerraformRunner{
		runResult: Result{OutputJSON: `{
			"connection_metadata":{"value":{"host":"new-pool.example.com","port":5432}},
			"credential_refs":{"value":{"password":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!new-pool","field":"password"}}}
		}`},
	}
	rootDir := tempRoot(t)
	provisioner := newTerraformPhysicalDatabaseInstanceProvisioner(
		LifecycleConfig{Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				operationEnsurePhysicalDatabaseInstance: terraformOperationWithBackend(
					map[string]any{"stateBackend": "s3", "bucket": "physical-state", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1"},
					map[string]TerraformModule{
						"postgres": {
							Source: "github.com/superblocksteam/terraform//modules/native-database/aws-rds-managed-instance",
							Inputs: map[string]any{"capacity_max": 4},
						},
					},
				),
			},
		}}},
		[]string{"github.com/superblocksteam/terraform//modules/native-database/aws-rds-managed-instance"},
		rootDir,
		runner,
		ProviderSSLOptions{Mode: "disable"},
	)
	provisioner.newProvisionID = func() (string, error) {
		t.Fatal("parent resource key must make physical provision identity stable without random ids")
		return "", nil
	}

	first, err := provisioner.ProvisionPhysicalDatabaseInstance(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:            "us-east-1",
		Environment:       "deployed",
		Profile:           "production",
		Engine:            "postgres",
		ParentResourceKey: "org/app/orders/deployed/production/default",
	})
	require.NoError(t, err)
	second, err := provisioner.ProvisionPhysicalDatabaseInstance(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:            "us-east-1",
		Environment:       "deployed",
		Profile:           "production",
		Engine:            "postgres",
		ParentResourceKey: "org/app/orders/deployed/production/default",
	})
	require.NoError(t, err)

	require.Equal(t, first.ProvisionResourceKey, second.ProvisionResourceKey)
	require.Contains(t, first.ProvisionResourceKey, "physical-database-instance:deployed:production:us-east-1:postgres:")
}

func TestPhysicalDatabaseInstanceFromTerraformOutputReadsPhysicalModuleOutputs(t *testing.T) {
	instance, err := physicalDatabaseInstanceFromTerraformOutput(Result{OutputJSON: `{
		"connection_metadata":{"value":{"host":"new-pool.example.com","port":5432}},
		"credential_refs":{"value":{"password":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!new-pool","field":"password"}}}
	}`}, map[string]any{
		"capacity_max":   8,
		"security_class": "standard",
	})

	require.NoError(t, err)
	require.Equal(t, "new-pool.example.com:5432", instance.Endpoint)
	require.Equal(t, 8, instance.CapacityMax)
	require.Equal(t, "active", instance.Status)
	require.Equal(t, "standard", instance.SecurityClass)
	require.Equal(t, map[string]any{
		"field":    "password",
		"ref":      "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!new-pool",
		"resolver": "aws_secrets_manager",
	}, instance.MasterCredentialRef)
}

func TestPhysicalDatabaseInstanceFromTerraformOutputRejectsMissingCapacity(t *testing.T) {
	_, err := physicalDatabaseInstanceFromTerraformOutput(Result{OutputJSON: `{
		"connection_metadata":{"value":{"host":"new-pool.example.com","port":5432}},
		"credential_refs":{"value":{"password":{"resolver":"aws_secrets_manager","ref":"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!new-pool","field":"password"}}}
	}`}, nil)

	require.ErrorContains(t, err, "capacity_max is required")
}

func TestSplitPhysicalDatabaseInstanceEndpointDefaultsPortWhenAbsent(t *testing.T) {
	resolved := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
		Module: TerraformModule{Inputs: map[string]any{}},
	}, PhysicalDatabaseInstance{
		Endpoint: "pool-rds.example.com",
	})

	require.Equal(t, "pool-rds.example.com", resolved.Module.Inputs["host"])
	require.Equal(t, 5432, resolved.Module.Inputs["port"])
}
