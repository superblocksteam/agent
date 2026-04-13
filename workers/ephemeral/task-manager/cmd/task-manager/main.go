package main

import (
	"context"
	"crypto/tls"
	"flag"
	"fmt"
	"os"
	systemruntime "runtime"
	"strings"
	"time"

	"workers/ephemeral/task-manager/internal/health"
	"workers/ephemeral/task-manager/internal/integrationexecutor"
	"workers/ephemeral/task-manager/internal/ipfiltermanager"
	sandboxmetrics "workers/ephemeral/task-manager/internal/metrics"
	ipfiltermiddleware "workers/ephemeral/task-manager/internal/middleware/ipfilter"
	"workers/ephemeral/task-manager/internal/plugin/sandbox"
	"workers/ephemeral/task-manager/internal/plugin_executor"
	"workers/ephemeral/task-manager/internal/sandboxmanager/k8sjobmanager"
	internalstore "workers/ephemeral/task-manager/internal/store/redis"
	"workers/ephemeral/task-manager/internal/streamingproxy"
	"workers/ephemeral/task-manager/internal/transport/redis"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	r "github.com/redis/go-redis/v9"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	httpserver "github.com/superblocksteam/agent/pkg/http"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/log"
	"github.com/superblocksteam/agent/pkg/pluginparser"
	pkgrun "github.com/superblocksteam/agent/pkg/run"
	"github.com/superblocksteam/agent/pkg/run/signaldelay"
	"github.com/superblocksteam/agent/pkg/store"
	redisstore "github.com/superblocksteam/agent/pkg/store/redis"
	"github.com/superblocksteam/agent/pkg/telemetry"
	"github.com/superblocksteam/agent/pkg/utils"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/encoding/protojson"
	corev1 "k8s.io/api/core/v1"
)

var (
	version = "v0.0.0"
	id      string
)

