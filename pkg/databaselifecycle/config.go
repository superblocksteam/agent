package databaselifecycle

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
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

	operationMigrateSchema  = "migrate_schema"
	operationRetireDatabase = "retire_database"

	lifecycleStateCancelled = "cancelled"
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
	Environment              string                        `json:"environment"`
	Profiles                 []string                      `json:"profiles"`
	Engines                  []string                      `json:"engines"`
	Operations               map[string]LifecycleOperation `json:"operations"`
	LegacyBackend            map[string]any                `json:"backend,omitempty"`
	LegacyCredentialResolver map[string]any                `json:"credentialResolver,omitempty"`
	LegacyModuleSelectors    map[string]any                `json:"moduleSelectors,omitempty"`
}

type LifecycleOperation struct {
	Backend          string                     `json:"backend"`
	PhysicalDatabase *PhysicalDatabasePolicy    `json:"physicalDatabase,omitempty"`
	Terraform        *TerraformOperationBackend `json:"terraform,omitempty"`
}

type PhysicalDatabaseMode string

const (
	PhysicalDatabaseModeDedicated  PhysicalDatabaseMode = "dedicated"
	PhysicalDatabaseModeNone       PhysicalDatabaseMode = "none"
	PhysicalDatabaseModeSharedPool PhysicalDatabaseMode = "shared_pool"
)

type PhysicalDatabaseOnExhausted string

const (
	PhysicalDatabaseOnExhaustedProvision PhysicalDatabaseOnExhausted = "provision"
)

type PhysicalDatabasePolicy struct {
	Mode               PhysicalDatabaseMode        `json:"mode"`
	ProvisionOperation string                      `json:"provisionOperation,omitempty"`
	OnExhausted        PhysicalDatabaseOnExhausted `json:"onExhausted,omitempty"`
	CapacityMax        int                         `json:"capacityMax,omitempty"`
	SecurityClass      string                      `json:"securityClass,omitempty"`
}

type TerraformOperationBackend struct {
	Backend            map[string]any             `json:"backend"`
	CredentialResolver map[string]any             `json:"credentialResolver"`
	ModuleSelectors    map[string]TerraformModule `json:"moduleSelectors"`
}

type ResolvedLifecycleConfig struct {
	Module             TerraformModule
	Backend            map[string]any
	CredentialResolver map[string]any
	PhysicalDatabase   *PhysicalDatabasePolicy
}

