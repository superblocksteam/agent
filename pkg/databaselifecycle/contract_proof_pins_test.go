package databaselifecycle

import (
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"golang.org/x/mod/semver"
	"gopkg.in/yaml.v3"
)

var completeSemanticVersionPattern = regexp.MustCompile(`^v[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$`)

type nativeDBHelmModulePins struct {
	LogicalPath  string
	PhysicalPath string
	Ref          string
	Repository   string
}

type terraformGitModuleSource struct {
	Path       string
	Ref        string
	Repository string
}

func terraformModuleRefFromSource(source string) (string, error) {
	const prefix = "?ref="
	index := strings.LastIndex(source, prefix)
	if index < 0 {
		return "", fmt.Errorf("module source %q is missing %q", source, prefix)
	}
	ref := strings.TrimSpace(source[index+len(prefix):])
	if ref == "" {
		return "", fmt.Errorf("module source %q has an empty ref", source)
	}
	return ref, nil
}

func parseTerraformGitModuleSource(source string) (terraformGitModuleSource, error) {
	const prefix = "git::"
	if !strings.HasPrefix(source, prefix) {
		return terraformGitModuleSource{}, fmt.Errorf("module source %q is missing %q", source, prefix)
	}
	ref, err := terraformModuleRefFromSource(source)
	if err != nil {
		return terraformGitModuleSource{}, err
	}
	if !isImmutableModuleTag(ref) {
		return terraformGitModuleSource{}, fmt.Errorf("module source %q must pin an immutable semantic-version tag", source)
	}
	sourceWithoutRef := source[len(prefix):strings.LastIndex(source, "?ref=")]
	submoduleSeparator := strings.LastIndex(sourceWithoutRef, "//")
	if submoduleSeparator < 0 {
		return terraformGitModuleSource{}, fmt.Errorf("module source %q is missing a submodule path", source)
	}
	repository := sourceWithoutRef[:submoduleSeparator]
	modulePath := sourceWithoutRef[submoduleSeparator+2:]
	if repository == "" || modulePath == "" {
		return terraformGitModuleSource{}, fmt.Errorf("module source %q has an empty repository or submodule path", source)
	}
	if err := validateTerraformModulePath(modulePath); err != nil {
		return terraformGitModuleSource{}, fmt.Errorf("module source %q: %w", source, err)
	}
	return terraformGitModuleSource{
		Path:       modulePath,
		Ref:        ref,
		Repository: repository,
	}, nil
}

func nativeDBHelmModulePinsFromValues(valuesYAML []byte) (nativeDBHelmModulePins, error) {
	var values struct {
		DatabaseLifecycle struct {
			Modules struct {
				Logical struct {
					Source string `yaml:"source"`
				} `yaml:"logical"`
				Physical struct {
					Source string `yaml:"source"`
				} `yaml:"physical"`
			} `yaml:"modules"`
		} `yaml:"databaseLifecycle"`
	}
	if err := yaml.Unmarshal(valuesYAML, &values); err != nil {
		return nativeDBHelmModulePins{}, fmt.Errorf("parse helm values: %w", err)
	}
	logicalSource := values.DatabaseLifecycle.Modules.Logical.Source
	if logicalSource == "" {
		return nativeDBHelmModulePins{}, fmt.Errorf("helm values are missing databaseLifecycle.modules.logical.source")
	}
	physicalSource := values.DatabaseLifecycle.Modules.Physical.Source
	if physicalSource == "" {
		return nativeDBHelmModulePins{}, fmt.Errorf("helm values are missing databaseLifecycle.modules.physical.source")
	}
	logical, err := parseTerraformGitModuleSource(logicalSource)
	if err != nil {
		return nativeDBHelmModulePins{}, fmt.Errorf("parse logical module source: %w", err)
	}
	physical, err := parseTerraformGitModuleSource(physicalSource)
	if err != nil {
		return nativeDBHelmModulePins{}, fmt.Errorf("parse physical module source: %w", err)
	}
	if logical.Repository != physical.Repository {
		return nativeDBHelmModulePins{}, fmt.Errorf(
			"helm values pin different repositories: logical=%s physical=%s",
			logical.Repository,
			physical.Repository,
		)
	}
	if logical.Ref != physical.Ref {
		return nativeDBHelmModulePins{}, fmt.Errorf(
			"helm values pin different module refs: logical=%s physical=%s",
			logical.Ref,
			physical.Ref,
		)
	}
	return nativeDBHelmModulePins{
		LogicalPath:  logical.Path,
		PhysicalPath: physical.Path,
		Ref:          logical.Ref,
		Repository:   logical.Repository,
	}, nil
}

func nativeDBContractProofModulePins() nativeDBHelmModulePins {
	pins := nativeDBHelmModulePinsOrDefault()
	if repository := os.Getenv("NATIVE_DB_TERRAFORM_MODULE_REPOSITORY"); repository != "" {
		pins.Repository = repository
	}
	if ref := os.Getenv("NATIVE_DB_TERRAFORM_MODULE_REF"); ref != "" {
		if !isImmutableModuleTag(ref) {
			panic(fmt.Sprintf("NATIVE_DB_TERRAFORM_MODULE_REF=%q must be an immutable semantic-version tag", ref))
		}
		pins.Ref = ref
	}
	return pins
}

func isImmutableModuleTag(ref string) bool {
	return completeSemanticVersionPattern.MatchString(ref) && semver.IsValid(ref)
}

func validateTerraformModulePath(modulePath string) error {
	if modulePath == "" || path.IsAbs(modulePath) || path.Clean(modulePath) != modulePath || modulePath == ".." || strings.HasPrefix(modulePath, "../") {
		return fmt.Errorf("unsafe Terraform submodule path %q", modulePath)
	}
	return nil
}

