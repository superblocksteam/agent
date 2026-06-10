package databaselifecycle

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
)

func TestBootstrapWorkerBuildsWorkerFromConfig(t *testing.T) {
	worker, interval, err := BootstrapWorker(
		Config{
			AgentID:              "agent-1",
			RootDir:              t.TempDir(),
			TerraformBin:         "tofu",
			PollInterval:         5 * time.Second,
			AllowedResourceTypes: []string{"aws_db_instance"},
			AllowedModuleSources: []string{"app.terraform.io/superblocks/rds-postgres/aws"},
		},
		clients.NewServerClient(&clients.ServerClientOptions{URL: "http://127.0.0.1"}),
		CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) { return CommandResult{}, nil }),
		NewMemoryLocker(),
	)

	require.NoError(t, err)
	require.NotNil(t, worker)
	require.Equal(t, 5*time.Second, interval)
}

func TestBootstrapWorkerRejectsLifecycleConfigWithInvalidModuleShape(t *testing.T) {
	_, _, err := BootstrapWorker(
		Config{
			AgentID:              "agent-1",
			RootDir:              t.TempDir(),
			TerraformBin:         "tofu",
			PollInterval:         5 * time.Second,
			AllowedResourceTypes: []string{"aws_db_instance"},
			AllowedModuleSources: []string{"app.terraform.io/superblocks/rds-postgres/aws"},
			LifecycleConfig:      testLifecycleConfig("app.terraform.io/superblocks/rds-postgres/aws"),
			ModuleShapes: map[string]TerraformModuleShape{
				"app.terraform.io/superblocks/rds-postgres/aws": {
					Variables: []string{"binding_key", "desired_spec_hash", "environment_class", "environment_name", "operation", "profile_id", "request_id"},
				},
			},
		},
		clients.NewServerClient(&clients.ServerClientOptions{URL: "http://127.0.0.1"}),
		CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) { return CommandResult{}, nil }),
		NewMemoryLocker(),
	)

	require.ErrorContains(t, err, `does not declare system variable "resource_key"`)
}

func TestDSNOptionsFromConfigWiresCredentialResolver(t *testing.T) {
	t.Setenv("SUPERBLOCKS_SECRETS_REFRESOLVER_ALLOWED_REF_PREFIXES", "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/")

	opts := dsnOptionsFromConfig(Config{
		SSLMode:     "verify-full",
		SSLRootCert: "/etc/rds/global-bundle.pem",
	})

	require.Equal(t, "verify-full", opts.SSLMode)
	require.Equal(t, "/etc/rds/global-bundle.pem", opts.SSLRootCert)
	require.Equal(t, []string{"arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"}, opts.AllowedRefPrefixes)
	require.NotNil(t, opts.ResolverFactory)
}

func TestBootstrapWorkerRejectsMissingConfig(t *testing.T) {
	_, _, err := BootstrapWorker(Config{}, nil, nil, nil)

	require.ErrorContains(t, err, "agent id is required")
}

func TestBootstrapWorkerRejectsMissingPolicyAllowlists(t *testing.T) {
	baseConfig := Config{
		AgentID:      "agent-1",
		RootDir:      t.TempDir(),
		TerraformBin: "tofu",
		PollInterval: 5 * time.Second,
	}
	client := clients.NewServerClient(&clients.ServerClientOptions{URL: "http://127.0.0.1"})
	executor := CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) { return CommandResult{}, nil })

	_, _, err := BootstrapWorker(baseConfig, client, executor, NewMemoryLocker())
	require.ErrorContains(t, err, "allowed resource types are required")

	configWithResourceTypes := baseConfig
	configWithResourceTypes.AllowedResourceTypes = []string{"aws_db_instance"}
	_, _, err = BootstrapWorker(configWithResourceTypes, client, executor, NewMemoryLocker())
	require.ErrorContains(t, err, "allowed module sources are required")
}

func testLifecycleConfig(moduleSource string) LifecycleConfig {
	return LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				"ensure_database": terraformOperation(map[string]TerraformModule{
					"postgres": {Source: moduleSource},
				}),
			},
		}},
	}
}
