package databaselifecycle

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestV020LifecycleConfigMaterializesValidTerraformModules(t *testing.T) {
	moduleRoot := os.Getenv("NATIVE_DB_TERRAFORM_MODULE_ROOT")
	if moduleRoot == "" {
		t.Skip("set NATIVE_DB_TERRAFORM_MODULE_ROOT to run the v0.2.0 module contract proof")
	}
	moduleRoot, err := filepath.Abs(moduleRoot)
	require.NoError(t, err)

	logicalSource := fmt.Sprintf("git::file://%s//modules/postgres-managed-database?ref=v0.2.0", moduleRoot)
	physicalSource := fmt.Sprintf("git::file://%s//modules/aws-rds-managed-instance?ref=v0.2.0", moduleRoot)
	rawConfig := lifecycleContractProofConfig(logicalSource, physicalSource)
	config, err := ConfigFromEnv(func(key string) string {
		if key == envConfig {
			return rawConfig
		}
		return ""
	})
	require.NoError(t, err)
	require.Equal(t, map[string][]string{
		"databaseLifecycle:engines":             {"postgres"},
		"databaseLifecycle:environmentProfiles": {"deployed:production"},
		"databaseLifecycle:operations":          {"ensure_database", "migrate_schema"},
	}, config.LifecycleConfig.CapabilityTags())

	logical, err := config.LifecycleConfig.Resolve("deployed", "production", "ensure_database", "postgres")
	require.NoError(t, err)
	require.Equal(t, 100, logical.PhysicalDatabase.CapacityMax)
	require.Equal(t, "standard", logical.PhysicalDatabase.SecurityClass)
	logical = ResolveWithPhysicalDatabaseInstance(logical, PhysicalDatabaseInstance{
		Endpoint: "database.internal:5432",
		MasterCredentialRef: map[string]any{
			"field":    "password",
			"ref":      "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!db-example",
			"resolver": "aws_secrets_manager",
		},
	})
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

func lifecycleContractProofConfig(logicalSource string, physicalSource string) string {
	return fmt.Sprintf(`{
	  "entries": [{
	    "environment": "deployed",
	    "profiles": ["production"],
	    "engines": ["postgres"],
	    "operations": {
	      "ensure_database": {
	        "backend": "terraform",
	        "physicalDatabase": {
	          "mode": "shared_pool",
	          "provisionOperation": "ensure_physical_database_instance",
	          "onExhausted": "provision",
	          "capacityMax": 100,
	          "securityClass": "standard"
	        },
	        "terraform": {
	          "backend": {
	            "stateBackend": "s3",
	            "bucket": "native-db-contract-proof",
	            "key": "logical/{{resource_key}}.tfstate",
	            "region": "us-east-1",
	            "use_lockfile": true
	          },
	          "credentialResolver": {"runtime": "aws_secrets_manager", "region": "us-east-1"},
	          "moduleSelectors": {
	            "postgres": {
	              "source": %q,
	              "inputs": {"credential_secret_prefix": "superblocks/native-db/contract-proof"}
	            }
	          }
	        }
	      },
	      "ensure_physical_database_instance": {
	        "backend": "terraform",
	        "terraform": {
	          "backend": {
	            "stateBackend": "s3",
	            "bucket": "native-db-contract-proof",
	            "key": "physical/{{resource_key}}.tfstate",
	            "region": "us-east-1",
	            "use_lockfile": true
	          },
	          "credentialResolver": {"runtime": "aws_secrets_manager", "region": "us-east-1"},
	          "moduleSelectors": {
	            "postgres": {
	              "source": %q,
	              "inputs": {
	                "allocated_storage": 20,
	                "instance_class": "db.t4g.micro",
	                "multi_az": true,
	                "subnet_ids": ["subnet-a", "subnet-b"],
	                "vpc_id": "vpc-example"
	              }
	            }
	          }
	        }
	      },
	      "migrate_schema": {"backend": "native_runner"}
	    }
	  }]
	}`, logicalSource, physicalSource)
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
