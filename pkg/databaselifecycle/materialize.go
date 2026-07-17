package databaselifecycle

import (
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
	"golang.org/x/sys/unix"
)

const (
	credentialSecretPrefixInput  = "credential_secret_prefix"
	deploymentTokenInput         = "deployment_token"
	defaultLocalModuleRoot       = "/opt/superblocks/terraform-modules"
	postgresAdminCredentialInput = "postgres_admin_credential_ref"
)

var deploymentTokenPattern = regexp.MustCompile(`^[0-9a-f]{12}$`)

var generatedSharedModeSecretInputs = map[string]struct{}{
	"runtime_credential_ref":        {},
	"runtime_password_wo":           {},
	"runtime_password_wo_version":   {},
	"migration_credential_ref":      {},
	"migration_password_wo":         {},
	"migration_password_wo_version": {},
	"migration_role_name":           {},
	credentialSecretPrefixInput:     {},
	postgresAdminCredentialInput:    {},
}

var iamOmittedSecretInputs = map[string]struct{}{
	"credential_resolver":           {},
	credentialSecretPrefixInput:     {},
	"migration_credential_ref":      {},
	"migration_password_wo":         {},
	"migration_password_wo_version": {},
	"postgres_admin_password":       {},
	"postgres_admin_username":       {},
	"runtime_credential_ref":        {},
	"runtime_password_wo":           {},
	"runtime_password_wo_version":   {},
}

// ProviderSSLOptions configures the shared-mode PostgreSQL TLS posture.
// Password mode renders these values in the root provider; IAM mode
// persists only these non-secret values and injects their libpq
// equivalents into plan/apply/destroy. The values match the migration
// runner so both paths use the same CA pinning. IAM requires verify-full.
type ProviderSSLOptions struct {
	Mode               string
	RootCert           string
	AllowedRefPrefixes []string
}

func MaterializeResolvedJob(job Job, dispatch DispatchPayload, resolved ResolvedLifecycleConfig, sslOpts ProviderSSLOptions) error {
	module := resolved.Module
	module.Inputs = copyTerraformModuleInputs(module.Inputs)
	if err := deriveSharedPhysicalDatabaseInputs(module, dispatch); err != nil {
		return err
	}
	if len(resolved.CredentialResolver) > 0 {
		if _, exists := module.Inputs["credential_resolver"]; exists {
			return fmt.Errorf("database lifecycle Terraform module input %q conflicts with local lifecycle credential resolver", "credential_resolver")
		}
		module.Inputs["credential_resolver"] = resolved.CredentialResolver
	}
	dispatch.TerraformModule = module
	dispatch.TerraformBackend = resolved.Backend
	if err := MaterializeJob(job, dispatch, sslOpts); err != nil {
		return fmt.Errorf("materialize resolved database lifecycle job: %w", err)
	}
	return nil
}

func ResolveWithPhysicalDatabaseInstance(resolved ResolvedLifecycleConfig, instance PhysicalDatabaseInstance) (ResolvedLifecycleConfig, error) {
	resolved.Module.Inputs = copyTerraformModuleInputs(resolved.Module.Inputs)
	if isIAMAuthModule(resolved.Module.Inputs) {
		trustedInputs, err := trustedIAMPhysicalDatabaseInputs(instance.Metadata)
		if err != nil {
			return ResolvedLifecycleConfig{}, err
		}
		for key, value := range trustedInputs {
			resolved.Module.Inputs[key] = value
		}
		resolved.Module.Inputs[postgresAdminCredentialInput] = instance.MasterCredentialRef
		return resolved, nil
	}
	host, port, hasPort := splitPhysicalDatabaseInstanceEndpoint(instance.Endpoint)
	resolved.Module.Inputs["host"] = host
	if hasPort {
		resolved.Module.Inputs["port"] = port
	} else {
		setTerraformModuleInputDefault(resolved.Module.Inputs, "port", 5432)
	}
	resolved.Module.Inputs[postgresAdminCredentialInput] = instance.MasterCredentialRef
	return resolved, nil
}

func trustedIAMPhysicalDatabaseInputs(metadata map[string]any) (map[string]any, error) {
	if metadata == nil {
		return nil, unsupportedSharedModeCredentialRef("physical database instance metadata is required in aws_iam_role mode")
	}
	host, ok := stringMapValue(metadata, "host")
	if !ok {
		return nil, unsupportedSharedModeCredentialRef("physical database instance metadata.host is required in aws_iam_role mode")
	}
	port, ok := descriptorInteger(metadata["port"])
	if !ok || port < 1 || port > 65535 {
		return nil, unsupportedSharedModeCredentialRef("physical database instance metadata.port must be an integer between 1 and 65535 in aws_iam_role mode")
	}
	accountID, ok := stringMapValue(metadata, "aws_account_id")
	if !ok || !awsAccountIDPattern.MatchString(accountID) {
		return nil, unsupportedSharedModeCredentialRef("physical database instance metadata.aws_account_id must contain exactly 12 digits in aws_iam_role mode")
	}
	clusterResourceID, ok := stringMapValue(metadata, "cluster_resource_id")
	if !ok || !clusterResourceIDPattern.MatchString(clusterResourceID) {
		return nil, unsupportedSharedModeCredentialRef("physical database instance metadata.cluster_resource_id is invalid in aws_iam_role mode")
	}
	region, ok := stringMapValue(metadata, "region")
	if !ok || !awsRegionPattern.MatchString(region) {
		return nil, unsupportedSharedModeCredentialRef("physical database instance metadata.region is invalid in aws_iam_role mode")
	}
	if err := validateRDSHostname(host, region); err != nil {
		return nil, unsupportedSharedModeCredentialRef(strings.Replace(err.Error(), "connection_metadata.", "physical database instance metadata.", 1))
	}
	return map[string]any{
		"aws_account_id":      accountID,
		"cluster_resource_id": clusterResourceID,
		"host":                host,
		"port":                port,
		"region":              region,
	}, nil
}

