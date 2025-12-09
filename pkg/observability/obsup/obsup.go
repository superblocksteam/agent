package obsup

import (
	"context"
	"errors"
	"fmt"
	"os"
	"runtime/debug"
	"strings"
	"time"

	"github.com/go-logr/logr"
	"github.com/superblocksteam/agent/pkg/observability/log"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.37.0"
	"go.uber.org/zap"
)

// ConfigProvider abstracts configuration retrieval for building OTEL options.
// This interface is compatible with *viper.Viper.
type ConfigProvider interface {
	GetString(key string) string
	GetInt(key string) int
	GetDuration(key string) time.Duration
}

type Options struct {
	ServiceName    string
	ServiceVersion string
	OtlpUrl        string

	Headers map[string]string

	BatchOptions    []trace.BatchSpanProcessorOption
	LogBatchOptions []sdklog.BatchProcessorOption
}

// OptionsFromConfig builds Options from a configuration provider.
// This extracts common configuration patterns used across services.
//
// Config keys used:
//   - otel.collector.http.url: OTLP collector URL
//   - superblocks.key: Agent key for x-superblocks-agent-key header
//   - otel.batcher.max_queue_size: Max queue size for batch processor
//   - otel.batcher.max_export_batch_size: Max export batch size
//   - otel.batcher.export_timeout: Export timeout duration
//   - otel.batcher.batch_timeout: Batch timeout duration
func OptionsFromConfig(cfg ConfigProvider, serviceName, serviceVersion string) Options {
	return Options{
		ServiceName:    serviceName,
		ServiceVersion: serviceVersion,
		OtlpUrl:        cfg.GetString("otel.collector.http.url"),
		Headers: map[string]string{
			"x-superblocks-agent-key": cfg.GetString("superblocks.key"),
		},
		BatchOptions: []trace.BatchSpanProcessorOption{
			trace.WithMaxQueueSize(cfg.GetInt("otel.batcher.max_queue_size")),
			trace.WithMaxExportBatchSize(cfg.GetInt("otel.batcher.max_export_batch_size")),
			trace.WithExportTimeout(cfg.GetDuration("otel.batcher.export_timeout")),
			trace.WithBatchTimeout(cfg.GetDuration("otel.batcher.batch_timeout")),
		},
	}
}

type Result struct {
	Logger         logr.Logger
	Resource       *resource.Resource
	TracerProvider *trace.TracerProvider
	LoggerProvider *sdklog.LoggerProvider
}

