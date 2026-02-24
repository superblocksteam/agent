// Package jobmanager manages the lifecycle of sandbox Kubernetes Jobs.
// It creates ephemeral Jobs for each code execution, waits for the Pod to be ready,
// and cleans up after execution completes.
package k8sjobmanager

import (
	"context"
	"fmt"
	"strings"
	"time"

	sandboxmetrics "workers/ephemeral/task-manager/internal/metrics"
	"workers/ephemeral/task-manager/internal/sandboxmanager"

	"go.uber.org/zap"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/cache"
	k8swatch "k8s.io/client-go/tools/watch"
	"k8s.io/utils/ptr"
)

// K8sJobManager manages the lifecycle of sandbox Jobs
type K8sJobManager struct {
	clientset               kubernetes.Interface
	namespace               string
	image                   string
	port                    int
	podIP                   string
	variableStoreGrpcPort   int
	variableStoreHttpPort   int
	streamingProxyGrpcPort  int
	ttlSecondsAfterFinished int32
	runtimeClassName        string
	nodeSelector            map[string]string
	tolerations             []corev1.Toleration
	logger                  *zap.Logger
	podReadyTimeout         time.Duration
	// Owner reference for garbage collection
	ownerPodName string
	ownerPodUID  string
	// Image pull secrets for sandbox pods
	imagePullSecrets []string
	// Language of the sandbox
	language string
	// Task manager's integration executor gRPC port
	integrationExecutorGrpcPort int
	// Ephemeral mode: task-manager processes one job and exits
	ephemeral bool
}

// NewSandboxJobManager creates a new SandboxJobManager
func NewSandboxJobManager(opts *Options) *K8sJobManager {
	return &K8sJobManager{
		clientset:                   opts.Clientset,
		namespace:                   opts.Namespace,
		image:                       opts.Image,
		port:                        opts.Port,
		podIP:                       opts.PodIP,
		variableStoreGrpcPort:       opts.VariableStoreGrpcPort,
		variableStoreHttpPort:       opts.VariableStoreHttpPort,
		streamingProxyGrpcPort:      opts.StreamingProxyGrpcPort,
		ttlSecondsAfterFinished:     opts.TTLSecondsAfterFinished,
		runtimeClassName:            opts.RuntimeClassName,
		nodeSelector:                opts.NodeSelector,
		tolerations:                 opts.Tolerations,
		logger:                      opts.Logger,
		podReadyTimeout:             opts.PodReadyTimeout,
		ownerPodName:                opts.OwnerPodName,
		ownerPodUID:                 opts.OwnerPodUID,
		imagePullSecrets:            opts.ImagePullSecrets,
		language:                    strings.ToLower(opts.Language),
		integrationExecutorGrpcPort: opts.IntegrationExecutorGrpcPort,
		ephemeral:                   opts.Ephemeral,
	}
}

// CreateSandbox creates a new sandbox Job and waits for the Pod to be ready.
// Returns SandboxInfo with the Pod IP and gRPC address.
func (m *K8sJobManager) CreateSandbox(ctx context.Context, sandboxId string) (*sandboxmanager.SandboxInfo, error) {
	start := time.Now()
	jobName := fmt.Sprintf("sandbox-%s", sandboxId)

	job := m.buildJobSpec(jobName, sandboxId, m.language)

	m.logger.Info("creating sandbox job",
		zap.String("job", jobName),
		zap.String("sandbox_id", sandboxId),
		zap.String("image", m.image),
	)

	createdJob, err := m.clientset.BatchV1().Jobs(m.namespace).Create(ctx, job, metav1.CreateOptions{})
	if err != nil {
		sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxCreationDuration, time.Since(start).Seconds(),
			sandboxmetrics.AttrLanguage.String(m.language),
			sandboxmetrics.AttrResult.String("failed"),
		)
		return nil, fmt.Errorf("failed to create sandbox job: %w", err)
	}

	m.logger.Info("sandbox job created, waiting for pod",
		zap.String("job", createdJob.Name),
	)

	// Wait for the Pod to be ready and get its IP
	podInfo, err := m.waitForPodReady(ctx, jobName)
	if err != nil {
		sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxCreationDuration, time.Since(start).Seconds(),
			sandboxmetrics.AttrLanguage.String(m.language),
			sandboxmetrics.AttrResult.String("failed"),
		)
		// Cleanup the job if we failed to get a ready pod.
		// Use ctx so this is cancellable - the owner reference on the job
		// will ensure Kubernetes garbage collects it if this delete fails.
		_ = m.DeleteSandbox(ctx, jobName)
		return nil, fmt.Errorf("failed waiting for sandbox pod: %w", err)
	}

	sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxCreationDuration, time.Since(start).Seconds(),
		sandboxmetrics.AttrLanguage.String(m.language),
		sandboxmetrics.AttrResult.String("succeeded"),
	)

	return &sandboxmanager.SandboxInfo{
		Name:    jobName,
		Id:      podInfo.Name,
		Ip:      podInfo.Status.PodIP,
		Address: fmt.Sprintf("%s:%d", podInfo.Status.PodIP, m.port),
	}, nil
}

