package databaselifecycle

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestConfigFromEnvReadsLifecycleWorkerSettings(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_AGENT_ID":               "agent-1",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ROOT_DIR":               "/var/lib/superblocks/database-lifecycle",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_TERRAFORM_BIN":          "/usr/local/bin/tofu",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_POLL_INTERVAL":          "5s",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES": "aws_db_instance, aws_rds_cluster",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES": "app.terraform.io/superblocks/rds-postgres/aws, app.terraform.io/superblocks/aurora-postgres/aws",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_MODE":               "verify-full",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_ROOT_CERT":          "/etc/rds/global-bundle.pem",
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })

	require.NoError(t, err)
	require.Equal(t, Config{
		AgentID:      "agent-1",
		RootDir:      "/var/lib/superblocks/database-lifecycle",
		TerraformBin: "/usr/local/bin/tofu",
		PollInterval: 5 * time.Second,
		AllowedResourceTypes: []string{
			"aws_db_instance",
			"aws_rds_cluster",
		},
		AllowedModuleSources: []string{
			"app.terraform.io/superblocks/rds-postgres/aws",
			"app.terraform.io/superblocks/aurora-postgres/aws",
		},
		SSLMode:     "verify-full",
		SSLRootCert: "/etc/rds/global-bundle.pem",
	}, config)
}

func TestConfigFromEnvHasNoImplicitSSLMode(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_AGENT_ID": "agent-1",
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })

	require.NoError(t, err)
	// SSLMode has NO implicit default (cursor HIGH 2026-05-20). Shipping
	// require-by-default would silently leave migration traffic
	// MITM-vulnerable until operators noticed and overrode. Empty value
	// here flows through to the DSN builder, which fails loud at dispatch
	// time with a clear "must set X to verify-full or require" message
	// rather than silently encrypting without identity validation.
	require.Empty(t, config.SSLMode)
	require.Empty(t, config.SSLRootCert)
}

func TestConfigFromEnvDefaultsOptionalSettings(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_AGENT_ID": "agent-1",
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })

	require.NoError(t, err)
	require.Equal(t, "/var/lib/superblocks/database-lifecycle", config.RootDir)
	require.Equal(t, "tofu", config.TerraformBin)
	require.Equal(t, 30*time.Second, config.PollInterval)
}

func TestConfigFromEnvRequiresAgentID(t *testing.T) {
	_, err := ConfigFromEnv(func(key string) string { return "" })

	require.ErrorContains(t, err, "agent id is required")
}

func TestConfigFromEnvRejectsInvalidPollInterval(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_AGENT_ID":      "agent-1",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_POLL_INTERVAL": "nope",
	}

	_, err := ConfigFromEnv(func(key string) string { return env[key] })

	require.ErrorContains(t, err, "poll interval")
}
