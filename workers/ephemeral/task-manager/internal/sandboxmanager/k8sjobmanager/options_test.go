package k8sjobmanager

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestWithWorkerPlugins(t *testing.T) {
	opts := NewOptions(WithWorkerPlugins("javascriptsdkapi"))
	assert.Equal(t, "javascriptsdkapi", opts.WorkerPlugins)
}

func TestWithResourceOptionsAndBuildRequirements(t *testing.T) {
	opts := NewOptions(
		WithResourceRequestsCPU("100m"),
		WithResourceRequestsMemory("128Mi"),
		WithResourceLimitsCPU("500m"),
		WithResourceLimitsMemory("512Mi"),
	)

	reqs := opts.BuildResourceRequirements()
	assert.Equal(t, "100m", reqs.Requests.Cpu().String())
	assert.Equal(t, "128Mi", reqs.Requests.Memory().String())
	assert.Equal(t, "500m", reqs.Limits.Cpu().String())
	assert.Equal(t, "512Mi", reqs.Limits.Memory().String())
}

func TestWithExecutionEnvInclusionListDedupes(t *testing.T) {
	opts := NewOptions(WithExecutionEnvInclusionList([]string{"FOO", "BAR", "FOO"}))
	assert.ElementsMatch(t, []string{"FOO", "BAR"}, opts.ExecutionEnvInclusionList)
}
