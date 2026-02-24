package k8sjobmanager

import (
	"context"
	"fmt"
	"runtime"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes/fake"
	clientgotesting "k8s.io/client-go/testing"
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
			WithEphemeral(true),
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
		assert.True(t, m.ephemeral)
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
		ephemeral                   bool
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
		{
			name:      "ephemeral adds do-not-disrupt annotation",
			language:  "javascript",
			ephemeral: true,
		},
		{
			name:      "non-ephemeral omits do-not-disrupt annotation",
			language:  "javascript",
			ephemeral: false,
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
				ephemeral:                   test.ephemeral,
				logger:                      zap.NewNop(),
			}

			job := m.buildJobSpec("sandbox-test-123", "test-123", test.language)

			assert.Equal(t, "sandbox-test-123", job.Name)
			assert.Equal(t, "test-ns", job.Namespace)

			if test.ephemeral {
				assert.Equal(t, "true", job.Spec.Template.ObjectMeta.Annotations["karpenter.sh/do-not-disrupt"])
			} else {
				assert.Empty(t, job.Spec.Template.ObjectMeta.Annotations)
			}

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

			// Verify language-specific container name and ephemeral label.
			assert.Equal(t, fmt.Sprintf("%s-sandbox", test.language), container.Name)
			assert.Equal(t, test.language, job.Labels["language"])
			assert.Equal(t, fmt.Sprintf("%t", test.ephemeral), job.Labels["ephemeral"])
			assert.Equal(t, fmt.Sprintf("%t", test.ephemeral), job.Spec.Template.Labels["ephemeral"])
		})
	}
}

func TestWatchSandboxPod(t *testing.T) {
	namespace := "test-ns"
	jobName := "sandbox-019c8c44-99e1-7e08-955c-4bd5d1357d3d"
	podName := jobName + "-abc123"

	makePod := func(phase corev1.PodPhase) *corev1.Pod {
		pod := &corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name:      podName,
				Namespace: namespace,
				Labels:    map[string]string{"job-name": jobName},
			},
			Status: corev1.PodStatus{Phase: phase},
		}
		if phase == corev1.PodFailed {
			pod.Status.ContainerStatuses = []corev1.ContainerStatus{
				{
					Name: "sandbox",
					State: corev1.ContainerState{
						Terminated: &corev1.ContainerStateTerminated{
							Reason:  "OOMKilled",
							Message: "out of memory",
						},
					},
				},
			}
		}
		return pod
	}

	for _, test := range []struct {
		name              string
		action            func(w watch.Interface)
		cancelBefore      bool
		expectedErrSubstr string
		expectCtxErr      bool
	}{
		{
			name: "reports when pod is deleted",
			action: func(w watch.Interface) {
				pod := makePod(corev1.PodRunning)
				w.(*watch.FakeWatcher).Add(pod)
				time.Sleep(10 * time.Millisecond)
				w.(*watch.FakeWatcher).Delete(pod)
			},
			expectedErrSubstr: "sandbox pod deleted",
		},
		{
			name: "reports when pod fails",
			action: func(w watch.Interface) {
				pod := makePod(corev1.PodRunning)
				w.(*watch.FakeWatcher).Add(pod)
				time.Sleep(10 * time.Millisecond)
				failedPod := makePod(corev1.PodFailed)
				w.(*watch.FakeWatcher).Modify(failedPod)
			},
			expectedErrSubstr: "sandbox pod failed",
		},
		{
			name: "reports when pod succeeds",
			action: func(w watch.Interface) {
				pod := makePod(corev1.PodRunning)
				w.(*watch.FakeWatcher).Add(pod)
				time.Sleep(10 * time.Millisecond)
				succeededPod := makePod(corev1.PodSucceeded)
				w.(*watch.FakeWatcher).Modify(succeededPod)
			},
			expectedErrSubstr: "sandbox pod unexpectedly completed successfully",
		},
		{
			name:         "reports when context is cancelled",
			cancelBefore: true,
			expectCtxErr: true,
		},
		{
			name: "reports when watcher channel closes without event",
			action: func(w watch.Interface) {
				time.Sleep(10 * time.Millisecond)
				w.(*watch.FakeWatcher).Stop()
			},
			expectedErrSubstr: "pod watcher channel closed",
		},
		{
			name: "reports when watcher sends Error event",
			action: func(w watch.Interface) {
				time.Sleep(10 * time.Millisecond)
				w.(*watch.FakeWatcher).Error(&metav1.Status{
					Status:  "Failure",
					Message: "connection reset",
				})
			},
			expectedErrSubstr: "sandbox pod watcher error",
		},
		{
			name: "ignores non-pod events and still reports pod deleted",
			action: func(w watch.Interface) {
				fw := w.(*watch.FakeWatcher)
				// Send a ConfigMap first - should be ignored
				fw.Add(&corev1.ConfigMap{
					ObjectMeta: metav1.ObjectMeta{Name: "other", Namespace: namespace},
				})
				time.Sleep(10 * time.Millisecond)
				pod := makePod(corev1.PodRunning)
				fw.Add(pod)
				time.Sleep(10 * time.Millisecond)
				fw.Delete(pod)
			},
			expectedErrSubstr: "sandbox pod deleted",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			fakeWatcher := watch.NewFake()
			clientset := fake.NewSimpleClientset()
			clientset.PrependWatchReactor("pods", func(action clientgotesting.Action) (bool, watch.Interface, error) {
				return true, fakeWatcher, nil
			})

			m := &K8sJobManager{
				clientset: clientset,
				namespace: namespace,
				logger:    zap.NewNop(),
			}

			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()

			deadCh := m.WatchSandboxPod(ctx, jobName)

			if test.cancelBefore {
				cancel()
			} else {
				go func() {
					time.Sleep(50 * time.Millisecond)
					test.action(fakeWatcher)
				}()
			}

			err, ok := <-deadCh
			require.True(t, ok, "expected one error from channel")
			require.Error(t, err)

			if test.expectCtxErr {
				assert.ErrorIs(t, err, context.Canceled)
			} else {
				assert.Contains(t, err.Error(), test.expectedErrSubstr)
			}

			// Channel should be closed after sending
			_, ok = <-deadCh
			assert.False(t, ok, "channel should be closed after sending error")
		})
	}
}

