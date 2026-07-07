package databaselifecycle

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

// testSSLOpts is the SSL posture passed by tests that don't care about
// it — matches the pre-fix hardcoded behavior of sslmode=require, so
// non-SSL-focused tests keep the same generated HCL. SSL-specific
// behavior is exercised by TestMaterializeJobEmitsConfiguredSSLModeForSharedModeModule.
var testSSLOpts = ProviderSSLOptions{Mode: "require"}
var testSharedModeSSLOpts = ProviderSSLOptions{
	Mode:               "require",
	AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!"},
}

const (
	testNativeDBModuleRef                   = "v0.1.0"
	testAWSRDSManagedInstanceModuleSource   = "git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/aws-rds-managed-instance?ref=" + testNativeDBModuleRef
	testPostgresManagedDatabaseModuleSource = "git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/postgres-managed-database?ref=" + testNativeDBModuleRef
)

func tempRoot(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	real, err := filepath.EvalSymlinks(root)
	require.NoError(t, err)
	return real
}

func TestMaterializeJobWritesBackendAndVarsFiles(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:prod:orders",
		DesiredSpecHash:  "hash-1",
		Environment:      "deployed",
		Operation:        "ensure_database",
		Profile:          "production",
		RequestID:        "request-1",
		ResourceKey:      "database/orders",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source:  "app.terraform.io/superblocks/rds-postgres/aws",
			Version: "1.2.3",
			Inputs: map[string]any{
				"engine_version": "16.3",
				"storage_gb":     float64(20),
			},
		},
	}, testSSLOpts)

	require.NoError(t, err)
	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	// S3 backend implies the root must declare `terraform { backend "s3" {} }`
	// so `-backend-config=<file>` is actually consumed; otherwise tofu falls
	// back to local state.
	require.Contains(t, string(mainFile), `terraform {
  backend "s3" {}
}`)
	// S3 backend implies AWS; root must configure the provider so tofu can
	// authenticate. Region flows through from the dispatch's backend config.
	require.Contains(t, string(mainFile), `provider "aws" {
  region = "us-west-2"
}`)
	require.Contains(t, string(mainFile), `variable "engine_version" {
  type = any
}`)
	require.Contains(t, string(mainFile), `variable "request_id" {
  type = any
}`)
	require.Contains(t, string(mainFile), `module "database" {
  source  = "app.terraform.io/superblocks/rds-postgres/aws"
  version = "1.2.3"
  binding_key = var.binding_key
  desired_spec_hash = var.desired_spec_hash
  engine_version = var.engine_version
  environment_class = var.environment_class
  environment_name = var.environment_name
  operation = var.operation
  profile_id = var.profile_id
  request_id = var.request_id
  resource_key = var.resource_key
  storage_gb = var.storage_gb
}
`)
	require.NotContains(t, string(mainFile), `  environment = var.environment`)
	require.NotContains(t, string(mainFile), `  profile = var.profile`)
	// Root-level outputs that re-export the module's connection_metadata and
	// runtime_credential_refs. Without these, `tofu output -json` returns {} and
	// the binding's connection info stays empty after a successful apply.
	require.Contains(t, string(mainFile), `output "connection_metadata" {
  value = module.database.connection_metadata
}`)
	require.Contains(t, string(mainFile), `output "runtime_credential_refs" {
  value     = try(module.database.runtime_credential_refs, module.database.credential_refs)
  sensitive = true
}`)

	backend, err := os.ReadFile(job.BackendFile)
	require.NoError(t, err)
	// `tofu init -backend-config=<file>` parses HCL key=value pairs,
	// not JSON. `type` is stripped — it's consumed by the HCL backend
	// declaration, not a valid s3-backend argument.
	require.Equal(t, "bucket = \"state-bucket\"\nkey = \"deployed/production/database-orders-13abfc789342.tfstate\"\nregion = \"us-west-2\"\n", string(backend))

	var vars map[string]any
	require.NoError(t, readJSONFile(job.VarsFile, &vars))
	require.Equal(t, "app:prod:orders", vars["binding_key"])
	require.Equal(t, "hash-1", vars["desired_spec_hash"])
	require.Equal(t, "prod", vars["environment_class"])
	require.Equal(t, "production", vars["environment_name"])
	require.Equal(t, "ensure_database", vars["operation"])
	require.Nil(t, vars["profile_id"])
	require.Equal(t, "request-1", vars["request_id"])
	require.Equal(t, "database/orders", vars["resource_key"])
	require.Equal(t, "16.3", vars["engine_version"])
	require.Equal(t, float64(20), vars["storage_gb"])
}

