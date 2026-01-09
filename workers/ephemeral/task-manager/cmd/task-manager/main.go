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
	"workers/ephemeral/task-manager/internal/jobmanager"
	"workers/ephemeral/task-manager/internal/plugin/sandbox"
	"workers/ephemeral/task-manager/internal/plugin_executor"
	internalstore "workers/ephemeral/task-manager/internal/store/redis"
	"workers/ephemeral/task-manager/internal/transport/redis"

	r "github.com/redis/go-redis/v9"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/log"
	"github.com/superblocksteam/agent/pkg/observability/obsup"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	redisstore "github.com/superblocksteam/agent/pkg/store/redis"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/run"
	"github.com/superblocksteam/run/contrib/process"
	"go.opentelemetry.io/otel/sdk/trace"
	"go.uber.org/zap"
)

var (
	version = "v0.0.0"
	id      string
)

func init() {
	systemruntime.GOMAXPROCS(systemruntime.NumCPU())

	// Logging
	pflag.String("log.level", "info", "The logging level.")

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
	pflag.String("worker.bucket", "BA", "The worker bucket.")
	pflag.StringSlice("worker.events", []string{"execute"}, "The list of events to listen for.")
	pflag.String("worker.language", "python", "The language this worker handles (python or javascript).")
	pflag.StringSlice("worker.stream.keys", []string{}, "Override stream keys (for testing). If empty, auto-generates based on group/bucket/events.")
	pflag.Bool("worker.ephemeral", false, "Run in ephemeral mode: process one job and exit.")

	// Sandbox settings
	// Static mode: connect to existing sandbox at this address (Docker Compose)
	pflag.String("sandbox.address", "", "Address of existing sandbox gRPC server. If set, skips Kubernetes Job creation.")
	// Dynamic mode: create Kubernetes Jobs (requires POD_IP, POD_NAMESPACE, sandbox.image)
	pflag.Duration("sandbox.timeout", 0, "Timeout for ephemeral job execution. 0 means no timeout.")
	pflag.String("sandbox.namespace", "", "Kubernetes namespace for sandbox Jobs (defaults to current namespace from POD_NAMESPACE env).")
	pflag.String("sandbox.image", "", "Container image for sandbox Jobs.")
	pflag.Int("sandbox.port", 50051, "gRPC port for sandbox container.")
	pflag.Int("sandbox.ttl", 60, "TTL in seconds for completed sandbox Jobs.")
	pflag.String("sandbox.runtimeClass", "", "RuntimeClass for sandbox Jobs (e.g., 'gvisor').")
	pflag.StringSlice("sandbox.imagePullSecrets", []string{}, "Image pull secret names for sandbox pods (comma-separated).")

	// gRPC settings for variable store
	pflag.Int("grpc.port", 50050, "The port for the VariableStore gRPC server.")
	pflag.String("grpc.address", "", "The address for sandbox to connect to VariableStore (defaults to localhost:grpc.port).")

	// Health check settings
	pflag.String("health.file", "/tmp/worker_healthy", "The path to the health file for file-based probes.")
	pflag.Duration("health.ping.timeout", 5*time.Second, "Timeout for Redis ping health checks.")
	pflag.Duration("health.check.interval", 5*time.Second, "The interval for health checks.")

	// OpenTelemetry settings
	pflag.String("otel.collector.http.url", "http://127.0.0.1:4318", "The OTLP HTTP collector URL.")
	pflag.Duration("otel.batcher.batch.timeout", 1*time.Second, "The maximum delay allowed for a BatchSpanProcessor before it will export any held span.")
	pflag.Duration("otel.batcher.export.timeout", 15*time.Second, "The amount of time a BatchSpanProcessor waits for an exporter to export before abandoning the export.")
	pflag.Int("otel.batcher.export.batch.max", 1000, "The maximum export batch size allowed for a BatchSpanProcessor.")
	pflag.Int("otel.batcher.export.queue.max", 5000, "The maximum queue size allowed for a BatchSpanProcessor.")

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

	// Bind specific environment variables for compatibility
	viper.BindEnv("grpc.port", "SUPERBLOCKS_WORKER_SANDBOX_VARIABLE_STORE_GRPC_PORT")

	if path := viper.GetString("config.path"); path != "" {
		viper.SetConfigFile(path)
		if err := viper.ReadInConfig(); err != nil {
			fmt.Fprintf(os.Stdout, "failed to load a config file, ignoring: %s", err)
		}
	}
}

