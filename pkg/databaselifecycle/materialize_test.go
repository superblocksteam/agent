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
var testIAMSSLOpts = ProviderSSLOptions{
	Mode:               sslModeVerifyFull,
	RootCert:           "/etc/ssl/certs/rds-global-bundle.pem",
	AllowedRefPrefixes: testSharedModeSSLOpts.AllowedRefPrefixes,
}

const (
	testBundledAuroraModuleSource           = "/opt/superblocks/terraform-superblocks-databases/modules/aws-aurora-managed-cluster"
	testBundledPostgresModuleSource         = "file:///opt/superblocks/terraform-superblocks-databases//modules/postgres-managed-database"
	testNativeDBModuleRef                   = "v0.2.0"
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

func TestMaterializeResolvedJobDerivesSharedPhysicalDatabaseInputsForDeprovision(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:dev:orders",
		WorkingDir:  filepath.Join(root, "app-dev-orders"),
		MainFile:    filepath.Join(root, "app-dev-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-dev-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-dev-orders", "terraform.tfvars.json"),
	}
	resolved, err := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
		Module: TerraformModule{
			Source: "git::https://github.com/superblocksteam/terraform.git//modules/native-database/postgres-managed-database?ref=feature-branch",
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
	require.NoError(t, err)

	err = MaterializeResolvedJob(job, DispatchPayload{
		BindingKey:      "org:app:edit:dev~dev:orders~Orders%20DB:postgres",
		DesiredSpec:     DatabaseRequirement{LogicalName: "Orders DB", Engine: "postgres"},
		DesiredSpecHash: "hash-1",
		Environment:     "edit",
		Operation:       operationRetireDatabase,
		Profile:         "dev",
		RequestID:       "request-1",
		ResourceKey:     "org/app/orders~Orders%20DB:postgres/edit/dev~dev/default",
	}, resolved, testSharedModeSSLOpts)

	require.NoError(t, err)

	var vars map[string]any
	require.NoError(t, readJSONFile(job.VarsFile, &vars))
	require.Equal(t, "sb_0feb472353575bf5", vars["database_name"])
	require.Equal(t, "app_0feb472353575bf5a7596189d9b482e1_migrator", vars["runtime_role_name"])
	_, hasMigrationRole := vars["migration_role_name"]
	require.False(t, hasMigrationRole, "deprovision materialization must target the single app migrator role")
	require.Equal(t, "retire_database", vars["operation"])
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
	resolved, err := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
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
	require.NoError(t, err)

	err = MaterializeResolvedJob(job, DispatchPayload{
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
	require.Equal(t, "sb_0feb472353575bf5", vars["database_name"])
	require.Equal(t, "app_0feb472353575bf5a7596189d9b482e1_migrator", vars["runtime_role_name"])
	_, hasMigrationRole := vars["migration_role_name"]
	require.False(t, hasMigrationRole, "shared-mode materialization must not set a separate migration_role_name")
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
	require.Contains(t, main, `resource "random_password" "app"`)
	require.Contains(t, main, `resource "aws_secretsmanager_secret" "app"`)
	require.NotContains(t, main, `resource "random_password" "migration"`)
	require.NotContains(t, main, `resource "aws_secretsmanager_secret" "migration"`)
	require.Contains(t, main, `provider = aws.pool_secrets
  name     = "${local.__credential_secret_prefix}/${var.database_name}/migrator"`)
	require.Contains(t, main, `runtime_credential_ref = {
    resolver = "aws_secrets_manager"
    ref      = aws_secretsmanager_secret.app.arn
    field    = "password"
  }`)
	require.Contains(t, main, `runtime_password_wo = random_password.app.result`)
	require.NotContains(t, main, `migration_credential_ref = {`)
	require.NotContains(t, main, `migration_password_wo =`)
	require.Contains(t, main, `postgres_admin_username = jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)["username"]`)
	require.Contains(t, main, `postgres_admin_password = sensitive(jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)["password"])`)
	require.Contains(t, main, `provider "postgresql" {
  host      = var.host
  port      = var.port`)
	require.NotContains(t, main, `postgres_admin_credential_ref = var.postgres_admin_credential_ref`)
	require.NotContains(t, main, `credential_secret_prefix = var.credential_secret_prefix`)
}

func TestSharedPhysicalDatabaseIdentifiersFallBackToBindingKey(t *testing.T) {
	const key = "org/app/orders~Orders%20DB:postgres/edit/dev~dev/default"

	withResourceKey := DispatchPayload{ResourceKey: key}
	withBindingKey := DispatchPayload{BindingKey: key}

	require.Equal(t, sharedPhysicalDatabaseIdentifierStem(withResourceKey), sharedPhysicalDatabaseIdentifierStem(withBindingKey))
	require.Equal(t, appMigratorRoleName(withResourceKey), appMigratorRoleName(withBindingKey))
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
	resolved, err := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
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
	require.NoError(t, err)

	err = MaterializeResolvedJob(job, DispatchPayload{
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

func TestMaterializeResolvedJobUsesPasswordlessIAMAdministration(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "binding-456",
		WorkingDir:  filepath.Join(root, "iam-database"),
		MainFile:    filepath.Join(root, "iam-database", "main.tf"),
		BackendFile: filepath.Join(root, "iam-database", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "iam-database", "terraform.tfvars.json"),
		Runtime:     &JobRuntime{},
	}
	resolved, err := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
		Module: TerraformModule{
			Source: testPostgresManagedDatabaseModuleSource,
			Inputs: map[string]any{
				"application_id":                "untrusted-application",
				"auth_mode":                     iamAuthMode,
				"binding_id":                    "untrusted-binding",
				"credential_resolver":           map[string]any{"runtime": "aws_secrets_manager"},
				"credential_secret_prefix":      "app-secrets",
				"connector_role_arn":            "arn:aws:iam::361919038798:role/operator-controlled",
				"database_name":                 "untrusted_database",
				"database_owner_role_name":      "untrusted_owner",
				"deployment_token":              "012345abcdef",
				"migration_credential_ref":      map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:aws:secretsmanager:us-east-1:361919038798:secret:app-migration"},
				"migration_password_wo":         "app-password",
				"migration_password_wo_version": "1",
				"postgres_admin_password":       "admin-password",
				"postgres_admin_username":       "cluster-master",
				"runtime_credential_ref":        map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:aws:secretsmanager:us-east-1:361919038798:secret:app-runtime"},
				"runtime_password_wo":           "app-password",
				"runtime_password_wo_version":   "1",
				"runtime_role_name":             "untrusted_runtime",
			},
		},
		Backend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "iam.tfstate", "region": "us-west-2"},
	}, PhysicalDatabaseInstance{
		Endpoint: "stale-endpoint.example.com:1111",
		MasterCredentialRef: map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!cluster",
		},
		Metadata: map[string]any{
			"aws_account_id":      "361919038798",
			"cluster_resource_id": "cluster-ABC123DEF456EXAMPLE",
			"connector_role_arn":  "arn:aws:iam::361919038798:role/metadata-must-not-win",
			"host":                "pool.cluster-abc.us-east-1.rds.amazonaws.com",
			"port":                5432,
			"region":              "us-east-1",
		},
	})
	require.NoError(t, err)

	err = MaterializeResolvedJob(job, DispatchPayload{
		ApplicationID:   "app-123",
		BindingID:       "binding-456",
		BindingKey:      "binding-key",
		DesiredSpec:     DatabaseRequirement{LogicalName: "Orders DB", Engine: "postgres"},
		DesiredSpecHash: "hash-1",
		Environment:     "deployed",
		Operation:       "ensure_database",
		Profile:         "production",
		RequestID:       "request-1",
		ResourceKey:     "resource-1",
	}, resolved, testIAMSSLOpts)

	require.NoError(t, err)
	require.NotNil(t, job.Runtime.MasterCredentialRef)
	require.Equal(t, "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!cluster", job.Runtime.MasterCredentialRef.Ref)
	require.Equal(t, &PostgresAdminConnection{
		Database:       "postgres",
		Host:           "pool.cluster-abc.us-east-1.rds.amazonaws.com",
		Port:           5432,
		SSLMode:        sslModeVerifyFull,
		SSLRootCert:    "/etc/ssl/certs/rds-global-bundle.pem",
		TargetDatabase: "sbndb_012345abcdef_27142541a26fd86ba68a5073",
	}, job.Runtime.PostgresAdminConnection)

	var vars map[string]any
	require.NoError(t, readJSONFile(job.VarsFile, &vars))
	require.Equal(t, "app-123", vars["application_id"])
	require.Equal(t, "361919038798", vars["aws_account_id"])
	require.Equal(t, "binding-456", vars["binding_id"])
	require.Equal(t, "cluster-ABC123DEF456EXAMPLE", vars["cluster_resource_id"])
	require.Equal(t, "arn:aws:iam::361919038798:role/operator-controlled", vars["connector_role_arn"])
	require.Equal(t, "sbndb_012345abcdef_27142541a26fd86ba68a5073", vars["database_name"])
	require.Equal(t, "sbndb_012345abcdef_27142541a26fd86ba68a5073_owner", vars["database_owner_role_name"])
	require.Equal(t, "postgres", vars["postgres_admin_database"])
	require.Equal(t, sslModeVerifyFull, vars["postgres_sslmode"])
	require.Equal(t, "/etc/ssl/certs/rds-global-bundle.pem", vars["postgres_sslrootcert"])
	require.Equal(t, "us-east-1", vars["region"])
	require.Equal(t, "sbndb_012345abcdef_27142541a26fd86ba68a5073_runtime", vars["runtime_role_name"])
	require.NotContains(t, vars, credentialSecretPrefixInput)
	require.NotContains(t, vars, "migration_credential_ref")
	require.NotContains(t, vars, "runtime_password_wo")
	require.NotContains(t, vars, "migration_password_wo")
	require.NotContains(t, vars, "postgres_admin_password")
	require.NotContains(t, vars, "postgres_admin_username")
	require.NotContains(t, vars, "runtime_credential_ref")

	varsFile, err := os.ReadFile(job.VarsFile)
	require.NoError(t, err)
	require.NotContains(t, string(varsFile), "admin-password")
	require.NotContains(t, string(varsFile), "app-password")
	require.NotContains(t, string(varsFile), "app-migration")
	require.NotContains(t, string(varsFile), "app-runtime")

	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	main := string(mainFile)
	require.Contains(t, main, `source = "hashicorp/aws"`)
	require.Contains(t, main, `provider "aws" {`)
	require.NotContains(t, main, `provider "postgresql" {`)
	require.NotContains(t, main, `providers = {`)
	require.NotContains(t, main, `data "aws_secretsmanager_secret_version"`)
	require.NotContains(t, main, `resource "random_password"`)
	require.NotContains(t, main, `resource "aws_secretsmanager_secret"`)
	require.NotContains(t, main, `password  =`)
	require.NotContains(t, main, `username  =`)
	require.NotContains(t, main, `postgres_admin_credential_ref = var.postgres_admin_credential_ref`)
	require.NotContains(t, main, `deployment_token = var.deployment_token`)
	require.NotContains(t, main, "admin-password")
	require.NotContains(t, main, "app-password")
}

func TestDeriveIAMSharedPhysicalDatabaseInputsSeparatesBindingsInSameApplication(t *testing.T) {
	firstInputs := map[string]any{deploymentTokenInput: "012345abcdef"}
	secondInputs := map[string]any{deploymentTokenInput: "012345abcdef"}

	require.NoError(t, deriveIAMSharedPhysicalDatabaseInputs(firstInputs, DispatchPayload{
		ApplicationID: "app-123",
		BindingID:     "binding-456",
	}))
	require.NoError(t, deriveIAMSharedPhysicalDatabaseInputs(secondInputs, DispatchPayload{
		ApplicationID: "app-123",
		BindingID:     "binding-457",
	}))

	require.Equal(t, "app-123", firstInputs["application_id"])
	require.Equal(t, "app-123", secondInputs["application_id"])
	require.Equal(t, "sbndb_012345abcdef_27142541a26fd86ba68a5073", firstInputs["database_name"])
	require.Equal(t, "sbndb_012345abcdef_26a4e52373a17d96be0c3dae", secondInputs["database_name"])
	require.Equal(t, "sbndb_012345abcdef_27142541a26fd86ba68a5073_owner", firstInputs["database_owner_role_name"])
	require.Equal(t, "sbndb_012345abcdef_26a4e52373a17d96be0c3dae_owner", secondInputs["database_owner_role_name"])
	require.Equal(t, "sbndb_012345abcdef_27142541a26fd86ba68a5073_runtime", firstInputs["runtime_role_name"])
	require.Equal(t, "sbndb_012345abcdef_26a4e52373a17d96be0c3dae_runtime", secondInputs["runtime_role_name"])
}

func TestDeriveIAMSharedPhysicalDatabaseInputsKeepsCanonicalRuntimeOnV1Retire(t *testing.T) {
	inputs := map[string]any{deploymentTokenInput: validIAMDeploymentToken}

	require.NoError(t, deriveIAMSharedPhysicalDatabaseInputs(inputs, DispatchPayload{
		ApplicationID:      validIAMApplicationID,
		BindingID:          validIAMBindingID,
		ConnectionMetadata: validIAMMetadata(),
		Operation:          operationRetireDatabase,
	}))

	require.Equal(t, validIAMV2Username, inputs["runtime_role_name"])
}

func TestDeriveIAMSharedPhysicalDatabaseInputsRejectsRetireFromDifferentDeployment(t *testing.T) {
	inputs := map[string]any{deploymentTokenInput: validIAMDeploymentToken}
	metadata := validIAMV2Metadata()
	metadata["database"] = "sbndb_abcdef012345_" + validIAMBindingToken
	metadata["username"] = "sbndb_abcdef012345_" + validIAMBindingToken + "_runtime"

	err := deriveIAMSharedPhysicalDatabaseInputs(inputs, DispatchPayload{
		ApplicationID:      validIAMApplicationID,
		BindingID:          validIAMBindingID,
		ConnectionMetadata: metadata,
		Operation:          operationRetireDatabase,
	})

	require.ErrorContains(t, err, "retire IAM descriptor deployment does not match the configured deployment_token")
	require.NotContains(t, inputs, "runtime_role_name")
}

func TestDeriveIAMSharedPhysicalDatabaseInputsRejectsRetireWithoutCanonicalIAMMetadata(t *testing.T) {
	inputs := map[string]any{deploymentTokenInput: validIAMDeploymentToken}

	err := deriveIAMSharedPhysicalDatabaseInputs(inputs, DispatchPayload{
		ApplicationID: validIAMApplicationID,
		BindingID:     validIAMBindingID,
		Operation:     operationRetireDatabase,
	})

	require.ErrorContains(t, err, "retire connection metadata is not a valid IAM descriptor")
	require.NotContains(t, inputs, "runtime_role_name")
}

func TestMaterializeResolvedJobRejectsIncompleteIAMAdministrationConnection(t *testing.T) {
	tests := []struct {
		name      string
		endpoint  string
		sslOpts   ProviderSSLOptions
		wantError string
	}{
		{
			name:      "missing host",
			endpoint:  "",
			sslOpts:   testIAMSSLOpts,
			wantError: "metadata.host",
		},
		{
			name:     "missing root cert",
			endpoint: "pool.cluster-abc.us-east-1.rds.amazonaws.com:5432",
			sslOpts: ProviderSSLOptions{
				Mode:               sslModeVerifyFull,
				AllowedRefPrefixes: testIAMSSLOpts.AllowedRefPrefixes,
			},
			wantError: "SSLRootCert",
		},
		{
			name:     "non-verifying TLS",
			endpoint: "pool.cluster-abc.us-east-1.rds.amazonaws.com:5432",
			sslOpts: ProviderSSLOptions{
				Mode:               sslModeRequire,
				RootCert:           "/etc/ssl/certs/rds-global-bundle.pem",
				AllowedRefPrefixes: testIAMSSLOpts.AllowedRefPrefixes,
			},
			wantError: "verify-full",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			host, _, _ := splitPhysicalDatabaseInstanceEndpoint(test.endpoint)
			root := tempRoot(t)
			job := Job{
				WorkingDir:  filepath.Join(root, "iam-database"),
				MainFile:    filepath.Join(root, "iam-database", "main.tf"),
				BackendFile: filepath.Join(root, "iam-database", "backend.tfbackend"),
				VarsFile:    filepath.Join(root, "iam-database", "terraform.tfvars.json"),
				Runtime:     &JobRuntime{},
			}
			resolved, resolveErr := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
				Module: TerraformModule{
					Source: testPostgresManagedDatabaseModuleSource,
					Inputs: map[string]any{
						"auth_mode":        iamAuthMode,
						"deployment_token": "012345abcdef",
					},
				},
				Backend: map[string]any{"stateBackend": "s3", "bucket": "state-bucket", "key": "iam.tfstate", "region": "us-west-2"},
			}, PhysicalDatabaseInstance{
				Endpoint: test.endpoint,
				MasterCredentialRef: map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!cluster",
				},
				Metadata: map[string]any{
					"aws_account_id":      "361919038798",
					"cluster_resource_id": "cluster-ABC123DEF456EXAMPLE",
					"host":                host,
					"port":                5432,
					"region":              "us-east-1",
				},
			})
			if test.endpoint == "" {
				require.ErrorContains(t, resolveErr, test.wantError)
				return
			}
			require.NoError(t, resolveErr)

			err := MaterializeResolvedJob(job, DispatchPayload{
				ApplicationID:   "app-123",
				BindingID:       "binding-456",
				BindingKey:      "binding-key",
				DesiredSpecHash: "hash-1",
				Operation:       "ensure_database",
			}, resolved, test.sslOpts)

			require.ErrorContains(t, err, test.wantError)
			require.NoFileExists(t, job.MainFile)
			require.NoFileExists(t, job.VarsFile)
		})
	}
}