func TestMaterializeJobUsesResolvedLifecycleConfig(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}
	resolved := ResolvedLifecycleConfig{
		Module: TerraformModule{
			Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
			Version: "1.2.3",
			Inputs: map[string]any{
				"storage_gb": float64(20),
			},
		},
		Backend: map[string]any{
			"stateBackend": "s3",
			"bucket":       "state-bucket",
			"key":          "{{environment}}/{{profile}}/{{resource_key}}.tfstate",
			"region":       "us-west-2",
		},
		CredentialResolver: map[string]any{"runtime": "aws_secrets_manager"},
	}

	err := MaterializeResolvedJob(job, DispatchPayload{
		BindingKey:      "app:prod:orders",
		DesiredSpecHash: "hash-1",
		Environment:     "deployed",
		Operation:       "ensure_database",
		Profile:         "production",
		RequestID:       "request-1",
		ResourceKey:     "database/orders",
	}, resolved, testSSLOpts)

	require.NoError(t, err)
	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	require.Contains(t, string(mainFile), `module "database" {
  source  = "app.terraform.io/superblocks/postgres-managed-database/aws"
  version = "1.2.3"`)

	var vars map[string]any
	require.NoError(t, readJSONFile(job.VarsFile, &vars))
	require.Equal(t, "prod", vars["environment_class"])
	require.Equal(t, "production", vars["environment_name"])
	require.Equal(t, "ensure_database", vars["operation"])
	require.Nil(t, vars["profile_id"])
	require.Equal(t, "database/orders", vars["resource_key"])
	require.Equal(t, float64(20), vars["storage_gb"])
	require.Equal(t, map[string]any{"runtime": "aws_secrets_manager"}, vars["credential_resolver"])

	backend, err := os.ReadFile(job.BackendFile)
	require.NoError(t, err)
	require.Equal(t, "bucket = \"state-bucket\"\nkey = \"deployed/production/database-orders-13abfc789342.tfstate\"\nregion = \"us-west-2\"\n", string(backend))
}

func TestMaterializeResolvedJobRejectsCredentialResolverInputConflict(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}
	resolved := ResolvedLifecycleConfig{
		Module: TerraformModule{
			Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
			Version: "1.2.3",
			Inputs: map[string]any{
				"credential_resolver": "override",
			},
		},
		Backend: map[string]any{
			"stateBackend": "s3",
			"bucket":       "state-bucket",
			"key":          "{{environment}}/{{profile}}/{{resource_key}}.tfstate",
			"region":       "us-west-2",
		},
		CredentialResolver: map[string]any{"runtime": "aws_secrets_manager"},
	}

	err := MaterializeResolvedJob(job, DispatchPayload{
		BindingKey:      "app:prod:orders",
		DesiredSpecHash: "hash-1",
		Environment:     "deployed",
		Operation:       "ensure_database",
		Profile:         "production",
		RequestID:       "request-1",
		ResourceKey:     "database/orders",
	}, resolved, testSSLOpts)

	require.ErrorContains(t, err, `input "credential_resolver" conflicts with local lifecycle credential resolver`)
}

func TestMaterializeResolvedJobDerivesSharedPhysicalDatabaseInputsFromReservedInstance(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:orders",
		WorkingDir:  filepath.Join(root, "app-dev-orders"),
		MainFile:    filepath.Join(root, "app-dev-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-orders", "terraform.tfvars.json"),
	}
	resolved := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
		Module: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"credential_secret_prefix": "superblocks/native-db/local",
			},
		},
		Backend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "devdb.tfstate", "region": "us-west-2"},
	}, PhysicalDatabaseInstance{
		Endpoint: "pool-rds.example.us-east-1.rds.amazonaws.com:6432",
		MasterCredentialRef: map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!db-bea6cf0e-L50noE",
		},
	})

	err := MaterializeResolvedJob(job, DispatchPayload{
		BindingKey:      "org:app:edit:dev~dev:orders~Orders%20DB:postgres",
		DesiredSpec:     DatabaseRequirement{LogicalName: "Orders DB", Engine: "postgres"},
		DesiredSpecHash: "hash-1",
		Environment:     "edit",
		Operation:       "ensure_database",
		Profile:         "dev",
		RequestID:       "request-1",
		ResourceKey:     "org/app/orders~Orders%20DB:postgres/edit/dev~dev/default",
	}, resolved, testSharedModeSSLOpts)

	require.NoError(t, err)

	var vars map[string]any
	require.NoError(t, readJSONFile(job.VarsFile, &vars))
	require.Equal(t, "orders_db", vars["logical_name"])
	require.Regexp(t, `^sb_[a-f0-9]{16}$`, vars["database_name"])
	require.Regexp(t, `^sb_[a-f0-9]{16}_run$`, vars["runtime_role_name"])
	require.Regexp(t, `^sb_[a-f0-9]{16}_mig$`, vars["migration_role_name"])
	require.Equal(t, "pool-rds.example.us-east-1.rds.amazonaws.com", vars["host"])
	require.Equal(t, float64(6432), vars["port"])
	require.Equal(t, map[string]any{
		"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!db-bea6cf0e-L50noE",
		"resolver": "aws_secrets_manager",
	}, vars["postgres_admin_credential_ref"])

	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	main := string(mainFile)
	require.Contains(t, main, `__pool_master_secret_arn    = var.postgres_admin_credential_ref.ref`)
	require.Contains(t, main, `resource "random_password" "runtime"`)
	require.Contains(t, main, `resource "aws_secretsmanager_secret" "runtime"`)
	require.Contains(t, main, `provider = aws.pool_secrets
  name     = "${local.__credential_secret_prefix}/${var.database_name}/runtime"`)
	require.Contains(t, main, `runtime_credential_ref = {
    resolver = "aws_secrets_manager"
    ref      = aws_secretsmanager_secret.runtime.arn
    field    = "password"
  }`)
	require.Contains(t, main, `runtime_password_wo = random_password.runtime.result`)
	require.Contains(t, main, `postgres_admin_username = jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)["username"]`)
	require.Contains(t, main, `postgres_admin_password = sensitive(jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)["password"])`)
	require.Contains(t, main, `provider "postgresql" {
  host      = var.host
  port      = var.port`)
	require.NotContains(t, main, `postgres_admin_credential_ref = var.postgres_admin_credential_ref`)
	require.NotContains(t, main, `credential_secret_prefix = var.credential_secret_prefix`)
}