func main() {
	pflag.Parse()

	language := viper.GetString("worker.language")

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: viper.GetString("log.level"),
			InitialFields: map[string]any{
				observability.OBS_TAG_WORKER_ID: id,
				observability.OBS_TAG_COMPONENT: fmt.Sprintf("worker.ephemeral.%s", language),
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}
		logger = l
	}

	var tracerRunnable run.Runnable
	{
		serviceName := fmt.Sprintf("worker.ephemeral.%s", language)

		t, err := tracer.Prepare(logger, obsup.Options{
			ServiceName:    serviceName,
			ServiceVersion: version,
			OtlpUrl:        viper.GetString("otel.collector.http.url"),
			BatchOptions: []trace.BatchSpanProcessorOption{
				trace.WithMaxQueueSize(viper.GetInt("otel.batcher.export.queue.max")),
				trace.WithMaxExportBatchSize(viper.GetInt("otel.batcher.export.batch.max")),
				trace.WithExportTimeout(viper.GetDuration("otel.batcher.export.timeout")),
				trace.WithBatchTimeout(viper.GetDuration("otel.batcher.batch.timeout")),
			},
			Headers: map[string]string{
				"x-superblocks-agent-key": viper.GetString("superblocks.key"),
			},
		})
		if err != nil {
			logger.Error("could not create tracer", zap.Error(err))
			os.Exit(1)
		}

		tracerRunnable = t.Runnable
	}

	// Determine gRPC address for variable store
	grpcAddress := viper.GetString("grpc.address")
	if grpcAddress == "" {
		grpcAddress = fmt.Sprintf("localhost:%d", viper.GetInt("grpc.port"))
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

	// Create variable store gRPC server (created early so it can be passed to JobSandboxPlugin)
	variableStoreGrpcRunnable := internalstore.NewVariableStoreGRPC(storeClient, logger, viper.GetInt("grpc.port"))

	// Create plugin executor
	pluginExec := plugin_executor.NewPluginExecutor(
		plugin_executor.NewOptions(
			plugin_executor.WithLogger(logger),
			plugin_executor.WithLanguage(language),
			plugin_executor.WithStore(storeClient),
		),
	)

	// Determine sandbox mode: static address (Docker Compose) or dynamic Jobs (Kubernetes)
	sandboxAddress := viper.GetString("sandbox.address")
	useStaticSandbox := sandboxAddress != ""

	var sandboxPlugin *sandbox.SandboxPlugin

	if useStaticSandbox {
		// Static mode: connect to existing sandbox at configured address
		// Used for Docker Compose e2e testing where sandbox containers already exist
		var err error
		sandboxPlugin, err = sandbox.NewSandboxPlugin(context.Background(), &sandbox.Options{
			Address:              sandboxAddress,
			Language:             language,
			Logger:               logger,
			Store:                storeClient,
			VariableStoreAddress: grpcAddress,
		})
		if err != nil {
			logger.Error("failed to create sandbox plugin", zap.Error(err))
			os.Exit(1)
		}

		logger.Info("sandbox configured (static mode)",
			zap.String("language", language),
			zap.String("address", sandboxAddress),
			zap.Int("grpc_port", viper.GetInt("grpc.port")),
		)
	} else {
		// Dynamic mode: create Kubernetes Jobs for each sandbox
		// Used in production with KEDA-managed task-manager pods

		// Get Pod IP from environment (set via Downward API)
		podIP := os.Getenv("POD_IP")
		if podIP == "" {
			logger.Error("POD_IP environment variable is required (or set sandbox.address for static mode)")
			os.Exit(1)
		}

		// Get namespace from environment or flag
		namespace := viper.GetString("sandbox.namespace")
		if namespace == "" {
			namespace = os.Getenv("POD_NAMESPACE")
		}
		if namespace == "" {
			logger.Error("sandbox.namespace or POD_NAMESPACE is required (or set sandbox.address for static mode)")
			os.Exit(1)
		}

		// Get sandbox image
		sandboxImage := viper.GetString("sandbox.image")
		if sandboxImage == "" {
			logger.Error("sandbox.image is required (or set sandbox.address for static mode)")
			os.Exit(1)
		}

		// Create Kubernetes client
		k8sClient, err := jobmanager.NewInClusterClient()
		if err != nil {
			logger.Error("could not create kubernetes client", zap.Error(err))
			os.Exit(1)
		}

		// Get owner pod info for garbage collection (from Downward API)
		ownerPodName := os.Getenv("POD_NAME")
		ownerPodUID := os.Getenv("POD_UID")
		if ownerPodName == "" || ownerPodUID == "" {
			logger.Error("POD_NAME or POD_UID not set, sandbox jobs will not have owner references for automatic cleanup")
			os.Exit(1)
		}

		// Create job manager
		jobMgr := jobmanager.NewSandboxJobManager(jobmanager.NewOptions(
			jobmanager.WithClientset(k8sClient),
			jobmanager.WithNamespace(namespace),
			jobmanager.WithImage(sandboxImage),
			jobmanager.WithPort(viper.GetInt("sandbox.port")),
			jobmanager.WithPodIP(podIP),
			jobmanager.WithGRPCPort(viper.GetInt("grpc.port")),
			jobmanager.WithTTL(int32(viper.GetInt("sandbox.ttl"))),
			jobmanager.WithRuntimeClassName(viper.GetString("sandbox.runtimeClass")),
			jobmanager.WithImagePullSecrets(viper.GetStringSlice("sandbox.imagePullSecrets")),
			jobmanager.WithLogger(logger),
			jobmanager.WithOwnerPodName(ownerPodName),
			jobmanager.WithOwnerPodUID(ownerPodUID),
		))

		// Create sandbox plugin - this creates the sandbox Job and connects to it
		sandboxPlugin, err = sandbox.NewSandboxPlugin(context.Background(), &sandbox.Options{
			JobManager:           jobMgr,
			Language:             language,
			Logger:               logger,
			Store:                storeClient,
			VariableStoreAddress: grpcAddress,
			IPFilterSetter:       variableStoreGrpcRunnable, // Filter connections by sandbox IP
			ExecutionID:          id,                        // Use worker ID for sandbox Job name
		})
		if err != nil {
			logger.Error("failed to create sandbox plugin", zap.Error(err))
			os.Exit(1)
		}

		// Set up security violation handler - terminate immediately if sandbox tries to access unauthorized keys
		variableStoreGrpcRunnable.SetSecurityViolationHandler(func(v internalstore.SecurityViolation) {
			logger.Error("SECURITY VIOLATION DETECTED - terminating task-manager",
				zap.String("violation_type", v.ViolationType),
				zap.String("execution_id", v.ExecutionID),
				zap.String("requested_key", v.RequestedKey),
				zap.Strings("allowed_keys", v.AllowedKeys),
				zap.String("client_ip", v.ClientIP),
			)
		})

		logger.Info("sandbox configured (dynamic mode)",
			zap.String("language", language),
			zap.String("namespace", namespace),
			zap.String("image", sandboxImage),
			zap.String("pod_ip", podIP),
			zap.Int("grpc_port", viper.GetInt("grpc.port")),
		)

	}

	pluginExec.RegisterPlugin(language, sandboxPlugin)

	// Generate stream keys
	// Allow override via --worker.stream.keys for testing
	streamKeys := viper.GetStringSlice("worker.stream.keys")
	if len(streamKeys) == 0 {
		streamKeys = redis.StreamKeys(
			pluginExec.ListPlugins(),
			viper.GetString("worker.group"),
			viper.GetString("worker.bucket"),
			viper.GetStringSlice("worker.events"),
			viper.GetBool("worker.ephemeral"),
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

	// Create health checker with file-based health checks
	// Sandbox health check reports NOT READY while sandbox is being created
	healthChecker := health.NewChecker(&health.Options{
		Redis:          redisClient,
		Sandbox:        sandboxPlugin, // Reports Connecting while sandbox is being created
		Logger:         logger,
		PingTimeout:    viper.GetDuration("health.ping.timeout"),
		HealthFilePath: viper.GetString("health.file"),
		CheckInterval:  viper.GetDuration("health.check.interval"),
	})

	// Create Redis transport
	transportRunnable := redis.NewRedisTransport(redis.NewOptions(
		redis.WithLogger(logger),
		redis.WithRedisClient(redisClient),
		redis.WithExecutionPool(viper.GetInt64("transport.redis.execution.pool")),
		redis.WithConsumerGroup(viper.GetString("worker.consumer.group")),
		redis.WithBlockDuration(viper.GetDuration("transport.redis.block.duration")),
		redis.WithMessageCount(viper.GetInt64("transport.redis.max.messages")),
		redis.WithPluginExecutor(pluginExec),
		redis.WithStreamKeys(streamKeys),
		redis.WithWorkerId(id),
		redis.WithFileContextProvider(variableStoreGrpcRunnable),
		redis.WithEphemeral(viper.GetBool("worker.ephemeral")),
		redis.WithEphemeralTimeout(viper.GetDuration("sandbox.timeout")),
		redis.WithAgentKey(viper.GetString("superblocks.key")),
	))

	logger.Info("redis transport configured",
		zap.String("host", viper.GetString("transport.redis.host")),
		zap.Int("port", viper.GetInt("transport.redis.port")),
		zap.Strings("streams", streamKeys),
		zap.String("group", viper.GetString("worker.consumer.group")),
		zap.Bool("worker_ephemeral", viper.GetBool("worker.ephemeral")),
		zap.Duration("sandbox_timeout", viper.GetDuration("sandbox.timeout")),
	)

	var g run.Group

	g.Always(process.New())
	g.Always(healthChecker)
	g.Always(variableStoreGrpcRunnable)
	g.Always(transportRunnable)
	g.Always(tracerRunnable)

	logger.Info("starting worker",
		zap.String("worker_id", id),
		zap.String("language", language),
		zap.String("version", version),
		zap.String("health_file", viper.GetString("health.file")),
	)

	if err := g.Run(); err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	os.Exit(0)
}
