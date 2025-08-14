package main

import (
	"context"
	"crypto/tls"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/pprof"
	"os"
	systemruntime "runtime"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors"
	grpc_logging "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/recovery"
	grpc_selector "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/selector"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/jonboulle/clockwork"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	redis "github.com/redis/go-redis/v9"
	"github.com/rs/cors"
	slogzap "github.com/samber/slog-zap/v2"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"github.com/superblocksteam/agent/internal/auth"
	"github.com/superblocksteam/agent/internal/fetch"
	"github.com/superblocksteam/agent/internal/flags"
	flagoptions "github.com/superblocksteam/agent/internal/flags/options"
	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	"github.com/superblocksteam/agent/internal/kafka"
	"github.com/superblocksteam/agent/internal/metadata"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/internal/registration"
	"github.com/superblocksteam/agent/internal/schedule"
	signatureReconciler "github.com/superblocksteam/agent/internal/signature/reconciler"
	signatureReconcilerServer "github.com/superblocksteam/agent/internal/signature/reconciler/server"
	signatureReconcilerSigner "github.com/superblocksteam/agent/internal/signature/reconciler/signer"
	signatureReconcilerWatcher "github.com/superblocksteam/agent/internal/signature/reconciler/watcher"
	"github.com/superblocksteam/agent/internal/syncer"
	"github.com/superblocksteam/agent/internal/transport"
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/crypto"
	"github.com/superblocksteam/agent/pkg/crypto/cipher"
	"github.com/superblocksteam/agent/pkg/crypto/signature"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/events"
	"github.com/superblocksteam/agent/pkg/executor/options"
	internalflagsclient "github.com/superblocksteam/agent/pkg/flagsclient"
	grpcserver "github.com/superblocksteam/agent/pkg/grpc"
	httpserver "github.com/superblocksteam/agent/pkg/http"
	"github.com/superblocksteam/agent/pkg/httpretry"
	kafkaconsumer "github.com/superblocksteam/agent/pkg/kafka/consumer"
	kafkaproducer "github.com/superblocksteam/agent/pkg/kafka/producer"
	metrics_exporter "github.com/superblocksteam/agent/pkg/metrics"
	grpc_auth "github.com/superblocksteam/agent/pkg/middleware/auth"
	grpc_cancellation "github.com/superblocksteam/agent/pkg/middleware/cancellation"
	grpc_correlation "github.com/superblocksteam/agent/pkg/middleware/correlation"
	grpc_errors "github.com/superblocksteam/agent/pkg/middleware/errors"
	grpc_jwt "github.com/superblocksteam/agent/pkg/middleware/jwt"
	grpc_trace "github.com/superblocksteam/agent/pkg/middleware/trace"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	"github.com/superblocksteam/agent/pkg/observability/emitter/auditlogs"
	"github.com/superblocksteam/agent/pkg/observability/emitter/event"
	"github.com/superblocksteam/agent/pkg/observability/emitter/remote"
	"github.com/superblocksteam/agent/pkg/observability/log"
	"github.com/superblocksteam/agent/pkg/observability/obsup"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	pkgrun "github.com/superblocksteam/agent/pkg/run"
	runfx "github.com/superblocksteam/agent/pkg/run/fx"
	"github.com/superblocksteam/agent/pkg/secrets"
	secretsoptions "github.com/superblocksteam/agent/pkg/secrets/options"
	"github.com/superblocksteam/agent/pkg/store"
	redisstore "github.com/superblocksteam/agent/pkg/store/redis"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/worker"
	redistransport "github.com/superblocksteam/agent/pkg/worker/transport/redis"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	"github.com/superblocksteam/run"
	"github.com/superblocksteam/run/contrib/process"
	"github.com/superblocksteam/run/contrib/waitgroup"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/sdk/trace"
	"go.uber.org/zap"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/encoding/protojson"
)

var (
	inception = time.Time{}
	version   = "v0.0.1"
	useragent = fmt.Sprintf("Superblocks/%s (%s %s)", strings.TrimPrefix(version, "v"), cases.Title(language.Und).String(systemruntime.GOOS), systemruntime.GOARCH)
)