func TestMaterializeResolvedJobRejectsInvalidCredentialSecretPrefixBeforeSharedModeMaterialization(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:orders",
		WorkingDir:  filepath.Join(root, "app-dev-orders"),
		MainFile:    filepath.Join(root, "app-dev-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-orders", "terraform.tfvars.json"),
	}
	resolved := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
		Module: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"credential_secret_prefix": "",
			},
		},
		Backend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "devdb.tfstate", "region": "us-west-2"},
	}, PhysicalDatabaseInstance{
		Endpoint: "pool-rds.example.us-east-1.rds.amazonaws.com:5432",
		MasterCredentialRef: map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!db-bea6cf0e-L50noE",
		},
	})

	err := MaterializeResolvedJob(job, DispatchPayload{
		BindingKey:      "app:dev:orders",
		DesiredSpec:     DatabaseRequirement{LogicalName: "Orders DB", Engine: "postgres"},
		DesiredSpecHash: "hash-1",
		Environment:     "edit",
		Operation:       "ensure_database",
		Profile:         "dev",
		RequestID:       "request-1",
		ResourceKey:     "resource-1",
	}, resolved, testSharedModeSSLOpts)

	require.ErrorContains(t, err, `credential_secret_prefix must be a non-empty string`)
}

func TestMaterializeJobOmitsProviderBlockForNonCloudBackends(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:prod:orders",
		TerraformBackend: map[string]any{"stateBackend": "local", "path": "./terraform.tfstate"},
		TerraformModule: TerraformModule{
			Source:  "app.terraform.io/superblocks/rds-postgres/aws",
			Version: "1.2.3",
		},
	}, testSSLOpts)

	require.NoError(t, err)
	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	require.NotContains(t, string(mainFile), `provider "aws"`)
}

func TestMaterializeJobRejectsModuleInputsThatOverwriteSystemVariables(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:prod:orders",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "orders.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source:  "app.terraform.io/superblocks/rds-postgres/aws",
			Version: "1.2.3",
			Inputs: map[string]any{
				"request_id": "override",
			},
		},
	}, testSSLOpts)

	require.ErrorContains(t, err, `input "request_id" conflicts with a system tracking variable`)
}

func TestMaterializeJobRejectsReservedTerraformModuleInputNames(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:prod:orders",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "orders.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source:  "app.terraform.io/superblocks/rds-postgres/aws",
			Version: "1.2.3",
			Inputs: map[string]any{
				"source": "override",
			},
		},
	}, testSSLOpts)

	require.ErrorContains(t, err, `input "source" conflicts with a Terraform module meta-argument`)
	require.NoFileExists(t, job.MainFile)
}

func TestIsTerraformModuleMetaArgument(t *testing.T) {
	for _, key := range []string{"count", "depends_on", "for_each", "providers", "source", "version"} {
		t.Run(key, func(t *testing.T) {
			require.True(t, isTerraformModuleMetaArgument(key))
		})
	}
	require.False(t, isTerraformModuleMetaArgument("engine_version"))
}

func TestMaterializeJobRejectsInvalidTerraformInputIdentifiers(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:prod:orders",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "orders.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source:  "app.terraform.io/superblocks/rds-postgres/aws",
			Version: "1.2.3",
			Inputs: map[string]any{
				"engine_version\ninjected = true": "16.3",
			},
		},
	}, testSSLOpts)

	require.ErrorContains(t, err, `is not a valid Terraform identifier`)
}

func TestMaterializeJobRejectsMissingTerraformBackendStateBackend(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:prod:orders",
		TerraformBackend: map[string]any{"bucket": "state-bucket", "key": "orders.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source:  "app.terraform.io/superblocks/rds-postgres/aws",
			Version: "1.2.3",
		},
	}, testSSLOpts)

	require.ErrorContains(t, err, "terraformBackend.stateBackend is required")
	require.NoFileExists(t, job.MainFile)
}

func TestMaterializeJobRejectsUnknownTerraformBackendStateBackend(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:prod:orders",
		TerraformBackend: map[string]any{"stateBackend": "consul", "address": "127.0.0.1:8500", "path": "orders"},
		TerraformModule: TerraformModule{
			Source:  "app.terraform.io/superblocks/rds-postgres/aws",
			Version: "1.2.3",
		},
	}, testSSLOpts)

	require.ErrorContains(t, err, `terraformBackend.stateBackend "consul" is not supported`)
	require.NoFileExists(t, job.MainFile)
}

