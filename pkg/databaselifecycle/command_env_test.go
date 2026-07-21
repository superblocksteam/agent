package databaselifecycle

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestEnsureDockerConfigEnvAddsDefaultWhenUnset(t *testing.T) {
	env := []string{
		"PATH=/usr/local/bin:/usr/bin",
		"HOME=/home/superblocks",
	}

	got := ensureDockerConfigEnv(env)

	require.Equal(t, []string{
		"PATH=/usr/local/bin:/usr/bin",
		"HOME=/home/superblocks",
		"DOCKER_CONFIG=" + defaultDockerConfigDir,
	}, got)
}

func TestEnsureDockerConfigEnvPreservesExplicitOverride(t *testing.T) {
	env := []string{
		"DOCKER_CONFIG=/custom/docker",
		"PATH=/usr/bin",
	}

	got := ensureDockerConfigEnv(env)

	require.Equal(t, env, got)
}

func TestEnsureDockerConfigEnvReplacesEmptyValue(t *testing.T) {
	env := []string{
		"DOCKER_CONFIG=",
		"PATH=/usr/bin",
	}

	got := ensureDockerConfigEnv(env)

	require.Equal(t, []string{
		"PATH=/usr/bin",
		"DOCKER_CONFIG=" + defaultDockerConfigDir,
	}, got)
}

func TestTerraformCommandEnvRewritesPwdToWorkingDir(t *testing.T) {
	got := terraformCommandEnv([]string{
		"PATH=/usr/bin",
		"PWD=/tmp/parent",
	}, "/tmp/workdir")

	require.Equal(t, []string{
		"PATH=/usr/bin",
		"DOCKER_CONFIG=" + defaultDockerConfigDir,
		"PWD=/tmp/workdir",
	}, got)
}