func init() {
	systemruntime.GOMAXPROCS(systemruntime.NumCPU())

	// Logging
	pflag.String("log.level", "info", "The logging level.")
	pflag.String("sandbox.language", "javascript", "The language of the sandbox.")

	// Redis transport settings
	pflag.Bool("transport.redis.tls", false, "Whether to connect via SSL to the redis transport.")
	pflag.String("transport.redis.host", "127.0.0.1", "The transport redis host.")
	pflag.Int("transport.redis.port", 6379, "The transport redis port.")
	pflag.String("transport.redis.password", "", "The transport redis password.")
	pflag.Int("transport.redis.execution.pool", 100, "The number of concurrent executions allowed.")
	pflag.Duration("transport.redis.timeout.dial", 5*time.Second, "The maximum duration for dialing a redis connection.")
	pflag.Duration("transport.redis.timeout.read", 5*time.Minute, "Timeout for socket reads.")
	pflag.Duration("transport.redis.timeout.write", 10*time.Second, "Timeout for socket writes.")
	pflag.Duration("transport.redis.timeout.pool", 5*time.Minute, "Amount of time client waits for connection if all connections are busy.")
	pflag.Int("transport.redis.pool.max", 10, "The maximum number of connections in the connection pool.")
	pflag.Int("transport.redis.pool.min", 5, "The minimum number of connections in the connection pool.")
	pflag.String("transport.redis.servername", "", "The server name used to verify the hostname returned by the TLS handshake.")
	pflag.Duration("transport.redis.block.duration", 5*time.Second, "The maximum duration to block for a message.")
	pflag.Int("transport.redis.max.messages", 10, "The maximum number of messages to process at once.")
	pflag.Duration("transport.redis.degraded.mode.backoff", 1*time.Second, "The backoff duration between failed plugin availability checks.")
	pflag.Duration("transport.redis.degraded.mode.max.time", 10*time.Minute, "The maximum time the service will stay in degraded mode before shutting down. Also used for replacing a TRANSIENT-unhealthy sandbox in the pool after this duration (dynamic sandbox pool). Zero disables timed sandbox replacement.")

	// Store Redis settings (uses same Redis as transport by default)
	pflag.String("store.redis.host", "", "The store redis host (defaults to transport.redis.host).")
	pflag.Int("store.redis.port", 0, "The store redis port (defaults to transport.redis.port).")
	pflag.String("store.redis.password", "", "The store redis password (defaults to transport.redis.password).")
	pflag.Bool("store.redis.tls", false, "Whether to connect via SSL to the redis store.")
	pflag.String("store.redis.servername", "", "The server name used for TLS verification for the store.")
	pflag.Duration("store.redis.default.ttl", 5*time.Minute, "Default TTL for stored output.")
	pflag.Int("store.redis.pool.max", 10, "The maximum number of connections in the store connection pool.")
	pflag.Int("store.redis.pool.min", 5, "The minimum number of connections in the store connection pool.")
	pflag.Duration("store.redis.timeout.dial", 5*time.Second, "The maximum duration for dialing a store redis connection.")
	pflag.Duration("store.redis.timeout.read", 5*time.Second, "Timeout for store socket reads.")
	pflag.Duration("store.redis.timeout.write", 5*time.Second, "Timeout for store socket writes.")
	pflag.Duration("store.redis.timeout.pool", 5*time.Second, "Amount of time client waits for store connection if all connections are busy.")

	// Worker settings
	pflag.String("worker.group", "main", "The worker group.")
	pflag.String("worker.consumer.group", "main", "The worker consumer group.")
	pflag.StringSlice("worker.buckets", []string{"BA"}, "The worker buckets (comma-separated).")
	pflag.StringSlice("worker.events", []string{}, "The list of plugin event types that are supported by this worker.")
	pflag.StringSlice("worker.plugins", []string{}, "The list of plugins that are supported by this worker. '*' is a wildcard that matches all plugins.")
	pflag.StringSlice("worker.stream.keys", []string{}, "Override stream keys. If empty, streams are generated by creating the cross-product of the supported plugins and events.")
	pflag.StringSlice("worker.stream.variants", []string{}, "Stream variants the worker should use when generating stream keys to listen on.")
	pflag.Bool("worker.stream.include.standard.keys", true, "Whether to include standard streams in the stream keys.")
	pflag.Bool("worker.ephemeral", false, "Run in ephemeral mode: process one job and exit.")
	pflag.Duration("worker.shutdown.delay", 0, "Delay before shutting down the worker after receiving a termination signal.")
	pflag.Duration("worker.shutdown.max.jitter", 0, "Maximum jitter added to the shutdown delay.")

	// Sandbox settings
	pflag.StringSlice("sandbox.address", []string{}, "Static sandbox gRPC address(es) (host:port). Repeat the flag and/or use comma-separated values per entry. Pool size in static mode is the resulting address count. When any address is set, Kubernetes sandbox Jobs are not created.")
	// Dynamic mode: create Kubernetes Jobs (requires POD_IP, POD_NAMESPACE, sandbox.image)
	pflag.Duration("sandbox.timeout", 0, "Timeout for ephemeral job execution. 0 means no timeout.")
	pflag.String("sandbox.namespace", "", "Kubernetes namespace for sandbox Jobs (defaults to current namespace from POD_NAMESPACE env).")
	pflag.String("sandbox.image", "", "Container image for the sandbox.")
	pflag.Int("sandbox.port", 50051, "gRPC port for sandbox container.")
	pflag.Int("sandbox.ttl", 0, "TTL in seconds for completed sandbox Jobs.")
	pflag.String("sandbox.runtimeClass", "", "RuntimeClass for sandbox Jobs (e.g., 'gvisor').")
	pflag.StringSlice("sandbox.imagePullSecrets", []string{}, "Image pull secret names for sandbox pods (comma-separated).")
	pflag.StringToString("sandbox.nodeSelector", map[string]string{}, "Node selector for sandbox pods (e.g., 'key=value,key2=value2').")
	pflag.StringArray("sandbox.toleration", []string{}, "Toleration for sandbox pods (format: 'key=x,operator=y,value=z,effect=w'). Can be specified multiple times for multiple tolerations.")
	pflag.String("sandbox.zone", "", "Availability zone for sandbox pods. Auto-discovered from node if NODE_NAME is set and this is empty.")
	pflag.Int("sandbox.pool.size", 1, "Number of sandbox Jobs per worker in dynamic mode. Ignored when using static sandbox.address (pool size is the address count).")

	// Sandbox resource requests/limits
	pflag.String("sandbox.resources.requests.cpu", "", "CPU request for sandbox containers (e.g., '100m').")
	pflag.String("sandbox.resources.requests.memory", "", "Memory request for sandbox containers (e.g., '256Mi').")
	pflag.String("sandbox.resources.limits.cpu", "", "CPU limit for sandbox containers (e.g., '500m').")
	pflag.String("sandbox.resources.limits.memory", "", "Memory limit for sandbox containers (e.g., '2Gi').")

	// IP filter settings
	pflag.Bool("ip.filter.disabled", false, "Disable IP filtering for the variable store and streaming proxy (for testing/development).")

	// gRPC settings for variable store
	pflag.Int("variable.store.grpc.port", 50050, "The port for the VariableStore gRPC server.")
	pflag.String("variable.store.grpc.address", "", "The address for sandbox to connect to VariableStore (defaults to localhost:variable.store.grpc.port).")

	// HTTP (gRPC Gateway) settings for variable store
	pflag.Int("variable.store.http.port", 8080, "The port for the VariableStore HTTP server.")
	pflag.String("variable.store.http.bind", "0.0.0.0", "The address to bind the HTTP (gRPC Gateway) server on.")

	// gRPC settings for streaming proxy
	pflag.Int("streaming.proxy.grpc.port", 50051, "The port for the StreamingProxy gRPC server.")

	// Integration executor settings
	pflag.Bool("integration.executor.enabled", false, "Whether to enable the IntegrationExecutor gRPC service (only for API 2.0 fleets).")
	pflag.Int("integration.executor.grpc.port", 50052, "The port for the IntegrationExecutor gRPC server.")
	pflag.String("orchestrator.grpc.address", "", "Internal gRPC address of the orchestrator for proxied integration execution.")
	pflag.String("auth.jwt.jwks_url", "", "Deprecated: JWT validation now happens on the orchestrator. This flag is kept for backward compatibility and is ignored.")

	// gRPC message size settings
	pflag.Int("grpc.msg.req.max", 30000000, "Max message size in bytes to be received by the grpc server as a request. Default 30mb.")
	pflag.Int("grpc.msg.res.max", 100000000, "Max message size in bytes to be sent by the grpc server response. Default 100mb.")
	pflag.Int("filepicker.max.size", 524288000, "Max file size in bytes for FilePicker uploads. Default 500mb.")

	// Health check settings
	pflag.Bool("health.enabled", false, "Whether to enable health checks.")
	pflag.String("health.file", "/tmp/worker_healthy", "The path to the health file for file-based probes.")
	pflag.Duration("health.ping.timeout", 5*time.Second, "Timeout for Redis ping health checks.")
	pflag.Duration("health.check.interval", 5*time.Second, "The interval for health checks.")

	// OpenTelemetry settings
	pflag.String("agent.environment", "*", "Environment to register the agent under.")
	pflag.String("otel.collector.http.url", "http://127.0.0.1:4318", "The OTLP HTTP collector URL for traces.")
	pflag.String("telemetry.deployment.type", "on-prem", "Telemetry deployment type. Valid values: cloud, cloud-prem, on-prem.")
	pflag.Int("telemetry.batch.max.queue.size", 0, "Max spans queued for export (0 = library default 2048).")
	pflag.Int("telemetry.batch.max.export.batch.size", 0, "Max spans per export batch (0 = SDK default 512).")
	pflag.Duration("telemetry.batch.timeout", 0, "Flush partial batch after this duration (0 = SDK default 5s).")
	pflag.Duration("telemetry.batch.export.timeout", 0, "Per-export-call timeout (0 = library default 30s).")
	pflag.String("otel.metrics.collector.http.url", "", "The OTLP HTTP collector URL for metrics. Falls back to otel.collector.http.url if empty.")

	// Superblocks settings
	pflag.String("superblocks.key", "dev-agent-key", "The superblocks agent key.")

	// Generate worker ID
	{
		uuid, err := utils.UUID()
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not generate uuid for worker: %s", err)
			os.Exit(1)
		}
		id = uuid
	}

	// This pflag setup allows the stdlib flag package to be used with viper.
	pflag.CommandLine.AddGoFlagSet(flag.CommandLine)
	pflag.Parse()

	// This viper setup allows env vars and config files to be used.
	viper.BindPFlags(pflag.CommandLine)
	viper.SetEnvPrefix("SUPERBLOCKS_WORKER_SANDBOX")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	_ = viper.BindEnv("telemetry.deployment.type", "SUPERBLOCKS_DEPLOYMENT_TYPE")
	_ = viper.BindEnv("telemetry.batch.max.queue.size", "SUPERBLOCKS_TELEMETRY_MAX_QUEUE_SIZE")
	_ = viper.BindEnv("telemetry.batch.max.export.batch.size", "SUPERBLOCKS_TELEMETRY_MAX_EXPORT_BATCH_SIZE")
	_ = viper.BindEnv("telemetry.batch.timeout", "SUPERBLOCKS_TELEMETRY_BATCH_TIMEOUT")
	_ = viper.BindEnv("telemetry.batch.export.timeout", "SUPERBLOCKS_TELEMETRY_EXPORT_TIMEOUT")

	if path := viper.GetString("config.path"); path != "" {
		viper.SetConfigFile(path)
		if err := viper.ReadInConfig(); err != nil {
			fmt.Fprintf(os.Stdout, "failed to load a config file, ignoring: %s", err)
		}
	}
}