// DeleteSandbox deletes a sandbox Job and its Pod
func (m *K8sJobManager) DeleteSandbox(ctx context.Context, jobName string) error {
	m.logger.Info("deleting sandbox job", zap.String("job", jobName))

	propagation := metav1.DeletePropagationBackground
	err := m.clientset.BatchV1().Jobs(m.namespace).Delete(ctx, jobName, metav1.DeleteOptions{
		PropagationPolicy: &propagation,
	})
	if err != nil {
		m.logger.Warn("failed to delete sandbox job",
			zap.String("job", jobName),
			zap.Error(err),
		)
		return err
	}

	return nil
}

// WatchSandboxPod watches the sandbox pod and closes the returned channel when the pod is
// no longer available (deleted, failed, evicted)
func (m *K8sJobManager) WatchSandboxPod(ctx context.Context, jobName string) <-chan error {
	deadCh := make(chan error, 1)
	go func() {
		defer close(deadCh)

		labelSelector := fmt.Sprintf("job-name=%s", jobName)
		podInterface := m.clientset.CoreV1().Pods(m.namespace)

		// Initial list to get resource version for RetryWatcher (required for reconnection).
		list, err := podInterface.List(ctx, metav1.ListOptions{LabelSelector: labelSelector})
		if err != nil {
			m.logger.Warn(
				"failed to list sandbox pods for watch",
				zap.String("job", jobName),
				zap.Error(err),
			)

			deadCh <- fmt.Errorf("failed to start sandbox pod watcher: %w", err)
			return
		}

		initialRV := list.ResourceVersion
		if initialRV == "" || initialRV == "0" {
			m.logger.Warn(
				"invalid resource version for RetryWatcher, using raw watch",
				zap.String("job", jobName),
				zap.String("resourceVersion", initialRV),
			)

			m.watchSandboxPodRaw(ctx, jobName, labelSelector, podInterface, deadCh)
			return
		}

		lwWithCtx := &cache.ListWatch{
			ListWithContextFunc: func(ctx context.Context, opts metav1.ListOptions) (runtime.Object, error) {
				opts.LabelSelector = labelSelector
				return podInterface.List(ctx, opts)
			},
			WatchFuncWithContext: func(ctx context.Context, opts metav1.ListOptions) (watch.Interface, error) {
				opts.LabelSelector = labelSelector
				return podInterface.Watch(ctx, opts)
			},
		}

		retryWatcher, err := k8swatch.NewRetryWatcherWithContext(ctx, initialRV, lwWithCtx)
		if err != nil {
			m.logger.Warn(
				"failed to create sandbox pod retry watcher",
				zap.String("job", jobName),
				zap.Error(err),
			)

			deadCh <- fmt.Errorf("failed to start sandbox pod retry watcher: %w", err)
			return
		}
		defer retryWatcher.Stop()

		m.processPodWatchEvents(ctx, jobName, retryWatcher.ResultChan(), deadCh)
	}()

	return deadCh
}

