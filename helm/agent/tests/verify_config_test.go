package helmtests

import (
	"bytes"
	"encoding/json"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/databaselifecycle"
	"gopkg.in/yaml.v3"
)

const (
	logicalModuleSource  = "git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/postgres-managed-database?ref=v0.2.0"
	physicalModuleSource = "git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/aws-rds-managed-instance?ref=v0.2.0"
)

func TestOPAChartRendersLifecycleWorkerConfigFromNamedGroups(t *testing.T) {
	t.Parallel()

	rendered := renderLifecycleChart(t)
	deployment := renderedDeployment(t, rendered)
	container := lifecycleContainer(t, deployment)
	require.NotContains(t, container, "args")

	env := lifecycleEnv(t, container)
	require.Equal(t, "true", env["SUPERBLOCKS_ORCHESTRATOR_DATABASE_LIFECYCLE_WORKER_ENABLED"])
	require.Equal(t, "require", env["SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_MODE"])
	require.Equal(t, "aws_db_instance", env["SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES"])
	require.Equal(t, logicalModuleSource+","+physicalModuleSource, env["SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES"])
	require.Equal(t,
		"arn:aws:secretsmanager:us-west-2:123456789012:secret:rds!db-",
		env["SUPERBLOCKS_SECRETS_REFRESOLVER_ALLOWED_REF_PREFIXES"],
	)
	require.NotContains(t, env, "SUPERBLOCKS_DATABASE_LIFECYCLE_MODULE_SHAPES")
	assertRenderedLifecycleConfig(t, env["SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG"])
	workerConfig, err := databaselifecycle.ConfigFromEnv(func(key string) string { return env[key] })
	require.NoError(t, err)
	require.Len(t, workerConfig.LifecycleConfig.Entries, 3)

	mounts := requireSlice(t, container["volumeMounts"])
	require.Contains(t, mounts, map[string]any{
		"mountPath": "/var/lib/superblocks/database-lifecycle",
		"name":      "database-lifecycle-work",
	})
	require.Equal(t, 1000, requireMap(t, lifecyclePodSpec(t, deployment)["securityContext"])["fsGroup"])
}

func TestOPAChartPreservesOperatorPodFSGroup(t *testing.T) {
	t.Parallel()

	rendered := renderLifecycleChart(t,
		"--set", "podSecurityContext.fsGroup=2000",
	)
	require.Equal(t, 2000, requireMap(t, lifecyclePodSpec(t, renderedDeployment(t, rendered))["securityContext"])["fsGroup"])
}

func TestOPAChartCanUseOnlyRegisteredPhysicalDatabases(t *testing.T) {
	t.Parallel()

	rendered := renderLifecycleChart(t,
		"--set", "databaseLifecycle.physicalProvisioning.enabled=false",
	)
	container := lifecycleContainer(t, renderedDeployment(t, rendered))
	env := lifecycleEnv(t, container)
	require.Equal(t, logicalModuleSource, env["SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES"])

	config := lifecycleConfig(t, env)
	operations := requireMap(t, entryByEnvironment(t, config, "edit")["operations"])
	require.NotContains(t, requireMap(t, operations["ensure_database"]), "physicalDatabase")
	require.NotContains(t, operations, "ensure_physical_database_instance")
}

func TestOPAChartRegisteredOnlyGroupsCanOmitPhysicalModuleInputs(t *testing.T) {
	t.Parallel()

	rendered := renderLifecycleChart(t,
		"--set", "databaseLifecycle.physicalProvisioning.enabled=false",
		"--set-json", "databaseLifecycle.groups.nonprod.physicalModuleInputs=null",
		"--set-json", "databaseLifecycle.groups.production.physicalModuleInputs=null",
	)
	config := lifecycleConfig(t, lifecycleEnv(t, lifecycleContainer(t, renderedDeployment(t, rendered))))
	require.NotContains(t, requireMap(t, entryByEnvironment(t, config, "edit")["operations"]), "ensure_physical_database_instance")
}