func splitPhysicalDatabaseInstanceEndpoint(endpoint string) (string, int, bool) {
	host, portText, err := net.SplitHostPort(endpoint)
	if err != nil {
		return endpoint, 0, false
	}
	port, err := strconv.Atoi(portText)
	if err != nil || port <= 0 {
		return endpoint, 0, false
	}
	return host, port, true
}

func deriveSharedPhysicalDatabaseInputs(module TerraformModule, dispatch DispatchPayload) error {
	// Destroy must materialize the same derived Postgres names/roles as ensure
	// so `tofu destroy` can plan against remote state for shared-pool bindings.
	if (dispatch.Operation != "ensure_database" && dispatch.Operation != operationRetireDatabase) ||
		!isPostgresManagedDatabaseSource(module.Source) {
		return nil
	}
	if _, ok := module.Inputs[postgresAdminCredentialInput]; !ok {
		return nil
	}
	if isIAMAuthModule(module.Inputs) {
		return deriveIAMSharedPhysicalDatabaseInputs(module.Inputs, dispatch)
	}
	if _, ok := module.Inputs[credentialSecretPrefixInput]; !ok {
		return nil
	}
	stem := sharedPhysicalDatabaseIdentifierStem(dispatch)
	setTerraformModuleInputDefault(module.Inputs, "database_name", stem)
	setTerraformModuleInputDefault(module.Inputs, "runtime_role_name", appMigratorRoleName(dispatch))
	if dispatch.DesiredSpec.LogicalName != "" {
		setTerraformModuleInputDefault(module.Inputs, "logical_name", safePostgresIdentifier(dispatch.DesiredSpec.LogicalName, stem))
	}
	return nil
}

func deriveIAMSharedPhysicalDatabaseInputs(inputs map[string]any, dispatch DispatchPayload) error {
	deploymentToken, ok := inputs[deploymentTokenInput].(string)
	if !ok || !deploymentTokenPattern.MatchString(deploymentToken) {
		return unsupportedSharedModeCredentialRef("deployment_token must be exactly 12 lowercase hexadecimal characters in aws_iam_role mode")
	}
	if dispatch.ApplicationID == "" {
		return unsupportedSharedModeCredentialRef("applicationId is required in aws_iam_role mode")
	}
	if dispatch.BindingID == "" {
		return unsupportedSharedModeCredentialRef("bindingId is required in aws_iam_role mode")
	}

	appToken := domainSeparatedIdentifierToken("application", dispatch.ApplicationID)
	databaseToken := domainSeparatedIdentifierToken("database", dispatch.BindingID)
	databaseName := fmt.Sprintf("sbndb_%s_%s", deploymentToken, databaseToken)
	inputs["application_id"] = dispatch.ApplicationID
	inputs["binding_id"] = dispatch.BindingID
	inputs["database_name"] = databaseName
	inputs["database_owner_role_name"] = databaseName + "_owner"
	inputs["runtime_role_name"] = fmt.Sprintf("sbndb_%s_%s_runtime", deploymentToken, appToken)
	if dispatch.DesiredSpec.LogicalName != "" {
		setTerraformModuleInputDefault(inputs, "logical_name", safePostgresIdentifier(dispatch.DesiredSpec.LogicalName, databaseName))
	}
	return nil
}

func domainSeparatedIdentifierToken(kind, trustedID string) string {
	sum := sha256.Sum256([]byte("superblocks-native-db:v1:" + kind + ":" + trustedID))
	return fmt.Sprintf("%x", sum[:12])
}

func isIAMAuthModule(inputs map[string]any) bool {
	authMode, _ := inputs["auth_mode"].(string)
	return authMode == iamAuthMode
}

func appMigratorRoleName(dispatch DispatchPayload) string {
	sum := sharedPhysicalDatabaseIdentifierHash(dispatch)
	return fmt.Sprintf("app_%x_migrator", sum[:16])
}

func setTerraformModuleInputDefault(inputs map[string]any, key string, value any) {
	if _, exists := inputs[key]; !exists {
		inputs[key] = value
	}
}

func sharedPhysicalDatabaseIdentifierStem(dispatch DispatchPayload) string {
	sum := sharedPhysicalDatabaseIdentifierHash(dispatch)
	return fmt.Sprintf("sb_%x", sum[:8])
}

func sharedPhysicalDatabaseIdentifierHash(dispatch DispatchPayload) [sha256.Size]byte {
	key := dispatch.ResourceKey
	if key == "" {
		key = dispatch.BindingKey
	}
	return sha256.Sum256([]byte(key))
}

var postgresIdentifierReplacePattern = regexp.MustCompile(`[^a-z0-9_]+`)

