package main

import (
	"crypto/tls"
	"flag"
	"fmt"
	"net/http"
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
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	"github.com/superblocksteam/agent/pkg/observability/emitter/remote"
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

	pflag.Bool("test", false, "Are we in test mode?")
	pflag.String("log.level", "info", "The logging level.")
	pflag.String("emitter.remote.intake", "https://logs.intake.superblocks.com", "The URL of the Intake service.")
	pflag.Bool("emitter.remote.enabled", true, "Whether remote logs should be sent to the Intake service.")
	pflag.Duration("emitter.remote.flush.max.duration", 30*time.Second, "The maximum duration before a log is flushed.")
	pflag.Int("emitter.remote.max.retries", 2, "The maximum number of retries before a log is dropped.")
	pflag.Int("emitter.remote.flush.max.items", 500, "The maximum number of logs before a flush is triggered.")
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
	pflag.String("otel.collector.http.url", "http://127.0.0.1:4318", "")
	pflag.Duration("otel.batcher.batch.timeout", 1*time.Second, "The maximum delay allowed for a BatchSpanProcessor before it will export any held span.")
	pflag.Duration("otel.batcher.export.timeout", 15*time.Second, "The amount of time a BatchSpanProcessor waits for an exporter to export before abandoning the export.")
	pflag.Int("otel.batcher.export.batch.max", 1000, "The maximum export batch size allowed for a BatchSpanProcessor.")
	pflag.Int("otel.batcher.export.queue.max", 5000, "The maximum queue size allowed for a BatchSpanProcessor.")
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

	var intakeHttpClient clients.IntakeClient
	{
		duration := viper.GetDuration("superblocks.timeout")
		intakeHttpClient = clients.NewIntakeClient(&clients.IntakeClientOptions{
			Logger:      intakeLogger,
			LogUrl:      viper.GetString("emitter.remote.intake"),
			MetadataUrl: viper.GetString("intake.metadata.url"),
			EventUrl:    viper.GetString("intake.event.url"),
			Headers: map[string]string{
				"x-superblocks-agent-key": viper.GetString("superblocks.key"),
				"x-superblocks-agent-id":  id,
			},
			Timeout: &duration,
		})
	}

	var remoteEmitter emitter.Emitter
	{
		headers := http.Header{}

		headers.Add("X-Superblocks-Agent-Key", viper.GetString("superblocks.key"))

		if viper.GetBool("test") {
			headers.Add("X-Superblocks-Organization-Id", "00000000-0000-0000-0000-000000000001")
		}

		remoteEmitter = remote.Emitter(
			intakeHttpClient,
			remote.Enabled(viper.GetBool("emitter.remote.enabled")),
			remote.Headers(headers),
			remote.FlushMaxItems(viper.GetInt("emitter.remote.flush.max.items")),
			remote.FlushMaxDuration(viper.GetDuration("emitter.remote.flush.max.duration")),
			remote.MaxRetries(viper.GetInt("emitter.remote.max.retries")),
			remote.Whitelist(
				observability.OBS_TAG_REMOTE,
				observability.OBS_TAG_AGENT_ID,
				observability.OBS_TAG_AGENT_VERSION,
				observability.OBS_TAG_CORRELATION_ID,
				observability.OBS_TAG_COMPONENT,
				observability.OBS_TAG_ORG_ID,
				observability.OBS_TAG_ORG_TIER,
				observability.OBS_TAG_ORG_NAME,
				observability.OBS_TAG_RESOURCE_ACTION,
				observability.OBS_TAG_RESOURCE_NAME,
				observability.OBS_TAG_RESOURCE_ID,
				observability.OBS_TAG_RESOURCE_TYPE,
				observability.OBS_TAG_APPLICATION_ID,
				observability.OBS_TAG_PAGE_ID,
				observability.OBS_TAG_PARENT_NAME,
				observability.OBS_TAG_PARENT_ID,
				observability.OBS_TAG_PARENT_TYPE,
				observability.OBS_TAG_PROFILE,
				observability.OBS_TAG_USER_EMAIL,
				observability.OBS_TAG_USER_TYPE,
			),
		)
	}

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: viper.GetString("log.level"),
			InitialFields: map[string]any{
				observability.OBS_TAG_WORKER_ID: id,
				observability.OBS_TAG_COMPONENT: "worker.go",
			},
			Emitters: []emitter.Emitter{
				remoteEmitter,
			},
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

	var tracerRunnable run.Runnable
	{
		t, err := tracer.Prepare(logger, obsup.Options{
			ServiceName:    "worker.go",
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
			redis.WithStreamKeys(redis.StreamKeys(pluginExecutor.ListPlugins(), viper.GetString("worker.group"), viper.GetString("worker.bucket"), viper.GetStringSlice("worker.events"), false)),
			redis.WithWorkerId(id),
		))
	}

	var g run.Group

	g.Always(process.New())
	g.Always(transportRunnable)
	g.Always(tracerRunnable)
	g.Add(viper.GetBool("emitter.remote.enabled"), remoteEmitter)

	if err := g.Run(); err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	os.Exit(0)
}