func TestOPAChartAppliesDeploymentTagsToEveryPhysicalModule(t *testing.T) {
	t.Parallel()

	config := lifecycleConfig(t, lifecycleEnv(t, lifecycleContainer(t, renderedDeployment(t, renderLifecycleChart(t)))))

	nonprodTags := physicalModuleTags(t, entryByEnvironment(t, config, "edit"))
	require.Equal(t, "retained", nonprodTags["group-specific"])
	require.Equal(t, "native-database", nonprodTags["superblocks.com/component"])
	require.Equal(t, "pr-1234", nonprodTags["superblocks.com/ephemeral-environment"])

	productionTags := physicalModuleTags(t, entryByEnvironment(t, config, "deployed"))
	require.Equal(t, "native-database", productionTags["superblocks.com/component"])
	require.Equal(t, "pr-1234", productionTags["superblocks.com/ephemeral-environment"])
}

func TestOPAChartPreservesDisabledS3Lockfile(t *testing.T) {
	t.Parallel()

	rendered := renderLifecycleChart(t,
		"--set", "databaseLifecycle.backend.useLockfile=false",
	)
	config := lifecycleConfig(t, lifecycleEnv(t, lifecycleContainer(t, renderedDeployment(t, rendered))))
	operations := requireMap(t, entryByEnvironment(t, config, "edit")["operations"])
	terraform := requireMap(t, requireMap(t, operations["ensure_database"])["terraform"])
	require.Equal(t, false, requireMap(t, terraform["backend"])["use_lockfile"])
}

func TestOPAChartSupportsLegacyManualConfig(t *testing.T) {
	t.Parallel()

	rendered := renderLifecycleChartFixture(t, "database-lifecycle-manual-values.yaml")
	env := lifecycleEnv(t, lifecycleContainer(t, renderedDeployment(t, rendered)))
	require.Equal(t, "registry.example.com/custom-postgres", env["SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES"])
	require.Contains(t, env, "SUPERBLOCKS_DATABASE_LIFECYCLE_MODULE_SHAPES")
	workerConfig, err := databaselifecycle.ConfigFromEnv(func(key string) string { return env[key] })
	require.NoError(t, err)
	require.Len(t, workerConfig.LifecycleConfig.Entries, 1)
}

func TestOPAChartRejectsOverlappingGroupRoutes(t *testing.T) {
	t.Parallel()

	_, output, err := executeLifecycleChart(t,
		"--set", "databaseLifecycle.groups.production.environments[0]=edit",
	)
	require.Error(t, err)
	require.Contains(t, string(output), `databaseLifecycle environment "edit" is configured by both groups "nonprod" and "production"`)
}

func TestOPAChartRejectsEmptyProfile(t *testing.T) {
	t.Parallel()

	_, output, err := executeLifecycleChart(t,
		"--set-string", "databaseLifecycle.groups.nonprod.profiles[0]=",
	)
	require.Error(t, err)
	require.Contains(t, strings.ToLower(string(output)), "profiles")
}

func TestOPAChartRejectsNonIntegerPoolCapacity(t *testing.T) {
	t.Parallel()

	_, output, err := executeLifecycleChart(t,
		"--set-string", "databaseLifecycle.groups.nonprod.pool.maxDatabases=1",
	)
	require.Error(t, err)
	require.Contains(t, strings.ToLower(string(output)), "maxdatabases")
	require.Contains(t, strings.ToLower(string(output)), "integer")
}

func TestOPAChartRejectsGroupEngineInput(t *testing.T) {
	t.Parallel()

	_, output, err := executeLifecycleChart(t,
		"--set", "databaseLifecycle.groups.nonprod.engines[0]=mysql",
	)
	require.Error(t, err)
	require.Contains(t, strings.ToLower(string(output)), "engines")
	require.Contains(t, strings.ToLower(string(output)), "not allowed")
}