func safePostgresIdentifier(value, fallback string) string {
	value = strings.ToLower(value)
	value = postgresIdentifierReplacePattern.ReplaceAllString(value, "_")
	value = strings.Trim(value, "_")
	if value == "" {
		return fallback
	}
	if value[0] >= '0' && value[0] <= '9' {
		value = "_" + value
	}
	if len(value) > 63 {
		value = strings.TrimRight(value[:63], "_")
	}
	if value == "" {
		return fallback
	}
	return value
}

func copyTerraformModuleInputs(inputs map[string]any) map[string]any {
	copied := make(map[string]any, len(inputs))
	for key, value := range inputs {
		copied[key] = value
	}
	return copied
}

func MaterializeJob(job Job, dispatch DispatchPayload, sslOpts ProviderSSLOptions) error {
	return MaterializeJobFromLocalModuleRoot(job, dispatch, sslOpts, defaultLocalModuleRoot)
}

func MaterializeJobFromLocalModuleRoot(job Job, dispatch DispatchPayload, sslOpts ProviderSSLOptions, localModuleRoot string) error {
	if job.WorkingDir == "" {
		return errors.New("database lifecycle working directory is required")
	}
	if job.MainFile == "" {
		return errors.New("database lifecycle main file is required")
	}
	if job.BackendFile == "" {
		return errors.New("database lifecycle backend file is required")
	}
	if job.VarsFile == "" {
		return errors.New("database lifecycle vars file is required")
	}
	if dispatch.TerraformModule.Source == "" {
		return errors.New("database lifecycle Terraform module source is required")
	}
	// `version` is meaningful only for Terraform Registry sources; for git/local/
	// URL sources it must be omitted (OpenTofu otherwise reinterprets `source` as
	// a registry address and rejects with "Invalid registry module source").
	// Require it only when the source IS a registry reference.
	if dispatch.TerraformModule.Version == "" && isRegistryModuleSource(dispatch.TerraformModule.Source) {
		return errors.New("database lifecycle Terraform module version is required for registry sources")
	}
	if err := validateTerraformBackend(dispatch.TerraformBackend); err != nil {
		return err
	}
	if err := os.MkdirAll(job.WorkingDir, 0o700); err != nil {
		return err
	}
	if err := copyVendoredModulePackage(job.WorkingDir, dispatch.TerraformModule.Source, localModuleRoot); err != nil {
		return err
	}
	// The backend.tfbackend file feeds `-backend-config=<file>` at init.
	// Tofu parses it as HCL key=value pairs (not JSON), so serialize the
	// stripped backend args as HCL. We strip the dispatch-level meta keys
	// (`stateBackend` drives the HCL declaration; `locking`/`remoteState`
	// are caller-side hints not understood by the s3 backend).
	if err := writeStringFile(job.BackendFile, backendConfigHCL(backendArgsForFile(dispatch.TerraformBackend, dispatch))); err != nil {
		return err
	}
	vars := terraformTrackingVars(dispatch)
	for key, value := range dispatch.TerraformModule.Inputs {
		if !terraformIdentifierPattern.MatchString(key) {
			return fmt.Errorf("database lifecycle Terraform module input %q is not a valid Terraform identifier", key)
		}
		if _, exists := vars[key]; exists {
			return fmt.Errorf("database lifecycle Terraform module input %q conflicts with a system tracking variable", key)
		}
		if isTerraformModuleMetaArgument(key) {
			return fmt.Errorf("database lifecycle Terraform module input %q conflicts with a Terraform module meta-argument", key)
		}
		vars[key] = value
	}
	sharedMode := isSharedModeModule(dispatch.TerraformModule, vars)
	if sharedMode {
		iamMode := isIAMAuthModule(vars)
		setTerraformModuleInputDefault(vars, "port", 5432)
		if err := validateSSLOptions(DSNOptions{SSLMode: sslOpts.Mode, SSLRootCert: sslOpts.RootCert}); err != nil {
			return err
		}
		// The wrapper module configures its own nested postgresql provider.
		// Thread the operator-selected TLS posture into that provider for both
		// password and IAM modes; the generated root provider alone is not
		// sufficient.
		vars["postgres_sslmode"] = sslOpts.Mode
		if sslOpts.RootCert != "" {
			vars["postgres_sslrootcert"] = sslOpts.RootCert
		}
		refInput, refValue, ok := sharedModeAdminCredentialRef(vars)
		if !ok {
			return unsupportedSharedModeCredentialRef("shared-mode postgres lifecycle config requires postgres_admin_credential_ref or runtime_credential_ref")
		}
		if err := validateSharedModeCredentialRef(refInput, refValue, sslOpts.AllowedRefPrefixes); err != nil {
			return err
		}
		if _, enabled := vars[credentialSecretPrefixInput]; enabled {
			if !iamMode {
				if err := validateSharedModeCredentialSecretPrefix(vars); err != nil {
					return err
				}
			}
		}
		if iamMode {
			refMap, ok := refValue.(map[string]any)
			if !ok {
				return unsupportedSharedModeCredentialRef("postgres_admin_credential_ref must be a typed credential ref")
			}
			ref, ok := refresolver.RefFromMap(refMap)
			if !ok {
				return unsupportedSharedModeCredentialRef("postgres_admin_credential_ref must be a typed credential ref")
			}
			setTerraformModuleInputDefault(vars, "postgres_admin_database", defaultPostgresAdminDatabase)
			connection, err := postgresAdminConnectionFromVars(vars)
			if err != nil {
				return err
			}
			if job.Runtime != nil {
				job.Runtime.MasterCredentialRef = &ref
				job.Runtime.PostgresAdminConnection = &connection
			}
			for input := range iamOmittedSecretInputs {
				delete(vars, input)
			}
		}
	}
	if err := writeStringFile(job.MainFile, rootModuleHCL(dispatch.TerraformModule, dispatch.TerraformBackend, vars, sslOpts)); err != nil {
		return err
	}
	return writeJSONFile(job.VarsFile, vars)
}

