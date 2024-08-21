package metrics

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	metrics "github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
	"go.uber.org/zap"
)

func TestExportMetrics(t *testing.T) {
	metrics.RegisterMetrics()

	mockServerClient := mocks.NewServerClient(t)

	metricsExporter := NewMetricsExporter(&MetricsExporterOptions{
		ServerHttpClient: mockServerClient,
		Version:          "v1",
		VersionExternal:  "v2",
		Interval:         10,
		Logger:           zap.NewNop(),
	})

	mockServerClient.On("PostHealthcheck", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       http.NoBody,
	}, nil, nil)

	metrics.ApiExecutionEventsTotal.WithLabelValues("failed", "api").Add(1)
	metrics.ApiExecutionEventsTotal.WithLabelValues("succeeded", "api").Add(2)
	metrics.ApiExecutionEventsTotal.WithLabelValues("failed", "workflow").Add(3)
	metrics.ApiExecutionEventsTotal.WithLabelValues("succeeded", "workflow").Add(4)
	err := metricsExporter.sendHealthCheckMetrics()

	assert.Nil(t, err)

	mockServerClient.AssertNumberOfCalls(t, "PostHealthcheck", 1)
	healthCheckRequest := mockServerClient.Calls[0].Arguments[4].(*HealthCheckRequest)
	assert.Equal(t, "v1", healthCheckRequest.Version)
	assert.Equal(t, "v2", healthCheckRequest.VersionExternal)
	assert.Equal(t, AgentStatusActive, healthCheckRequest.DesiredState)
	assert.NotNil(t, healthCheckRequest.Cpu)
	assert.NotNil(t, healthCheckRequest.Memory)
	assert.Equal(t, float64(1), healthCheckRequest.ApiFailureCount)
	assert.Equal(t, float64(2), healthCheckRequest.ApiSuccessCount)
	assert.Equal(t, float64(3), healthCheckRequest.WorkflowFailureCount)
	assert.Equal(t, float64(4), healthCheckRequest.WorkflowSuccessCount)
}
