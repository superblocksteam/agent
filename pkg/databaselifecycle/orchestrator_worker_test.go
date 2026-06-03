package databaselifecycle

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

func TestNewOrchestratorRuntimeBuildsWorkerDependencies(t *testing.T) {
	rootDir := t.TempDir()
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ROOT_DIR":               rootDir,
		"SUPERBLOCKS_DATABASE_LIFECYCLE_TERRAFORM_BIN":          "terraform",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_POLL_INTERVAL":          "15s",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES": "aws_db_instance,aws_rds_cluster",
	}

	runtime, err := newOrchestratorRuntime(func(key string) string {
		return env[key]
	}, "agent-1")

	require.NoError(t, err)
	require.Equal(t, "agent-1", runtime.Config.AgentID)
	require.Equal(t, rootDir, runtime.Config.RootDir)
	require.Equal(t, "terraform", runtime.Config.TerraformBin)
	require.Equal(t, []string{"aws_db_instance", "aws_rds_cluster"}, runtime.Config.AllowedResourceTypes)
	require.NotNil(t, runtime.Executor)
	require.NotNil(t, runtime.Locker)
	release, err := runtime.Locker.Lock(context.Background(), "resource-1")
	require.NoError(t, err)
	release()
}

func TestNewOrchestratorRuntimeRejectsInvalidConfig(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_POLL_INTERVAL": "nope",
	}

	_, err := newOrchestratorRuntime(func(key string) string {
		return env[key]
	}, "agent-1")

	require.ErrorContains(t, err, "poll interval")
}

func TestNewOrchestratorServerClientUsesLifecycleAgentID(t *testing.T) {
	var agentID string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		agentID = r.Header.Get("x-superblocks-agent-id")
		require.NoError(t, json.NewEncoder(w).Encode(map[string]any{"data": []any{}}))
	}))
	defer server.Close()

	options := clients.ServerClientOptions{
		URL: server.URL,
		Headers: map[string]string{
			"x-superblocks-agent-id":    "process-agent",
			"x-superblocks-data-domain": "app.superblocks.com",
		},
		SuperblocksAgentKey: "agent-key",
	}

	client := newOrchestratorServerClient(options, "lifecycle-agent")
	_, err := client.PostClaimDatabaseLifecycleDispatches(
		context.Background(),
		nil,
		nil,
		clients.DatabaseLifecycleDispatchClaimRequest{AgentID: "lifecycle-agent"},
	)

	require.NoError(t, err)
	require.Equal(t, "lifecycle-agent", agentID)
	require.Equal(t, "process-agent", options.Headers["x-superblocks-agent-id"])
}

func TestRunOrchestratorWorkerUsesRuntimeConfig(t *testing.T) {
	rootDir := t.TempDir()
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ROOT_DIR":               rootDir,
		"SUPERBLOCKS_DATABASE_LIFECYCLE_TERRAFORM_BIN":          "tofu",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_POLL_INTERVAL":          "15s",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES": "aws_db_instance",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES": "git::https://example.com/module.git",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_MODE":               "require",
	}

	var gotConfig Config
	var gotClient clients.ServerClient
	var gotExecutor CommandExecutor
	var gotLocker ResourceLocker
	err := runOrchestratorWorker(
		context.Background(),
		func(key string) string {
			return env[key]
		},
		clients.ServerClientOptions{},
		"lifecycle-agent",
		zap.NewNop(),
		func(
			ctx context.Context,
			config Config,
			client clients.ServerClient,
			executor CommandExecutor,
			locker ResourceLocker,
			loop PollLoop,
		) error {
			gotConfig = config
			gotClient = client
			gotExecutor = executor
			gotLocker = locker
			return nil
		},
	)

	require.NoError(t, err)
	require.Equal(t, "lifecycle-agent", gotConfig.AgentID)
	require.Equal(t, rootDir, gotConfig.RootDir)
	require.Equal(t, "tofu", gotConfig.TerraformBin)
	require.Equal(t, []string{"aws_db_instance"}, gotConfig.AllowedResourceTypes)
	require.Equal(t, []string{"git::https://example.com/module.git"}, gotConfig.AllowedModuleSources)
	require.Equal(t, "require", gotConfig.SSLMode)
	require.NotNil(t, gotClient)
	require.NotNil(t, gotExecutor)
	require.NotNil(t, gotLocker)
}

func TestRunOrchestratorWorkerRoutesLoopLogsThroughProcessLogger(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ROOT_DIR":               t.TempDir(),
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES": "aws_db_instance",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES": "git::https://example.com/module.git",
	}
	core, logs := observer.New(zap.WarnLevel)
	logger := zap.New(core)

	err := runOrchestratorWorker(
		context.Background(),
		func(key string) string {
			return env[key]
		},
		clients.ServerClientOptions{},
		"lifecycle-agent",
		logger,
		func(
			ctx context.Context,
			config Config,
			client clients.ServerClient,
			executor CommandExecutor,
			locker ResourceLocker,
			loop PollLoop,
		) error {
			// Drive the loop the worker was assembled with: a failing poll
			// must surface through the orchestrator's own zap logger, not a
			// process-global default.
			loopCtx, cancel := context.WithCancel(ctx)
			polls := 0
			return loop.Run(loopCtx, PollOnceFunc(func(ctx context.Context, agentID string) (PollResult, error) {
				polls++
				if polls > 1 {
					cancel()
					return PollResult{}, ctx.Err()
				}
				return PollResult{}, errors.New("control plane unavailable")
			}), config.AgentID, time.Millisecond)
		},
	)

	require.ErrorIs(t, err, context.Canceled)
	entries := logs.FilterMessage("database lifecycle poll failed").All()
	require.Len(t, entries, 1)
	require.Equal(t, "lifecycle-agent", entries[0].ContextMap()["agent_id"])
}
