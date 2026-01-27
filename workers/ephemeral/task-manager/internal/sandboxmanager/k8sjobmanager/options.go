package k8sjobmanager

import (
	"time"

	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
)

// Options configures the SandboxJobManager
type Options struct {
	// Kubernetes client
	Clientset kubernetes.Interface

	// Namespace to create sandbox Jobs in
	Namespace string

	// Sandbox container image
	Image string

	// Sandbox gRPC port
	Port int

	// Task manager's own Pod IP (for sandbox to call back)
	PodIP string

	// Task manager's gRPC port (variable store)
	VariableStoreGrpcPort int

	// Task manager's HTTP port (variable store)
	VariableStoreHttpPort int

	// Task manager's gRPC port (streaming proxy)
	StreamingProxyGrpcPort int

	// TTL for completed Jobs (auto garbage collection)
	TTLSecondsAfterFinished int32

	// RuntimeClass for gVisor
	RuntimeClassName string

	// NodeSelector for sandbox pods (to schedule on specific nodes)
	NodeSelector map[string]string

	// Tolerations for sandbox pods (to tolerate node taints)
	Tolerations []corev1.Toleration

	// Logger
	Logger *zap.Logger

	// Timeout for waiting for pod to become ready
	PodReadyTimeout time.Duration

	// Owner reference fields (for garbage collection when task-manager pod is deleted)
	OwnerPodName string
	OwnerPodUID  string

	// ImagePullSecrets for sandbox pods (to pull from private registries)
	ImagePullSecrets []string

	// Language of the sandbox
	Language string
}

// Option is a functional option for Options
type Option func(*Options)

// WithClientset sets the Kubernetes client
func WithClientset(c kubernetes.Interface) Option {
	return func(o *Options) {
		o.Clientset = c
	}
}

// WithNamespace sets the namespace
func WithNamespace(ns string) Option {
	return func(o *Options) {
		o.Namespace = ns
	}
}

// WithImage sets the sandbox image
func WithImage(image string) Option {
	return func(o *Options) {
		o.Image = image
	}
}

// WithPort sets the sandbox gRPC port
func WithPort(port int) Option {
	return func(o *Options) {
		o.Port = port
	}
}

// WithPodIP sets the task manager's Pod IP
func WithPodIP(ip string) Option {
	return func(o *Options) {
		o.PodIP = ip
	}
}

// WithVariableStoreGrpcPort sets the task manager's gRPC port
func WithVariableStoreGrpcPort(port int) Option {
	return func(o *Options) {
		o.VariableStoreGrpcPort = port
	}
}

// WithVariableStoreHttpPort sets the task manager's HTTP port
func WithVariableStoreHttpPort(port int) Option {
	return func(o *Options) {
		o.VariableStoreHttpPort = port
	}
}

// WithStreamingProxyGrpcPort sets the task manager's gRPC port
func WithStreamingProxyGrpcPort(port int) Option {
	return func(o *Options) {
		o.StreamingProxyGrpcPort = port
	}
}

// WithTTL sets the TTL for completed Jobs
func WithTTL(ttl int32) Option {
	return func(o *Options) {
		o.TTLSecondsAfterFinished = ttl
	}
}

// WithRuntimeClassName sets the runtime class for gVisor
func WithRuntimeClassName(name string) Option {
	return func(o *Options) {
		o.RuntimeClassName = name
	}
}

// WithLogger sets the logger
func WithLogger(l *zap.Logger) Option {
	return func(o *Options) {
		o.Logger = l
	}
}

// WithPodReadyTimeout sets the timeout for waiting for pod readiness
func WithPodReadyTimeout(t time.Duration) Option {
	return func(o *Options) {
		o.PodReadyTimeout = t
	}
}

// WithOwnerPodName sets the owner pod name for garbage collection
func WithOwnerPodName(name string) Option {
	return func(o *Options) {
		o.OwnerPodName = name
	}
}

// WithOwnerPodUID sets the owner pod UID for garbage collection
func WithOwnerPodUID(uid string) Option {
	return func(o *Options) {
		o.OwnerPodUID = uid
	}
}

// WithImagePullSecrets sets the image pull secrets for sandbox pods
func WithImagePullSecrets(secrets []string) Option {
	return func(o *Options) {
		o.ImagePullSecrets = secrets
	}
}

// WithNodeSelector sets the node selector for sandbox pods
func WithNodeSelector(nodeSelector map[string]string) Option {
	return func(o *Options) {
		o.NodeSelector = nodeSelector
	}
}

// WithTolerations sets the tolerations for sandbox pods
func WithTolerations(tolerations []corev1.Toleration) Option {
	return func(o *Options) {
		o.Tolerations = tolerations
	}
}

// WithLanguage sets the language of the sandbox
func WithLanguage(language string) Option {
	return func(o *Options) {
		o.Language = language
	}
}

// NewOptions creates Options with defaults and applies functional options
func NewOptions(opts ...Option) *Options {
	o := &Options{
		Port:                    50051,
		VariableStoreGrpcPort:   50050,
		VariableStoreHttpPort:   8080,
		TTLSecondsAfterFinished: 60,
		PodReadyTimeout:         2 * time.Minute,
	}
	for _, opt := range opts {
		opt(o)
	}
	return o
}
