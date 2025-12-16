package main

import (
	"crypto/tls"
	"flag"
	"fmt"
	"os"
	systemruntime "runtime"
	"strings"
	"time"

	"workers/ephemeral/task-manager/internal/plugin/sandbox"
	"workers/ephemeral/task-manager/internal/plugin_executor"
	"workers/ephemeral/task-manager/internal/transport/redis"

	r "github.com/redis/go-redis/v9"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/log"
	"github.com/superblocksteam/agent/pkg/observability/obsup"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
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

	// Worker settings
	pflag.String("worker.group", "main", "The worker group.")
	pflag.String("worker.consumer.group", "main", "The worker consumer group.")
	pflag.String("worker.bucket", "BA", "The worker bucket.")
	pflag.StringSlice("worker.events", []string{"execute"}, "The list of events to listen for.")
	pflag.String("worker.language", "python", "The language this worker handles (python or javascript).")
	pflag.StringSlice("worker.stream.keys", []string{}, "Override stream keys (for testing). If empty, auto-generates based on group/bucket/events.")
	pflag.Bool("worker.ephemeral", false, "Run in ephemeral mode: process one job and exit.")

	// Sandbox settings
	pflag.String("sandbox.address", "python-sandbox:50051", "The address of the sandbox gRPC server.")
	pflag.Duration("sandbox.timeout", 5*time.Minute, "Timeout for ephemeral job execution. If sandbox doesn't respond before timeout, task-manager returns failure and exits 0.")

	// gRPC settings for variable store
	pflag.Int("grpc.port", 50050, "The port for the VariableStore gRPC server.")
	pflag.String("grpc.address", "", "The address for sandbox to connect to VariableStore (defaults to localhost:grpc.port).")

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

	// Create plugin executor
	pluginExec := plugin_executor.NewPluginExecutor(
		plugin_executor.NewOptions(
			plugin_executor.WithLogger(logger),
			plugin_executor.WithLanguage(language),
		),
	)

	// Create and register sandbox plugin
	sandboxPlugin, err := sandbox.NewSandboxPlugin(&sandbox.Options{
		Address:              viper.GetString("sandbox.address"),
		Language:             language,
		Logger:               logger,
		VariableStoreAddress: grpcAddress,
	})
	if err != nil {
		logger.Error("could not create sandbox plugin", zap.Error(err))
		os.Exit(1)
	}
	defer sandboxPlugin.Close()
	pluginExec.RegisterPlugin(language, sandboxPlugin)

	logger.Info("connected to sandbox",
		zap.String("language", language),
		zap.String("address", viper.GetString("sandbox.address")),
		zap.String("variable_store_address", grpcAddress),
	)

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

	// Create Redis transport
	var transportRunnable run.Runnable
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

		redisClient := r.NewClient(options)

		transportRunnable = redis.NewRedisTransport(redis.NewOptions(
			redis.WithLogger(logger),
			redis.WithRedisClient(redisClient),
			redis.WithExecutionPool(viper.GetInt64("transport.redis.execution.pool")),
			redis.WithConsumerGroup(viper.GetString("worker.consumer.group")),
			redis.WithBlockDuration(viper.GetDuration("transport.redis.block.duration")),
			redis.WithMessageCount(viper.GetInt64("transport.redis.max.messages")),
			redis.WithPluginExecutor(pluginExec),
			redis.WithStreamKeys(streamKeys),
			redis.WithWorkerId(id),
			redis.WithGRPCAddress(grpcAddress),
			redis.WithGRPCPort(viper.GetInt("grpc.port")),
			redis.WithEphemeral(viper.GetBool("worker.ephemeral")),
			redis.WithEphemeralTimeout(viper.GetDuration("sandbox.timeout")),
		))

		logger.Info("redis transport configured",
			zap.String("host", viper.GetString("transport.redis.host")),
			zap.Int("port", viper.GetInt("transport.redis.port")),
			zap.Strings("streams", streamKeys),
			zap.String("group", viper.GetString("worker.consumer.group")),
			zap.Bool("worker_ephemeral", viper.GetBool("worker.ephemeral")),
			zap.Duration("sandbox_timeout", viper.GetDuration("sandbox.timeout")),
		)
	}

	var g run.Group

	g.Always(process.New())
	g.Always(transportRunnable)
	g.Always(tracerRunnable)

	logger.Info("starting worker",
		zap.String("worker_id", id),
		zap.String("language", language),
		zap.String("version", version),
	)

	if err := g.Run(); err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	os.Exit(0)
}