func Setup(logger *zap.Logger, opts Options) (Result, func(context.Context) error, error) {
	var err error
	result := Result{}

	onShutdown := []func(context.Context) error{}
	shutdown := func(ctx context.Context) error {
		var err error
		for _, f := range onShutdown {
			err = errors.Join(err, f(ctx))
		}
		if err != nil {
			err = fmt.Errorf("unable to shutdown observability: %w", err)
		}
		return err
	}

	logger = logger.Named("otel")
	result.Logger = logr.New(&log.LogrAdapter{
		Logger: logger,
	})
	otel.SetLogger(result.Logger)

	attrs := []attribute.KeyValue{
		semconv.ServiceNameKey.String(opts.ServiceName),
		semconv.ServiceVersionKey.String(opts.ServiceVersion),
	}

	info, _ := debug.ReadBuildInfo()
	attrs = append(attrs, setupDdGit(logger, info)...)

	result.Resource, err = resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(semconv.SchemaURL, attrs...),
	)
	if err != nil {
		return result, shutdown, fmt.Errorf("unable to merge otel resources: %w", err)
	}

	var se trace.SpanExporter
	if opts.OtlpUrl == "" {
		se, err = stdouttrace.New()
		if err != nil {
			return result, shutdown, fmt.Errorf("create stdouttrace error: %w", err)
		}
	} else {
		options := []otlptracehttp.Option{
			otlptracehttp.WithEndpointURL(opts.OtlpUrl),
			otlptracehttp.WithHeaders(opts.Headers),
		}

		if strings.HasPrefix(opts.OtlpUrl, "http://") {
			options = append(options, otlptracehttp.WithInsecure())
		}

		// se stands for span exporter
		se, err = otlptracehttp.New(context.Background(), options...)
		if err != nil {
			return result, shutdown, fmt.Errorf("create otlptracehttp error: %w", err)
		}
	}

	result.TracerProvider = trace.NewTracerProvider(
		trace.WithBatcher(se, opts.BatchOptions...),
		trace.WithResource(result.Resource),
	)
	otel.SetTracerProvider(result.TracerProvider)
	onShutdown = append(onShutdown, result.TracerProvider.Shutdown)

	otel.SetTextMapPropagator(propagation.TraceContext{})

	// Set up OTLP log exporter (only if URL is configured)
	if opts.OtlpUrl != "" {
		logOptions := []otlploghttp.Option{
			otlploghttp.WithEndpointURL(buildLogsURL(opts.OtlpUrl)),
			otlploghttp.WithHeaders(opts.Headers),
		}

		if strings.HasPrefix(opts.OtlpUrl, "http://") {
			logOptions = append(logOptions, otlploghttp.WithInsecure())
		}

		logExporter, err := otlploghttp.New(context.Background(), logOptions...)
		if err != nil {
			return result, shutdown, fmt.Errorf("create otlploghttp error: %w", err)
		}

		result.LoggerProvider = sdklog.NewLoggerProvider(
			sdklog.WithProcessor(sdklog.NewBatchProcessor(logExporter, opts.LogBatchOptions...)),
			sdklog.WithResource(result.Resource),
		)
		onShutdown = append(onShutdown, result.LoggerProvider.Shutdown)
	}

	return result, shutdown, nil
}

// buildLogsURL converts a trace collector URL to a logs URL.
// If the URL ends with /v1/traces, it replaces with /v1/logs.
// If the URL already ends with /v1/logs, it returns as-is.
// Otherwise, it appends /v1/logs.
func buildLogsURL(baseURL string) string {
	if strings.HasSuffix(baseURL, "/v1/traces") {
		return strings.TrimSuffix(baseURL, "/v1/traces") + "/v1/logs"
	}
	if strings.HasSuffix(baseURL, "/v1/logs") {
		return baseURL
	}
	return strings.TrimSuffix(baseURL, "/") + "/v1/logs"
}

func setupDdGit(log *zap.Logger, info *debug.BuildInfo) []attribute.KeyValue {
	attrs := []attribute.KeyValue{}

	gitCommitSha := os.Getenv("SB_GIT_COMMIT_SHA")
	gitRepositoryUrl := os.Getenv("SB_GIT_REPOSITORY_URL")
	if gitCommitSha == "" || gitRepositoryUrl == "" {
		if info == nil {
			log.Warn("failed to read build info")
		} else {
			if gitCommitSha == "" {
				// go version -m ./go-binary
				// ...
				// 	build	vcs.revision=6a8bc0b41ed1607522b396aa3e9490e377a9e7db
				// ...
				for _, kv := range info.Settings {
					if kv.Key == "vcs.revision" {
						gitCommitSha = kv.Value
					}
				}
			}

			if gitRepositoryUrl == "" {
				gitRepositoryUrl = info.Main.Path
			}
		}
	}

	if gitCommitSha != "" && gitRepositoryUrl != "" {
		attrs = append(attrs,
			attribute.Key("git.commit.sha").String(gitCommitSha),
			attribute.Key("git.repository_url").String(gitRepositoryUrl),
		)
		log.Info("initialized otel git.*",
			zap.String("git.commit.sha", gitCommitSha),
			zap.String("git.repository_url", gitRepositoryUrl),
		)
	} else {
		log.Warn("missing otel git.* setup, use env vars SB_GIT_COMMIT_SHA and SB_GIT_REPOSITORY_URL")
	}

	return attrs
}