// watchSandboxPodRaw is a fallback when RetryWatcher cannot be used (e.g. invalid resource version)
func (m *K8sJobManager) watchSandboxPodRaw(
	ctx context.Context,
	jobName, labelSelector string,
	podInterface interface {
		Watch(context.Context, metav1.ListOptions) (watch.Interface, error)
	},
	deadCh chan<- error,
) {
	watcher, err := podInterface.Watch(ctx, metav1.ListOptions{LabelSelector: labelSelector})
	if err != nil {
		m.logger.Warn(
			"failed to start sandbox pod watcher",
			zap.String("job", jobName),
			zap.Error(err),
		)

		deadCh <- fmt.Errorf("failed to start sandbox pod raw watcher: %w", err)
		return
	}
	defer watcher.Stop()

	m.processPodWatchEvents(ctx, jobName, watcher.ResultChan(), deadCh)
}

// processPodWatchEvents handles watch events for pod lifecycle (deleted, failed, succeeded)
func (m *K8sJobManager) processPodWatchEvents(
	ctx context.Context,
	jobName string,
	resultChan <-chan watch.Event,
	deadCh chan<- error,
) {
	for {
		select {
		case <-ctx.Done():
			deadCh <- ctx.Err()
			return
		case event, ok := <-resultChan:
			if !ok {
				deadCh <- fmt.Errorf("pod watcher channel closed")
				return
			}

			if event.Type == watch.Error {
				m.logger.Warn(
					"sandbox pod watcher error",
					zap.String("job", jobName),
					zap.Any("object", event.Object),
				)

				deadCh <- fmt.Errorf("sandbox pod watcher error: %v", event.Object)
				return
			}

			pod, ok := event.Object.(*corev1.Pod)
			if !ok {
				continue
			}

			switch event.Type {
			case watch.Deleted:
				m.logger.Info(
					"sandbox pod deleted",
					zap.String("job", jobName),
					zap.String("pod", pod.Name),
				)

				deadCh <- fmt.Errorf("sandbox pod deleted: %s", pod.Name)
				return
			case watch.Modified:
				if pod.Status.Phase == corev1.PodFailed {
					m.logger.Info(
						"sandbox pod failed",
						zap.String("job", jobName),
						zap.String("pod", pod.Name),
						zap.String("reason", getPodFailureReason(pod)),
					)

					deadCh <- fmt.Errorf("sandbox pod failed: %s", getPodFailureReason(pod))
					return
				} else if pod.Status.Phase == corev1.PodSucceeded {
					m.logger.Info(
						"sandbox pod unexpectedly completed successfully",
						zap.String("job", jobName),
						zap.String("pod", pod.Name),
					)

					deadCh <- fmt.Errorf("sandbox pod unexpectedly completed successfully: %s", pod.Name)
					return
				}
			}
		}
	}
}