func TestOPAChartRejectsMissingPhysicalNetworkInputs(t *testing.T) {
	t.Parallel()

	_, output, err := executeLifecycleChart(t,
		"--set-string", "databaseLifecycle.groups.nonprod.physicalModuleInputs.vpc_id=",
	)
	require.Error(t, err)
	require.Contains(t, string(output), "databaseLifecycle.groups.nonprod.physicalModuleInputs.vpc_id is required when physical provisioning is enabled")
}

func TestOPAChartRejectsWorkerOwnedPhysicalModuleInputs(t *testing.T) {
	t.Parallel()

	for _, input := range []string{"capacity_max", "credential_resolver", "security_class"} {
		input := input
		t.Run(input, func(t *testing.T) {
			t.Parallel()
			_, output, err := executeLifecycleChart(t,
				"--set-string", "databaseLifecycle.groups.nonprod.physicalModuleInputs."+input+"=reserved",
			)
			require.Error(t, err)
			require.Contains(t, string(output), "databaseLifecycle.groups.nonprod.physicalModuleInputs."+input+" is worker-owned and must be omitted")
		})
	}
}

func TestOPAChartRejectsStringLifecycleBooleanValues(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name string
		args []string
		want string
	}{
		{
			name: "enabled",
			args: []string{"--set-string", "databaseLifecycle.enabled=false"},
			want: "databaseLifecycle.enabled must be a boolean",
		},
		{
			name: "physicalProvisioning.enabled",
			args: []string{"--set-string", "databaseLifecycle.physicalProvisioning.enabled=false"},
			want: "databaseLifecycle.physicalProvisioning.enabled must be a boolean",
		},
		{
			name: "backend.useLockfile",
			args: []string{"--set-string", "databaseLifecycle.backend.useLockfile=false"},
			want: "databaseLifecycle.backend.useLockfile must be a boolean",
		},
	} {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			_, output, err := executeLifecycleChart(t, test.args...)
			require.Error(t, err)
			rendered := string(output)
			require.True(t,
				strings.Contains(rendered, test.want) ||
					strings.Contains(rendered, "want boolean") ||
					strings.Contains(strings.ToLower(rendered), "invalid type. expected: boolean"),
				rendered,
			)
		})
	}
}

func TestOPAChartLintRejectsStringLifecycleBooleanValues(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name string
		args []string
		want string
	}{
		{
			name: "enabled",
			args: []string{"--set-string", "databaseLifecycle.enabled=false"},
			want: "enabled",
		},
		{
			name: "physicalProvisioning.enabled",
			args: []string{"--set-string", "databaseLifecycle.physicalProvisioning.enabled=false"},
			want: "physicalProvisioning",
		},
		{
			name: "backend.useLockfile",
			args: []string{"--set-string", "databaseLifecycle.backend.useLockfile=false"},
			want: "useLockfile",
		},
	} {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			_, output, err := lintLifecycleChartFixture(t, "database-lifecycle-config-values.yaml", test.args...)
			require.Error(t, err)
			require.Contains(t, strings.ToLower(string(output)), strings.ToLower(test.want))
		})
	}
}

func renderLifecycleChart(t *testing.T, extraArgs ...string) []byte {
	t.Helper()
	return renderLifecycleChartFixture(t, "database-lifecycle-config-values.yaml", extraArgs...)
}

func renderLifecycleChartFixture(t *testing.T, fixtureName string, extraArgs ...string) []byte {
	t.Helper()

	_, rendered, err := executeLifecycleChartFixture(t, fixtureName, extraArgs...)
	require.NoError(t, err, string(rendered))
	return rendered
}

func executeLifecycleChart(t *testing.T, extraArgs ...string) (*exec.Cmd, []byte, error) {
	t.Helper()
	return executeLifecycleChartFixture(t, "database-lifecycle-config-values.yaml", extraArgs...)
}

