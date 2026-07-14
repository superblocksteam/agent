package databaselifecycle

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestTerraformModuleRefFromSource(t *testing.T) {
	t.Parallel()

	ref, err := terraformModuleRefFromSource(
		"git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/postgres-managed-database?ref=v0.2.0",
	)
	require.NoError(t, err)
	require.Equal(t, "v0.2.0", ref)
}

func TestTerraformModuleRefFromSourceRejectsMissingOrEmptyRef(t *testing.T) {
	t.Parallel()

	for _, source := range []string{
		"git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/postgres-managed-database",
		"git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/postgres-managed-database?ref=",
	} {
		_, err := terraformModuleRefFromSource(source)
		require.Error(t, err)
	}
}

func TestImmutableModuleTagValidationUsesSemanticVersionSyntax(t *testing.T) {
	t.Parallel()

	for _, valid := range []string{"v0.2.0", "v1.2.3-rc.1", "v1.2.3-rc.1+build.5"} {
		require.True(t, isImmutableModuleTag(valid), valid)
	}
	for _, invalid := range []string{"main", "v01.2.3", "v1.2", "v1.2.3-01"} {
		require.False(t, isImmutableModuleTag(invalid), invalid)
	}
}

func TestRepositoriesMatchAcrossGitHubDeployKeyRewrite(t *testing.T) {
	t.Parallel()

	pinned := "ssh://git@github.com/superblocksteam/terraform-superblocks-databases.git"
	checkout := "git@key-37fc2dcf46d69a3ba2804e93bb2c4af0f154264aa62af437042a7e3e699efd61.github.com:superblocksteam/terraform-superblocks-databases.git"

	require.True(t, repositoriesMatch(checkout, pinned))
	require.False(t, repositoriesMatch(
		"git@key.example.github.com:other/repository.git",
		pinned,
	))
	require.False(t, repositoriesMatch(
		"ssh://git@git.example.com/owner/repository",
		"ssh://git@git.example.com/owner/repository.git",
	))
}

func TestNativeDBHelmModulePinsFromValuesReadsPathsAndRef(t *testing.T) {
	t.Parallel()

	valuesPath := filepath.Join("..", "..", "helm", "agent", "values.yaml")
	content, err := os.ReadFile(valuesPath)
	require.NoError(t, err)

	pins, err := nativeDBHelmModulePinsFromValues(content)
	require.NoError(t, err)
	require.Equal(t, nativeDBHelmModulePins{
		LogicalPath:  "modules/postgres-managed-database",
		PhysicalPath: "modules/aws-rds-managed-instance",
		Ref:          "v0.2.0",
		Repository:   "https://github.com/superblocksteam/terraform-superblocks-databases.git",
	}, pins)
}

func TestNativeDBHelmModulePinsFromValuesIgnoresPhysicalModuleName(t *testing.T) {
	t.Parallel()

	values := []byte(`databaseLifecycle:
  modules:
    logical:
      source: git::https://example.com/repo.git//modules/postgres-managed-database?ref=v0.3.0
    physical:
      source: git::https://example.com/repo.git//modules/aws-aurora-managed-cluster?ref=v0.3.0
`)
	pins, err := nativeDBHelmModulePinsFromValues(values)
	require.NoError(t, err)
	require.Equal(t, nativeDBHelmModulePins{
		LogicalPath:  "modules/postgres-managed-database",
		PhysicalPath: "modules/aws-aurora-managed-cluster",
		Ref:          "v0.3.0",
		Repository:   "https://example.com/repo.git",
	}, pins)
}

func TestNativeDBHelmModulePinsFromValuesRejectsDifferentRepositories(t *testing.T) {
	t.Parallel()

	values := []byte(`databaseLifecycle:
  modules:
    logical:
      source: git::https://example.com/logical.git//modules/postgres-managed-database?ref=v0.3.0
    physical:
      source: git::https://example.com/physical.git//modules/aws-rds-managed-instance?ref=v0.3.0
`)
	_, err := nativeDBHelmModulePinsFromValues(values)
	require.ErrorContains(t, err, "different repositories")
}

func TestNativeDBHelmModulePinsOrDefaultUsesValuesFileOverride(t *testing.T) {
	dir := t.TempDir()
	valuesPath := filepath.Join(dir, "custom-values.yaml")
	require.NoError(t, os.WriteFile(valuesPath, []byte(`databaseLifecycle:
  modules:
    logical:
      source: git::https://example.com/custom.git//modules/custom-logical?ref=v9.9.9
    physical:
      source: git::https://example.com/custom.git//modules/custom-physical?ref=v9.9.9
`), 0o644))
	t.Setenv("NATIVE_DB_HELM_VALUES_FILE", valuesPath)

	require.Equal(t, nativeDBHelmModulePins{
		LogicalPath:  "modules/custom-logical",
		PhysicalPath: "modules/custom-physical",
		Ref:          "v9.9.9",
		Repository:   "https://example.com/custom.git",
	}, nativeDBHelmModulePinsOrDefault())
}

