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

	plugin_javascript "workers/golang/internal/plugin/javascript"
	"workers/golang/internal/plugin_executor"
	"workers/golang/internal/transport/redis"
	workerutils "workers/golang/internal/utils"

	r "github.com/redis/go-redis/v9"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	"github.com/superblocksteam/agent/pkg/observability/log"
	pkgrun "github.com/superblocksteam/agent/pkg/run"
	"github.com/superblocksteam/agent/pkg/store"
	redisstore "github.com/superblocksteam/agent/pkg/store/redis"
	"github.com/superblocksteam/agent/pkg/telemetry"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/run"
	"github.com/superblocksteam/run/contrib/process"
	"go.uber.org/zap"
)

var (
	version = "v0.0.0"
	id      string
)

func init() {
	systemruntime.GOMAXPROCS(systemruntime.NumCPU())

	pflag.Bool("test", false, "Are we in test mode?")
	pflag.String("log.level", "info", "The logging level.")
	pflag.String("store.redis.host", "127.0.0.1", "The kvstore redis port.")
	pflag.Int("store.redis.port", 6379, "The kvstore redis port.")
	pflag.String("store.redis.password", "", "The kvstore redis password.")
	pflag.Bool("store.redis.tls", false, "Whether to connect via SSL to the redis kvstore.")
	pflag.Duration("store.redis.default.ttl", 24*time.Hour, "default ttl for writes when ttl is not specified at call site")
	pflag.Bool("transport.redis.tls", false, "Whether to connect via SSL to the redis transport.")
	pflag.String("transport.redis.host", "127.0.0.1", "The transport redis host.")
	pflag.Int("transport.redis.port", 6379, "The transport redis port.")
	pflag.String("transport.redis.password", "", "The transport redis password.")
	pflag.Int("transport.redis.execution.pool", 100, "The number of concurrent executions allowed.")
	pflag.String("agent.environment", "*", "Environment to register the agent under.")
	pflag.String("otel.collector.http.url", "http://127.0.0.1:4318", "")
	pflag.String("telemetry.deployment.type", "on-prem", "Telemetry deployment type. Valid values: cloud, cloud-prem, on-prem.")
	pflag.String("superblocks.key", "dev-agent-key", "The superblocks agent key.")
	pflag.Duration("superblocks.timeout", 10*time.Second, "The timeout to use for Superblocks HTTP requests.")
	pflag.Duration("transport.redis.timeout.dial", 5*time.Second, "The maximum duration for dialing a redis connection.")
	pflag.Duration("transport.redis.timeout.read", 5*time.Minute, "Timeout for socket reads.")
	pflag.Duration("transport.redis.timeout.write", 10*time.Second, "Timeout for socket writes.")
	pflag.Duration("transport.redis.timeout.pool", 5*time.Minute, "The maximum duration for waiting for a redis connection from the pool.")
	pflag.Duration("store.redis.timeout.dial", 5*time.Second, "The maximum duration for dialing a redis connection.")
	pflag.Duration("store.redis.timeout.read", 5*time.Minute, "Timeout for socket reads.")
	pflag.Duration("store.redis.timeout.write", 10*time.Second, "Timeout for socket writes.")
	pflag.Duration("store.redis.timeout.pool", 5*time.Minute, "Amount of time client waits for connection if all connections are busy before returning an error.")
	pflag.Int("store.redis.pool.max", 10, "The maximum number of connections in the connection pool.")
	pflag.Int("store.redis.pool.min", 5, "The minimum number of connections in the connection pool.")
	pflag.Int("transport.redis.pool.max", 10, "The maximum number of connections in the connection pool.")
	pflag.Int("transport.redis.pool.min", 5, "The minimum number of connections in the connection pool.")
	pflag.String("store.redis.servername", "", "The server name used to verify the hostname returned by the TLS handshake.")
	pflag.String("transport.redis.servername", "", "The server name used to verify the hostname returned by the TLS handshake.")
	pflag.String("worker.group", "main", "The worker group.")
	pflag.String("worker.consumer.group", "main", "The worker consumer group.")
	pflag.String("worker.bucket", "BA", "The worker bucket.")
	pflag.StringSlice("worker.events", []string{"execute", "predelete", "test", "metadata", "stream"}, "The list of events to listen for.")
	pflag.Duration("transport.redis.block.duration", 5*time.Second, "The maximum duration to block for a message.")
	pflag.Int("transport.redis.max.messages", 10, "The maximum number of messages to process at once.")
	pflag.Int("v8.flags.max_old_space_size", 0, "The maximum old space size for the V8 engine.")
	pflag.Int("v8.flags.max_heap_size", 0, "The maximum heap size for the V8 engine.")

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
	viper.SetEnvPrefix("SUPERBLOCKS_WORKER_GO")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	_ = viper.BindEnv("telemetry.deployment.type", "SUPERBLOCKS_DEPLOYMENT_TYPE")

	if path := viper.GetString("config.path"); path != "" {
		viper.SetConfigFile(path)
		if err := viper.ReadInConfig(); err != nil {
			fmt.Fprintf(os.Stdout, "failed to load a config file, ignoring: %s", err)
		}
	}
}