func TestMaterializeResolvedJobIAMModeDoesNotRequireCredentialSecretPrefix(t *testing.T) {
	inputs := map[string]any{
		"auth_mode":          iamAuthMode,
		deploymentTokenInput: "012345abcdef",
		postgresAdminCredentialInput: map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!cluster",
		},
	}
	require.NoError(t, deriveSharedPhysicalDatabaseInputs(TerraformModule{
		Source: testPostgresManagedDatabaseModuleSource,
		Inputs: inputs,
	}, DispatchPayload{
		ApplicationID: "app-123",
		BindingID:     "binding-456",
		Operation:     "ensure_database",
	}))
	require.NotContains(t, inputs, credentialSecretPrefixInput)
}

func TestResolveWithPhysicalDatabaseInstanceRejectsMissingIAMMetadata(t *testing.T) {
	_, err := ResolveWithPhysicalDatabaseInstance(ResolvedLifecycleConfig{
		Module: TerraformModule{Inputs: map[string]any{"auth_mode": iamAuthMode}},
	}, PhysicalDatabaseInstance{
		Endpoint: "legacy.example.com:5432",
		MasterCredentialRef: map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:aws:secretsmanager:us-east-1:361919038798:secret:rds!cluster",
		},
	})

	require.ErrorContains(t, err, "physical database instance metadata is required")
}