func TestNativeDBHelmModulePinsOrDefaultRejectsMissingValuesFileOverride(t *testing.T) {
	t.Setenv("NATIVE_DB_HELM_VALUES_FILE", filepath.Join(t.TempDir(), "missing.yaml"))

	require.Panics(t, func() { nativeDBHelmModulePinsOrDefault() })
}

func TestNativeDBContractProofModulePinsPrefersRepositoryAndRefOverrides(t *testing.T) {
	t.Setenv("NATIVE_DB_TERRAFORM_MODULE_REPOSITORY", "git@github.com:example/custom.git")
	t.Setenv("NATIVE_DB_TERRAFORM_MODULE_REF", "v9.9.9")

	pins := nativeDBContractProofModulePins()
	require.Equal(t, "v9.9.9", pins.Ref)
	require.Equal(t, "git@github.com:example/custom.git", pins.Repository)
}

func TestNativeDBContractProofModulePinsRejectsMutableRefOverride(t *testing.T) {
	t.Setenv("NATIVE_DB_TERRAFORM_MODULE_REF", "main")

	require.Panics(t, func() { nativeDBContractProofModulePins() })
}

func TestNativeDBContractProofModulePinsPrefersRefEnv(t *testing.T) {
	t.Setenv("NATIVE_DB_TERRAFORM_MODULE_REF", "v9.9.9")
	require.Equal(t, "v9.9.9", nativeDBContractProofModulePins().Ref)
}

func TestNativeDBContractProofModulePinsFallsBackWithoutHelmValues(t *testing.T) {
	t.Setenv("NATIVE_DB_TERRAFORM_MODULE_REF", "")
	t.Chdir(t.TempDir())

	require.Equal(t, defaultNativeDBTerraformModuleRef, nativeDBContractProofModulePins().Ref)
}

func TestNativeDBContractProofModulePinsPanicsOnInvalidHelmValues(t *testing.T) {
	t.Setenv("NATIVE_DB_TERRAFORM_MODULE_REF", "")
	dir := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "helm", "agent"), 0o755))
	require.NoError(t, os.WriteFile(
		filepath.Join(dir, "helm", "agent", "values.yaml"),
		[]byte("databaseLifecycle:\n  modules:\n    logical:\n      source: git::https://example.com/repo.git//modules/postgres-managed-database?ref=v0.2.0\n    physical:\n      source: git::https://example.com/repo.git//modules/aws-rds-managed-instance?ref=v0.3.0\n"),
		0o644,
	))
	t.Chdir(dir)

	require.Panics(t, func() { nativeDBContractProofModulePins() })
}

func TestNativeDBHelmModulePinsFromValuesRejectsInvalidPins(t *testing.T) {
	t.Parallel()

	for _, values := range []string{
		"databaseLifecycle:\n  modules: {}\n",
		"    source: git::https://example.com/postgres-managed-database?ref=v0.2.0\n",
		"    source: git::https://example.com/postgres-managed-database?ref=v0.2.0\n    source: git::https://example.com/aws-rds-managed-instance?ref=v0.3.0\n",
		"databaseLifecycle:\n  modules:\n    logical:\n      source: git::https://example.com/repo.git//modules/logical?ref=main\n    physical:\n      source: git::https://example.com/repo.git//modules/physical?ref=main\n",
	} {
		_, err := nativeDBHelmModulePinsFromValues([]byte(values))
		require.Error(t, err)
	}
}

func TestVerifyNativeDBTerraformModuleRootChecksPathsOriginAndTag(t *testing.T) {
	moduleRoot := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(moduleRoot, "modules", "logical"), 0o755))
	require.NoError(t, os.MkdirAll(filepath.Join(moduleRoot, "modules", "physical"), 0o755))
	runContractProofCommand(t, moduleRoot, "git", "init")
	runContractProofCommand(t, moduleRoot, "git", "-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "--allow-empty", "-m", "initial")
	runContractProofCommand(t, moduleRoot, "git", "tag", "v1.2.3")
	runContractProofCommand(t, moduleRoot, "git", "branch", "v1.2.4")
	runContractProofCommand(t, moduleRoot, "git", "remote", "add", "origin", "https://example.com/modules.git")

	pins := nativeDBHelmModulePins{
		LogicalPath:  "modules/logical",
		PhysicalPath: "modules/physical",
		Ref:          "v1.2.3",
		Repository:   "https://example.com/modules.git",
	}
	require.NoError(t, verifyNativeDBTerraformModuleRoot(moduleRoot, pins))

	pins.Repository = "https://example.com/other.git"
	require.ErrorContains(t, verifyNativeDBTerraformModuleRoot(moduleRoot, pins), "does not match")

	pins.Repository = "https://example.com/modules.git"
	pins.Ref = "v1.2.4"
	require.ErrorContains(t, verifyNativeDBTerraformModuleRoot(moduleRoot, pins), "refs/tags/v1.2.4")
}