func copyVendoredModulePackage(workingDir string, source string, localModuleRoot string) error {
	if !strings.HasPrefix(source, "./modules/") {
		return nil
	}
	if "./"+filepath.ToSlash(filepath.Clean(strings.TrimPrefix(source, "./"))) != source {
		return fmt.Errorf("database lifecycle local Terraform module source %q must be a clean path under ./modules", source)
	}
	modulePath := filepath.Join(localModuleRoot, filepath.FromSlash(strings.TrimPrefix(source, "./")))
	info, err := os.Stat(modulePath)
	if err != nil {
		return fmt.Errorf("database lifecycle vendored Terraform module %q: %w", source, err)
	}
	if !info.IsDir() {
		return fmt.Errorf("database lifecycle vendored Terraform module %q is not a directory", source)
	}

	target := filepath.Join(workingDir, "modules")
	if err := os.RemoveAll(target); err != nil {
		return fmt.Errorf("remove stale vendored Terraform modules: %w", err)
	}
	if err := os.CopyFS(target, os.DirFS(filepath.Join(localModuleRoot, "modules"))); err != nil {
		return fmt.Errorf("copy vendored Terraform modules: %w", err)
	}
	return nil
}

var terraformIdentifierPattern = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

func terraformTrackingVars(dispatch DispatchPayload) map[string]any {
	profileID := any(nil)
	if dispatch.ProfileID != "" {
		profileID = dispatch.ProfileID
	}
	resourceKey := dispatch.ResourceKey
	if resourceKey == "" {
		resourceKey = dispatch.BindingKey
	}
	return map[string]any{
		"binding_key":       dispatch.BindingKey,
		"desired_spec_hash": dispatch.DesiredSpecHash,
		"environment_class": legacyTerraformEnvironmentClass(dispatch.Environment),
		"environment_name":  dispatch.Profile,
		"operation":         dispatch.Operation,
		"profile_id":        profileID,
		"request_id":        dispatch.RequestID,
		"resource_key":      resourceKey,
	}
}

func legacyTerraformEnvironmentClass(environment string) string {
	switch environment {
	case "edit":
		return "dev"
	case "preview":
		return "staging"
	case "deployed":
		return "prod"
	default:
		return environment
	}
}

var terraformModuleMetaArguments = map[string]struct{}{
	"count":      {},
	"depends_on": {},
	"for_each":   {},
	"providers":  {},
	"source":     {},
	"version":    {},
}

func isTerraformModuleMetaArgument(key string) bool {
	_, ok := terraformModuleMetaArguments[key]
	return ok
}

// isRegistryModuleSource reports whether `source` is a Terraform/OpenTofu
// Registry reference. Only registry sources accept the `version` argument;
// every other form (git::ssh://…, http(s)://…, ./relative, /absolute, s3::…,
// bitbucket.org/…) must omit it. Registry references are bare "namespace/name/
// provider" or "host/namespace/name/provider" — no protocol marker and no
// path-style prefix.
func isRegistryModuleSource(source string) bool {
	if strings.Contains(source, "::") || strings.Contains(source, "://") {
		return false
	}
	if strings.HasPrefix(source, "/") || strings.HasPrefix(source, "./") || strings.HasPrefix(source, "../") {
		return false
	}
	if isVCSShorthandModuleSource(source) {
		return false
	}
	return true
}

func isVCSShorthandModuleSource(source string) bool {
	if scpStyleGitModuleSourcePattern.MatchString(source) {
		return true
	}
	parts := strings.Split(source, "/")
	if len(parts) < 3 {
		return false
	}
	switch parts[0] {
	case "github.com", "bitbucket.org", "gitlab.com":
		return true
	default:
		return false
	}
}

var scpStyleGitModuleSourcePattern = regexp.MustCompile(`^[^/@\s]+@[^:\s]+:.+`)

func isSharedModeModule(module TerraformModule, vars map[string]any) bool {
	_, hasHost := vars["host"]
	_, hasAdminCredRef := vars[postgresAdminCredentialInput]
	_, hasRuntimeCredRef := vars["runtime_credential_ref"]
	return isPostgresManagedDatabaseSource(module.Source) && hasHost && (hasAdminCredRef || hasRuntimeCredRef)
}

func isPostgresManagedDatabaseSource(source string) bool {
	return strings.Contains(source, "postgres-managed-database")
}

func sharedModeAdminCredentialRef(vars map[string]any) (string, any, bool) {
	if value, ok := vars[postgresAdminCredentialInput]; ok {
		return postgresAdminCredentialInput, value, true
	}
	if value, ok := vars["runtime_credential_ref"]; ok {
		return "runtime_credential_ref", value, true
	}
	return "", nil, false
}

func validateSharedModeRuntimeCredentialRef(value any, allowedPrefixes []string) error {
	return validateSharedModeCredentialRef("runtime_credential_ref", value, allowedPrefixes)
}