func TestMaterializeJobAcceptsGCSAndAzureRMTerraformBackends(t *testing.T) {
	for _, tc := range []struct {
		name        string
		backend     map[string]any
		wantBackend string
		wantConfig  string
	}{
		{
			name: "gcs",
			backend: map[string]any{
				"bucket":       "state-bucket",
				"prefix":       "orders",
				"stateBackend": "gcs",
			},
			wantBackend: `terraform {
  backend "gcs" {}
}`,
			wantConfig: "bucket = \"state-bucket\"\nprefix = \"orders\"\n",
		},
		{
			name: "azurerm",
			backend: map[string]any{
				"container_name":       "tfstate",
				"key":                  "orders.tfstate",
				"resource_group_name":  "rg-superblocks",
				"stateBackend":         "azurerm",
				"storage_account_name": "sbstorage",
			},
			wantBackend: `terraform {
  backend "azurerm" {}
}`,
			wantConfig: "container_name = \"tfstate\"\nkey = \"orders.tfstate\"\nresource_group_name = \"rg-superblocks\"\nstorage_account_name = \"sbstorage\"\n",
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			root := tempRoot(t)
			job := Job{
				BindingKey:  "app:prod:orders",
				WorkingDir:  filepath.Join(root, "app-prod-orders"),
				MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
				BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
				VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
			}

			err := MaterializeJob(job, DispatchPayload{
				BindingKey:       "app:prod:orders",
				TerraformBackend: tc.backend,
				TerraformModule: TerraformModule{
					Source:  "app.terraform.io/superblocks/rds-postgres/aws",
					Version: "1.2.3",
				},
			}, testSSLOpts)

			require.NoError(t, err)
			mainFile, err := os.ReadFile(job.MainFile)
			require.NoError(t, err)
			require.Contains(t, string(mainFile), tc.wantBackend)

			backendFile, err := os.ReadFile(job.BackendFile)
			require.NoError(t, err)
			require.Equal(t, tc.wantConfig, string(backendFile))
		})
	}
}

func TestMaterializeJobRejectsMissingPaths(t *testing.T) {
	// Exhaustive missing-path coverage: each Job-path field is required,
	// so callers that wire up only a subset (typically a sign of a bug
	// in the JobBuilder) fail loudly with a labeled error instead of
	// producing a half-materialized workspace.
	root := tempRoot(t)
	t.Run("missing WorkingDir", func(t *testing.T) {
		err := MaterializeJob(Job{}, DispatchPayload{BindingKey: "app:prod:orders"}, testSSLOpts)
		require.ErrorContains(t, err, "working directory is required")
	})
	t.Run("missing MainFile", func(t *testing.T) {
		err := MaterializeJob(Job{
			WorkingDir: filepath.Join(root, "x"),
		}, DispatchPayload{BindingKey: "app:prod:orders"}, testSSLOpts)
		require.ErrorContains(t, err, "main file is required")
	})
	t.Run("missing BackendFile", func(t *testing.T) {
		err := MaterializeJob(Job{
			WorkingDir: filepath.Join(root, "x"),
			MainFile:   filepath.Join(root, "x", "main.tf"),
		}, DispatchPayload{BindingKey: "app:prod:orders"}, testSSLOpts)
		require.ErrorContains(t, err, "backend file is required")
	})
	t.Run("missing VarsFile", func(t *testing.T) {
		err := MaterializeJob(Job{
			WorkingDir:  filepath.Join(root, "x"),
			MainFile:    filepath.Join(root, "x", "main.tf"),
			BackendFile: filepath.Join(root, "x", "backend.tfbackend"),
		}, DispatchPayload{BindingKey: "app:prod:orders"}, testSSLOpts)
		require.ErrorContains(t, err, "vars file is required")
	})
}

func TestMaterializeJobRejectsMissingTerraformModuleSource(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey: "app:prod:orders",
		TerraformModule: TerraformModule{
			Version: "1.2.3",
		},
	}, testSSLOpts)

	require.ErrorContains(t, err, "Terraform module source is required")
}

func TestMaterializeJobRejectsMissingTerraformModuleVersion(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey: "app:prod:orders",
		TerraformModule: TerraformModule{
			Source: "app.terraform.io/superblocks/rds-postgres/aws",
		},
	}, testSSLOpts)

	require.ErrorContains(t, err, "Terraform module version is required")
}

func TestMaterializeJobTreatsVCSShorthandSourcesAsNonRegistryModules(t *testing.T) {
	for _, source := range []string{
		"github.com/superblocksteam/terraform-superblocks-databases//modules/aws-rds-managed-instance",
		"bitbucket.org/superblocks/terraform-superblocks-databases//modules/aws-rds-managed-instance",
	} {
		t.Run(source, func(t *testing.T) {
			root := tempRoot(t)
			job := Job{
				BindingKey:  "app:prod:orders",
				WorkingDir:  filepath.Join(root, "app-prod-orders"),
				MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
				BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
				VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
			}

			err := MaterializeJob(job, DispatchPayload{
				BindingKey:       "app:prod:orders",
				TerraformBackend: map[string]any{"stateBackend": "local", "path": "./terraform.tfstate"},
				TerraformModule: TerraformModule{
					Source:  source,
					Version: "1.2.3",
				},
			}, testSSLOpts)

			require.NoError(t, err)
			mainFile, err := os.ReadFile(job.MainFile)
			require.NoError(t, err)
			require.Contains(t, string(mainFile), `  source  = "`+source+`"`)
			require.NotContains(t, string(mainFile), `  version = "1.2.3"`)
		})
	}
}

