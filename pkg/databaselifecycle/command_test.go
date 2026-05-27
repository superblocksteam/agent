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