func validateSharedModeCredentialRef(input string, value any, allowedPrefixes []string) error {
	refMap, ok := value.(map[string]any)
	if !ok {
		return unsupportedSharedModeCredentialRef(fmt.Sprintf("%s must be a typed credential ref", input))
	}
	ref, ok := refresolver.RefFromMap(refMap)
	if !ok {
		return unsupportedSharedModeCredentialRef(fmt.Sprintf("%s must be a typed credential ref", input))
	}
	if ref.Resolver != refresolver.ResolverAWSSecretsManager {
		return unsupportedSharedModeCredentialRef(fmt.Sprintf("%s resolver %q is not supported", input, ref.Resolver))
	}
	if !isAWSSecretsManagerARN(ref.Ref) {
		return unsupportedSharedModeCredentialRef(fmt.Sprintf("%s.ref must be an AWS Secrets Manager ARN", input))
	}
	if !refAllowedByPrefix(ref.Ref, allowedPrefixes) {
		return unsupportedSharedModeCredentialRef(fmt.Sprintf("%s.ref is not in allowed prefixes configured by %s", input, refresolver.AllowedRefPrefixesEnvVar))
	}
	return nil
}

func validateSharedModeCredentialSecretPrefix(vars map[string]any) error {
	prefix, ok := vars[credentialSecretPrefixInput].(string)
	if !ok || strings.TrimSpace(prefix) == "" {
		return unsupportedSharedModeCredentialRef("credential_secret_prefix must be a non-empty string")
	}
	return nil
}

func unsupportedSharedModeRuntimeCredentialRef(message string) error {
	return unsupportedSharedModeCredentialRef(message)
}

func unsupportedSharedModeCredentialRef(message string) error {
	return &LifecycleError{
		Code:      ErrorCodeUnsupportedShape,
		Retryable: false,
		Err:       errors.New(message),
	}
}

func refAllowedByPrefix(ref string, allowedPrefixes []string) bool {
	for _, prefix := range allowedPrefixes {
		if prefix != "" && strings.HasPrefix(ref, prefix) {
			return true
		}
	}
	return false
}

func isAWSSecretsManagerARN(ref string) bool {
	parts := strings.SplitN(ref, ":", 6)
	return len(parts) == 6 &&
		parts[0] == "arn" &&
		parts[1] != "" &&
		parts[2] == "secretsmanager" &&
		parts[3] != "" &&
		parts[4] != "" &&
		strings.HasPrefix(parts[5], "secret:")
}

