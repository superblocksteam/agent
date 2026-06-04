package databaselifecycle

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"golang.org/x/sys/unix"
)

func MaterializeJob(job Job, dispatch DispatchPayload) error {
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
	// The backend.tfbackend file feeds `-backend-config=<file>` at init.
	// Tofu parses it as HCL key=value pairs (not JSON), so serialize the
	// stripped backend args as HCL. We strip the dispatch-level meta keys
	// (`stateBackend` drives the HCL declaration; `locking`/`remoteState`
	// are caller-side hints not understood by the s3 backend).
	if err := writeStringFile(job.BackendFile, backendConfigHCL(backendArgsForFile(dispatch.TerraformBackend, dispatch))); err != nil {
		return err
	}
	vars := map[string]any{
		"binding_key":       dispatch.BindingKey,
		"desired_spec_hash": dispatch.DesiredSpecHash,
		"operation":         dispatch.Operation,
		"profile_id":        dispatch.ProfileID,
		"request_id":        dispatch.RequestID,
	}
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
	if err := writeStringFile(job.MainFile, rootModuleHCL(dispatch.TerraformModule, dispatch.TerraformBackend, vars)); err != nil {
		return err
	}
	return writeJSONFile(job.VarsFile, vars)
}

var terraformIdentifierPattern = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

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

func rootModuleHCL(module TerraformModule, backend map[string]any, vars map[string]any) string {
	keys := make([]string, 0, len(vars))
	for key := range vars {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	var builder strings.Builder
	// Declare the backend in HCL. `-backend-config=<file>` only supplies
	// arguments to a backend that is *already declared* here; without this
	// block tofu silently falls back to the local backend and writes state
	// to ./terraform.tfstate, breaking multi-worker coordination and state
	// durability.
	if backendHCL := backendBlockFromBackend(backend); backendHCL != "" {
		builder.WriteString(backendHCL)
	}
	for _, key := range keys {
		builder.WriteString(fmt.Sprintf("variable %q {\n", key))
		builder.WriteString("  type = any\n")
		builder.WriteString("}\n\n")
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
		builder.WriteString(fmt.Sprintf("  %s = var.%s\n", key, key))
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
	builder.WriteString("  value     = try(module.database.runtime_credential_refs, module.database.credential_refs)\n")
	builder.WriteString("  sensitive = true\n")
	builder.WriteString("}\n\n")
	builder.WriteString("output \"migration_credential_refs\" {\n")
	builder.WriteString("  value     = try(module.database.migration_credential_refs, {})\n")
	builder.WriteString("  sensitive = true\n")
	builder.WriteString("}\n")
	return builder.String()
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
		"{{profile_id}}", safeBindingPathSegment(dispatch.ProfileID),
	).Replace(value)
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