func TestRootModuleHCLReexportsPhysicalModuleOutputsWithoutApplicationCredentialOutputs(t *testing.T) {
	hcl := rootModuleHCL(TerraformModule{
		Source: "git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/aws-aurora-managed-cluster?ref=v0.1.0",
	}, nil, map[string]any{}, ProviderSSLOptions{})

	require.Contains(t, hcl, `output "capacity_max" {
  value = try(module.database.capacity_max, null)
}`)
	// Physical modules expose master credentials as credential_refs (and
	// optionally master_* aliases). The worker only reads root outputs, so the
	// generated root must re-export credential_refs and fall back to
	// credential_refs.password when the module omits master_* outputs.
	require.Contains(t, hcl, `output "credential_refs" {
  value     = try(module.database.credential_refs, {})
  sensitive = true
}`)
	require.Contains(t, hcl, `output "master_user_secret_arn" {
  value     = try(coalesce(try(module.database.master_user_secret_arn, null), try(module.database.credential_refs.password.ref, null)), null)
  sensitive = true
}`)
	require.Contains(t, hcl, `output "master_credential_ref" {
  value     = try(coalesce(try(module.database.master_credential_ref, null), try(module.database.credential_refs.password, null)), null)
  sensitive = true
}`)
	require.Contains(t, hcl, `output "runtime_credential_refs" {
  value     = {}
  sensitive = true
}`)
}

