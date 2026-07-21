package databaselifecycle

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestBinaryCommandExecutorRunsConfiguredBinary(t *testing.T) {
	dir := t.TempDir()
	binary := filepath.Join(dir, "tofu")
	require.NoError(t, os.WriteFile(binary, []byte("#!/usr/bin/env bash\nprintf 'stdout:%s:%s' \"$1\" \"$2\"\nprintf 'stderr:%s' \"$PWD\" >&2\n"), 0o700))

	result, err := NewBinaryCommandExecutor(binary).Run(context.Background(), Command{
		Name: "plan",
		Args: []string{"-out=tfplan"},
		Dir:  dir,
	})

	require.NoError(t, err)
	require.Equal(t, "stdout:plan:-out=tfplan", result.Stdout)
	require.Equal(t, "stderr:"+dir, result.Stderr)
}

func TestBinaryCommandExecutorRequiresBinary(t *testing.T) {
	_, err := NewBinaryCommandExecutor("").Run(context.Background(), Command{Name: "plan"})

	require.ErrorContains(t, err, "binary is required")
}

func TestBinaryCommandExecutorInjectsDockerConfigForTerraform(t *testing.T) {
	dir := t.TempDir()
	binary := filepath.Join(dir, "tofu")
	require.NoError(t, os.WriteFile(binary, []byte("#!/usr/bin/env bash\nprintf '%s' \"$DOCKER_CONFIG\"\n"), 0o700))
	t.Setenv("DOCKER_CONFIG", "")

	result, err := NewBinaryCommandExecutor(binary).Run(context.Background(), Command{
		Name: "init",
		Dir:  dir,
	})

	require.NoError(t, err)
	require.Equal(t, defaultDockerConfigDir, result.Stdout)
}

func TestBinaryCommandExecutorCombinesInheritedEnvironmentWithCommandOverrides(t *testing.T) {
	dir := t.TempDir()
	binary := filepath.Join(dir, "tofu")
	require.NoError(t, os.WriteFile(binary, []byte("#!/usr/bin/env bash\nprintf '%s:%s:%s' \"$INHERITED_VALUE\" \"$PGUSER\" \"$PGPASSWORD\"\n"), 0o700))
	t.Setenv("INHERITED_VALUE", "inherited")
	originalPGUser := os.Getenv("PGUSER")
	originalPGPassword := os.Getenv("PGPASSWORD")

	result, err := NewBinaryCommandExecutor(binary).Run(context.Background(), Command{
		Name: "plan",
		Dir:  dir,
		Env: map[string]string{
			"PGPASSWORD": "transient-password",
			"PGUSER":     "transient-user",
		},
	})

	require.NoError(t, err)
	require.Equal(t, "inherited:transient-user:transient-password", result.Stdout)
	require.Equal(t, "inherited", os.Getenv("INHERITED_VALUE"))
	require.Equal(t, originalPGUser, os.Getenv("PGUSER"))
	require.Equal(t, originalPGPassword, os.Getenv("PGPASSWORD"))
}
