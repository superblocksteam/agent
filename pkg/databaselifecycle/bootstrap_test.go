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