func executeLifecycleChartFixture(t *testing.T, fixtureName string, extraArgs ...string) (*exec.Cmd, []byte, error) {
	t.Helper()

	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	testDir := filepath.Dir(filename)
	chartDir := filepath.Clean(filepath.Join(testDir, ".."))
	baseFixture := filepath.Join(testDir, "fixtures", "database-lifecycle-config-values.yaml")
	fixture := filepath.Join(testDir, "fixtures", fixtureName)

	if _, err := exec.LookPath("helm"); err != nil {
		t.Skip("helm is not installed")
	}

	args := []string{"template", "lifecycle-test", chartDir, "-f", baseFixture}
	if fixture != baseFixture {
		args = append(args, "-f", fixture)
	}
	args = append(args, extraArgs...)
	render := exec.Command("helm", args...)
	rendered, err := render.CombinedOutput()
	return render, rendered, err
}

func lintLifecycleChartFixture(t *testing.T, fixtureName string, extraArgs ...string) (*exec.Cmd, []byte, error) {
	t.Helper()

	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	testDir := filepath.Dir(filename)
	chartDir := filepath.Clean(filepath.Join(testDir, ".."))
	baseFixture := filepath.Join(testDir, "fixtures", "database-lifecycle-config-values.yaml")
	fixture := filepath.Join(testDir, "fixtures", fixtureName)

	if _, err := exec.LookPath("helm"); err != nil {
		t.Skip("helm is not installed")
	}

	args := []string{"lint", chartDir, "-f", baseFixture}
	if fixture != baseFixture {
		args = append(args, "-f", fixture)
	}
	args = append(args, extraArgs...)
	lint := exec.Command("helm", args...)
	output, err := lint.CombinedOutput()
	return lint, output, err
}

func renderedDeployment(t *testing.T, rendered []byte) map[string]any {
	t.Helper()

	decoder := yaml.NewDecoder(bytes.NewReader(rendered))
	for {
		var doc map[string]any
		if err := decoder.Decode(&doc); err != nil {
			break
		}
		if doc["kind"] == "Deployment" {
			return doc
		}
	}

	t.Fatal("Deployment not found in rendered chart")
	return nil
}

func lifecyclePodSpec(t *testing.T, deployment map[string]any) map[string]any {
	t.Helper()

	spec := requireMap(t, deployment["spec"])
	template := requireMap(t, spec["template"])
	return requireMap(t, template["spec"])
}

func lifecycleContainer(t *testing.T, deployment map[string]any) map[string]any {
	t.Helper()

	containers := requireSlice(t, lifecyclePodSpec(t, deployment)["containers"])
	require.NotEmpty(t, containers)
	return requireMap(t, containers[0])
}

func lifecycleEnv(t *testing.T, container map[string]any) map[string]string {
	t.Helper()

	result := map[string]string{}
	for _, item := range requireSlice(t, container["env"]) {
		entry := requireMap(t, item)
		name, _ := entry["name"].(string)
		value, _ := entry["value"].(string)
		result[name] = strings.TrimSpace(value)
	}
	return result
}

func lifecycleConfig(t *testing.T, env map[string]string) map[string]any {
	t.Helper()

	var config map[string]any
	require.NoError(t, json.Unmarshal([]byte(env["SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG"]), &config))
	return config
}

func entryByEnvironment(t *testing.T, config map[string]any, environment string) map[string]any {
	t.Helper()

	for _, item := range requireSlice(t, config["entries"]) {
		entry := requireMap(t, item)
		if entry["environment"] == environment {
			return entry
		}
	}
	t.Fatalf("entry for environment %q not found", environment)
	return nil
}

func physicalModuleTags(t *testing.T, entry map[string]any) map[string]any {
	t.Helper()

	operations := requireMap(t, entry["operations"])
	physicalOperation := requireMap(t, operations["ensure_physical_database_instance"])
	terraform := requireMap(t, physicalOperation["terraform"])
	moduleSelectors := requireMap(t, terraform["moduleSelectors"])
	physicalModule := requireMap(t, moduleSelectors["postgres"])
	inputs := requireMap(t, physicalModule["inputs"])
	return requireMap(t, inputs["tags"])
}