func main() {
	pflag.Parse()

	plugins := pluginparser.ParsePlugins(utils.GetStringSlice("worker.plugins"))
	if plugins.IsEmpty() {
		fmt.Fprintf(os.Stderr, "no plugins specified")
		os.Exit(1)
	}

	events := utils.NewSet(utils.GetStringSlice("worker.events")...)
	if events.IsEmpty() {
		fmt.Fprintf(os.Stderr, "no events specified")
		os.Exit(1)
	}

	serviceLabel := "worker.sandbox"
	if viper.GetBool("worker.ephemeral") {
		serviceLabel = fmt.Sprintf("%s.ephemeral", serviceLabel)
	}

	var intakeLogger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: viper.GetString("log.level"),
			InitialFields: map[string]any{
				observability.OBS_TAG_WORKER_ID: id,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}
		intakeLogger = l
	}

	var tracerRunnable run.Runnable
	var meterRunnable run.Runnable
	var telInstance *telemetry.Instance
	{
		var policy telemetry.TelemetryPolicy
		switch telemetry.DeploymentType(viper.GetString("telemetry.deployment.type")) {
		case telemetry.DeploymentTypeCloud:
			policy = telemetry.DefaultCloudPolicy()
		case telemetry.DeploymentTypeCloudPrem:
			policy = telemetry.DefaultCloudPremPolicy()
		case telemetry.DeploymentTypeOnPrem:
			policy = telemetry.DefaultOnPremPolicy()
		default:
			fmt.Fprintf(os.Stderr, "invalid telemetry.deployment.type %q: valid values are %q, %q, and %q\n", viper.GetString("telemetry.deployment.type"), telemetry.DeploymentTypeCloud, telemetry.DeploymentTypeCloudPrem, telemetry.DeploymentTypeOnPrem)
			os.Exit(1)
		}

		var err error
		telInstance, err = telemetry.Init(context.Background(), telemetry.Config{
			ServiceName:    serviceLabel,
			ServiceVersion: version,
			Environment:    viper.GetString("agent.environment"),
			OTLPURL:        viper.GetString("otel.collector.http.url"),
			Headers: map[string]string{
				"x-superblocks-agent-key": viper.GetString("superblocks.key"),
			},
			MetricsEnabled: false,
			LogsEnabled:    true,
			Batch: telemetry.BatchConfig{
				MaxQueueSize:       viper.GetInt("telemetry.batch.max.queue.size"),
				MaxExportBatchSize: viper.GetInt("telemetry.batch.max.export.batch.size"),
				BatchTimeout:       viper.GetDuration("telemetry.batch.timeout"),
				ExportTimeout:      viper.GetDuration("telemetry.batch.export.timeout"),
			},
		}, policy, intakeLogger)
		if err != nil {
			intakeLogger.Error("could not initialize telemetry", zap.Error(err))
			os.Exit(1)
		}

		tracerRunnable = pkgrun.Telemetry(telInstance)

		metricsURL := viper.GetString("otel.metrics.collector.http.url")
		if metricsURL == "" {
			metricsURL = viper.GetString("otel.collector.http.url")
		}

		mp, err := sandboxmetrics.SetupMeterProvider(
			context.Background(),
			metricsURL,
			serviceLabel,
			version,
			os.Getenv("POD_NAME"),
			os.Getenv("FLEET_NAME"),
		)
		if err != nil {
			intakeLogger.Error("could not create meter provider", zap.Error(err))
			os.Exit(1)
		}
		meterRunnable = sandboxmetrics.NewRunnable(mp)

		if err := sandboxmetrics.RegisterMetrics(); err != nil {
			intakeLogger.Error("could not register sandbox metrics", zap.Error(err))
			os.Exit(1)
		}
	}

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: viper.GetString("log.level"),
			InitialFields: map[string]any{
				observability.OBS_TAG_WORKER_ID: id,
				observability.OBS_TAG_COMPONENT: serviceLabel,
			},
			LoggerProvider: telInstance.LoggerProvider,
			ServiceName:    serviceLabel,
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}
		logger = l
	}

	hostname := os.Getenv("POD_IP")
	if hostname == "" {
		hostname = "localhost"
	}

	// Determine gRPC address for variable store
	variableStoreGrpcAddress := viper.GetString("variable.store.grpc.address")
	if variableStoreGrpcAddress == "" {
		variableStoreGrpcAddress = fmt.Sprintf("%s:%d", hostname, viper.GetInt("variable.store.grpc.port"))
	}

	// Determine gRPC address for integration executor
	var integrationExecutorAddress string
	if viper.GetBool("integration.executor.enabled") {
		integrationExecutorAddress = fmt.Sprintf("%s:%d", hostname, viper.GetInt("integration.executor.grpc.port"))
	}

	// Create Redis store client (uses same Redis as transport by default)
	var storeClient store.Store
	{
		storeHost := viper.GetString("store.redis.host")
		if storeHost == "" {
			storeHost = viper.GetString("transport.redis.host")
		}
		storePort := viper.GetInt("store.redis.port")
		if storePort == 0 {
			storePort = viper.GetInt("transport.redis.port")
		}
		storePassword := viper.GetString("store.redis.password")
		if storePassword == "" {
			storePassword = viper.GetString("transport.redis.password")
		}

		options := &r.Options{
			Addr:         fmt.Sprintf("%s:%d", storeHost, storePort),
			Username:     "default",
			Password:     storePassword,
			DB:           0,
			PoolSize:     viper.GetInt("store.redis.pool.max"),
			MinIdleConns: viper.GetInt("store.redis.pool.min"),
			DialTimeout:  viper.GetDuration("store.redis.timeout.dial"),
			ReadTimeout:  viper.GetDuration("store.redis.timeout.read"),
			WriteTimeout: viper.GetDuration("store.redis.timeout.write"),
			PoolTimeout:  viper.GetDuration("store.redis.timeout.pool"),
		}

		if viper.GetBool("store.redis.tls") {
			options.TLSConfig = &tls.Config{
				ServerName: viper.GetString("store.redis.servername"),
			}
		}

		redisClient := r.NewClient(options)
		storeClient = redisstore.New(redisClient,
			redisstore.WithDefaultTtl(viper.GetDuration("store.redis.default.ttl")),
		)
	}

	// Create plugin executor
	pluginExec := plugin_executor.NewPluginExecutor(
		plugin_executor.NewOptions(
			plugin_executor.WithLogger(logger),
			plugin_executor.WithStore(storeClient),
		),
	)

	// Create IP filter manager
	ipFilterManager := ipfiltermanager.NewIpFilterManager()
	ipFilterDisabled := viper.GetBool("ip.filter.disabled")
	if ipFilterDisabled {
		logger.Warn("IP filtering is disabled")
	}

	sandboxOptions := []sandbox.Option{
		sandbox.WithLogger(logger),
		sandbox.WithKvStore(storeClient),
		sandbox.WithVariableStoreAddress(variableStoreGrpcAddress),
		sandbox.WithIntegrationExecutorAddress(integrationExecutorAddress),
		sandbox.WithGrpcMaxRequestSize(viper.GetInt("grpc.msg.req.max")),
		// Response hard cap is aligned with large object handling class so
		// task-manager can receive full sandbox output and enforce quota at KV write.
		sandbox.WithGrpcMaxResponseSize(viper.GetInt("filepicker.max.size")),
	}

	var sandboxPoolSize int
	staticAddrs := utils.GetStringSlice("sandbox.address")

	if len(staticAddrs) > 0 {
		sandboxPoolSize = len(staticAddrs)
		sandboxOptions = append(sandboxOptions,
			sandbox.WithConnectionMode(sandbox.SandboxConnectionModeStatic),
		)
	} else {
		sandboxPoolSize = viper.GetInt("sandbox.pool.size")
		if sandboxPoolSize < 1 {
			logger.Error("sandbox.pool.size must be at least 1")
			os.Exit(1)
		}

		// Create sandbox manager for dynamically creating sandbox (on-demand)
		podIP := os.Getenv("POD_IP")
		if podIP == "" {
			logger.Error("POD_IP environment variable is required (or set sandbox.address for static mode)")
			os.Exit(1)
		}

		namespace := viper.GetString("sandbox.namespace")
		if namespace == "" {
			namespace = os.Getenv("POD_NAMESPACE")
		}
		if namespace == "" {
			logger.Error("sandbox.namespace or POD_NAMESPACE is required (or set sandbox.address for static mode)")
			os.Exit(1)
		}

		k8sClient, err := k8sjobmanager.NewInClusterClient()
		if err != nil {
			logger.Error("could not create kubernetes client", zap.Error(err))
			os.Exit(1)
		}

		// Get owner pod info for garbage collection
		ownerPodName := os.Getenv("POD_NAME")
		ownerPodUID := os.Getenv("POD_UID")
		if ownerPodName == "" || ownerPodUID == "" {
			logger.Error("POD_NAME or POD_UID not set, sandbox jobs will not have owner references for automatic cleanup")
			os.Exit(1)
		}

		nodeSelector := viper.GetStringMapString("sandbox.nodeSelector")

		// Discover zone: explicit flag > auto-discovery from node
		sandboxZone := viper.GetString("sandbox.zone")
		if sandboxZone == "" {
			if nodeName := os.Getenv("NODE_NAME"); nodeName != "" {
				if z, err := k8sjobmanager.GetNodeZone(context.Background(), k8sClient, nodeName); err != nil {
					logger.Warn("could not discover node zone, sandbox zone constraint will be skipped", zap.Error(err))
				} else if z != "" {
					sandboxZone = z
					logger.Info("discovered task-manager zone from node", zap.String("zone", sandboxZone), zap.String("node", nodeName))
				}
			}
		}

		// Build owner pod labels for pod affinity matching.
		// These must match the labels on the task-manager pod template in the ScaledJob.
		ownerPodLabels := map[string]string{
			"role": "task-manager",
		}
		if fleetName := os.Getenv("FLEET_NAME"); fleetName != "" {
			ownerPodLabels["fleet"] = fleetName
		}

		// Parse tolerations from string array (format: "key=x,operator=y,value=z,effect=w")
		var tolerations []corev1.Toleration
		for _, t := range viper.GetStringSlice("sandbox.toleration") {
			// Parse the key=value pairs
			pairs := make(map[string]string)
			for _, pair := range strings.Split(t, ",") {
				kv := strings.SplitN(pair, "=", 2)
				if len(kv) == 2 {
					pairs[kv[0]] = kv[1]
				}
			}

			toleration := corev1.Toleration{}
			if key, ok := pairs["key"]; ok {
				toleration.Key = key
			}
			if operator, ok := pairs["operator"]; ok {
				toleration.Operator = corev1.TolerationOperator(operator)
			}
			if value, ok := pairs["value"]; ok {
				toleration.Value = value
			}
			if effect, ok := pairs["effect"]; ok {
				toleration.Effect = corev1.TaintEffect(effect)
			}
			tolerations = append(tolerations, toleration)
		}

		// Parse execution env inclusion list (comma-separated env var names to copy to sandbox)
		executionEnvInclusionList := utils.NewSet[string]()
		if raw := os.Getenv("SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST"); raw != "" {
			for _, s := range strings.Split(raw, ",") {
				if t := strings.TrimSpace(s); t != "" {
					executionEnvInclusionList.Add(t)
				}
			}
		}

		jobManagerOptions := []k8sjobmanager.Option{
			k8sjobmanager.WithClientset(k8sClient),
			k8sjobmanager.WithNamespace(namespace),
			k8sjobmanager.WithPort(viper.GetInt("sandbox.port")),
			k8sjobmanager.WithPodIP(podIP),
			k8sjobmanager.WithVariableStoreGrpcPort(viper.GetInt("variable.store.grpc.port")),
			k8sjobmanager.WithVariableStoreHttpPort(viper.GetInt("variable.store.http.port")),
			k8sjobmanager.WithStreamingProxyGrpcPort(viper.GetInt("streaming.proxy.grpc.port")),
			k8sjobmanager.WithTTL(int32(viper.GetInt("sandbox.ttl"))),
			k8sjobmanager.WithRuntimeClassName(viper.GetString("sandbox.runtimeClass")),
			k8sjobmanager.WithNodeSelector(nodeSelector),
			k8sjobmanager.WithTolerations(tolerations),
			k8sjobmanager.WithImagePullSecrets(utils.GetStringSlice("sandbox.imagePullSecrets")),
			k8sjobmanager.WithLogger(logger),
			k8sjobmanager.WithOwnerPodName(ownerPodName),
			k8sjobmanager.WithOwnerPodUID(ownerPodUID),
			k8sjobmanager.WithLanguage(viper.GetString("sandbox.language")),
			k8sjobmanager.WithEphemeral(viper.GetBool("worker.ephemeral")),
			k8sjobmanager.WithResourceRequestsCPU(viper.GetString("sandbox.resources.requests.cpu")),
			k8sjobmanager.WithResourceRequestsMemory(viper.GetString("sandbox.resources.requests.memory")),
			k8sjobmanager.WithResourceLimitsCPU(viper.GetString("sandbox.resources.limits.cpu")),
			k8sjobmanager.WithResourceLimitsMemory(viper.GetString("sandbox.resources.limits.memory")),
			k8sjobmanager.WithZone(sandboxZone),
			k8sjobmanager.WithOwnerPodLabels(ownerPodLabels),
			k8sjobmanager.WithWorkerPlugins(strings.Join(plugins.ToSlice(), ",")),
			k8sjobmanager.WithExecutionEnvInclusionList(executionEnvInclusionList.ToSlice()),
			k8sjobmanager.WithGrpcMaxRequestSize(viper.GetInt("grpc.msg.req.max")),
			k8sjobmanager.WithGrpcMaxResponseSize(viper.GetInt("filepicker.max.size")),
		}

		if viper.GetBool("integration.executor.enabled") {
			jobManagerOptions = append(jobManagerOptions, k8sjobmanager.WithIntegrationExecutorGrpcPort(viper.GetInt("integration.executor.grpc.port")))
		}

		sandboxImage := viper.GetString("sandbox.image")
		if sandboxImage == "" {
			logger.Error("sandbox.image is required (or set sandbox.address for static mode)")
			os.Exit(1)
		}

		jobManagerOptions = append(jobManagerOptions, k8sjobmanager.WithImage(sandboxImage))
		jobMgr := k8sjobmanager.NewSandboxJobManager(k8sjobmanager.NewOptions(jobManagerOptions...))

		ipFilterManager.AddAllowedIps(podIP)

		sandboxOptions = append(sandboxOptions,
			sandbox.WithConnectionMode(sandbox.SandboxConnectionModeDynamic),
			sandbox.WithSandboxManager(jobMgr),
			sandbox.WithIpFilterSetter(ipFilterManager),
		)
	}

	// Drain coordination: transport closes this when in-flight requests finish.
	// SandboxPlugin.Close blocks until then before deleting the sandbox.
	drainCompleteCh := make(chan struct{})

	sandboxRunnable, err := sandbox.NewSandboxPool(
		sandbox.WithWorkerId(id),
		sandbox.WithSandboxOptions(sandboxOptions...),
		sandbox.WithSandboxPoolSize(sandboxPoolSize),
		sandbox.WithSandboxAddresses(staticAddrs),
		sandbox.WithPoolLogger(logger),
		sandbox.WithDrainCompleteCh(drainCompleteCh),
		sandbox.WithSandboxRecoveryTimeout(viper.GetDuration("transport.redis.degraded.mode.max.time")),
		sandbox.WithEphemeralExecution(viper.GetBool("worker.ephemeral")),
	)
	if err != nil {
		logger.Error("failed to create sandbox pool", zap.Error(err))
		os.Exit(1)
	}

	for _, pluginName := range plugins.ToSlice() {
		pluginExec.RegisterPlugin(pluginName, sandboxRunnable)
	}

	logFields := []zap.Field{
		zap.String("worker_id", id),
		zap.Int("sandbox.pool.size", sandboxPoolSize),
		zap.Strings("plugins", pluginExec.ListPlugins()),
		zap.Strings("events", events.ToSlice()),
	}
	if len(staticAddrs) > 0 {
		logFields = append(logFields, zap.Strings("static_sandbox_addresses", staticAddrs))
	}
	logger.Info("sandbox configured", logFields...)

	// Generate stream keys
	streamKeys := utils.GetStringSlice("worker.stream.keys")
	if len(streamKeys) == 0 {
		streamKeys = redis.StreamKeys(
			pluginExec.ListPlugins(),
			viper.GetString("worker.group"),
			utils.GetStringSlice("worker.buckets"),
			utils.GetStringSlice("worker.stream.variants"),
			events.ToSlice(),
			viper.GetBool("worker.stream.include.standard.keys"),
		)
	}

	// Create Redis client (shared between transport and health server)
	var redisClient *r.Client
	{
		options := &r.Options{
			Addr:         fmt.Sprintf("%s:%d", viper.GetString("transport.redis.host"), viper.GetInt("transport.redis.port")),
			Username:     "default",
			Password:     viper.GetString("transport.redis.password"),
			DB:           0,
			PoolSize:     viper.GetInt("transport.redis.pool.max"),
			MinIdleConns: viper.GetInt("transport.redis.pool.min"),
			DialTimeout:  viper.GetDuration("transport.redis.timeout.dial"),
			ReadTimeout:  viper.GetDuration("transport.redis.timeout.read"),
			WriteTimeout: viper.GetDuration("transport.redis.timeout.write"),
			PoolTimeout:  viper.GetDuration("transport.redis.timeout.pool"),
		}

		if viper.GetBool("transport.redis.tls") {
			options.TLSConfig = &tls.Config{
				ServerName: viper.GetString("transport.redis.servername"),
			}
		}

		redisClient = r.NewClient(options)
	}

	// Create variable store gRPC server (created early so it can be passed to JobSandboxPlugin)
	// Uses filepicker.max.size for send limit because FetchFile responses can be up to 500MB.
	var variableStoreGrpcRunnable *internalstore.VariableStoreGRPC
	{
		grpcServer := grpc.NewServer(
			grpc.UnaryInterceptor(ipfiltermiddleware.IpFilterInterceptor(ipFilterManager, logger, ipFilterDisabled)),
			grpc.MaxRecvMsgSize(viper.GetInt("grpc.msg.req.max")),
			grpc.MaxSendMsgSize(viper.GetInt("filepicker.max.size")),
			grpc.StatsHandler(otelgrpc.NewServerHandler()),
		)

		variableStoreGrpcRunnable = internalstore.NewVariableStoreGRPC(
			internalstore.WithKvStore(storeClient),
			internalstore.WithServer(grpcServer),
			internalstore.WithLogger(logger),
			internalstore.WithPort(viper.GetInt("variable.store.grpc.port")),
		)

		// Set up security violation handler for when sandbox tries to access unauthorized keys
		variableStoreGrpcRunnable.SetSecurityViolationHandler(func(v internalstore.SecurityViolation) {
			logger.Error("security violation detected",
				zap.String("violation_type", v.ViolationType),
				zap.String("execution_id", v.ExecutionID),
				zap.String("requested_key", v.RequestedKey),
				zap.Strings("allowed_keys", v.AllowedKeys),
				zap.String("client_ip", v.ClientIP),
			)
		})
	}

	var variableStoreHttpRunnable run.Runnable
	{
		mux := runtime.NewServeMux(
			runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.HTTPBodyMarshaler{
				Marshaler: &runtime.JSONPb{
					MarshalOptions: protojson.MarshalOptions{
						UseProtoNames:   false,
						EmitUnpopulated: false,
						AllowPartial:    true,
					},
					UnmarshalOptions: protojson.UnmarshalOptions{
						DiscardUnknown: true,
					},
				},
			}),
		)

		opts := []grpc.DialOption{
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
			grpc.WithDefaultCallOptions(
				// Gateway proxies the variable store which includes FetchFile,
				// so it must accept responses up to filepicker.max.size.
				grpc.MaxCallRecvMsgSize(viper.GetInt("filepicker.max.size")),
				grpc.MaxCallSendMsgSize(viper.GetInt("grpc.msg.req.max")),
			),
		}

		err := workerv1.RegisterSandboxVariableStoreServiceHandlerFromEndpoint(
			context.Background(),
			mux,
			variableStoreGrpcAddress,
			opts,
		)
		if err != nil {
			logger.Error("failed to register variable store gRPC gateway handler", zap.Error(err))
			os.Exit(1)
		}

		// Wrap the mux with IP filter middleware
		handler := ipfiltermiddleware.IpFilterHttpMiddleware(ipFilterManager, logger, ipFilterDisabled)(mux)

		variableStoreHttpRunnable = httpserver.Prepare(&httpserver.Options{
			Name:         "variableStoreHttp",
			Handler:      handler,
			InsecurePort: viper.GetInt("variable.store.http.port"),
			Logger:       logger,
			InsecureAddr: viper.GetString("variable.store.http.bind"),
		})
	}

	var streamingProxyService *streamingproxy.StreamingProxyService
	{
		grpcServer := grpc.NewServer(
			grpc.UnaryInterceptor(ipfiltermiddleware.IpFilterInterceptor(ipFilterManager, logger, ipFilterDisabled)),
			grpc.MaxRecvMsgSize(viper.GetInt("grpc.msg.req.max")),
			grpc.MaxSendMsgSize(viper.GetInt("grpc.msg.res.max")),
			grpc.StatsHandler(otelgrpc.NewServerHandler()),
		)

		streamingProxyService = streamingproxy.NewStreamingProxyService(
			streamingproxy.WithServer(grpcServer),
			streamingproxy.WithRedisClient(redisClient),
			streamingproxy.WithLogger(logger),
			streamingproxy.WithPort(viper.GetInt("streaming.proxy.grpc.port")),
		)
	}

	// Create integration executor service (explicitly enabled via flag, only for API 2.0 fleets).
	var integrationExecutorService *integrationexecutor.IntegrationExecutorService
	integrationExecutorEnabled := viper.GetBool("integration.executor.enabled")
	if integrationExecutorEnabled {
		orchestratorAddr := viper.GetString("orchestrator.grpc.address")
		if orchestratorAddr == "" {
			logger.Error("orchestrator.grpc.address is required when integration.executor.enabled is true")
			os.Exit(1)
		}

		grpcServer := grpc.NewServer(
			grpc.UnaryInterceptor(ipfiltermiddleware.IpFilterInterceptor(ipFilterManager, logger, ipFilterDisabled)),
			grpc.MaxRecvMsgSize(viper.GetInt("grpc.msg.req.max")),
			grpc.MaxSendMsgSize(viper.GetInt("grpc.msg.res.max")),
			grpc.StatsHandler(otelgrpc.NewServerHandler()),
		)

		integrationExecutorService = integrationexecutor.New(
			integrationexecutor.WithServer(grpcServer),
			integrationexecutor.WithLogger(logger),
			integrationexecutor.WithPort(viper.GetInt("integration.executor.grpc.port")),
			integrationexecutor.WithOrchestratorAddress(orchestratorAddr),
			integrationexecutor.WithFileContextProvider(variableStoreGrpcRunnable),
		)
	}
	logger.Info("integration executor configuration",
		zap.Bool("enabled", integrationExecutorEnabled),
	)

	// Create health checker with file-based health checks
	// Sandbox health check reports NOT READY while sandbox is being created
	healthChecker := health.NewChecker(&health.Options{
		Redis:          redisClient,
		Logger:         logger,
		PingTimeout:    viper.GetDuration("health.ping.timeout"),
		HealthFilePath: viper.GetString("health.file"),
		CheckInterval:  viper.GetDuration("health.check.interval"),
	})

	// Create Redis transport
	var transportRunnable run.Runnable
	{
		executionPoolSize := viper.GetInt64("transport.redis.execution.pool")
		if viper.GetBool("worker.ephemeral") {
			executionPoolSize = min(executionPoolSize, int64(sandboxPoolSize))
		}

		transportRunnable = redis.NewRedisTransport(redis.NewOptions(
			redis.WithLogger(logger),
			redis.WithRedisClient(redisClient),
			redis.WithExecutionPool(executionPoolSize),
			redis.WithConsumerGroup(viper.GetString("worker.consumer.group")),
			redis.WithBlockDuration(viper.GetDuration("transport.redis.block.duration")),
			redis.WithMessageCount(viper.GetInt64("transport.redis.max.messages")),
			redis.WithPluginExecutor(pluginExec),
			redis.WithStreamKeys(streamKeys),
			redis.WithWorkerId(id),
			redis.WithFileContextProvider(variableStoreGrpcRunnable),
			redis.WithEphemeral(viper.GetBool("worker.ephemeral")),
			redis.WithAgentKey(viper.GetString("superblocks.key")),
			redis.WithDrainCompleteCh(drainCompleteCh),
			redis.WithDegradedModeBackoff(viper.GetDuration("transport.redis.degraded.mode.backoff")),
			redis.WithMaxDegradedTime(viper.GetDuration("transport.redis.degraded.mode.max.time")),
		))

		logger.Info("redis transport configured",
			zap.String("host", viper.GetString("transport.redis.host")),
			zap.Int("port", viper.GetInt("transport.redis.port")),
			zap.String("group", viper.GetString("worker.consumer.group")),
			zap.Bool("worker_ephemeral", viper.GetBool("worker.ephemeral")),
			zap.Duration("sandbox_timeout", viper.GetDuration("sandbox.timeout")),
		)
	}

	g := run.New(
		run.WithSyncShutdown(),
	)

	g.Always(signaldelay.New(
		signaldelay.WithBaseDelay(viper.GetDuration("worker.shutdown.delay")),
		signaldelay.WithMaxJitter(viper.GetDuration("worker.shutdown.max.jitter")),
	))
	g.Add(viper.GetBool("health.enabled"), healthChecker)
	g.Always(transportRunnable)
	g.Always(sandboxRunnable)
	g.Always(variableStoreGrpcRunnable)
	g.Always(variableStoreHttpRunnable)
	g.Always(streamingProxyService)
	g.Add(integrationExecutorEnabled, integrationExecutorService)
	g.Always(tracerRunnable)
	g.Always(meterRunnable)

	logger.Info("starting worker",
		zap.String("worker_id", id),
		zap.String("version", version),
		zap.String("health_file", viper.GetString("health.file")),
		zap.Bool("ephemeral", viper.GetBool("worker.ephemeral")),
		zap.Strings("plugins", pluginExec.ListPlugins()),
		zap.Strings("events", events.ToSlice()),
	)

	if err := g.Run(); err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	os.Exit(0)
}