func TestRootModuleHCLPreservesLogicalCredentialsWhenGitRefContainsPhysicalModuleName(t *testing.T) {
	hcl := rootModuleHCL(TerraformModule{
		Source: "git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/postgres-managed-database?ref=fix-aurora-migration",
	}, nil, map[string]any{}, ProviderSSLOptions{})

	require.Contains(t, hcl, `output "runtime_credential_refs" {
  value     = try(module.database.runtime_credential_refs, module.database.credential_refs)
  sensitive = true
}`)
	require.NotContains(t, hcl, `output "capacity_max"`)
}

func TestMaterializeJobPassesNestedAuroraDeploymentInputUnchanged(t *testing.T) {
	// The Aurora physical module's capacity contract is a tagged union
	// (`deployment.provisioned` xor `deployment.serverless_v2`) supplied by
	// helm/agent's physicalModuleInputs. Every Terraform module input is
	// declared `type = any` in the generated root and copied verbatim into
	// terraform.tfvars.json (materialize.go), so no orchestrator reshaping
	// is expected — this locks that pass-through contract for both variants.
	for _, test := range []struct {
		name       string
		deployment map[string]any
	}{
		{
			name: "serverless_v2",
			deployment: map[string]any{
				"serverless_v2": map[string]any{
					"auto_pause_seconds": float64(300),
					"instance_count":     float64(1),
					"max_acu":            float64(16),
					"min_acu":            float64(0),
				},
			},
		},
		{
			name: "provisioned",
			deployment: map[string]any{
				"provisioned": map[string]any{
					"instance_class": "db.r6g.large",
					"instance_count": float64(2),
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			root := tempRoot(t)
			job := Job{
				BindingKey:  "physical-database-instance:deployed:production:us-east-1:postgres:aurora",
				WorkingDir:  filepath.Join(root, "aurora-"+test.name),
				MainFile:    filepath.Join(root, "aurora-"+test.name, "main.tf"),
				BackendFile: filepath.Join(root, "aurora-"+test.name, "backend.tfbackend"),
				VarsFile:    filepath.Join(root, "aurora-"+test.name, "terraform.tfvars.json"),
			}

			require.NoError(t, MaterializeJob(job, DispatchPayload{
				BindingKey:      job.BindingKey,
				DesiredSpecHash: "hash-physical",
				Environment:     "deployed",
				Operation:       operationEnsurePhysicalDatabaseInstance,
				Profile:         "production",
				RequestID:       "request-physical",
				ResourceKey:     "physical/aurora-" + test.name,
				TerraformBackend: map[string]any{
					"stateBackend": "s3", "bucket": "state-bucket", "key": "{{resource_key}}.tfstate", "region": "us-east-1",
				},
				TerraformModule: TerraformModule{
					Source: testBundledAuroraModuleSource,
					Inputs: map[string]any{
						"deployment": test.deployment,
						"subnet_ids": []any{"subnet-a", "subnet-b"},
						"vpc_id":     "vpc-example",
					},
				},
			}, testSSLOpts))

			var vars map[string]any
			require.NoError(t, readJSONFile(job.VarsFile, &vars))
			require.Equal(t, test.deployment, vars["deployment"])
		})
	}
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

func TestMaterializeJobCopiesVendoredModulePackageForLocalSources(t *testing.T) {
	root := tempRoot(t)
	moduleRoot := filepath.Join(root, "vendored")
	require.NoError(t, os.MkdirAll(filepath.Join(moduleRoot, "modules", "postgres-managed-database"), 0o700))
	require.NoError(t, os.MkdirAll(filepath.Join(moduleRoot, "modules", "postgres-managed-database-core"), 0o700))
	require.NoError(t, os.WriteFile(
		filepath.Join(moduleRoot, "modules", "postgres-managed-database", "main.tf"),
		[]byte(`module "core" { source = "../postgres-managed-database-core" }`),
		0o600,
	))
	require.NoError(t, os.WriteFile(
		filepath.Join(moduleRoot, "modules", "postgres-managed-database-core", "main.tf"),
		[]byte(`output "ready" { value = true }`),
		0o600,
	))
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJobFromLocalModuleRoot(job, DispatchPayload{
		BindingKey: "app:prod:orders",
		TerraformModule: TerraformModule{
			Source: "./modules/postgres-managed-database",
		},
		TerraformBackend: map[string]any{"stateBackend": "local"},
	}, testSSLOpts, moduleRoot)

	require.NoError(t, err)
	require.FileExists(t, filepath.Join(job.WorkingDir, "modules", "postgres-managed-database", "main.tf"))
	require.FileExists(t, filepath.Join(job.WorkingDir, "modules", "postgres-managed-database-core", "main.tf"))
	mainFile, err := os.ReadFile(job.MainFile)
	require.NoError(t, err)
	require.Contains(t, string(mainFile), `source  = "./modules/postgres-managed-database"`)
}

func TestCopyVendoredModulePackageSkipsRemoteSources(t *testing.T) {
	root := tempRoot(t)

	require.NoError(t, copyVendoredModulePackage(
		filepath.Join(root, "working"),
		testPostgresManagedDatabaseModuleSource,
		filepath.Join(root, "missing-vendored-root"),
	))
}

func TestCopyVendoredModulePackageRejectsInvalidLocalSources(t *testing.T) {
	root := tempRoot(t)
	moduleRoot := filepath.Join(root, "vendored")
	require.NoError(t, os.MkdirAll(filepath.Join(moduleRoot, "modules"), 0o700))
	require.NoError(t, os.WriteFile(filepath.Join(moduleRoot, "modules", "not-a-directory"), []byte("module"), 0o600))

	for _, tc := range []struct {
		name    string
		source  string
		wantErr string
	}{
		{
			name:    "unclean path",
			source:  "./modules/../outside",
			wantErr: "must be a clean path under ./modules",
		},
		{
			name:    "missing module",
			source:  "./modules/missing",
			wantErr: `vendored Terraform module "./modules/missing"`,
		},
		{
			name:    "module is not a directory",
			source:  "./modules/not-a-directory",
			wantErr: "is not a directory",
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			err := copyVendoredModulePackage(filepath.Join(root, "working"), tc.source, moduleRoot)
			require.ErrorContains(t, err, tc.wantErr)
		})
	}
}

func TestCopyVendoredModulePackageReplacesStaleModules(t *testing.T) {
	root := tempRoot(t)
	moduleRoot := filepath.Join(root, "vendored")
	require.NoError(t, os.MkdirAll(filepath.Join(moduleRoot, "modules", "postgres-managed-database"), 0o700))
	require.NoError(t, os.WriteFile(
		filepath.Join(moduleRoot, "modules", "postgres-managed-database", "main.tf"),
		[]byte("# current"),
		0o600,
	))
	workingDir := filepath.Join(root, "working")
	require.NoError(t, os.MkdirAll(filepath.Join(workingDir, "modules", "stale"), 0o700))
	require.NoError(t, os.WriteFile(filepath.Join(workingDir, "modules", "stale", "main.tf"), []byte("# stale"), 0o600))

	require.NoError(t, copyVendoredModulePackage(
		workingDir,
		"./modules/postgres-managed-database",
		moduleRoot,
	))
	require.NoFileExists(t, filepath.Join(workingDir, "modules", "stale", "main.tf"))
	require.FileExists(t, filepath.Join(workingDir, "modules", "postgres-managed-database", "main.tf"))
}

func TestMaterializeJobFromLocalModuleRootPropagatesVendoredCopyErrors(t *testing.T) {
	root := tempRoot(t)
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  filepath.Join(root, "app-prod-orders"),
		MainFile:    filepath.Join(root, "app-prod-orders", "main.tf"),
		BackendFile: filepath.Join(root, "app-prod-orders", "backend.tfbackend"),
		VarsFile:    filepath.Join(root, "app-prod-orders", "terraform.tfvars.json"),
	}

	err := MaterializeJobFromLocalModuleRoot(job, DispatchPayload{
		BindingKey: "app:prod:orders",
		TerraformModule: TerraformModule{
			Source: "./modules/../outside",
		},
		TerraformBackend: map[string]any{"stateBackend": "local"},
	}, testSSLOpts, filepath.Join(root, "vendored"))

	require.ErrorContains(t, err, "must be a clean path under ./modules")
	require.NoFileExists(t, job.MainFile)
}