func init() {
	inception = time.Now()
	systemruntime.GOMAXPROCS(systemruntime.NumCPU())

	pflag.Bool("zen", false, "go easy on the log fields")
	pflag.String("file.server.url", "http://localhost:8080/v2/files", "the url to send to workers by which it can access orchestrators file server endpoint")
	pflag.Bool("test", false, "Are we in test mode?")
	pflag.String("log.level", "info", "The logging level.")
	pflag.Int("metrics.port", 9090, "The port to expose the metrics server on.")
	pflag.Bool("pprof.enabled", false, "enable the golang pprof server")
	pflag.Int("pprof.port", 7777, "The port to expose the pprof server on.")
	pflag.Int("grpc.port", 8081, "The port to expose the grpc server on.")
	pflag.String("grpc.bind", "0.0.0.0", "The address to bind the grpc server on.")
	pflag.Int("grpc.msg.res.max", 100000000, "Max message size in bytes to be sent by the from grpc server response. Default 100mb.")
	pflag.Int("grpc.msg.req.max", 30000000, "Max message size in bytes be received by the grpc server as a request. Default 30mb.")
	pflag.String("http.bind", "0.0.0.0", "The address to bind the grpc server on.")
	pflag.Int("http.port", 8080, "The port to expose the http server on.")
	pflag.Duration("job.poll.interval", 60*time.Second, "Polling interval for schedule jobs in milliseconds.")
	pflag.String("transport.redis.host", "127.0.0.1", "")
	pflag.Int("transport.redis.port", 6379, "")
	pflag.String("transport.redis.password", "koala", "")
	pflag.Int("transport.redis.pool.min", 5, "")
	pflag.Int("transport.redis.pool.max", 10, "")
	pflag.Bool("transport.redis.tls", false, "")
	pflag.String("transport.redis.servername", "", "")
	pflag.Duration("transport.redis.timeout.dial", 5*time.Second, "")
	pflag.Duration("transport.redis.timeout.read", 5*time.Minute, "")
	pflag.Duration("transport.redis.timeout.write", 10*time.Second, "")
	pflag.Duration("transport.redis.timeout.pool", 5*time.Minute, "")
	pflag.Duration("transport.redis.ack.timeout", 10*time.Second, "")
	pflag.Duration("transport.redis.response.timeout", 5*time.Minute, "")
	pflag.String("store.redis.host", "127.0.0.1", "")
	pflag.Int("store.redis.port", 6379, "")
	pflag.String("store.redis.password", "koala", "")
	pflag.Int("store.redis.pool.min", 5, "")
	pflag.Int("store.redis.pool.max", 10, "")
	pflag.Bool("store.redis.tls", false, "")
	pflag.String("store.redis.servername", "", "")
	pflag.Duration("store.redis.default.ttl", 24*time.Hour, "default ttl for writes when ttl is not specified at call site")
	pflag.Duration("store.redis.timeout.dial", 5*time.Second, "")
	pflag.Duration("store.redis.timeout.read", 5*time.Minute, "")
	pflag.Duration("store.redis.timeout.write", 10*time.Second, "")
	pflag.Duration("store.redis.timeout.pool", 5*time.Minute, "")
	pflag.String("superblocks.url", "https://api.superblocks.com", "")
	pflag.String("intake.metadata.url", "https://metadata.intake.superblocks.com", "")
	pflag.String("intake.event.url", "https://events.intake.superblocks.com", "")
	pflag.Duration("superblocks.timeout", 1*time.Minute, "")
	pflag.String("emitter.remote.intake", "https://logs.intake.superblocks.com", "")
	pflag.Bool("emitter.remote.enabled", true, "")
	pflag.Duration("emitter.remote.flush.max.duration", 30*time.Second, "")
	pflag.Int("emitter.remote.flush.max.items", 5, "")
	pflag.Bool("emitter.audit.enabled", true, "")
	pflag.Duration("emitter.audit.flush.max.duration", 5*time.Second, "")
	pflag.Int("emitter.audit.flush.max.items", 10, "")
	pflag.Duration("emitter.event.flush.max.duration", time.Minute, "")
	pflag.Bool("emitter.event.enabled", true, "")
	pflag.Int("emitter.event.flush.max.items", 100, "")
	pflag.String("superblocks.key", "dev-agent-key", "")
	pflag.String("otel.collector.http.url", "https://traces.intake.superblocks.com/v1/traces", "")
	pflag.Duration("otel.batcher.batch_timeout", 1*time.Second, "The maximum delay allowed for a BatchSpanProcessor before it will export any held span.")
	pflag.Duration("otel.batcher.export_timeout", 15*time.Second, "The amount of time a BatchSpanProcessor waits for an exporter to export before abandoning the export.")
	pflag.Int("otel.batcher.max_export_batch_size", 1000, "The maximum export batch size allowed for a BatchSpanProcessor.")
	pflag.Int("otel.batcher.max_queue_size", 5000, "The maximum queue size allowed for a BatchSpanProcessor.")
	pflag.String("buckets.config", "buckets.json", "")
	pflag.Duration("block.parallel.setting.jitter", 2*time.Millisecond, "")
	pflag.Int("block.stream.setting.buffer_size", 100, "")
	pflag.String("launchdarkly.apikey", "", "")
	pflag.Bool("launchdarkly.local", true, "")
	pflag.String("launchdarkly.config", "flags.json", "")
	pflag.String("agent.tags", "", "Comma-separated list of tags to apply to the agent")
	pflag.Int("registration.retries", 5, "Number of times to retry registration")
	pflag.String("agent.environment", "*", "Environment to register the agent under")
	pflag.String("agent.host.url", "http://localhost:8080", "URL of the host the agent is running on")
	pflag.String("agent.version", "0.0.0", "Version of the agent")
	pflag.String("agent.version.external", "0.0.0", "External version of the agent")
	pflag.String("kafka.sasl.username", "", "")
	pflag.String("kafka.sasl.password", "", "")
	pflag.String("kafka.bootstrap", "127.0.0.1:19092", "")
	pflag.String("kafka.consumer.group.id", "main", "Kafka consumer group ID")
	pflag.String("kafka.topic.metadata", "metadata.cloud", "Kafka topic for metadata")
	pflag.Int("kafka.consumer.workers", 10, "")
	pflag.Bool("kafka.enabled", false, "")
	pflag.Bool("events.cloud.enabled", false, "Whether or not to listen for cloud events")
	pflag.String("events.cloud.url", "queue.intake.superblocks.com:8443", "URL to listen on for cloud events")
	pflag.Bool("events.cloud.insecure", false, "Whether or not to use an insecure grpc connection for cloud events")
	pflag.Duration("events.cloud.keepalive.time", 20*time.Second, "Time between keepalive pings to the cloud events server")
	pflag.Duration("events.cloud.keepalive.timeout", 10*time.Second, "Timeout for each keepalive ping to the cloud events server")
	pflag.String("events.cloud.local.organization_id", "", "local redisrouter requires organization id set in requests")
	pflag.Bool("jobs.enabled", true, "Whether or not to let this agent poll for scheduled jobs")
	pflag.Bool("registration.enabled", true, "Whether or not to register the agent. This should only be enabled for OPA")
	pflag.String("data.domain", "app.superblocks.com", "Domain where user's data resides.")
	pflag.Duration("healthcheck.interval", 30*time.Second, "Interval between healthchecks in milliseconds.")
	pflag.Bool("auth.jwt.enabled", true, "")
	pflag.String("auth.jwt.jwks_url", "https://prod-cdn.superblocks.com/.well-known/jwks.json", "")
	pflag.Int("auth.eager.refresh.threshold.ms", 300000, "The threshold in milliseconds before a token expires to refresh it.")
	pflag.String("config.path", "", "Path to config file")
	pflag.Bool("quotas.enabled", false, "Whether or not to fetch quotas from LaunchDarkly")
	pflag.Float64("quotas.default.api_timeout", 600000, `Default value for "api timeout by org tier" quota. Defaults to 10m`)
	pflag.Bool("handle.cors", true, "Whether or not to handle CORS headers in the gateway")
	pflag.StringSlice(
		"cors.headers",
		[]string{"*"},
		"A list of cors headers to allow. This is only used if handle.cors is true. If nothing is set, all headers are allowed.",
	)
	pflag.String("this.region", "us-west-2", "The region this component is deployed in.")
	pflag.String("secrets.encryption.key", "22f0e749288e8455bd525b12fe857726", "")
	pflag.String("secrets.cache.mode", "memory", "The cache mode to use for the secrets store. Possible values are 'memory' and 'redis'.")
	pflag.Bool("signature.verification.enabled", false, "Whether or not to enable signature verification.")
	pflag.StringToString("signature.keys", map[string]string{}, "The set of potential keys used to sign and verify payloads.")
	pflag.String("signature.signing_key_id", "", "The id of the key used to sign payloads.")
	pflag.Bool("signature.reconciler.enabled", true, "enable the agent signature reconciler")
	pflag.Int("signature.batch.size", 200, "number of resources to fetch per signature reconcile loop")
	pflag.Bool("worker.go.enabled", false, "Whether or not to enable routing requests to the Go worker in the OPA.")
	pflag.Bool("agent.plugins.workflow.inherit_parameters.enabled", false, "Whether or not to use the API's mode and branch for workflow plugin step execution.")

	// This pflag setup allows the stdlib flag package to be used with viper.
	pflag.CommandLine.AddGoFlagSet(flag.CommandLine)
	pflag.Parse()

	// This viper setup allows env vars and config files to be used.
	viper.BindPFlags(pflag.CommandLine)
	viper.SetEnvPrefix("SUPERBLOCKS_ORCHESTRATOR")
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
	var g *run.Group
	var ready bool // We need to wait until all the runnables have beed added to the group.

	pflag.Parse()

	metrics.RegisterMetrics()
	metrics.StreamBufferCapacityTotal.WithLabelValues().Add(float64(viper.GetFloat64("block.stream.setting.buffer_size")))

	ctx := context.Background()
	wg := &sync.WaitGroup{}

	if viper.GetDuration("block.parallel.setting.jitter") > 10*time.Millisecond {
		fmt.Fprintf(os.Stderr, "jitter is too large which can result in a major performance regressions")
		os.Exit(1)
	}

	var id string
	{
		i, err := utils.UUID()
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create uuid: %s", err)
			os.Exit(1)
		} else {
			id = i
		}
	}

	var serverHttpClient clients.ServerClient
	var serverHttpClientOptions clients.ServerClientOptions
	{
		duration := viper.GetDuration("superblocks.timeout")
		serverHttpClientOptions = clients.ServerClientOptions{
			URL: viper.GetString("superblocks.url"),
			Headers: map[string]string{
				"x-superblocks-agent-id":    id,
				"x-superblocks-data-domain": viper.GetString("data.domain"),
				"user-agent":                useragent,
			},
			Timeout:             &duration,
			SuperblocksAgentKey: viper.GetString("superblocks.key"),
		}

		serverHttpClient = clients.NewServerClient(&serverHttpClientOptions)
	}

	var auditEmitter emitter.Emitter
	{
		auditEmitter = auditlogs.Emitter(
			auditlogs.Enabled(viper.GetBool("emitter.audit.enabled")),
			auditlogs.ServerClient(serverHttpClient),
			auditlogs.FlushMaxItems(viper.GetInt("emitter.audit.flush.max.items")),
			auditlogs.FlushMaxDuration(viper.GetDuration("emitter.audit.flush.max.duration")),
			auditlogs.AgentId(id),
		)
	}

	var intakeLogger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: viper.GetString("log.level"),
			InitialFields: map[string]any{
				observability.OBS_TAG_AGENT_VERSION: version,
				observability.OBS_TAG_AGENT_ID:      id,
			},
			Zen: viper.GetBool("zen"),
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
				"x-superblocks-agent-key":   viper.GetString("superblocks.key"),
				"x-superblocks-data-domain": viper.GetString("data.domain"),
				"x-superblocks-agent-id":    id,
				"user-agent":                useragent,
			},
			Timeout: &duration,
		})
	}

	var remoteEmitter emitter.Emitter
	{
		headers := http.Header{}

		if viper.GetBool("test") {
			headers.Add("X-Superblocks-Organization-Id", "00000000-0000-0000-0000-000000000001")
		}

		remoteEmitter = remote.Emitter(
			intakeHttpClient,
			remote.Enabled(viper.GetBool("emitter.remote.enabled")),
			remote.Headers(headers),
			remote.FlushMaxItems(viper.GetInt("emitter.remote.flush.max.items")),
			remote.FlushMaxDuration(viper.GetDuration("emitter.remote.flush.max.duration")),
			remote.Whitelist(
				observability.OBS_TAG_AGENT_ID,
				observability.OBS_TAG_AGENT_VERSION,
				observability.OBS_TAG_ORG_ID,
				observability.OBS_TAG_RESOURCE_ACTION,
				observability.OBS_TAG_RESOURCE_NAME,
				observability.OBS_TAG_RESOURCE_ID,
				observability.OBS_TAG_RESOURCE_TYPE,
				observability.OBS_TAG_PARENT_NAME,
				observability.OBS_TAG_PARENT_ID,
				observability.OBS_TAG_PARENT_TYPE,
				observability.OBS_TAG_PROFILE,
				observability.OBS_TAG_CORRELATION_ID,
				observability.OBS_TAG_COMPONENT,
				observability.OBS_TAG_USER_EMAIL,
				observability.OBS_TAG_USER_TYPE,
				observability.OBS_TAG_APPLICATION_ID,
				observability.OBS_TAG_PAGE_ID,
				observability.OBS_TAG_VIEW_MODE,
			),
		)
	}

	var eventEmitter emitter.Emitter
	{
		eventEmitter = event.Emitter(
			event.Enabled(viper.GetBool("emitter.event.enabled")),
			event.FlushMaxItems(viper.GetInt("emitter.event.flush.max.items")),
			event.FlushMaxDuration(viper.GetDuration("emitter.event.flush.max.duration")),
			event.AgentId(id),
			event.IntakeClient(intakeHttpClient),
		)
	}

	var logger *zap.Logger
	{
		fields := map[string]any{}

		if !viper.GetBool("zen") {
			fields[observability.OBS_TAG_AGENT_VERSION] = version
			fields[observability.OBS_TAG_AGENT_ID] = id
			fields[observability.OBS_TAG_COMPONENT] = "orchestrator"
		}

		l, err := log.Logger(&log.Options{
			Level:         viper.GetString("log.level"),
			InitialFields: fields,
			Emitters: []emitter.Emitter{
				auditEmitter,
				eventEmitter,
				remoteEmitter,
			},
			Zen: viper.GetBool("zen"),
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	logger.Info("agent-id", zap.String("x-superblocks-agent-id", id))

	if err := javascript.PreCompileBundles(); err != nil {
		logger.Error("could not pre compile javascript bundles", zap.Error(err))
		os.Exit(1)
	}

	var metricsRunnable run.Runnable
	{
		metricsRunnable = httpserver.Prepare(&httpserver.Options{
			Name:         "metrics",
			Handler:      promhttp.Handler(), // Exposes it on /* which includes /metrics.
			InsecureAddr: viper.GetString("http.bind"),
			InsecurePort: viper.GetInt("metrics.port"),
			Logger:       logger,
		})
	}

	var tracerRunnable run.Runnable
	{
		var err error
		tracerRunnable, err = tracer.Prepare(logger, obsup.Options{
			ServiceName:    "orchestrator",
			ServiceVersion: version,
			OtlpUrl:        viper.GetString("otel.collector.http.url"),

			Headers: map[string]string{
				"x-superblocks-agent-key": viper.GetString("superblocks.key"),
			},

			BatchOptions: []trace.BatchSpanProcessorOption{
				trace.WithMaxQueueSize(viper.GetInt("otel.batcher.max_queue_size")),
				trace.WithMaxExportBatchSize(viper.GetInt("otel.batcher.max_export_batch_size")),
				trace.WithExportTimeout(viper.GetDuration("otel.batcher.export_timeout")),
				trace.WithBatchTimeout(viper.GetDuration("otel.batcher.batch_timeout")),
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create tracer: %s", err)
			os.Exit(1)
		}
	}

	var storeRedisClient *redis.Client
	var storage store.Store
	{
		options := &redis.Options{
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

		storeRedisClient = redis.NewClient(options)
		storage = redisstore.New(storeRedisClient,
			redisstore.WithDefaultTtl(viper.GetDuration("store.redis.default.ttl")),
		)
	}

	var flagsClient flags.Client
	{
		options := []flagoptions.Option{
			flagoptions.WithLogger(logger),
			flagoptions.WithDefaultApiTimeout(viper.GetFloat64("quotas.default.api_timeout")),
			flagoptions.WithDefaultGoWorkerEnabled(viper.GetBool("worker.go.enabled")),
			flagoptions.WithDefaultWorkflowPluginInheritanceEnabled(viper.GetBool("agent.plugins.workflow.inherit_parameters.enabled")),
		}
		internalOptions := []internalflagsclient.Option{
			internalflagsclient.WithLogger(logger),
		}

		if viper.GetBool("launchdarkly.local") {
			options = append(options, flagoptions.WithLocal(viper.GetString("launchdarkly.config")))
			internalOptions = append(internalOptions, internalflagsclient.WithLocal(viper.GetString("launchdarkly.config")))
		}

		if viper.GetBool("quotas.enabled") {
			internalFlagsClient := internalflagsclient.NewLaunchDarklyClient(viper.GetString("launchdarkly.apikey"), internalOptions...)
			flagsClient = flags.LaunchDarkly(internalFlagsClient, options...)
		} else {
			flagsClient = flags.NoopFlags(options...)
		}
	}

	var transportRedisClient *redis.Client
	var workerClient worker.Client
	{
		options := &redis.Options{
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

		transportRedisClient = redis.NewClient(options)

		buckets, err := redistransport.BucketsFromConfig(viper.GetString("buckets.config"))
		if err != nil {
			logger.Error(err.Error())
			os.Exit(1)
		}

		workerClient = redistransport.New(
			redistransport.WithBuckets(buckets),
			redistransport.WithLogger(logger),
			redistransport.WithRedisClient(transportRedisClient),
			redistransport.WithHeartbeatInterval(viper.GetDuration("transport.redis.ack.timeout")),
			redistransport.WithTimeout(viper.GetDuration("transport.redis.response.timeout")),
		)
	}

	var fetcher fetch.Fetcher
	{
		fetcher = fetch.New(&fetch.Options{
			Logger:       logger,
			ServerClient: serverHttpClient,
			IntakeClient: intakeHttpClient,
		})
	}

	var kafkaConsumerRunnable run.Runnable
	{
		syncer, err := syncer.New(&syncer.Config{
			Logger:  logger,
			Worker:  workerClient,
			Fetcher: fetcher,
		})
		if err != nil {
			logger.Error(err.Error())
			os.Exit(1)
		}

		kafkaConsumerRunnable, err = kafkaconsumer.New(&kafkaconsumer.Options{
			Topics:         []string{viper.GetString("kafka.topic.metadata")},
			Logger:         logger,
			Handler:        kafka.Dispatcher(syncer, logger),
			Workers:        viper.GetInt("kafka.consumer.workers"),
			MetricsCounter: metrics.KafkaConsumedMessagesTotal,
			Config: map[string]interface{}{
				"security.protocol": "SASL_SSL",
				"sasl.mechanisms":   "PLAIN",
				"sasl.username":     viper.GetString("kafka.sasl.username"),
				"sasl.password":     viper.GetString("kafka.sasl.password"),
				"bootstrap.servers": viper.GetString("kafka.bootstrap"),
				"group.id":          viper.GetString("kafka.consumer.group.id"),
			},
		})

		if err != nil {
			logger.Error(err.Error(), zap.Error(err))
			os.Exit(1)
		}
	}

	var kafkaProducerRunnable run.Runnable
	{
		var err error
		kafkaProducerRunnable, err = kafkaproducer.New(&kafkaproducer.Options{
			Config: map[string]interface{}{
				"security.protocol": "SASL_SSL",
				"sasl.mechanisms":   "PLAIN",
				"sasl.username":     viper.GetString("kafka.sasl.username"),
				"sasl.password":     viper.GetString("kafka.sasl.password"),
				"bootstrap.servers": viper.GetString("kafka.bootstrap"),
			},
			Logger: logger,
		})

		if err != nil {
			logger.Error(err.Error(), zap.Error(err))
			os.Exit(1)
		}
	}

	defaultResolveOptions := []options.Option{
		options.Jitter(viper.GetDuration("block.parallel.setting.jitter")),
		options.BufferSize(viper.GetInt("block.stream.setting.buffer_size")),
	}

	var manager secrets.Secrets
	{
		var cache store.Store
		{
			switch viper.GetString("secrets.cache.mode") {
			case "memory":
				cache = store.Memory()
			case "redis":
				cache = storage
			default:
				fmt.Fprintf(os.Stderr, "unknown secrets cache mode: %s\n", viper.GetString("secrets.cache.mode"))
				os.Exit(1)
			}
		}

		manager = secrets.Manager(
			secretsoptions.WithLogger(logger),
			secretsoptions.WithRegion(viper.GetString("this.region")),
			secretsoptions.WithCipher(cipher.AES([]byte(viper.GetString("secrets.encryption.key")))),
			secretsoptions.WithCache(cache),
		)
	}

	// TODO(frank): Deprecate.
	var secretManager secrets.SecretManager
	{
		secretManager = secrets.NewSecretManager()
	}

	var registry signature.Registry
	{
		var keys []signature.Key
		{
			input, err := utils.GetStringMapString(
				viper.GetStringMapString("signature.keys"),
				os.Getenv("SUPERBLOCKS_ORCHESTRATOR_SIGNATURE_KEYS"),
			)
			if err != nil {
				fmt.Fprint(os.Stderr, err.Error())
				os.Exit(1)
			}

			for id, key := range input {
				keys = append(keys, signature.Key{
					ID:    id,
					Value: []byte(key),
				})
			}
		}

		var err error
		registry, err = signature.Manager(
			viper.GetBool("signature.verification.enabled"),
			keys,
			viper.GetString("signature.signing_key_id"),
			signature.NewResourceSerializer(),
		)

		if err != nil {
			logger.Error(err.Error(), zap.Error(err))
			os.Exit(1)
		}
	}

	var eventsCloudRunnable run.Runnable
	{
		headers := map[string]string{
			"X-Superblocks-Agent-Key": viper.GetString("superblocks.key"),
		}
		orgId := viper.GetString("events.cloud.local.organization_id")
		if orgId != "" {
			headers["x-superblocks-organization-id"] = orgId
		}
		eventsCloudRunnable = events.NewListener(
			viper.GetString("events.cloud.url"),
			headers,
			&events.Options{
				Consumers:        map[string]*events.Consumer{},
				KeepaliveTime:    viper.GetDuration("events.cloud.keepalive.time"),
				KeepaliveTimeout: viper.GetDuration("events.cloud.keepalive.timeout"),
				Insecure:         viper.GetBool("events.cloud.insecure"),
				Logger:           logger,
			},
		)
	}

	var registrator registration.Registrator
	{
		verificationKeys := make(map[string]clients.VerificationKey)
		for keyId, publicKey := range registry.PublicKeys() {
			verificationKeys[keyId] = clients.VerificationKey{
				Algorithm: publicKey.Algorithm.String(),
				Key:       publicKey.EncodedValue,
			}
		}

		registrator = registration.New(&registration.Options{
			Logger:               logger,
			ServerClient:         serverHttpClient,
			Tags:                 metadata.GetTagsMap(viper.GetString("agent.tags")),
			AgentVersion:         viper.GetString("agent.version"),
			AgentVersionExternal: viper.GetString("agent.version.external"),
			AgentUrl:             viper.GetString("agent.host.url"),
			Environment:          viper.GetString("agent.environment"),
			SigningKeyId:         registry.SigningKeyID(),
			VerificationKeys:     verificationKeys,
			SuperblocksKey:       viper.GetString("superblocks.key"),
		})
	}

	var clock clockwork.Clock
	{
		clock = clockwork.NewRealClock()
	}

	var grpcRunnable run.Runnable
	{
		grpcServer := transport.NewServer(&transport.Config{
			WaitGroup:             wg,
			Logger:                logger,
			Worker:                workerClient,
			Store:                 storage,
			FileServerUrl:         viper.GetString("file.server.url"),
			Flags:                 flagsClient,
			DefaultResolveOptions: defaultResolveOptions,
			Fetcher:               fetcher,
			TokenManager:          auth.NewTokenManager(serverHttpClient, clock, logger, viper.GetInt64("auth.eager.refresh.threshold.ms")),
			AgentId:               id,
			AgentVersion:          version,
			SecretManager:         secretManager,
			Secrets:               manager,
			Health: func(options *apiv1.HealthRequest) (response *commonv1.HealthResponse, err error) {
				if !ready || !g.Alive() {
					return nil, sberrors.HealthCheckError("The system is not ready.")
				}

				response = &commonv1.HealthResponse{
					Id:      id,
					Message: "OK",
					Uptime:  time.Since(inception).Milliseconds(),
					Version: version,
				}

				if options.Detailed {
					if storeRedisClient != nil {
						response.Store = utils.PoolStats(storeRedisClient.PoolStats())
					}
					if transportRedisClient != nil {
						response.Stream = utils.PoolStats(transportRedisClient.PoolStats())
					}
				}

				return
			},
			Signature: registry,
		})

		logOptions := []grpc_logging.Option{
			grpc_logging.WithLogOnEvents(
				grpc_logging.StartCall,
				grpc_logging.FinishCall,
			),
			// https://github.com/grpc-ecosystem/go-grpc-middleware/issues/679
			grpc_logging.WithDisableLoggingFields("grpc.response.content", "grpc.request.content"),
		}

		logDecider := func(ctx context.Context, callMeta interceptors.CallMeta) bool {
			// NOTE(frank): We can make this method level if we need to.
			return !slices.Contains([]string{
				"api.v1.MetadataService",
				"grpc.reflection.v1alpha.ServerReflection",
			}, callMeta.Service)
		}

		key, err := crypto.LoadEcdsaPublicKeyFromJwksUrl(ctx, viper.GetString("auth.jwt.jwks_url"))
		if err != nil {
			logger.Error(err.Error())
			os.Exit(1)
		}

		jwtOptions := []grpc_jwt.Option{
			grpc_jwt.WithLogger(logger),
			grpc_jwt.WithMetadataKey("X-Superblocks-Authorization"),
			grpc_jwt.WithSigningKeyECDSA(key),
			grpc_jwt.WithClaimsFactory(jwt_validator.NewClaims),
			grpc_jwt.WithAdditionalValidators(jwt_validator.Validate),
		}

		jwtDecider := func(ctx context.Context, callMeta interceptors.CallMeta) bool {
			jwtEnabled := viper.GetBool("auth.jwt.enabled")
			requestUsesJwtAuth, err := constants.GetRequestUsesJwtAuth(ctx)
			if err != nil {
				// NOTE: @joeyagreco - we always expect this to be set by auth middleware, so if it is not set, that's unexpected
				// NOTE: @joeyagreco - unsure if there's a better way to handle this here
				logger.Error("could not get requestUsesJwtAuth", zap.Error(err))
				return false
			}
			if callMeta.ReqOrNil == nil {
				// we reach this path for streaming

				// we do not pass the Superblocks JWT from the workers for file downloads, so we can't use JWT auth for that
				if callMeta.Method == "Download" {
					return false
				}
				return jwtEnabled && requestUsesJwtAuth
			}

			switch callMeta.ReqOrNil.(type) {
			case *apiv1.ExecuteRequest, *apiv1.TestRequest, *apiv1.MetadataRequest:
				return jwtEnabled && requestUsesJwtAuth
			case *secretsv1.InvalidateRequest:
				// TODO: This endpoint depends on the JWT for getting org ID, so we must return true even if flag is off
				// Consider supporting JWTs without validation for this endpoint, or moving the org ID to the body
				return true
			case *securityv1.SignRequest:
				return false
			default:
				return false
			}
		}

		streamInterceptors := []grpc.StreamServerInterceptor{
			grpc_correlation.StreamServerInterceptor(),
			grpc_trace.StreamServerInterceptor(),
			grpc_cancellation.StreamServerInterceptor(logger),
			grpc_selector.StreamServerInterceptor(
				grpc_logging.StreamServerInterceptor(log.InterceptorLogger(logger), logOptions...),
				grpc_selector.MatchFunc(logDecider),
			),
			grpc_errors.StreamServerInterceptor(),
			grpc_recovery.StreamServerInterceptor(),
			grpc_auth.StreamServerInterceptor(),
			grpc_selector.StreamServerInterceptor(
				grpc_jwt.StreamServerInterceptor(jwtOptions...),
				grpc_selector.MatchFunc(jwtDecider),
			),
		}

		unaryInterceptors := []grpc.UnaryServerInterceptor{
			grpc_correlation.UnaryServerInterceptor(),
			grpc_trace.UnaryServerInterceptor(),
			grpc_cancellation.UnaryServerInterceptor(logger),
			grpc_selector.UnaryServerInterceptor(
				grpc_logging.UnaryServerInterceptor(log.InterceptorLogger(logger), logOptions...),
				grpc_selector.MatchFunc(logDecider),
			),
			grpc_errors.UnaryServerInterceptor(),
			grpc_recovery.UnaryServerInterceptor(),
			grpc_auth.UnaryServerInterceptor(),
			grpc_selector.UnaryServerInterceptor(
				grpc_jwt.UnaryServerInterceptor(jwtOptions...),
				grpc_selector.MatchFunc(jwtDecider),
			),
		}

		s := grpc.NewServer(
			grpc.ChainUnaryInterceptor(unaryInterceptors...),
			grpc.ChainStreamInterceptor(streamInterceptors...),
			grpc.MaxRecvMsgSize(viper.GetInt("grpc.msg.req.max")),
			grpc.MaxSendMsgSize(viper.GetInt("grpc.msg.res.max")),
			grpc.StatsHandler(otelgrpc.NewServerHandler()),
		)
		apiv1.RegisterExecutorServiceServer(s, grpcServer)
		apiv1.RegisterMetadataServiceServer(s, grpcServer)
		apiv1.RegisterDeprecatedServiceServer(s, grpcServer)
		apiv1.RegisterIntegrationAuthServiceServer(s, grpcServer)
		secretsv1.RegisterStoreServiceServer(s, grpcServer)
		securityv1.RegisterSignatureServiceServer(s, grpcServer)

		grpcRunnable = grpcserver.Prepare(&grpcserver.Options{
			Server:     s,
			Network:    "tcp",
			Address:    fmt.Sprintf("%s:%d", viper.GetString("grpc.bind"), viper.GetInt("grpc.port")),
			Reflection: true,
			Logger:     logger,
			Name:       "main",
		})
	}

	var httpRunnable run.Runnable
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
			runtime.WithIncomingHeaderMatcher(func(key string) (string, bool) {
				// authorization header already gets passed
				lowerKey := strings.ToLower(key)
				switch lowerKey {
				case "cookie", "origin", "x-superblocks-authorization", "x-forwarded-for":
					return lowerKey, true
				}
				return "", false
			}),
			runtime.WithOutgoingHeaderMatcher(func(key string) (string, bool) {
				lowerKey := strings.ToLower(key)
				switch lowerKey {
				case "set-cookie":
					return lowerKey, true
				case constants.HeaderCorrelationId:
					return lowerKey, true
				}
				return "", false
			}),
		)

		opts := []grpc.DialOption{
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
			grpc.WithDefaultCallOptions(
				// note that gateway uses the opposite of grpc direction.
				// grpc send max (response) is gateway receive max
				grpc.MaxCallRecvMsgSize(viper.GetInt("grpc.msg.req.max")),
				grpc.MaxCallSendMsgSize(viper.GetInt("grpc.msg.res.max")),
			),
		}

		for _, register := range []func(context.Context, *runtime.ServeMux, string, []grpc.DialOption) error{
			apiv1.RegisterExecutorServiceHandlerFromEndpoint,
			apiv1.RegisterMetadataServiceHandlerFromEndpoint,
			apiv1.RegisterDeprecatedServiceHandlerFromEndpoint,
			apiv1.RegisterIntegrationAuthServiceHandlerFromEndpoint,
			secretsv1.RegisterStoreServiceHandlerFromEndpoint,
			securityv1.RegisterSignatureServiceHandlerFromEndpoint,
		} {
			if err := register(ctx, mux, fmt.Sprintf("%s:%d", viper.GetString("grpc.bind"), viper.GetInt("grpc.port")), opts); err != nil {
				fmt.Fprintln(os.Stderr, err.Error())
				os.Exit(1)
			}
		}

		var handler http.Handler
		{
			if viper.GetBool("handle.cors") {
				handler = cors.New(cors.Options{
					AllowOriginFunc:     func(string) bool { return true },
					AllowedMethods:      []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
					AllowedHeaders:      viper.GetStringSlice("cors.headers"),
					AllowCredentials:    true,
					AllowPrivateNetwork: true,
					MaxAge:              300,
				}).Handler(mux)
			} else {
				handler = mux
			}
		}

		handler = otelhttp.NewHandler(transport.HackUntilWeHaveGoKit(handler), "grpc-gateway")

		httpRunnable = httpserver.Prepare(&httpserver.Options{
			Name:         "main",
			Handler:      handler,
			InsecurePort: viper.GetInt("http.port"),
			Logger:       logger,
			InsecureAddr: viper.GetString("http.bind"),
		})
	}

	var profiler run.Runnable
	{
		mux := http.NewServeMux()
		mux.HandleFunc("/debug/pprof/", pprof.Index)
		mux.HandleFunc("/debug/pprof/profile", pprof.Profile)
		mux.HandleFunc("/debug/pprof/{action}", pprof.Index)
		mux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)

		profiler = httpserver.Prepare(&httpserver.Options{
			Name:         "pprof",
			Handler:      mux,
			InsecurePort: viper.GetInt("pprof.port"),
			Logger:       logger,
			InsecureAddr: viper.GetString("http.bind"),
		})
	}

	var scheduledJobRunner run.Runnable
	{
		scheduledJobRunner = schedule.New(&schedule.Config{
			Clock:                   clock,
			Logger:                  logger,
			Store:                   storage,
			Worker:                  workerClient,
			Fetcher:                 fetcher,
			ServerClient:            serverHttpClient,
			PollInterval:            viper.GetDuration("job.poll.interval"),
			DefaultResolveOptions:   defaultResolveOptions,
			Flags:                   flagsClient,
			SecretManager:           secretManager,
			Secrets:                 manager,
			EagerRefreshThresholdMs: viper.GetInt64("auth.eager.refresh.threshold.ms"),
			Signature:               registry,
		})
	}

	var metricsExporter run.Runnable
	{
		metricsExporter = metrics_exporter.NewMetricsExporter(
			&metrics_exporter.MetricsExporterOptions{
				ServerHttpClient: serverHttpClient,
				Logger:           logger,
				Version:          viper.GetString("agent.version"),
				VersionExternal:  viper.GetString("agent.version.external"),
				Interval:         viper.GetDuration("healthcheck.interval"),
			},
		)
	}

	g = run.New(
		run.WithLogger(slog.New(slogzap.Option{
			Level:  slog.LevelInfo,
			Logger: logger,
		}.NewZapHandler())),
		run.WithSyncShutdown(),
	)

	{
		enabled := viper.GetBool("signature.reconciler.enabled") && viper.GetString("signature.signing_key_id") != ""
		if enabled {
			// defaultClient is based on the default implementation of clients.NewServerClient which
			// defaults Client to this value when Client is not passed
			defaultClient := tracer.DefaultHttpClient()
			defaultClient.Transport = httpretry.New(logger, defaultClient.Transport)
			opts := serverHttpClientOptions // copy to not disturb other http client global
			opts.Client = defaultClient
			serverClient := clients.NewServerClient(&opts)

			headers := map[string]string{}
			for k, v := range opts.Headers {
				headers[k] = v
			}
			headers["x-superblocks-agent-key"] = viper.GetString("superblocks.key")

			watcher, err := signatureReconcilerWatcher.New(logger, opts.URL, headers)
			if err != nil {
				logger.Error("cannot create signature reconciler watcher", zap.Error(err))
				os.Exit(1)
			}
			g.Add(enabled, runfx.AdaptRunCtxAsRunnable(watcher.Run))

			r := signatureReconciler.New(logger,
				signatureReconcilerServer.New(logger, serverClient, "agent-"+id,
					signatureReconcilerServer.WithBatchSize(viper.GetInt32("signature.batch.size")),
				),
				signatureReconcilerSigner.New(logger, registry),
				watcher.C,
			)
			g.Add(enabled, runfx.AdaptRunCtxAsRunnable(r.Run))
		}
	}

	// shutdown of runnables is synchronous so we need to take into account the order of shutdown
	// order of shutdown is the same as the order of creation
	g.Always(process.New())

	g.Add(viper.GetBool("kafka.enabled"), kafkaConsumerRunnable)
	g.Add(viper.GetBool("kafka.enabled"), kafkaProducerRunnable)
	g.Add(viper.GetBool("jobs.enabled"), scheduledJobRunner)
	g.Add(viper.GetBool("events.cloud.enabled"), eventsCloudRunnable)

	// close server runnables, these should block while requests are still being processed
	g.Always(grpcRunnable)
	g.Always(httpRunnable)
	g.Always(waitgroup.New(wg, true))

	// close rest of the runnables
	g.Add(viper.GetBool("quotas.enabled"), flagsClient)
	g.Add(viper.GetBool("registration.enabled"), registrator)
	g.Add(viper.GetBool("registration.enabled"), metricsExporter)
	g.Add(viper.GetBool("emitter.remote.enabled"), remoteEmitter)

	g.Always(metricsRunnable)
	g.Always(tracerRunnable)
	g.Always(auditEmitter)
	g.Always(eventEmitter)
	g.Always(workerClient)

	if storeRedisClient != nil {
		g.Always(pkgrun.Redis("store", storeRedisClient, logger))
	}

	if transportRedisClient != nil {
		g.Always(pkgrun.Redis("transport", transportRedisClient, logger))
	}

	g.Add(viper.GetBool("pprof.enabled"), profiler)

	ready = true

	if err := g.Run(); err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	os.Exit(0)
}