func assertRenderedLifecycleConfig(t *testing.T, configJSON string) {
	t.Helper()

	var config map[string]any
	require.NoError(t, json.Unmarshal([]byte(configJSON), &config))
	require.Len(t, requireSlice(t, config["entries"]), 3)

	editEntry := entryByEnvironment(t, config, "edit")
	require.Equal(t, []any{"*"}, editEntry["profiles"])
	require.Equal(t, []any{"postgres"}, editEntry["engines"])
	operations := requireMap(t, editEntry["operations"])
	ensureDatabase := requireMap(t, operations["ensure_database"])
	require.Equal(t, map[string]any{
		"capacityMax":        float64(100),
		"mode":               "shared_pool",
		"onExhausted":        "provision",
		"provisionOperation": "ensure_physical_database_instance",
		"securityClass":      "standard",
	}, requireMap(t, ensureDatabase["physicalDatabase"]))

	ensureTerraform := requireMap(t, ensureDatabase["terraform"])
	require.Equal(t,
		"native-db/ee-opa/pr-19889/{{environment}}/{{profile}}/{{resource_key}}.tfstate",
		requireMap(t, ensureTerraform["backend"])["key"],
	)
	logicalModule := requireMap(t, requireMap(t, ensureTerraform["moduleSelectors"])["postgres"])
	require.Equal(t, logicalModuleSource, logicalModule["source"])
	require.Equal(t,
		"superblocks/native-db/test",
		requireMap(t, logicalModule["inputs"])["credential_secret_prefix"],
	)

	physicalOperation := requireMap(t, operations["ensure_physical_database_instance"])
	physicalTerraform := requireMap(t, physicalOperation["terraform"])
	physicalModule := requireMap(t, requireMap(t, physicalTerraform["moduleSelectors"])["postgres"])
	require.Equal(t, physicalModuleSource, physicalModule["source"])
	physicalInputs := requireMap(t, physicalModule["inputs"])
	require.Equal(t, "vpc-0abc123", physicalInputs["vpc_id"])
	require.Equal(t, []any{"subnet-aaa", "subnet-bbb"}, physicalInputs["subnet_ids"])
	require.Equal(t, "db.t4g.micro", physicalInputs["instance_class"])
	require.Equal(t, float64(20), physicalInputs["allocated_storage"])
	require.Equal(t, false, physicalInputs["multi_az"])
	require.NotContains(t, physicalInputs, "capacity_max")
	require.NotContains(t, physicalInputs, "security_class")
	require.NotContains(t, physicalInputs, "credential_resolver")

	deployedEntry := entryByEnvironment(t, config, "deployed")
	deployedOperations := requireMap(t, deployedEntry["operations"])
	deployedPolicy := requireMap(t, requireMap(t, deployedOperations["ensure_database"])["physicalDatabase"])
	require.Equal(t, float64(1), deployedPolicy["capacityMax"])
	deployedPhysical := requireMap(t,
		requireMap(t,
			requireMap(t, deployedOperations["ensure_physical_database_instance"])["terraform"],
		)["moduleSelectors"],
	)
	require.Equal(t,
		"db.m6g.large",
		requireMap(t, requireMap(t, deployedPhysical["postgres"])["inputs"])["instance_class"],
	)
	require.Equal(t, "native_runner", requireMap(t, operations["migrate_schema"])["backend"])
}

func requireMap(t *testing.T, value any) map[string]any {
	t.Helper()

	typed, ok := value.(map[string]any)
	require.True(t, ok)
	return typed
}

func requireSlice(t *testing.T, value any) []any {
	t.Helper()

	typed, ok := value.([]any)
	require.True(t, ok)
	return typed
}