func nativeDBHelmModulePinsOrDefault() nativeDBHelmModulePins {
	if valuesPath := os.Getenv("NATIVE_DB_HELM_VALUES_FILE"); valuesPath != "" {
		return nativeDBHelmModulePinsFromFile(valuesPath)
	}
	for _, valuesPath := range helmAgentValuesPaths() {
		if _, err := os.Stat(valuesPath); err != nil {
			continue
		}
		return nativeDBHelmModulePinsFromFile(valuesPath)
	}
	panic("Native DB Helm module pins require helm/agent/values.yaml or NATIVE_DB_HELM_VALUES_FILE")
}

func nativeDBHelmModulePinsFromFile(valuesPath string) nativeDBHelmModulePins {
	content, err := os.ReadFile(valuesPath)
	if err != nil {
		panic(fmt.Sprintf("read Native DB Helm values %s: %v", valuesPath, err))
	}
	pins, err := nativeDBHelmModulePinsFromValues(content)
	if err != nil {
		panic(fmt.Sprintf("invalid Native DB module pin in %s: %v", valuesPath, err))
	}
	return pins
}

func helmAgentValuesPaths() []string {
	return []string{
		filepath.Join("helm", "agent", "values.yaml"),
		filepath.Join("..", "..", "helm", "agent", "values.yaml"),
	}
}

func nativeDBTerraformModuleRoot(t *testing.T, pins nativeDBHelmModulePins) string {
	t.Helper()
	if moduleRoot := os.Getenv("NATIVE_DB_TERRAFORM_MODULE_ROOT"); moduleRoot != "" {
		absoluteRoot, err := filepath.Abs(moduleRoot)
		require.NoError(t, err)
		require.NoError(t, verifyNativeDBTerraformModuleRoot(absoluteRoot, pins))
		return absoluteRoot
	}

	moduleRoot := filepath.Join(t.TempDir(), "terraform-superblocks-databases")
	runContractProofCommand(t, "", "git", "ls-remote", "--exit-code", "--tags", pins.Repository, "refs/tags/"+pins.Ref)
	runContractProofCommand(t, "", "git", "clone", "--depth", "1", "--branch", pins.Ref, "--single-branch", pins.Repository, moduleRoot)
	require.NoError(t, verifyNativeDBTerraformModuleRoot(moduleRoot, pins))
	return moduleRoot
}

func verifyNativeDBTerraformModuleRoot(moduleRoot string, pins nativeDBHelmModulePins) error {
	for _, modulePath := range []string{pins.LogicalPath, pins.PhysicalPath} {
		info, err := os.Stat(filepath.Join(moduleRoot, filepath.FromSlash(modulePath)))
		if err != nil || !info.IsDir() {
			return fmt.Errorf("module checkout %s is missing %s", moduleRoot, modulePath)
		}
	}
	origin, err := contractProofCommandOutput(moduleRoot, "git", "remote", "get-url", "origin")
	if err != nil {
		return err
	}
	if !repositoriesMatch(origin, pins.Repository) {
		return fmt.Errorf("module checkout origin %q does not match pinned repository %q", origin, pins.Repository)
	}
	head, err := contractProofCommandOutput(moduleRoot, "git", "rev-parse", "HEAD")
	if err != nil {
		return err
	}
	tagRef := "refs/tags/" + pins.Ref + "^{commit}"
	pinnedCommit, err := contractProofCommandOutput(moduleRoot, "git", "rev-parse", tagRef)
	if err != nil {
		return err
	}
	if head != pinnedCommit {
		return fmt.Errorf("module checkout HEAD %s does not match %s (%s)", head, pins.Ref, pinnedCommit)
	}
	return nil
}

func repositoriesMatch(actual string, expected string) bool {
	actualIdentity, actualOK := githubRepositoryIdentity(actual)
	expectedIdentity, expectedOK := githubRepositoryIdentity(expected)
	if actualOK || expectedOK {
		return actualOK && expectedOK && actualIdentity == expectedIdentity
	}
	return actual == expected
}

func githubRepositoryIdentity(repository string) (string, bool) {
	host, repositoryPath := repositoryHostAndPath(repository)
	host = strings.ToLower(host)
	if host != "github.com" && !strings.HasSuffix(host, ".github.com") {
		return "", false
	}
	repositoryPath = strings.Trim(strings.TrimSuffix(repositoryPath, ".git"), "/")
	if len(strings.Split(repositoryPath, "/")) != 2 {
		return "", false
	}
	return "github.com/" + strings.ToLower(repositoryPath), true
}

func repositoryHostAndPath(repository string) (string, string) {
	repository = strings.TrimPrefix(repository, "git::")
	if parsed, err := url.Parse(repository); err == nil && parsed.Hostname() != "" {
		return parsed.Hostname(), parsed.Path
	}
	if at := strings.LastIndex(repository, "@"); at >= 0 {
		hostAndPath := repository[at+1:]
		if colon := strings.Index(hostAndPath, ":"); colon >= 0 {
			return hostAndPath[:colon], hostAndPath[colon+1:]
		}
	}
	return "", ""
}

func contractProofCommandOutput(workingDir string, name string, args ...string) (string, error) {
	command := exec.Command(name, args...)
	command.Dir = workingDir
	output, err := command.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("%s: %w\n%s", command.String(), err, output)
	}
	return strings.TrimSpace(string(output)), nil
}

func runContractProofCommand(t *testing.T, workingDir string, name string, args ...string) {
	t.Helper()
	command := exec.Command(name, args...)
	command.Dir = workingDir
	output, err := command.CombinedOutput()
	require.NoError(t, err, "%s\n%s", command.String(), output)
}