func (config LifecycleConfig) Resolve(environment string, profile string, operation string, engine string) (ResolvedLifecycleConfig, error) {
	for _, entry := range config.Entries {
		if entry.Environment != environment || !entry.SupportsProfile(profile) {
			continue
		}
		if !containsString(entry.Engines, engine) {
			return ResolvedLifecycleConfig{}, fmt.Errorf("database lifecycle config entry %s/%s does not support environment %q profile %q operation %q engine %q; supported engines: %s", environment, profile, environment, profile, operation, engine, formatStringList(entry.Engines))
		}
		byEngine, backend, credentialResolver, err := entry.resolveTerraformOperation(operation)
		if err != nil {
			return ResolvedLifecycleConfig{}, fmt.Errorf("database lifecycle config entry %s/%s does not support environment %q profile %q operation %q engine %q; %w", environment, profile, environment, profile, operation, engine, err)
		}
		if byEngine == nil {
			return ResolvedLifecycleConfig{}, fmt.Errorf("database lifecycle config entry %s/%s operation %q uses backend %q and does not resolve to Terraform", environment, profile, operation, entry.Operations[operation].Backend)
		}
		module, ok := byEngine[engine]
		if !ok {
			return ResolvedLifecycleConfig{}, fmt.Errorf("database lifecycle config entry %s/%s operation %q does not support environment %q profile %q operation %q engine %q; supported engines: %s", environment, profile, operation, environment, profile, operation, engine, formatStringList(terraformModuleKeys(byEngine)))
		}
		return ResolvedLifecycleConfig{
			Module:             module,
			Backend:            backend,
			CredentialResolver: credentialResolver,
			PhysicalDatabase:   entry.Operations[operation].PhysicalDatabase,
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
		for _, profile := range entry.Profiles {
			key := entry.Environment + "\x00" + profile
			if _, exists := seenEntries[key]; exists {
				return LifecycleConfig{}, fmt.Errorf("database lifecycle config entries[%d] duplicates environment %q profile %q", index, entry.Environment, profile)
			}
			seenEntries[key] = struct{}{}
		}
	}
	if err := validateLifecycleConfigCoverage(config); err != nil {
		return LifecycleConfig{}, err
	}
	if err := validateLifecycleConfigPhysicalPoolingConsistency(config); err != nil {
		return LifecycleConfig{}, err
	}
	return config, nil
}

type physicalPoolingSignature struct {
	Policy          PhysicalDatabasePolicy
	PhysicalBackend map[string]any
	PhysicalModules map[string]TerraformModule
}

func physicalPoolingSignatureFromEntry(entry LifecycleConfigEntry) (*physicalPoolingSignature, error) {
	ensureOperation, ok := entry.Operations["ensure_database"]
	if !ok || ensureOperation.PhysicalDatabase == nil {
		return nil, nil
	}
	switch ensureOperation.PhysicalDatabase.Mode {
	case PhysicalDatabaseModeSharedPool, PhysicalDatabaseModeDedicated:
	default:
		return nil, nil
	}
	provisionOperation := ensureOperation.PhysicalDatabase.ProvisionOperation
	if provisionOperation == "" {
		return nil, fmt.Errorf("database lifecycle config environment %q profile %q ensure_database.physicalDatabase.provisionOperation is required when mode is %s", entry.Environment, formatStringList(entry.Profiles), ensureOperation.PhysicalDatabase.Mode)
	}
	physicalOperation, ok := entry.Operations[provisionOperation]
	if !ok {
		return nil, fmt.Errorf("database lifecycle config environment %q profile %q physicalDatabase.provisionOperation %s is not configured in this entry", entry.Environment, formatStringList(entry.Profiles), provisionOperation)
	}
	if physicalOperation.Backend != "terraform" || physicalOperation.Terraform == nil {
		return nil, fmt.Errorf("database lifecycle config environment %q profile %q operation %s must use backend terraform", entry.Environment, formatStringList(entry.Profiles), provisionOperation)
	}
	return &physicalPoolingSignature{
		Policy:          *ensureOperation.PhysicalDatabase,
		PhysicalBackend: physicalOperation.Terraform.Backend,
		PhysicalModules: physicalOperation.Terraform.ModuleSelectors,
	}, nil
}

func validateLifecycleConfigPhysicalPoolingConsistency(config LifecycleConfig) error {
	byEnvironment := map[string][]LifecycleConfigEntry{}
	for _, entry := range config.Entries {
		byEnvironment[entry.Environment] = append(byEnvironment[entry.Environment], entry)
	}
	for environment, entries := range byEnvironment {
		if len(entries) < 2 {
			continue
		}
		var reference []byte
		poolingEntries := 0
		for _, entry := range entries {
			signature, err := physicalPoolingSignatureFromEntry(entry)
			if err != nil {
				return err
			}
			if signature == nil {
				continue
			}
			poolingEntries++
			encoded, err := json.Marshal(signature)
			if err != nil {
				return fmt.Errorf("database lifecycle config environment %q physical database pooling signature: %w", environment, err)
			}
			if reference == nil {
				reference = encoded
				continue
			}
			if !bytes.Equal(reference, encoded) {
				return fmt.Errorf("database lifecycle config environment %q has conflicting physical database pooling configuration across entries", environment)
			}
		}
		if poolingEntries > 0 && poolingEntries < len(entries) {
			return fmt.Errorf("database lifecycle config environment %q mixes physical database pooling and non-pooling entries", environment)
		}
	}
	return nil
}

func validateLifecycleConfigEntry(index int, entry LifecycleConfigEntry) error {
	prefix := fmt.Sprintf("database lifecycle config entries[%d]", index)
	if !isSupportedEnvironment(entry.Environment) {
		return fmt.Errorf("%s.environment must be one of edit, preview, deployed", prefix)
	}
	if len(entry.Profiles) == 0 {
		return fmt.Errorf("%s.profiles is required", prefix)
	}
	for profileIndex, profile := range entry.Profiles {
		if profile == "" {
			return fmt.Errorf("%s.profiles[%d] is required", prefix, profileIndex)
		}
	}
	if len(entry.Engines) == 0 {
		return fmt.Errorf("%s.engines is required", prefix)
	}
	for engineIndex, engine := range entry.Engines {
		if engine == "" {
			return fmt.Errorf("%s.engines[%d] is required", prefix, engineIndex)
		}
	}
	if len(entry.LegacyBackend) > 0 || len(entry.LegacyCredentialResolver) > 0 || len(entry.LegacyModuleSelectors) > 0 {
		return fmt.Errorf("%s uses legacy entry-level backend/credentialResolver/moduleSelectors fields; migrate to entries[].operations.<operation>.backend = \"terraform\" with entries[].operations.<operation>.terraform.{backend,credentialResolver,moduleSelectors}", prefix)
	}
	if len(entry.Operations) == 0 {
		return fmt.Errorf("%s.operations is required", prefix)
	}
	return validateLifecycleOperations(prefix, entry)
}

func validateLifecycleOperations(prefix string, entry LifecycleConfigEntry) error {
	for operation, config := range entry.Operations {
		if operation == "" {
			return fmt.Errorf("%s.operations operation key is required", prefix)
		}
		switch config.Backend {
		case "terraform":
			if config.Terraform == nil {
				return fmt.Errorf("%s.operations.%s.terraform is required", prefix, operation)
			}
			if len(config.Terraform.Backend) == 0 {
				return fmt.Errorf("%s.operations.%s.terraform.backend is required", prefix, operation)
			}
			if len(config.Terraform.CredentialResolver) == 0 {
				return fmt.Errorf("%s.operations.%s.terraform.credentialResolver is required", prefix, operation)
			}
			if err := validateTerraformModuleSelectorEngines(fmt.Sprintf("%s.operations.%s.terraform.moduleSelectors", prefix, operation), entry.Engines, config.Terraform.ModuleSelectors); err != nil {
				return err
			}
		case "native_runner":
			if operation != operationMigrateSchema {
				return fmt.Errorf("%s.operations.%s.backend native_runner is only supported for %s", prefix, operation, operationMigrateSchema)
			}
			if config.Terraform != nil {
				return fmt.Errorf("%s.operations.%s.terraform must be omitted for backend native_runner", prefix, operation)
			}
		case "":
			return fmt.Errorf("%s.operations.%s.backend is required", prefix, operation)
		default:
			return fmt.Errorf("%s.operations.%s.backend must be one of native_runner, terraform", prefix, operation)
		}
		if err := validatePhysicalDatabasePolicy(fmt.Sprintf("%s.operations.%s.physicalDatabase", prefix, operation), operation, config.PhysicalDatabase, entry.Operations); err != nil {
			return err
		}
	}
	return nil
}

func validatePhysicalDatabasePolicy(prefix string, operation string, policy *PhysicalDatabasePolicy, operations map[string]LifecycleOperation) error {
	if policy == nil {
		return nil
	}
	if operation != "ensure_database" {
		return fmt.Errorf("%s is only supported for ensure_database", prefix)
	}
	if policy.CapacityMax < 0 {
		return fmt.Errorf("%s.capacityMax must be a non-negative integer", prefix)
	}
	switch policy.Mode {
	case PhysicalDatabaseModeNone:
		if policy.ProvisionOperation != "" {
			return fmt.Errorf("%s.provisionOperation must be omitted when mode is none", prefix)
		}
		if policy.OnExhausted != "" {
			return fmt.Errorf("%s.onExhausted must be omitted when mode is none", prefix)
		}
	case PhysicalDatabaseModeSharedPool, PhysicalDatabaseModeDedicated:
		if policy.ProvisionOperation == "" {
			return fmt.Errorf("%s.provisionOperation is required when mode is %s", prefix, policy.Mode)
		}
		switch policy.OnExhausted {
		case PhysicalDatabaseOnExhaustedProvision:
		default:
			return fmt.Errorf("%s.onExhausted must be provision when mode is %s", prefix, policy.Mode)
		}
		if _, exists := operations[policy.ProvisionOperation]; !exists {
			return fmt.Errorf("%s.provisionOperation %s is not configured in this entry", prefix, policy.ProvisionOperation)
		}
	case "":
		return fmt.Errorf("%s.mode is required", prefix)
	default:
		return fmt.Errorf("%s.mode must be one of none, shared_pool, dedicated", prefix)
	}
	return nil
}

func validateTerraformModuleSelectorEngines(prefix string, engines []string, byEngine map[string]TerraformModule) error {
	if len(byEngine) == 0 {
		return fmt.Errorf("%s engines are required", prefix)
	}
	for engine, module := range byEngine {
		if engine == "" {
			return fmt.Errorf("%s engine key is required", prefix)
		}
		if module.Source == "" {
			return fmt.Errorf("%s.%s.source is required", prefix, engine)
		}
	}
	for _, engine := range engines {
		if _, ok := byEngine[engine]; !ok {
			return fmt.Errorf("%s.%s is required for declared engine", prefix, engine)
		}
	}
	return nil
}

func validateLifecycleConfigCoverage(config LifecycleConfig) error {
	engines := make([]string, 0, len(config.Entries))
	operations := make([]string, 0, len(config.Entries))

	for _, entry := range config.Entries {
		engines = append(engines, entry.Engines...)
		operations = append(operations, entry.operationNames()...)
	}

	allOperations := sortedUniqueStrings(operations)
	allEngines := sortedUniqueStrings(engines)
	for index, entry := range config.Entries {
		entryOperations := sortedUniqueStrings(entry.operationNames())
		if !slices.Equal(entryOperations, allOperations) {
			return fmt.Errorf("database lifecycle config entries[%d].operations must match configured operations %s", index, formatStringList(allOperations))
		}
		entryEngines := sortedUniqueStrings(entry.Engines)
		if !slices.Equal(entryEngines, allEngines) {
			return fmt.Errorf("database lifecycle config entries[%d].engines must match configured engines %s", index, formatStringList(allEngines))
		}
	}

	return nil
}

func (entry LifecycleConfigEntry) operationNames() []string {
	operations := make([]string, 0, len(entry.Operations))
	for operation := range entry.Operations {
		operations = append(operations, operation)
	}
	return operations
}

func (entry LifecycleConfigEntry) resolveTerraformOperation(operation string) (map[string]TerraformModule, map[string]any, map[string]any, error) {
	config, ok := entry.Operations[operation]
	if !ok {
		return nil, nil, nil, fmt.Errorf("supported operations: %s", formatStringList(entry.operationNames()))
	}
	if config.Backend != "terraform" {
		return nil, nil, nil, nil
	}
	if config.Terraform == nil {
		return nil, nil, nil, fmt.Errorf("operation %q has incomplete Terraform backend config", operation)
	}

	return map[string]TerraformModule(config.Terraform.ModuleSelectors), config.Terraform.Backend, config.Terraform.CredentialResolver, nil
}

func (entry LifecycleConfigEntry) SupportsProfile(profile string) bool {
	return containsString(entry.Profiles, profile) || containsString(entry.Profiles, "*")
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

func sortedUniqueStrings(values []string) []string {
	unique := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		unique = append(unique, value)
	}
	sort.Strings(unique)
	return unique
}

func formatConfiguredEntries(entries []LifecycleConfigEntry) string {
	if len(entries) == 0 {
		return "<none>"
	}
	formatted := make([]string, 0, len(entries))
	for _, entry := range entries {
		formatted = append(formatted, fmt.Sprintf("%s profiles=%s engines=%s operations=%s", entry.Environment, formatStringList(entry.Profiles), formatStringList(entry.Engines), formatStringList(entry.operationNames())))
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

func terraformModuleKeys(modules map[string]TerraformModule) []string {
	keys := make([]string, 0, len(modules))
	for key := range modules {
		keys = append(keys, key)
	}
	return keys
}