// buildJobSpec creates the Job specification for a sandbox
func (m *K8sJobManager) buildJobSpec(jobName, sandboxId, language string) *batchv1.Job {
	ttl := m.ttlSecondsAfterFinished
	backoffLimit := int32(0)
	parallelism := int32(1)
	completions := int32(1)

	// Variable store address - task manager's Pod IP + gRPC port
	variableStoreAddress := fmt.Sprintf("%s:%d", m.podIP, m.variableStoreGrpcPort)
	variableStoreHttpAddress := fmt.Sprintf("%s:%d", m.podIP, m.variableStoreHttpPort)

	// Streaming proxy address - task manager's Pod IP + gRPC port
	streamingProxyAddress := fmt.Sprintf("%s:%d", m.podIP, m.streamingProxyGrpcPort)

	containerName := fmt.Sprintf("%s-sandbox", language)
	labels := map[string]string{
		"component":    "worker.sandbox",
		"ephemeral":    fmt.Sprintf("%t", m.ephemeral),
		"execution-id": sandboxId,
		"language":     language,
		"role":         "sandbox",
		"sandbox-id":   sandboxId,
	}
	specLabels := map[string]string{
		"component":    "worker.sandbox",
		"ephemeral":    fmt.Sprintf("%t", m.ephemeral),
		"execution-id": sandboxId,
		"job-name":     jobName,
		"language":     language,
		"role":         "sandbox",
		"sandbox-id":   sandboxId,
	}

	var podAnnotations map[string]string
	if m.ephemeral {
		podAnnotations = map[string]string{
			"karpenter.sh/do-not-disrupt": "true",
		}
	}

	job := &batchv1.Job{
		ObjectMeta: metav1.ObjectMeta{
			Name:            jobName,
			Namespace:       m.namespace,
			Labels:          labels,
			OwnerReferences: m.buildOwnerReferences(),
		},
		Spec: batchv1.JobSpec{
			TTLSecondsAfterFinished: &ttl,
			BackoffLimit:            &backoffLimit,
			Parallelism:             &parallelism,
			Completions:             &completions,
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels:      specLabels,
					Annotations: podAnnotations,
				},
				Spec: corev1.PodSpec{
					RestartPolicy:                corev1.RestartPolicyNever,
					AutomountServiceAccountToken: ptr.To(false),
					ImagePullSecrets:             m.buildImagePullSecrets(),
					Containers: []corev1.Container{
						{
							Name:            containerName,
							Image:           m.image,
							ImagePullPolicy: corev1.PullIfNotPresent,
							Env: []corev1.EnvVar{
								{
									Name:  "SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_SANDBOX_ID",
									Value: sandboxId,
								},
								{
									Name:  "SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_PORT",
									Value: fmt.Sprintf("%d", m.port),
								},
								{
									Name:  "SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_VARIABLE_STORE_ADDRESS",
									Value: variableStoreAddress,
								},
								{
									Name:  "SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_VARIABLE_STORE_HTTP_ADDRESS",
									Value: variableStoreHttpAddress,
								},
								{
									Name:  "SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_STREAMING_PROXY_ADDRESS",
									Value: streamingProxyAddress,
								},
								{
									Name:  "EXECUTION_ID",
									Value: sandboxId,
								},
							},
							Ports: []corev1.ContainerPort{
								{
									Name:          "grpc",
									ContainerPort: int32(m.port),
									Protocol:      corev1.ProtocolTCP,
								},
							},
							// Readiness probe: only mark Ready when gRPC server is listening.
							// Prevents task-manager from connecting before sandbox has bound to port 50051.
							ReadinessProbe: &corev1.Probe{
								ProbeHandler: corev1.ProbeHandler{
									TCPSocket: &corev1.TCPSocketAction{
										Port: intstr.FromInt32(int32(m.port)),
									},
								},
								InitialDelaySeconds: 2,
								PeriodSeconds:       2,
								TimeoutSeconds:      1,
							},
							// TODO: Add resource limits from config
						},
					},
				},
			},
		},
	}

	// Set integration executor address if enabled
	if m.integrationExecutorGrpcPort > 0 {
		container := &job.Spec.Template.Spec.Containers[0]
		container.Env = append(container.Env, corev1.EnvVar{
			Name:  "SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_INTEGRATION_EXECUTOR_ADDRESS",
			Value: fmt.Sprintf("%s:%d", m.podIP, m.integrationExecutorGrpcPort),
		})
	}

	// Set runtime class if specified (for gVisor)
	if m.runtimeClassName != "" {
		job.Spec.Template.Spec.RuntimeClassName = &m.runtimeClassName
	}

	// Set node selector if specified
	if len(m.nodeSelector) > 0 {
		job.Spec.Template.Spec.NodeSelector = m.nodeSelector
	}

	// Set tolerations if specified
	if len(m.tolerations) > 0 {
		job.Spec.Template.Spec.Tolerations = m.tolerations
	}

	return job
}