func TestMaterializeJobDoesNotRequireVersionForVCSShorthandSources(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:prod:orders",
		TerraformBackend: map[string]any{"stateBackend": "local", "path": "./terraform.tfstate"},
		TerraformModule: TerraformModule{
			Source: testAWSRDSManagedInstanceModuleSource,
		},
	}, testSSLOpts)

	require.NoError(t, err)
}

func TestMaterializeJobRejectsUnallowlistedSharedModeRuntimeCredentialRef(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:devdb",
		WorkingDir:  filepath.Join(root, "app-dev-devdb"),
		MainFile:    filepath.Join(root, "app-dev-devdb", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-devdb", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-devdb", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:dev:devdb",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "devdb.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"host": "pool-rds.example.us-east-1.rds.amazonaws.com",
				"runtime_credential_ref": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:other/pool-master",
				},
			},
		},
	}, testSharedModeSSLOpts)

	require.ErrorContains(t, err, "runtime_credential_ref.ref is not in allowed prefixes")
	require.NoFileExists(t, job.MainFile)
}

func TestMaterializeJobRejectsInvalidSharedModeSSLOptions(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:devdb",
		WorkingDir:  filepath.Join(root, "app-dev-devdb"),
		MainFile:    filepath.Join(root, "app-dev-devdb", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-devdb", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-devdb", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:dev:devdb",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "devdb.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"host": "pool-rds.example.us-east-1.rds.amazonaws.com",
				"runtime_credential_ref": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!db-bea6cf0e",
				},
			},
		},
	}, ProviderSSLOptions{
		AllowedRefPrefixes: testSharedModeSSLOpts.AllowedRefPrefixes,
	})

	require.ErrorContains(t, err, "must be set explicitly")
	require.NoFileExists(t, job.MainFile)
}

func TestMaterializeJobRejectsNonARNSharedModeRuntimeCredentialRef(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:devdb",
		WorkingDir:  filepath.Join(root, "app-dev-devdb"),
		MainFile:    filepath.Join(root, "app-dev-devdb", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-devdb", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-devdb", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:dev:devdb",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "devdb.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"host": "pool-rds.example.us-east-1.rds.amazonaws.com",
				"runtime_credential_ref": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "superblocks/native-db/pool-master",
				},
			},
		},
	}, ProviderSSLOptions{
		Mode:               "require",
		AllowedRefPrefixes: []string{"superblocks/native-db/"},
	})

	require.ErrorContains(t, err, "runtime_credential_ref.ref must be an AWS Secrets Manager ARN")
	require.NoFileExists(t, job.MainFile)
}

func TestMaterializeJobEmitsPostgresProviderForSharedModeModule(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:devdb",
		WorkingDir:  filepath.Join(root, "app-dev-devdb"),
		MainFile:    filepath.Join(root, "app-dev-devdb", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-devdb", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-devdb", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:dev:devdb",
		DesiredSpecHash:  "hash-1",
		Environment:      "edit",
		Operation:        "ensure_database",
		Profile:          "development",
		RequestID:        "request-1",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "devdb.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"host":                "pool-rds.example.us-east-1.rds.amazonaws.com",
				"database_name":       "db_abc",
				"runtime_role_name":   "db_abc",
				"migration_role_name": "migr_abc",
				"runtime_credential_ref": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!db-bea6cf0e-L50noE",
				},
				"migration_credential_ref": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!db-bea6cf0e-L50noE",
				},
			},
		},
	}, testSharedModeSSLOpts)

	require.NoError(t, err)
	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	main := string(mainFile)

	require.Contains(t, main, `terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.26.0"
    }
  }
}`)
	require.Contains(t, main, `locals {
  __pool_master_secret_arn    = var.runtime_credential_ref.ref
  __pool_master_secret_region = split(":", local.__pool_master_secret_arn)[3]
}`)
	require.Contains(t, main, `provider "aws" {
  alias  = "pool_secrets"
  region = local.__pool_master_secret_region
}`)
	require.Contains(t, main, `data "aws_secretsmanager_secret_version" "pool_master" {
  provider  = aws.pool_secrets
  secret_id = local.__pool_master_secret_arn
}`)
	require.Contains(t, main, `provider "postgresql" {
  host      = var.host
  port      = var.port
  username  = jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)["username"]
  password  = jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)["password"]
  sslmode   = "require"
  superuser = false
}`)
	require.Contains(t, main, `provider "aws" {
  region = "us-west-2"
}`)
}

func TestMaterializeJobBindsGeneratedSharedModeSecretsToPoolSecretsProvider(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:devdb",
		WorkingDir:  filepath.Join(root, "app-dev-devdb"),
		MainFile:    filepath.Join(root, "app-dev-devdb", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-devdb", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-devdb", "terraform.tfvars.json"),
	}

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:dev:devdb",
		TerraformBackend: map[string]any{"stateBackend": "gcs", "bucket": "state-bucket", "prefix": "devdb"},
		TerraformModule: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"credential_secret_prefix": "superblocks/native-db/local",
				"host":                     "pool-rds.example.us-east-1.rds.amazonaws.com",
				"postgres_admin_credential_ref": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!db-bea6cf0e-L50noE",
				},
			},
		},
	}, testSharedModeSSLOpts)

	require.NoError(t, err)
	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	main := string(mainFile)
	require.Contains(t, main, `aws = {
      source = "hashicorp/aws"
    }`)
	require.Contains(t, main, `resource "aws_secretsmanager_secret" "runtime" {
  provider = aws.pool_secrets`)
	require.Contains(t, main, `resource "aws_secretsmanager_secret_version" "runtime" {
  provider      = aws.pool_secrets`)
	require.NotContains(t, main, `provider "aws" {
  region = "us-west-2"
}`)
}

