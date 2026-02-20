package k8sjobmanager

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
)

func TestNewSandboxJobManager(t *testing.T) {
	t.Run("creates manager from options with all fields", func(t *testing.T) {
		logger := zap.NewNop()
		tolerations := []corev1.Toleration{{Key: "sandbox", Operator: corev1.TolerationOpExists}}
		nodeSelector := map[string]string{"node-type": "sandbox"}
		imagePullSecrets := []string{"registry-creds"}

		opts := NewOptions(
			WithNamespace("sandbox-ns"),
			WithImage("sandbox:v2"),
			WithPort(9090),
			WithPodIP("10.0.0.5"),
			WithVariableStoreGrpcPort(50060),
			WithVariableStoreHttpPort(8090),
			WithStreamingProxyGrpcPort(50070),
			WithTTL(120),
			WithRuntimeClassName("gvisor"),
			WithNodeSelector(nodeSelector),
			WithTolerations(tolerations),
			WithLogger(logger),
			WithPodReadyTimeout(30*time.Second),
			WithOwnerPodName("tm-pod-1"),
			WithOwnerPodUID("uid-123"),
			WithImagePullSecrets(imagePullSecrets),
			WithLanguage("python"),
			WithIntegrationExecutorGrpcPort(50052),
		)

		m := NewSandboxJobManager(opts)

		assert.Equal(t, "sandbox-ns", m.namespace)
		assert.Equal(t, "sandbox:v2", m.image)
		assert.Equal(t, 9090, m.port)
		assert.Equal(t, "10.0.0.5", m.podIP)
		assert.Equal(t, 50060, m.variableStoreGrpcPort)
		assert.Equal(t, 8090, m.variableStoreHttpPort)
		assert.Equal(t, 50070, m.streamingProxyGrpcPort)
		assert.Equal(t, int32(120), m.ttlSecondsAfterFinished)
		assert.Equal(t, "gvisor", m.runtimeClassName)
		assert.Equal(t, nodeSelector, m.nodeSelector)
		assert.Equal(t, tolerations, m.tolerations)
		assert.Equal(t, logger, m.logger)
		assert.Equal(t, 30*time.Second, m.podReadyTimeout)
		assert.Equal(t, "tm-pod-1", m.ownerPodName)
		assert.Equal(t, "uid-123", m.ownerPodUID)
		assert.Equal(t, imagePullSecrets, m.imagePullSecrets)
		assert.Equal(t, "python", m.language)
		assert.Equal(t, 50052, m.integrationExecutorGrpcPort)
	})

	t.Run("uses default option values", func(t *testing.T) {
		opts := NewOptions()

		m := NewSandboxJobManager(opts)

		assert.Equal(t, 50051, m.port)
		assert.Equal(t, 50050, m.variableStoreGrpcPort)
		assert.Equal(t, 8080, m.variableStoreHttpPort)
		assert.Equal(t, int32(60), m.ttlSecondsAfterFinished)
		assert.Equal(t, 2*time.Minute, m.podReadyTimeout)
		assert.Equal(t, 0, m.integrationExecutorGrpcPort)
	})
}

func TestBuildJobSpec(t *testing.T) {
	for _, test := range []struct {
		name                        string
		integrationExecutorGrpcPort int
		language                    string
		expectIntegrationExecutor   bool
	}{
		{
			name:                        "without integration executor",
			integrationExecutorGrpcPort: 0,
			language:                    "javascript",
			expectIntegrationExecutor:   false,
		},
		{
			name:                        "with integration executor",
			integrationExecutorGrpcPort: 50052,
			language:                    "javascript",
			expectIntegrationExecutor:   true,
		},
		{
			name:                        "with integration executor and python language",
			integrationExecutorGrpcPort: 50052,
			language:                    "python",
			expectIntegrationExecutor:   true,
		},
		{
			name:                        "without language",
			integrationExecutorGrpcPort: 0,
			language:                    "",
			expectIntegrationExecutor:   false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m := &K8sJobManager{
				namespace:                   "test-ns",
				image:                       "sandbox:latest",
				port:                        50051,
				podIP:                       "10.0.0.1",
				variableStoreGrpcPort:       50050,
				variableStoreHttpPort:       8080,
				streamingProxyGrpcPort:      50053,
				ttlSecondsAfterFinished:     60,
				language:                    test.language,
				integrationExecutorGrpcPort: test.integrationExecutorGrpcPort,
				logger:                      zap.NewNop(),
			}

			job := m.buildJobSpec("sandbox-test-123", "test-123", test.language)

			assert.Equal(t, "sandbox-test-123", job.Name)
			assert.Equal(t, "test-ns", job.Namespace)

			container := job.Spec.Template.Spec.Containers[0]

			// Check integration executor env var presence.
			var found bool
			var envValue string
			for _, env := range container.Env {
				if env.Name == "SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_INTEGRATION_EXECUTOR_ADDRESS" {
					found = true
					envValue = env.Value
					break
				}
			}

			if test.expectIntegrationExecutor {
				assert.True(t, found, "expected integration executor env var to be set")
				assert.Equal(t, "10.0.0.1:50052", envValue)
			} else {
				assert.False(t, found, "expected integration executor env var to not be set")
			}

			// Verify language-specific container name.
			assert.Equal(t, fmt.Sprintf("%s-sandbox", test.language), container.Name)
			assert.Equal(t, test.language, job.Labels["language"])
		})
	}
}