func TestMaterializeJobFromLocalModuleRootSurfacesWorkingDirectoryErrors(t *testing.T) {
	root := tempRoot(t)
	blocker := filepath.Join(root, "blocker")
	require.NoError(t, os.WriteFile(blocker, []byte("not a directory"), 0o600))
	workingDir := filepath.Join(blocker, "app-prod-orders")
	job := Job{
		BindingKey:  "app:prod:orders",
		WorkingDir:  workingDir,
		MainFile:    filepath.Join(workingDir, "main.tf"),
		BackendFile: filepath.Join(workingDir, "backend.tfbackend"),
		VarsFile:    filepath.Join(workingDir, "terraform.tfvars.json"),
	}

	err := MaterializeJobFromLocalModuleRoot(job, DispatchPayload{
		BindingKey: "app:prod:orders",
		TerraformModule: TerraformModule{
			Source: "./modules/postgres-managed-database",
		},
		TerraformBackend: map[string]any{"stateBackend": "local"},
	}, testSSLOpts, filepath.Join(root, "vendored"))

	require.Error(t, err)
}

func TestCopyVendoredModulePackageSurfacesStaleModuleRemovalErrors(t *testing.T) {
	root := tempRoot(t)
	moduleRoot := filepath.Join(root, "vendored")
	require.NoError(t, os.MkdirAll(filepath.Join(moduleRoot, "modules", "postgres-managed-database"), 0o700))
	workingDir := filepath.Join(root, "working")
	require.NoError(t, os.WriteFile(workingDir, []byte("not a directory"), 0o600))

	err := copyVendoredModulePackage(
		workingDir,
		"./modules/postgres-managed-database",
		moduleRoot,
	)
	require.ErrorContains(t, err, "remove stale vendored Terraform modules")
}

