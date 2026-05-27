package databaselifecycle

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
)

func TestRunFromConfigBootstrapsWorkerAndRunsLoop(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	polls := 0
	err := RunFromConfig(
		ctx,
		Config{
			AgentID:              "agent-1",
			RootDir:              t.TempDir(),
			TerraformBin:         "tofu",
			PollInterval:         time.Millisecond,
			AllowedResourceTypes: []string{"aws_db_instance"},
			AllowedModuleSources: []string{"app.terraform.io/superblocks/rds-postgres/aws"},
		},
		clients.NewServerClient(&clients.ServerClientOptions{URL: "http://127.0.0.1"}),
		CommandExecutorFunc(func(ctx context.Context, command Command) (CommandResult, error) {
			return CommandResult{}, nil
		}),
		NewMemoryLocker(),
		PollLoopFunc(func(ctx context.Context, poller Poller, agentID string, interval time.Duration) error {
			polls++
			require.Equal(t, "agent-1", agentID)
			require.Equal(t, time.Millisecond, interval)
			cancel()
			return nil
		}),
	)

	require.NoError(t, err)
	require.Equal(t, 1, polls)
}

func TestRunFromConfigRejectsInvalidConfig(t *testing.T) {
	err := RunFromConfig(context.Background(), Config{}, nil, nil, nil, nil)

	require.ErrorContains(t, err, "agent id is required")
}
