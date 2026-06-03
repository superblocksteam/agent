package databaselifecycle

import (
	"fmt"
	"strings"
	"time"
)

const (
	envRootDir      = "SUPERBLOCKS_DATABASE_LIFECYCLE_ROOT_DIR"
	envTerraformBin = "SUPERBLOCKS_DATABASE_LIFECYCLE_TERRAFORM_BIN"
	envPollInterval = "SUPERBLOCKS_DATABASE_LIFECYCLE_POLL_INTERVAL"
	envAllowedTypes = "SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES"
	envAllowedMods  = "SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES"
	envSSLMode      = "SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_MODE"
	envSSLRootCert  = "SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_ROOT_CERT"
)

type Config struct {
	// AgentID is the orchestrator's own agent id, supplied by the caller
	// (the worker runs in-process and claims dispatches as the agent that
	// registered this process's environment profiles). It is intentionally
	// not read from the environment.
	AgentID              string
	RootDir              string
	TerraformBin         string
	PollInterval         time.Duration
	AllowedResourceTypes []string
	AllowedModuleSources []string
	// DSN tuning for the worker's only DB connection (the migration
	// runner). SSLMode has no implicit default — operators must opt in
	// to "verify-full" (production answer; requires SSLRootCert) or
	// "require" (encrypt-only, accepted for intra-VPC sandboxes). The
	// DSN builder rejects empty SSLMode at dispatch time so a missing
	// env var fails loud instead of silently shipping an insecure
	// default.
	SSLMode     string
	SSLRootCert string
}

func ConfigFromEnv(getenv func(string) string) (Config, error) {
	config := Config{
		RootDir:      valueOrDefault(getenv(envRootDir), "/var/lib/superblocks/database-lifecycle"),
		TerraformBin: valueOrDefault(getenv(envTerraformBin), "tofu"),
		PollInterval: 30 * time.Second,
	}
	config.AllowedResourceTypes = splitCSV(getenv(envAllowedTypes))
	config.AllowedModuleSources = splitCSV(getenv(envAllowedMods))
	config.SSLMode = getenv(envSSLMode)
	config.SSLRootCert = getenv(envSSLRootCert)
	if rawInterval := getenv(envPollInterval); rawInterval != "" {
		interval, err := time.ParseDuration(rawInterval)
		if err != nil {
			return Config{}, fmt.Errorf("database lifecycle poll interval: %w", err)
		}
		config.PollInterval = interval
	}
	return config, nil
}

func valueOrDefault(value string, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func splitCSV(value string) []string {
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			values = append(values, trimmed)
		}
	}
	return values
}