func rootModuleHCL(module TerraformModule, backend map[string]any, vars map[string]any, sslOpts ProviderSSLOptions) string {
	keys := make([]string, 0, len(vars))
	for key := range vars {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	// Shared-mode Postgres modules operate against a registered physical
	// instance. The root module configures the PostgreSQL provider from an
	// AWS Secrets Manager admin credential and then calls the logical database
	// module with generated runtime and migration credentials.
	sharedMode := isSharedModeModule(module, vars)
	sharedModeCredentialInput, _, _ := sharedModeAdminCredentialRef(vars)
	iamMode := sharedMode && isIAMAuthModule(vars)
	physicalDatabaseModule := isPhysicalDatabaseModuleSource(module.Source)
	generateSharedModeSecrets := !iamMode && sharedModeCredentialInput == postgresAdminCredentialInput && vars[credentialSecretPrefixInput] != nil

	var builder strings.Builder
	// Declare the backend in HCL. `-backend-config=<file>` only supplies
	// arguments to a backend that is *already declared* here; without this
	// block tofu silently falls back to the local backend and writes state
	// to ./terraform.tfstate, breaking multi-worker coordination and state
	// durability.
	if backendHCL := backendBlockFromBackend(backend); backendHCL != "" {
		builder.WriteString(backendHCL)
	}
	// Root-level required_providers MUST include every provider the root
	// directly references (alias blocks, data sources, provider blocks).
	// Without this, `tofu init` skips installing cyrilgdn/postgresql and
	// `tofu plan` fails with "Required provider not declared".
	if sharedMode {
		builder.WriteString("terraform {\n")
		builder.WriteString("  required_providers {\n")
		// S3 backends still emit a root provider "aws" via providerBlocksFromBackend.
		// required_providers must declare every provider the root references,
		// including IAM mode which omits the Secrets Manager data graph.
		builder.WriteString("    aws = {\n")
		builder.WriteString("      source = \"hashicorp/aws\"\n")
		builder.WriteString("    }\n")
		if generateSharedModeSecrets {
			builder.WriteString("    random = {\n")
			builder.WriteString("      source = \"hashicorp/random\"\n")
			builder.WriteString("    }\n")
		}
		builder.WriteString("    postgresql = {\n")
		builder.WriteString("      source  = \"cyrilgdn/postgresql\"\n")
		builder.WriteString("      version = \"~> 1.26.0\"\n")
		builder.WriteString("    }\n")
		builder.WriteString("  }\n")
		builder.WriteString("}\n\n")
	}
	for _, key := range keys {
		builder.WriteString(fmt.Sprintf("variable %q {\n", key))
		builder.WriteString("  type = any\n")
		builder.WriteString("}\n\n")
	}
	// Cloud providers required by the module need explicit root-level
	// configuration; the module itself only declares the version constraint.
	// Derive the minimal config from the backend so the dispatch payload
	// remains the single source of truth for where state + resources live.
	if providerHCL := providerBlocksFromBackend(backend); providerHCL != "" {
		builder.WriteString(providerHCL)
	}
	if sharedMode {
		if !iamMode {
			// Legacy password mode resolves the physical instance admin credential
			// inside Terraform for compatibility with existing states. IAM mode
			// deliberately omits this entire graph and injects PGUSER/PGPASSWORD
			// into only the plan/apply/destroy subprocess.
			builder.WriteString("locals {\n")
			builder.WriteString(fmt.Sprintf("  __pool_master_secret_arn    = var.%s.ref\n", sharedModeCredentialInput))
			builder.WriteString("  __pool_master_secret_region = split(\":\", local.__pool_master_secret_arn)[3]\n")
			if generateSharedModeSecrets {
				builder.WriteString("  __credential_secret_prefix  = trimsuffix(var.credential_secret_prefix, \"/\")\n")
			}
			builder.WriteString("}\n\n")
			builder.WriteString("provider \"aws\" {\n")
			builder.WriteString("  alias  = \"pool_secrets\"\n")
			builder.WriteString("  region = local.__pool_master_secret_region\n")
			builder.WriteString("}\n\n")
			builder.WriteString("data \"aws_secretsmanager_secret_version\" \"pool_master\" {\n")
			builder.WriteString("  provider  = aws.pool_secrets\n")
			builder.WriteString("  secret_id = local.__pool_master_secret_arn\n")
			builder.WriteString("}\n\n")
		}
		if !iamMode {
			// SSL posture is threaded from operator config (DSNOptions /
			// SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_MODE) so the terraform
			// apply and the subsequent migration run both connect to the
			// pool master with the same posture and the same root CA
			// pinning — operators can pick `verify-full` once and have it
			// apply across both code paths. cursor r3284281726.
			builder.WriteString("provider \"postgresql\" {\n")
			builder.WriteString("  host      = var.host\n")
			builder.WriteString("  port      = var.port\n")
			builder.WriteString("  username  = jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)[\"username\"]\n")
			builder.WriteString("  password  = jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)[\"password\"]\n")
			builder.WriteString(fmt.Sprintf("  sslmode   = %q\n", sslOpts.Mode))
			if sslOpts.RootCert != "" {
				builder.WriteString(fmt.Sprintf("  sslrootcert = %q\n", sslOpts.RootCert))
			}
			builder.WriteString("  superuser = false\n")
			builder.WriteString("}\n\n")
		}
		if generateSharedModeSecrets {
			builder.WriteString(sharedModeRoleSecretsHCL())
		}
	}
	builder.WriteString("module \"database\" {\n")
	builder.WriteString(fmt.Sprintf("  source  = %q\n", module.Source))
	// `version` is meaningful only for Terraform Registry sources (3-4 dot/slash-separated
	// components with no protocol prefix). Emitting it alongside a git/local/URL source
	// makes OpenTofu reinterpret `source` as a registry address and reject the module
	// with "Invalid registry module source address". Skip it for non-registry sources.
	if module.Version != "" && isRegistryModuleSource(module.Source) {
		builder.WriteString(fmt.Sprintf("  version = %q\n", module.Version))
	}
	for _, key := range keys {
		if generateSharedModeSecrets {
			if _, skip := generatedSharedModeSecretInputs[key]; skip {
				continue
			}
		}
		if iamMode && (key == postgresAdminCredentialInput || key == credentialSecretPrefixInput || key == deploymentTokenInput) {
			continue
		}
		builder.WriteString(fmt.Sprintf("  %s = var.%s\n", key, key))
	}
	if generateSharedModeSecrets {
		builder.WriteString(`  runtime_credential_ref = {
    resolver = "aws_secrets_manager"
    ref      = aws_secretsmanager_secret.app.arn
    field    = "password"
  }
  runtime_password_wo = random_password.app.result
  runtime_password_wo_version = "1"
  postgres_admin_username = jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)["username"]
  postgres_admin_password = sensitive(jsondecode(data.aws_secretsmanager_secret_version.pool_master.secret_string)["password"])
`)
	}
	builder.WriteString("}\n\n")
	// Re-export the module's `connection_metadata` and runtime credential refs
	// as root-level outputs. `tofu output -json` only surfaces root outputs, so
	// without this re-export the worker reads {} after a successful apply and the
	// binding's connection info stays empty. The try() fallback keeps older
	// modules that still expose `credential_refs` working while the V1 contract
	// moves to the explicit `runtime_credential_refs` name.
	builder.WriteString("output \"connection_metadata\" {\n")
	builder.WriteString("  value = module.database.connection_metadata\n")
	builder.WriteString("}\n\n")
	builder.WriteString("output \"runtime_credential_refs\" {\n")
	if iamMode || physicalDatabaseModule {
		builder.WriteString("  value     = {}\n")
	} else {
		builder.WriteString("  value     = try(module.database.runtime_credential_refs, module.database.credential_refs)\n")
	}
	builder.WriteString("  sensitive = true\n")
	builder.WriteString("}\n\n")
	builder.WriteString("output \"migration_credential_refs\" {\n")
	if iamMode {
		builder.WriteString("  value     = {}\n")
	} else {
		builder.WriteString("  value     = try(module.database.migration_credential_refs, {})\n")
	}
	builder.WriteString("  sensitive = true\n")
	builder.WriteString("}\n")
	if physicalDatabaseModule {
		builder.WriteString("\noutput \"capacity_max\" {\n")
		// Physical pool capacity is worker-owned policy metadata. New modules
		// may echo it, but released RDS modules predate that output; keep the
		// generated root compatible with both contracts.
		builder.WriteString("  value = try(module.database.capacity_max, null)\n")
		builder.WriteString("}\n\n")
		// Physical modules (RDS managed instance / Aurora) expose the master
		// secret via credential_refs. Older roots also looked for master_*
		// aliases that those modules never emitted, so fall back to
		// credential_refs.password so the worker can register the instance.
		builder.WriteString("output \"credential_refs\" {\n")
		builder.WriteString("  value     = try(module.database.credential_refs, {})\n")
		builder.WriteString("  sensitive = true\n")
		builder.WriteString("}\n\n")
		builder.WriteString("output \"master_user_secret_arn\" {\n")
		builder.WriteString("  value     = try(module.database.master_user_secret_arn, try(module.database.credential_refs.password.ref, null))\n")
		builder.WriteString("  sensitive = true\n")
		builder.WriteString("}\n\n")
		builder.WriteString("output \"master_credential_ref\" {\n")
		builder.WriteString("  value     = try(module.database.master_credential_ref, try(module.database.credential_refs.password, null))\n")
		builder.WriteString("  sensitive = true\n")
		builder.WriteString("}\n")
	}
	return builder.String()
}

func isPhysicalDatabaseModuleSource(source string) bool {
	sourcePath := strings.SplitN(source, "?", 2)[0]
	moduleName := filepath.Base(strings.TrimSuffix(sourcePath, "/"))
	return strings.Contains(moduleName, "aurora") || strings.Contains(moduleName, "managed-instance")
}

func sharedModeRoleSecretsHCL() string {
	return `resource "random_password" "app" {
  length  = 40
  special = false
}

resource "aws_secretsmanager_secret" "app" {
  provider = aws.pool_secrets
  name     = "${local.__credential_secret_prefix}/${var.database_name}/migrator"
}

resource "aws_secretsmanager_secret_version" "app" {
  provider      = aws.pool_secrets
  secret_id     = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    username = var.runtime_role_name
    password = random_password.app.result
  })
}

`
}

// backendConfigHCL renders backend arguments as HCL key=value pairs, the
// format `tofu init -backend-config=<file>` expects. Keys are emitted in
// sorted order for deterministic output. Returns "" for nil/empty input.
//
// Value handling:
//   - strings → bare HCL string with %q quoting
//   - bool, number → printed as %v (Go's natural formatting matches HCL)
//   - everything else → JSON-encoded, which is valid HCL for compound types
func backendConfigHCL(args map[string]any) string {
	if len(args) == 0 {
		return ""
	}
	keys := make([]string, 0, len(args))
	for key := range args {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	var builder strings.Builder
	for _, key := range keys {
		builder.WriteString(fmt.Sprintf("%s = %s\n", key, hclValue(args[key])))
	}
	return builder.String()
}

func hclValue(value any) string {
	switch v := value.(type) {
	case string:
		return fmt.Sprintf("%q", v)
	case bool:
		return fmt.Sprintf("%v", v)
	case float64, float32, int, int64, int32:
		return fmt.Sprintf("%v", v)
	default:
		// JSON-encoded fallback. Lists of any/map are valid HCL when JSON.
		encoded, err := json.Marshal(v)
		if err != nil {
			return fmt.Sprintf("%q", fmt.Sprintf("%v", v))
		}
		return string(encoded)
	}
}

// backendArgsForFile returns a copy of the backend map suitable for writing
// to backend.tfbackend, stripping dispatch-level meta keys that aren't valid
// backend arguments. `stateBackend` is consumed by `backendBlockFromBackend`
// to emit the HCL declaration; `locking` and `remoteState` are caller-side
// hints (e.g. for the server's UI) that backends don't recognize.
func backendArgsForFile(backend map[string]any, dispatch DispatchPayload) map[string]any {
	if backend == nil {
		return nil
	}
	out := make(map[string]any, len(backend))
	for key, value := range backend {
		switch key {
		case "stateBackend", "locking", "remoteState":
			continue
		}
		if key == "key" {
			if raw, ok := value.(string); ok {
				value = expandBackendKey(raw, dispatch)
			}
		}
		out[key] = value
	}
	return out
}

func expandBackendKey(value string, dispatch DispatchPayload) string {
	resourceKey := dispatch.ResourceKey
	if resourceKey == "" {
		resourceKey = dispatch.BindingKey
	}
	return strings.NewReplacer(
		"{{resource_key}}", safeBindingPathSegment(resourceKey),
		"{{binding_key}}", safeBindingPathSegment(dispatch.BindingKey),
		"{{environment}}", safeBackendPathSegment(dispatch.Environment),
		"{{profile}}", safeBackendPathSegment(dispatch.Profile),
	).Replace(value)
}

func safeBackendPathSegment(value string) string {
	sanitized := unsafePathSegmentPattern.ReplaceAllString(value, "-")
	sanitized = strings.Trim(sanitized, "-")
	if strings.Trim(sanitized, "._-") == "" {
		return "unknown"
	}
	return sanitized
}

func validateTerraformBackend(backend map[string]any) error {
	backendType, _ := backend["stateBackend"].(string)
	if backendType == "" {
		return errors.New("database lifecycle terraformBackend.stateBackend is required")
	}
	switch backendType {
	case "azurerm", "gcs", "local", "s3":
		return nil
	default:
		return fmt.Errorf("database lifecycle terraformBackend.stateBackend %q is not supported", backendType)
	}
}

// backendBlockFromBackend emits the `terraform { backend "<stateBackend>" {} }`
// declaration that the materialized root needs. Args are passed in via
// `-backend-config=<file>` (see runner.go), not inlined here — keeping the
// declaration empty matches the partial-config pattern. Returns "" when
// `stateBackend` is missing or unrecognized, in which case tofu falls back
// to local state.
func backendBlockFromBackend(backend map[string]any) string {
	if backend == nil {
		return ""
	}
	backendType, _ := backend["stateBackend"].(string)
	if backendType == "" {
		return ""
	}
	return fmt.Sprintf("terraform {\n  backend %q {}\n}\n\n", backendType)
}

// providerBlocksFromBackend emits root-level `provider "..." {}` blocks for
// the cloud(s) implied by the dispatch's terraform backend. Today we only
// derive AWS from an S3 backend; extend here for GCS/Azure/etc. as new
// backends ship. Returns an empty string if no provider config is needed
// (e.g. local backends or providers that auto-configure from env).
func providerBlocksFromBackend(backend map[string]any) string {
	if backend == nil {
		return ""
	}
	backendType, _ := backend["stateBackend"].(string)
	var builder strings.Builder
	if backendType == "s3" {
		region, _ := backend["region"].(string)
		builder.WriteString("provider \"aws\" {\n")
		if region != "" {
			builder.WriteString(fmt.Sprintf("  region = %q\n", region))
		}
		builder.WriteString("}\n\n")
	}
	return builder.String()
}

func ValidateTerraformModuleSource(module TerraformModule, allowedSources []string) error {
	if len(allowedSources) == 0 {
		return &LifecycleError{
			Code:      ErrorCodeUnsupportedShape,
			Retryable: false,
			Err:       errors.New("no Terraform module sources are allowed"),
		}
	}
	for _, allowed := range allowedSources {
		if module.Source == allowed {
			return nil
		}
	}
	return &LifecycleError{
		Code:      ErrorCodeUnsupportedShape,
		Retryable: false,
		Err:       fmt.Errorf("unsupported Terraform module source %s", module.Source),
	}
}

func writeStringFile(path string, value string) error {
	return writeFileNoFollow(path, []byte(value))
}

func writeJSONFile(path string, value any) error {
	encoded, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	encoded = append(encoded, '\n')
	return writeFileNoFollow(path, encoded)
}

func writeFileNoFollow(path string, contents []byte) error {
	parentFD, err := mkdirAllNoFollow(filepath.Dir(path))
	if err != nil {
		return err
	}
	defer unix.Close(parentFD)

	fd, err := unix.Openat(parentFD, filepath.Base(path), unix.O_WRONLY|unix.O_CREAT|unix.O_TRUNC|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0o600)
	if err != nil {
		if errors.Is(err, unix.ELOOP) {
			return fmt.Errorf("refuses to write through symlink %s: %w", path, err)
		}
		return fmt.Errorf("write %s: %w", path, err)
	}
	file := os.NewFile(uintptr(fd), path)
	if _, err := file.Write(contents); err != nil {
		_ = file.Close()
		return fmt.Errorf("write %s: %w", path, err)
	}
	if err := file.Close(); err != nil {
		return fmt.Errorf("close %s: %w", path, err)
	}
	return nil
}

func mkdirAllNoFollow(path string) (int, error) {
	clean := filepath.Clean(path)
	if !filepath.IsAbs(clean) {
		abs, err := filepath.Abs(clean)
		if err != nil {
			return -1, fmt.Errorf("resolve directory %s: %w", path, err)
		}
		clean = abs
	}
	root := string(filepath.Separator)
	fd, err := unix.Open(root, unix.O_RDONLY|unix.O_DIRECTORY|unix.O_CLOEXEC, 0)
	if err != nil {
		return -1, fmt.Errorf("open root directory: %w", err)
	}
	if clean == root {
		return fd, nil
	}

	current := root
	for _, part := range strings.Split(strings.TrimPrefix(clean, root), root) {
		if part == "" || part == "." {
			continue
		}
		current = filepath.Join(current, part)
		if err := unix.Mkdirat(fd, part, 0o700); err != nil && !errors.Is(err, unix.EEXIST) {
			_ = unix.Close(fd)
			return -1, fmt.Errorf("create directory %s: %w", current, err)
		}
		nextFD, err := unix.Openat(fd, part, unix.O_RDONLY|unix.O_DIRECTORY|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0)
		if err != nil {
			isSymlink := isSymlinkAt(fd, part)
			_ = unix.Close(fd)
			if errors.Is(err, unix.ELOOP) || isSymlink {
				return -1, fmt.Errorf("refuses to write through symlink parent %s: %w", current, err)
			}
			return -1, fmt.Errorf("open directory %s: %w", current, err)
		}
		_ = unix.Close(fd)
		fd = nextFD
	}
	return fd, nil
}

func isSymlinkAt(dirfd int, name string) bool {
	var stat unix.Stat_t
	if err := unix.Fstatat(dirfd, name, &stat, unix.AT_SYMLINK_NOFOLLOW); err != nil {
		return false
	}
	return stat.Mode&unix.S_IFMT == unix.S_IFLNK
}