// waitForPodReady watches for the Pod created by the Job to become ready
func (m *K8sJobManager) waitForPodReady(ctx context.Context, jobName string) (*corev1.Pod, error) {
	// Create a context with timeout
	ctx, cancel := context.WithTimeout(ctx, m.podReadyTimeout)
	defer cancel()

	// Watch for pods with the job-name label
	labelSelector := fmt.Sprintf("job-name=%s", jobName)

	watcher, err := m.clientset.CoreV1().Pods(m.namespace).Watch(ctx, metav1.ListOptions{
		LabelSelector: labelSelector,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to watch pods: %w", err)
	}
	defer watcher.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("timeout waiting for sandbox pod to be ready: %w", ctx.Err())

		case event, ok := <-watcher.ResultChan():
			if !ok {
				return nil, fmt.Errorf("pod watcher channel closed")
			}

			if event.Type == watch.Error {
				return nil, fmt.Errorf("watch error: %v", event.Object)
			}

			pod, ok := event.Object.(*corev1.Pod)
			if !ok {
				continue
			}

			m.logger.Debug("pod event",
				zap.String("pod", pod.Name),
				zap.String("phase", string(pod.Status.Phase)),
				zap.String("event", string(event.Type)),
			)

			// Check if pod is ready
			if isPodReady(pod) {
				m.logger.Info("sandbox pod is ready",
					zap.String("pod", pod.Name),
					zap.String("ip", pod.Status.PodIP),
				)
				return pod, nil
			}

			// Check for failure
			if pod.Status.Phase == corev1.PodFailed {
				return nil, fmt.Errorf("sandbox pod failed: %s", getPodFailureReason(pod))
			}
		}
	}
}

// isPodReady checks if a pod is ready to accept connections
func isPodReady(pod *corev1.Pod) bool {
	if pod.Status.Phase != corev1.PodRunning {
		return false
	}

	if pod.Status.PodIP == "" {
		return false
	}

	// Check container ready conditions
	for _, condition := range pod.Status.Conditions {
		if condition.Type == corev1.PodReady && condition.Status == corev1.ConditionTrue {
			return true
		}
	}

	// Also check if all containers are ready
	for _, containerStatus := range pod.Status.ContainerStatuses {
		if !containerStatus.Ready {
			return false
		}
	}

	return len(pod.Status.ContainerStatuses) > 0
}

// getPodFailureReason extracts the failure reason from a failed pod
func getPodFailureReason(pod *corev1.Pod) string {
	for _, containerStatus := range pod.Status.ContainerStatuses {
		if containerStatus.State.Terminated != nil {
			return fmt.Sprintf("container %s terminated: %s - %s",
				containerStatus.Name,
				containerStatus.State.Terminated.Reason,
				containerStatus.State.Terminated.Message,
			)
		}
		if containerStatus.State.Waiting != nil {
			return fmt.Sprintf("container %s waiting: %s - %s",
				containerStatus.Name,
				containerStatus.State.Waiting.Reason,
				containerStatus.State.Waiting.Message,
			)
		}
	}
	return pod.Status.Message
}

// buildImagePullSecrets creates the image pull secrets for sandbox pods
func (m *K8sJobManager) buildImagePullSecrets() []corev1.LocalObjectReference {
	if len(m.imagePullSecrets) == 0 {
		return nil
	}

	refs := make([]corev1.LocalObjectReference, len(m.imagePullSecrets))
	for i, name := range m.imagePullSecrets {
		refs[i] = corev1.LocalObjectReference{Name: name}
	}
	return refs
}

// buildOwnerReferences creates owner references for garbage collection.
// When the task-manager pod is deleted, the sandbox Job will be automatically deleted.
func (m *K8sJobManager) buildOwnerReferences() []metav1.OwnerReference {
	if m.ownerPodName == "" || m.ownerPodUID == "" {
		m.logger.Warn("owner pod name or UID not set, sandbox jobs will not have owner references")
		return nil
	}

	return []metav1.OwnerReference{
		{
			APIVersion: "v1",
			Kind:       "Pod",
			Name:       m.ownerPodName,
			UID:        types.UID(m.ownerPodUID),
			// Controller = false: non-controlling owner reference for garbage collection.
			// When task-manager is deleted, sandbox Jobs are automatically cleaned up.
			Controller: ptr.To(false),
			// BlockOwnerDeletion = true: prevents task-manager pod from being fully deleted
			// until the sandbox Job is gone. This gives the task-manager time to complete
			// in-flight executions during the terminationGracePeriodSeconds window.
			BlockOwnerDeletion: ptr.To(true),
		},
	}
}