func TestMaterializeJobEmitsConfiguredSSLModeForSharedModeModule(t *testing.T) {
	// Regression: cursor r3284281726. The shared-mode `provider "postgresql"`
	// block previously hardcoded `sslmode = "require"`, contradicting
	// validateSSLOptions (which rejects "require" as an implicit default and
	// pushes operators toward verify-full + a root CA bundle). The materializer
	// now threads ProviderSSLOptions through so terraform-apply and the
	// migration runner share the same TLS posture.
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:devdb",
		WorkingDir:  filepath.Join(root, "app-dev-devdb"),
		MainFile:    filepath.Join(root, "app-dev-devdb", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-devdb", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-devdb", "terraform.tfvars.json"),
	}
	dispatch := DispatchPayload{
		BindingKey:       "app:dev:devdb",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "devdb.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"host": "pool-rds.example.us-east-1.rds.amazonaws.com",
				"runtime_credential_ref": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!db-bea6cf0e",
				},
			},
		},
	}

	require.NoError(t, MaterializeJob(job, dispatch, ProviderSSLOptions{
		Mode:               "verify-full",
		RootCert:           "/etc/rds/global-bundle.pem",
		AllowedRefPrefixes: testSharedModeSSLOpts.AllowedRefPrefixes,
	}))
	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	main := string(mainFile)

	// verify-full mode + sslrootcert path both threaded through; HCL is
	// formatted with %q so the path is quoted (rules out unquoted-path
	// regressions if an operator supplied a path containing whitespace).
	require.Contains(t, main, `  sslmode   = "verify-full"`)
	require.Contains(t, main, `  sslrootcert = "/etc/rds/global-bundle.pem"`)
	// require posture must NOT leak in via a stale hardcoded literal.
	require.NotContains(t, main, `  sslmode   = "require"`)
}

func TestMaterializeJobOmitsSSLRootCertWhenUnset(t *testing.T) {
	// `require` does not need a root cert, and the cyrilgdn/postgresql
	// provider treats `sslrootcert = ""` as an attempt to load an empty
	// path (errors at provider init). The materializer must skip the
	// argument entirely when SSLRootCert is empty.
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:devdb",
		WorkingDir:  filepath.Join(root, "app-dev-devdb"),
		MainFile:    filepath.Join(root, "app-dev-devdb", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-devdb", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-devdb", "terraform.tfvars.json"),
	}
	dispatch := DispatchPayload{
		BindingKey:       "app:dev:devdb",
		TerraformBackend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "devdb.tfstate", "region": "us-west-2"},
		TerraformModule: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"host": "pool-rds.example.us-east-1.rds.amazonaws.com",
				"runtime_credential_ref": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!db-bea6cf0e",
				},
			},
		},
	}

	require.NoError(t, MaterializeJob(job, dispatch, testSharedModeSSLOpts))
	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	main := string(mainFile)
	require.Contains(t, main, `  sslmode   = "require"`)
	require.NotContains(t, main, `sslrootcert`)
}

func TestMaterializeJobRejectsSymlinkedGeneratedFiles(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}
	outside := filepath.Join(root, "outside.tfbackend")
	require.NoError(t, os.WriteFile(outside, []byte("do not overwrite"), 0o600))
	require.NoError(t, os.MkdirAll(job.WorkingDir, 0o700))
	require.NoError(t, os.Symlink(outside, job.BackendFile))

	err := MaterializeJob(job, DispatchPayload{
		BindingKey:       "app:prod:orders",
		TerraformBackend: map[string]any{"stateBackend": "local", "path": "./terraform.tfstate"},
		TerraformModule: TerraformModule{
			Source: testAWSRDSManagedInstanceModuleSource,
		},
	}, testSSLOpts)

	require.ErrorContains(t, err, "refuses to write through symlink")
	raw, err := os.ReadFile(outside)
	require.NoError(t, err)
	require.Equal(t, "do not overwrite", string(raw))
}

func TestWriteFileNoFollowRejectsSymlinkedParentDirectory(t *testing.T) {
	root := tempRoot(t)
	outside := filepath.Join(root, "outside")
	require.NoError(t, os.MkdirAll(outside, 0o700))
	link := filepath.Join(root, "binding-workdir")
	require.NoError(t, os.Symlink(outside, link))

	target := filepath.Join(link, "main.tf")
	err := writeFileNoFollow(target, []byte("# generated"))

	require.ErrorContains(t, err, "refuses to write through symlink parent")
	_, statErr := os.Stat(filepath.Join(outside, "main.tf"))
	require.True(t, os.IsNotExist(statErr), "must not write through a symlinked parent directory")
}

