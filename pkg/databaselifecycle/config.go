package databaselifecycle

import (
	"encoding/json"
	"errors"
	"fmt"
	"sort"
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
	envConfig       = "SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG"
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

	LifecycleConfig LifecycleConfig
}

type LifecycleConfig struct {
	Entries []LifecycleConfigEntry `json:"entries"`
}

type LifecycleConfigEntry struct {
	Environment        string                                `json:"environment"`
	Profile            string                                `json:"profile"`
	Engines            []string                              `json:"engines"`
	Backend            map[string]any                        `json:"backend"`
	CredentialResolver map[string]any                        `json:"credentialResolver"`
	ModuleSelectors    map[string]map[string]TerraformModule `json:"moduleSelectors"`
}

type ResolvedLifecycleConfig struct {
	Module             TerraformModule
	Backend            map[string]any
	CredentialResolver map[string]any
}

func (config LifecycleConfig) Resolve(environment string, profile string, operation string, engine string) (ResolvedLifecycleConfig, error) {
	for _, entry := range config.Entries {
		if entry.Environment != environment || entry.Profile != profile {
			continue
		}
		if !containsString(entry.Engines, engine) {
			return ResolvedLifecycleConfig{}, fmt.Errorf("database lifecycle config entry %s/%s does not support environment %q profile %q operation %q engine %q; supported engines: %s", environment, profile, environment, profile, operation, engine, formatStringList(entry.Engines))
		}
		byEngine, ok := entry.ModuleSelectors[operation]
		if !ok {
			return ResolvedLifecycleConfig{}, fmt.Errorf("database lifecycle config entry %s/%s does not support environment %q profile %q operation %q engine %q; supported operations: %s", environment, profile, environment, profile, operation, engine, formatStringList(moduleSelectorOperations(entry.ModuleSelectors)))
		}
		module, ok := byEngine[engine]
		if !ok {
			return ResolvedLifecycleConfig{}, fmt.Errorf("database lifecycle config entry %s/%s operation %q does not support environment %q profile %q operation %q engine %q; supported engines: %s", environment, profile, operation, environment, profile, operation, engine, formatStringList(terraformModuleKeys(byEngine)))
		}
		return ResolvedLifecycleConfig{
			Module:             module,
			Backend:            entry.Backend,
			CredentialResolver: entry.CredentialResolver,
		}, nil
	}
	return ResolvedLifecycleConfig{}, fmt.Errorf("database lifecycle config has no entry for environment %q profile %q operation %q engine %q; configured entries: %s", environment, profile, operation, engine, formatConfiguredEntries(config.Entries))
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
	if rawConfig := getenv(envConfig); rawConfig != "" {
		lifecycleConfig, err := parseLifecycleConfig(rawConfig)
		if err != nil {
			return Config{}, err
		}
		config.LifecycleConfig = lifecycleConfig
	}
	if rawInterval := getenv(envPollInterval); rawInterval != "" {
		interval, err := time.ParseDuration(rawInterval)
		if err != nil {
			return Config{}, fmt.Errorf("database lifecycle poll interval: %w", err)
		}
		config.PollInterval = interval
	}
	return config, nil
}

func parseLifecycleConfig(raw string) (LifecycleConfig, error) {
	var config LifecycleConfig
	if err := json.Unmarshal([]byte(raw), &config); err != nil {
		return LifecycleConfig{}, fmt.Errorf("database lifecycle config: %w", err)
	}
	if len(config.Entries) == 0 {
		return LifecycleConfig{}, errors.New("database lifecycle config entries are required")
	}
	seenEntries := map[string]struct{}{}
	for index, entry := range config.Entries {
		if err := validateLifecycleConfigEntry(index, entry); err != nil {
			return LifecycleConfig{}, err
		}
		key := entry.Environment + "\x00" + entry.Profile
		if _, exists := seenEntries[key]; exists {
			return LifecycleConfig{}, fmt.Errorf("database lifecycle config entries[%d] duplicates environment %q profile %q", index, entry.Environment, entry.Profile)
		}
		seenEntries[key] = struct{}{}
	}
	return config, nil
}

func validateLifecycleConfigEntry(index int, entry LifecycleConfigEntry) error {
	prefix := fmt.Sprintf("database lifecycle config entries[%d]", index)
	if !isSupportedEnvironment(entry.Environment) {
		return fmt.Errorf("%s.environment must be one of edit, preview, deployed", prefix)
	}
	if entry.Profile == "" {
		return fmt.Errorf("%s.profile is required", prefix)
	}
	if len(entry.Engines) == 0 {
		return fmt.Errorf("%s.engines is required", prefix)
	}
	for engineIndex, engine := range entry.Engines {
		if engine == "" {
			return fmt.Errorf("%s.engines[%d] is required", prefix, engineIndex)
		}
	}
	if len(entry.Backend) == 0 {
		return fmt.Errorf("%s.backend is required", prefix)
	}
	if len(entry.CredentialResolver) == 0 {
		return fmt.Errorf("%s.credentialResolver is required", prefix)
	}
	if len(entry.ModuleSelectors) == 0 {
		return fmt.Errorf("%s.moduleSelectors is required", prefix)
	}
	for operation, byEngine := range entry.ModuleSelectors {
		if operation == "" {
			return fmt.Errorf("%s.moduleSelectors operation key is required", prefix)
		}
		if len(byEngine) == 0 {
			return fmt.Errorf("%s.moduleSelectors.%s engines are required", prefix, operation)
		}
		for engine, module := range byEngine {
			if engine == "" {
				return fmt.Errorf("%s.moduleSelectors.%s engine key is required", prefix, operation)
			}
			if module.Source == "" {
				return fmt.Errorf("%s.moduleSelectors.%s.%s.source is required", prefix, operation, engine)
			}
		}
	}
	return nil
}

func isSupportedEnvironment(environment string) bool {
	switch environment {
	case "edit", "preview", "deployed":
		return true
	default:
		return false
	}
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

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func formatConfiguredEntries(entries []LifecycleConfigEntry) string {
	if len(entries) == 0 {
		return "<none>"
	}
	formatted := make([]string, 0, len(entries))
	for _, entry := range entries {
		formatted = append(formatted, fmt.Sprintf("%s/%s engines=%s operations=%s", entry.Environment, entry.Profile, formatStringList(entry.Engines), formatStringList(moduleSelectorOperations(entry.ModuleSelectors))))
	}
	sort.Strings(formatted)
	return strings.Join(formatted, "; ")
}

func formatStringList(values []string) string {
	if len(values) == 0 {
		return "[]"
	}
	sorted := append([]string(nil), values...)
	sort.Strings(sorted)
	return "[" + strings.Join(sorted, ", ") + "]"
}

func moduleSelectorOperations(selectors map[string]map[string]TerraformModule) []string {
	operations := make([]string, 0, len(selectors))
	for operation := range selectors {
		operations = append(operations, operation)
	}
	return operations
}

func terraformModuleKeys(modules map[string]TerraformModule) []string {
	keys := make([]string, 0, len(modules))
	for key := range modules {
		keys = append(keys, key)
	}
	return keys
}
