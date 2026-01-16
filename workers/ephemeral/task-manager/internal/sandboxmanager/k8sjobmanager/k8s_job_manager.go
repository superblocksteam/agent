// Package jobmanager manages the lifecycle of sandbox Kubernetes Jobs.
// It creates ephemeral Jobs for each code execution, waits for the Pod to be ready,
// and cleans up after execution completes.
package k8sjobmanager

import (
	"context"
	"fmt"
	"time"
	"workers/ephemeral/task-manager/internal/sandboxmanager"

	"go.uber.org/zap"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
	"k8s.io/utils/ptr"
)

// K8sJobManager manages the lifecycle of sandbox Jobs
type K8sJobManager struct {
	clientset               kubernetes.Interface
	namespace               string
	image                   string
	port                    int
	podIP                   string
	grpcPort                int
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
}

// NewSandboxJobManager creates a new SandboxJobManager
func NewSandboxJobManager(opts *Options) *K8sJobManager {
	return &K8sJobManager{
		clientset:               opts.Clientset,
		namespace:               opts.Namespace,
		image:                   opts.Image,
		port:                    opts.Port,
		podIP:                   opts.PodIP,
		grpcPort:                opts.GRPCPort,
		ttlSecondsAfterFinished: opts.TTLSecondsAfterFinished,
		runtimeClassName:        opts.RuntimeClassName,
		nodeSelector:            opts.NodeSelector,
		tolerations:             opts.Tolerations,
		logger:                  opts.Logger,
		podReadyTimeout:         opts.PodReadyTimeout,
		ownerPodName:            opts.OwnerPodName,
		ownerPodUID:             opts.OwnerPodUID,
		imagePullSecrets:        opts.ImagePullSecrets,
		language:                opts.Language,
	}
}

// CreateSandbox creates a new sandbox Job and waits for the Pod to be ready.
// Returns SandboxInfo with the Pod IP and gRPC address.
func (m *K8sJobManager) CreateSandbox(ctx context.Context, sandboxId string) (*sandboxmanager.SandboxInfo, error) {
	jobName := fmt.Sprintf("sandbox-%s", sandboxId)

	job := m.buildJobSpec(jobName, sandboxId, m.language)

	m.logger.Info("creating sandbox job",
		zap.String("job", jobName),
		zap.String("sandbox_id", sandboxId),
		zap.String("image", m.image),
	)

	createdJob, err := m.clientset.BatchV1().Jobs(m.namespace).Create(ctx, job, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create sandbox job: %w", err)
	}

	m.logger.Info("sandbox job created, waiting for pod",
		zap.String("job", createdJob.Name),
	)

	// Wait for the Pod to be ready and get its IP
	podInfo, err := m.waitForPodReady(ctx, jobName)
	if err != nil {
		// Cleanup the job if we failed to get a ready pod.
		// Use ctx so this is cancellable - the owner reference on the job
		// will ensure Kubernetes garbage collects it if this delete fails.
		_ = m.DeleteSandbox(ctx, jobName)
		return nil, fmt.Errorf("failed waiting for sandbox pod: %w", err)
	}

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

// buildJobSpec creates the Job specification for a sandbox
func (m *K8sJobManager) buildJobSpec(jobName, executionID, language string) *batchv1.Job {
	ttl := m.ttlSecondsAfterFinished
	backoffLimit := int32(0)
	parallelism := int32(1)
	completions := int32(1)

	// Variable store address - task manager's Pod IP + gRPC port
	variableStoreAddress := fmt.Sprintf("%s:%d", m.podIP, m.grpcPort)

	containerName := "javascript-sandbox"
	labels := map[string]string{
		"role":         "sandbox",
		"execution-id": executionID,
	}
	specLabels := map[string]string{
		"role":         "sandbox",
		"execution-id": executionID,
		"job-name":     jobName,
	}

	if language != "" {
		containerName = fmt.Sprintf("%s-lang-executor-sandbox", language)
		labels["language"] = language
		specLabels["language"] = language
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
					Labels: specLabels,
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
									Name:  "VARIABLE_STORE_ADDRESS",
									Value: variableStoreAddress,
								},
								{
									Name:  "EXECUTION_ID",
									Value: executionID,
								},
								{
									Name:  "GRPC_PORT",
									Value: fmt.Sprintf("%d", m.port),
								},
							},
							Ports: []corev1.ContainerPort{
								{
									Name:          "grpc",
									ContainerPort: int32(m.port),
									Protocol:      corev1.ProtocolTCP,
								},
							},
							// TODO: Add resource limits from config
						},
					},
				},
			},
		},
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