func TestWriteFileNoFollowRejectsSymlinkedAncestorDirectory(t *testing.T) {
	root := tempRoot(t)
	outside := filepath.Join(root, "outside")
	require.NoError(t, os.MkdirAll(filepath.Join(outside, "binding-workdir"), 0o700))
	link := filepath.Join(root, "lifecycle-root")
	require.NoError(t, os.Symlink(outside, link))

	target := filepath.Join(link, "binding-workdir", "main.tf")
	err := writeFileNoFollow(target, []byte("# generated"))

	require.ErrorContains(t, err, "refuses to write through symlink parent")
	_, statErr := os.Stat(filepath.Join(outside, "binding-workdir", "main.tf"))
	require.True(t, os.IsNotExist(statErr), "must not write through a symlinked ancestor directory")
}

func TestValidateTerraformModuleSourceRejectsUnallowlistedSources(t *testing.T) {
	err := ValidateTerraformModuleSource(
		TerraformModule{Source: "app.terraform.io/superblocks/iam-role/aws", Version: "1.0.0"},
		[]string{"app.terraform.io/superblocks/rds-postgres/aws"},
	)

	var lifecycleErr *LifecycleError
	require.ErrorAs(t, err, &lifecycleErr)
	require.Equal(t, ErrorCodeUnsupportedShape, lifecycleErr.Code)
	require.ErrorContains(t, lifecycleErr, "unsupported Terraform module source app.terraform.io/superblocks/iam-role/aws")
}

func TestValidateTerraformModuleSourceRejectsEmptyAllowlist(t *testing.T) {
	err := ValidateTerraformModuleSource(
		TerraformModule{Source: "app.terraform.io/superblocks/rds-postgres/aws", Version: "1.0.0"},
		nil,
	)

	var lifecycleErr *LifecycleError
	require.ErrorAs(t, err, &lifecycleErr)
	require.Equal(t, ErrorCodeUnsupportedShape, lifecycleErr.Code)
	require.ErrorContains(t, lifecycleErr, "no Terraform module sources are allowed")
}

func readJSONFile(path string, target any) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, target)
}

func TestHCLValueRendersScalarTypes(t *testing.T) {
	// hclValue is the HCL serializer used inside materialize.go.
	// Walk every case in its type switch so a regression on any branch
	// (e.g. a refactor that drops bool quoting) shows up in unit tests
	// before it lands in a tofu run.
	cases := []struct {
		name string
		in   any
		out  string
	}{
		{"string quoted", "us-west-2", `"us-west-2"`},
		{"string with quotes escaped", `re"name"`, `"re\"name\""`},
		{"bool true", true, "true"},
		{"bool false", false, "false"},
		{"int", int(5432), "5432"},
		{"int32", int32(5432), "5432"},
		{"int64", int64(5432), "5432"},
		{"float64", float64(3.5), "3.5"},
		{"float32", float32(3.5), "3.5"},
		{"string list fallback", []string{"a", "b"}, `["a","b"]`},
		{"empty string list fallback", []string{}, `[]`},
		{"map fallback", map[string]any{"a": 1}, `{"a":1}`},
		{"any list fallback", []any{"a", 1, true}, `["a",1,true]`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			require.Equal(t, tc.out, hclValue(tc.in))
		})
	}
}

func TestWriteFileNoFollowSucceedsCreatingNestedDir(t *testing.T) {
	// writeFileNoFollow's first responsibility is MkdirAll on the
	// target's parent at 0o700. Covers the happy path explicitly so
	// the "create the binding's workdir on first dispatch" flow is
	// regression-protected even when no other materialize_test case
	// exercises this depth.
	root := tempRoot(t)
	path := filepath.Join(root, "deeply", "nested", "binding-X", "main.tf")
	err := writeFileNoFollow(path, []byte("# generated"))
	require.NoError(t, err)
	contents, err := os.ReadFile(path)
	require.NoError(t, err)
	require.Equal(t, "# generated", string(contents))
	info, err := os.Stat(filepath.Dir(path))
	require.NoError(t, err)
	require.True(t, info.IsDir())
}

func TestWriteFileNoFollowOverwritesExistingRegularFile(t *testing.T) {
	// O_CREAT|O_TRUNC means an existing regular file at the path gets
	// replaced (not appended to). Tests this explicitly because the
	// "rerun the same binding" path relies on it.
	root := tempRoot(t)
	path := filepath.Join(root, "main.tf")
	require.NoError(t, os.WriteFile(path, []byte("old contents"), 0o600))
	err := writeFileNoFollow(path, []byte("new contents"))
	require.NoError(t, err)
	got, err := os.ReadFile(path)
	require.NoError(t, err)
	require.Equal(t, "new contents", string(got))
}

func TestWriteFileNoFollowSurfacesNonELOOPErrorWithPath(t *testing.T) {
	// O_NOFOLLOW + a read-only parent dir → syscall.Open returns EACCES
	// (not ELOOP). The non-ELOOP branch must still surface the path so
	// operators can pinpoint which file the worker failed to write.
	root := tempRoot(t)
	readonly := filepath.Join(root, "readonly")
	require.NoError(t, os.MkdirAll(readonly, 0o700))
	require.NoError(t, os.Chmod(readonly, 0o500)) // r-x, no write
	t.Cleanup(func() { _ = os.Chmod(readonly, 0o700) })
	target := filepath.Join(readonly, "main.tf")

	err := writeFileNoFollow(target, []byte("# generated"))
	require.Error(t, err)
	// Non-ELOOP error path: the message must contain the path so the
	// operator can find the broken target instead of getting a bare
	// "permission denied".
	require.NotContains(t, err.Error(), "refuses to write through symlink")
	require.Contains(t, err.Error(), target)
}

