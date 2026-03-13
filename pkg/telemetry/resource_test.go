package telemetry

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/sdk/resource"
)

func TestBuildResourceIncludesRequiredAttributes(t *testing.T) {
	res, err := BuildResource(Config{
		ServiceName:    "svc",
		ServiceVersion: "1.2.3",
		Environment:    "test",
	})
	require.NoError(t, err)
	require.NotNil(t, res)

	set := res.Set()
	serviceName, ok := set.Value("service.name")
	require.True(t, ok)
	assert.Equal(t, "svc", serviceName.AsString())

	serviceVersion, ok := set.Value("service.version")
	require.True(t, ok)
	assert.Equal(t, "1.2.3", serviceVersion.AsString())

	environment, ok := set.Value("deployment.environment.name")
	require.True(t, ok)
	assert.Equal(t, "test", environment.AsString())
}

func TestValidateResourceMissingAttributes(t *testing.T) {
	res := resource.NewSchemaless()
	err := ValidateResource(res)
	require.Error(t, err)
}

func TestAssertNoResourceAttributes(t *testing.T) {
	err := AssertNoResourceAttributes(map[string]any{
		"service.name": "svc",
	})
	require.Error(t, err)

	err = AssertNoResourceAttributes(map[string]any{
		"custom.key": "ok",
	})
	require.NoError(t, err)
}