func TestWatchSandboxPodWatchError(t *testing.T) {
	watchErr := fmt.Errorf("watch failed: forbidden")
	clientset := fake.NewSimpleClientset()
	clientset.PrependWatchReactor("pods", func(action clientgotesting.Action) (bool, watch.Interface, error) {
		return true, nil, watchErr
	})

	m := &K8sJobManager{
		clientset: clientset,
		namespace: "test-ns",
		logger:    zap.NewNop(),
	}

	ctx := context.Background()
	deadCh := m.WatchSandboxPod(ctx, "sandbox-test")

	err, ok := <-deadCh

	require.True(t, ok, "expected error from channel")
	assert.ErrorContains(t, err, "failed to start sandbox pod raw watcher")
	assert.ErrorIs(t, err, watchErr, "error should wrap watch error")

	_, ok = <-deadCh
	assert.False(t, ok, "channel should be closed after sending error")
}

func TestWatchSandboxPodGoroutineCompletesWithoutRead(t *testing.T) {
	// Verifies the goroutine completes (and doesn't block on send) when no one reads from deadCh.
	namespace := "test-ns"
	jobName := "sandbox-test"
	podName := jobName + "-abc123"

	before := runtime.NumGoroutine()

	for i := 0; i < 20; i++ {
		fakeWatcher := watch.NewFake()
		clientset := fake.NewSimpleClientset()
		clientset.PrependWatchReactor("pods", func(action clientgotesting.Action) (bool, watch.Interface, error) {
			return true, fakeWatcher, nil
		})

		m := &K8sJobManager{
			clientset: clientset,
			namespace: namespace,
			logger:    zap.NewNop(),
		}

		_ = m.WatchSandboxPod(context.Background(), jobName)

		// Trigger pod delete so the goroutine sends to the channel and returns.
		go func(fw *watch.FakeWatcher) {
			time.Sleep(10 * time.Millisecond)
			pod := &corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Name:      podName,
					Namespace: namespace,
					Labels:    map[string]string{"job-name": jobName},
				},
				Status: corev1.PodStatus{Phase: corev1.PodRunning},
			}
			fw.Add(pod)
			time.Sleep(10 * time.Millisecond)
			fw.Delete(pod)
		}(fakeWatcher)
	}

	// Give goroutines time to complete.
	time.Sleep(200 * time.Millisecond)
	runtime.GC()

	after := runtime.NumGoroutine()
	assert.LessOrEqual(t, after, before+5,
		"goroutines should complete without a reader; possible leak if channel is unbuffered")
}