func TestWriteJSONFileSurfacesMarshalError(t *testing.T) {
	// json.MarshalIndent fails on values it can't encode (channels,
	// functions, cyclic refs). The wrapper must surface that error
	// rather than silently producing an empty file.
	root := tempRoot(t)
	path := filepath.Join(root, "vars.json")
	err := writeJSONFile(path, map[string]any{
		"bad": func() {}, // funcs are not JSON-marshalable
	})
	require.Error(t, err)
	// Sanity: no file was written.
	_, statErr := os.Stat(path)
	require.True(t, os.IsNotExist(statErr), "no file should exist when marshal fails")
}

func TestWriteFileNoFollowFailsWhenParentIsNonDir(t *testing.T) {
	// MkdirAll fails if any path component already exists as a regular
	// file — surface this clearly so operators don't get a cryptic
	// "permission denied" when an earlier dispatch left a broken state.
	root := tempRoot(t)
	blockedParent := filepath.Join(root, "blocker")
	require.NoError(t, os.WriteFile(blockedParent, []byte("not a directory"), 0o600))
	target := filepath.Join(blockedParent, "main.tf")
	err := writeFileNoFollow(target, []byte("anything"))
	require.Error(t, err)
	require.NotContains(t, err.Error(), "refuses to write through symlink")
}

func TestIsRegistryModuleSource(t *testing.T) {
	// Independent of MaterializeJob, exhaustively walks the source
	// classifier so the next person who adds a VCS shorthand has a
	// clear set of golden cases to extend.
	cases := []struct {
		source string
		want   bool
	}{
		// Registry-shaped: namespace/name/provider, no scheme/colons.
		{"app.terraform.io/superblocks/rds-postgres/aws", true},
		{"hashicorp/consul/aws", true},
		// Explicit VCS shorthand prefixes — must NOT be classified registry.
		{"github.com/superblocksteam/terraform-superblocks-databases//modules/aws-rds-managed-instance", false},
		{"bitbucket.org/team/repo//modules/x", false},
		{"gitlab.com/group/repo//modules/x", false},
		{"git@github.com:superblocksteam/terraform-superblocks-databases.git//modules/postgres-managed-database", false},
		// Protocol-style sources — explicit schemes never classify as registry.
		{testAWSRDSManagedInstanceModuleSource, false},
		{"https://example.com/module.zip", false},
		// Filesystem paths.
		{"./modules/x", false},
		{"../shared/modules/x", false},
		{"/abs/path", false},
	}
	for _, tc := range cases {
		t.Run(tc.source, func(t *testing.T) {
			require.Equal(t, tc.want, isRegistryModuleSource(tc.source))
		})
	}
}

func TestBackendBlockFromBackend(t *testing.T) {
	require.Equal(t, "", backendBlockFromBackend(nil))
	require.Equal(t, "", backendBlockFromBackend(map[string]any{}))
	require.Equal(t, "", backendBlockFromBackend(map[string]any{"bucket": "x"})) // missing "stateBackend"
	require.Equal(t, "terraform {\n  backend \"s3\" {}\n}\n\n",
		backendBlockFromBackend(map[string]any{"stateBackend": "s3", "bucket": "x"}))
}

func TestExpandBackendKeyFallsBackToBindingKeyWhenResourceKeyIsEmpty(t *testing.T) {
	withResourceKey := expandBackendKey("state/{{resource_key}}.tfstate", DispatchPayload{
		ResourceKey: "resource-1",
		BindingKey:  "binding-1",
	})
	withoutResourceKey := expandBackendKey("state/{{resource_key}}.tfstate", DispatchPayload{
		BindingKey: "binding-1",
	})

	require.Equal(t, "state/"+safeBindingPathSegment("resource-1")+".tfstate", withResourceKey)
	require.Equal(t, "state/"+safeBindingPathSegment("binding-1")+".tfstate", withoutResourceKey)
	require.NotEqual(t, withResourceKey, withoutResourceKey)
}

func TestValidateTerraformBackend(t *testing.T) {
	require.ErrorContains(t, validateTerraformBackend(nil), "terraformBackend.stateBackend is required")
	require.ErrorContains(t, validateTerraformBackend(map[string]any{}), "terraformBackend.stateBackend is required")
	require.ErrorContains(t, validateTerraformBackend(map[string]any{"bucket": "x"}), "terraformBackend.stateBackend is required")
	require.ErrorContains(t, validateTerraformBackend(map[string]any{"stateBackend": "consul"}), `terraformBackend.stateBackend "consul" is not supported`)
	require.NoError(t, validateTerraformBackend(map[string]any{"stateBackend": "azurerm"}))
	require.NoError(t, validateTerraformBackend(map[string]any{"stateBackend": "gcs"}))
	require.NoError(t, validateTerraformBackend(map[string]any{"stateBackend": "local"}))
	require.NoError(t, validateTerraformBackend(map[string]any{"stateBackend": "s3"}))
}
