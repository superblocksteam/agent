package obsup

import (
	"context"
	"errors"
	"fmt"
	"os"
	"runtime/debug"
	"strings"

	"github.com/go-logr/logr"
	"github.com/superblocksteam/agent/pkg/observability/log"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.uber.org/zap"
)

type Options struct {
	ServiceName    string
	ServiceVersion string
	OtlpUrl        string

	Headers map[string]string

	BatchOptions []trace.BatchSpanProcessorOption
}

type Result struct {
	Logger         logr.Logger
	Resource       *resource.Resource
	TracerProvider *trace.TracerProvider
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

	return result, shutdown, nil
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