func TestCopyVendoredModulePackageSurfacesCopyErrors(t *testing.T) {
	root := tempRoot(t)
	moduleRoot := filepath.Join(root, "vendored")
	require.NoError(t, os.MkdirAll(filepath.Join(moduleRoot, "modules", "postgres-managed-database"), 0o700))
	require.NoError(t, os.WriteFile(
		filepath.Join(moduleRoot, "modules", "postgres-managed-database", "main.tf"),
		[]byte("# current"),
		0o600,
	))
	workingDir := filepath.Join(root, "working")
	require.NoError(t, os.MkdirAll(workingDir, 0o700))
	require.NoError(t, os.Chmod(workingDir, 0o500))
	t.Cleanup(func() { _ = os.Chmod(workingDir, 0o700) })

	err := copyVendoredModulePackage(
		workingDir,
		"./modules/postgres-managed-database",
		moduleRoot,
	)
	require.ErrorContains(t, err, "copy vendored Terraform modules")
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
	require.Contains(t, main, `resource "aws_secretsmanager_secret" "app" {
  provider = aws.pool_secrets`)
	require.Contains(t, main, `resource "aws_secretsmanager_secret_version" "app" {
  provider      = aws.pool_secrets`)
	require.NotContains(t, main, `resource "aws_secretsmanager_secret" "runtime"`)
	require.NotContains(t, main, `resource "aws_secretsmanager_secret" "migration"`)
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

	var vars map[string]any
	require.NoError(t, readJSONFile(job.VarsFile, &vars))
	require.Equal(t, "verify-full", vars["postgres_sslmode"])
	require.Equal(t, "/etc/rds/global-bundle.pem", vars["postgres_sslrootcert"])
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

func TestValidateTerraformModuleSourceAcceptsOnlyExactBundledModulePaths(t *testing.T) {
	allowed := []string{testBundledAuroraModuleSource, testBundledPostgresModuleSource}

	require.NoError(t, ValidateTerraformModuleSource(TerraformModule{Source: testBundledAuroraModuleSource}, allowed))
	require.NoError(t, ValidateTerraformModuleSource(TerraformModule{Source: testBundledPostgresModuleSource}, allowed))
	require.ErrorContains(t,
		ValidateTerraformModuleSource(TerraformModule{Source: testBundledPostgresModuleSource + "/../postgres-managed-database-core"}, allowed),
		"unsupported Terraform module source",
	)
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
