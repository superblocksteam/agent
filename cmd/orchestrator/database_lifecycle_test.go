package main

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestNewDatabaseLifecycleRuntimeBuildsWorkerDependencies(t *testing.T) {
	rootDir := t.TempDir()
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_AGENT_ID":               "agent-1",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ROOT_DIR":               rootDir,
		"SUPERBLOCKS_DATABASE_LIFECYCLE_TERRAFORM_BIN":          "terraform",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_POLL_INTERVAL":          "15s",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES": "aws_db_instance,aws_rds_cluster",
	}

	runtime, err := newDatabaseLifecycleRuntime(func(key string) string {
		return env[key]
	})

	require.NoError(t, err)
	require.Equal(t, "agent-1", runtime.config.AgentID)
	require.Equal(t, rootDir, runtime.config.RootDir)
	require.Equal(t, "terraform", runtime.config.TerraformBin)
	require.Equal(t, []string{"aws_db_instance", "aws_rds_cluster"}, runtime.config.AllowedResourceTypes)
	require.NotNil(t, runtime.executor)
	require.NotNil(t, runtime.locker)
	release, err := runtime.locker.Lock(context.Background(), "resource-1")
	require.NoError(t, err)
	release()
}

func TestNewDatabaseLifecycleRuntimeRejectsInvalidConfig(t *testing.T) {
	_, err := newDatabaseLifecycleRuntime(func(string) string {
		return ""
	})

	require.ErrorContains(t, err, "database lifecycle agent id is required")
}

func TestDatabaseLifecycleWorkerContextCancelsWithParent(t *testing.T) {
	parent, cancelParent := context.WithCancel(context.Background())
	ctx, stop := databaseLifecycleWorkerContext(parent)
	defer stop()

	cancelParent()

	select {
	case <-ctx.Done():
	case <-time.After(time.Second):
		t.Fatal("database lifecycle worker context was not canceled")
	}
}