func main() {
	pflag.Parse()

	var intakeLogger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: viper.GetString("log.level"),
			InitialFields: map[string]any{
				observability.OBS_TAG_WORKER_ID: id,
			},
			Emitters: []emitter.Emitter{},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		intakeLogger = l
	}

	var tracerRunnable run.Runnable
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
			ServiceName:    "worker.go",
			ServiceVersion: version,
			Environment:    viper.GetString("agent.environment"),
			OTLPURL:        viper.GetString("otel.collector.http.url"),
			Headers: map[string]string{
				"x-superblocks-agent-key": viper.GetString("superblocks.key"),
			},
			MetricsEnabled: false,
			LogsEnabled:    true,
		}, policy, intakeLogger)
		if err != nil {
			intakeLogger.Error("could not initialize telemetry", zap.Error(err))
			os.Exit(1)
		}

		tracerRunnable = pkgrun.Telemetry(telInstance)
	}

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: viper.GetString("log.level"),
			InitialFields: map[string]any{
				observability.OBS_TAG_WORKER_ID: id,
				observability.OBS_TAG_COMPONENT: "worker.go",
			},
			Emitters:       []emitter.Emitter{},
			LoggerProvider: telInstance.LoggerProvider,
			ServiceName:    "worker.go",
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	if err := javascript.PreCompileBundles(); err != nil {
		logger.Error("could not pre compile javascript bundles", zap.Error(err))
		os.Exit(1)
	}

	var storeClient store.Store
	{
		options := &r.Options{
			Addr:         fmt.Sprintf("%s:%d", viper.GetString("store.redis.host"), viper.GetInt("store.redis.port")),
			Username:     "default",
			Password:     viper.GetString("store.redis.password"),
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

	var pluginExecutor plugin_executor.PluginExecutor
	{
		jsPlugin := plugin_javascript.NewJavascriptPlugin(
			&plugin_javascript.Options{
				StoreClient: storeClient,
				Logger:      logger,
				Headers: map[string][]string{
					"x-superblocks-agent-key": {
						workerutils.SanitizeAgentKey(viper.GetString("superblocks.key")),
					},
				},
				V8MaxOldSpaceSize: viper.GetInt("v8.flags.max_old_space_size"),
				V8MaxHeapSize:     viper.GetInt("v8.flags.max_heap_size"),
			},
		)
		pluginExecutor = plugin_executor.NewPluginExecutor(
			plugin_executor.NewOptions(
				plugin_executor.WithStore(storeClient),
				plugin_executor.WithLogger(logger),
			),
		)
		pluginExecutor.RegisterPlugin("v8", jsPlugin)
	}

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
			redis.WithMaxBytes(viper.GetInt64("transport.redis.max.bytes")),
			redis.WithMessageCount(viper.GetInt64("transport.redis.max.messages")),
			redis.WithPluginExecutor(pluginExecutor),
			redis.WithStreamKeys(redis.StreamKeys(pluginExecutor.ListPlugins(), viper.GetString("worker.group"), []string{viper.GetString("worker.bucket")}, utils.GetStringSlice("worker.events"), false)),
			redis.WithWorkerId(id),
		))
	}

	var g run.Group

	g.Always(process.New())
	g.Always(transportRunnable)
	g.Always(tracerRunnable)

	if err := g.Run(); err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	os.Exit(0)
}
