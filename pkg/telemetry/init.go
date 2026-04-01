package telemetry

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	otellog "go.opentelemetry.io/otel/log"
	otellogglobal "go.opentelemetry.io/otel/log/global"
	otelmetric "go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/propagation"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

var (
	initMu            sync.Mutex
	initialized       *Instance
	noopLoggerFactory = zap.NewNop
)

func Init(ctx context.Context, cfg Config, policy TelemetryPolicy, logger *zap.Logger) (*Instance, error) {
	if logger == nil {
		logger = noopLoggerFactory()
	}
	if err := validateConfig(cfg); err != nil {
		return nil, err
	}
	if err := validatePolicy(policy); err != nil {
		return nil, err
	}

	initMu.Lock()
	defer initMu.Unlock()

	if initialized != nil {
		return initialized, nil
	}

	if os.Getenv("CI") == "true" {
		instance := newNoOpInstance(cfg, policy)
		initialized = instance
		return instance, nil
	}

	policyEvaluator := NewPolicyEvaluator(policy)

	res, err := BuildResource(cfg)
	if err != nil {
		return nil, err
	}

	// Save previous globals so we can restore them if Init fails partway through.
	prevTracerProvider := otel.GetTracerProvider()
	prevMeterProvider := otel.GetMeterProvider()
	prevPropagator := otel.GetTextMapPropagator()

	traceProvider, resilientExporter, err := newTraceProvider(ctx, cfg, res, policyEvaluator, logger, policy.DeploymentType)
	if err != nil {
		return nil, err
	}
	otel.SetTracerProvider(traceProvider)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	meterProvider, err := newMeterProvider(ctx, cfg, res, policyEvaluator)
	if err != nil {
		_ = traceProvider.Shutdown(ctx)
		otel.SetTracerProvider(prevTracerProvider)
		otel.SetTextMapPropagator(prevPropagator)
		return nil, err
	}
	otel.SetMeterProvider(meterProvider)

	serviceMeter := meterProvider.Meter(cfg.ServiceName, otelmetric.WithInstrumentationVersion(cfg.ServiceVersion))
	metricsClient := NewMetricsClient(serviceMeter)

	loggerProvider, err := newLoggerProvider(ctx, cfg, res, policy)
	if err != nil {
		_ = meterProvider.Shutdown(ctx)
		_ = traceProvider.Shutdown(ctx)
		otel.SetTracerProvider(prevTracerProvider)
		otel.SetMeterProvider(prevMeterProvider)
		otel.SetTextMapPropagator(prevPropagator)
		return nil, err
	}
	if loggerProvider != nil {
		otellogglobal.SetLoggerProvider(loggerProvider)
	}

	var (
		shutdownOnce sync.Once
		shutdownErr  error
	)

	instance := &Instance{}
	instance.TracerProvider = traceProvider
	instance.MeterProvider = meterProvider
	instance.LoggerProvider = loggerProvider
	instance.PolicyEvaluator = policyEvaluator
	instance.MetricsClient = metricsClient
	instance.GetTracer = func(name string) trace.Tracer {
		if name == "" {
			name = cfg.ServiceName
		}
		return traceProvider.Tracer(name, trace.WithInstrumentationVersion(cfg.ServiceVersion))
	}
	instance.GetMeter = func(name string) otelmetric.Meter {
		if name == "" {
			name = cfg.ServiceName
		}
		return meterProvider.Meter(name, otelmetric.WithInstrumentationVersion(cfg.ServiceVersion))
	}
	instance.GetLogger = func(name string) otellog.Logger {
		if name == "" {
			name = cfg.ServiceName
		}
		if loggerProvider == nil {
			return otellogglobal.Logger(name, otellog.WithInstrumentationVersion(cfg.ServiceVersion))
		}
		return loggerProvider.Logger(name, otellog.WithInstrumentationVersion(cfg.ServiceVersion))
	}
	instance.Shutdown = func(shutdownCtx context.Context) error {
		shutdownOnce.Do(func() {
			shutdownErr = errors.Join(
				metricsClient.Close(),
				shutdownLoggerProvider(shutdownCtx, loggerProvider),
				meterProvider.Shutdown(shutdownCtx),
				traceProvider.Shutdown(shutdownCtx),
			)
			initMu.Lock()
			defer initMu.Unlock()
			if initialized == instance {
				initialized = nil
			}
		})
		return shutdownErr
	}

	if resilientExporter != nil {
		logger.Debug(
			"telemetry initialized with resilient trace exporter",
			zap.Int64("queue_capacity", resilientExporter.maxQueueSize),
		)
	}

	initialized = instance
	return instance, nil
}

func validateConfig(cfg Config) error {
	if strings.TrimSpace(cfg.ServiceName) == "" {
		return fmt.Errorf("service name is required")
	}
	if strings.TrimSpace(cfg.ServiceVersion) == "" {
		return fmt.Errorf("service version is required")
	}
	if strings.TrimSpace(cfg.Environment) == "" {
		return fmt.Errorf("environment is required")
	}
	if cfg.OTLPURL != "" {
		if _, err := url.Parse(cfg.OTLPURL); err != nil {
			return fmt.Errorf("invalid OTLP URL: %w", err)
		}
	}
	return nil
}

func newTraceProvider(
	ctx context.Context,
	cfg Config,
	res *resource.Resource,
	policyEvaluator *PolicyEvaluator,
	logger *zap.Logger,
	deploymentType DeploymentType,
) (*sdktrace.TracerProvider, *ResilientExporter, error) {
	traceOpts := []sdktrace.TracerProviderOption{
		sdktrace.WithResource(res),
	}

	tier2 := policyEvaluator.GetPolicy().Tiers[Tier2Operational]
	traceOpts = append(traceOpts, sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(tier2.SampleRate))))

	if cfg.OTLPURL != "" && policyEvaluator.IsExportEnabled(Tier2Operational) {
		exporter, err := otlptracehttp.New(ctx, traceHTTPOptions(cfg, "/v1/traces")...)
		if err != nil {
			return nil, nil, fmt.Errorf("create trace exporter: %w", err)
		}

		sanitizing := NewSanitizingExporter(exporter, deploymentType)
		resilient := NewResilientExporter(ResilientExporterConfig{
			Delegate:      sanitizing,
			MaxQueueSize:  cfg.Batch.MaxQueueSize,
			ExportTimeout: cfg.Batch.ExportTimeout,
			OnDrop: func(count int, reason DropReason) {
				logger.Warn("dropped spans", zap.Int("count", count), zap.String("reason", string(reason)))
			},
		})

		var bspOpts []sdktrace.BatchSpanProcessorOption
		if cfg.Batch.MaxExportBatchSize > 0 {
			bspOpts = append(bspOpts, sdktrace.WithMaxExportBatchSize(cfg.Batch.MaxExportBatchSize))
		}
		if cfg.Batch.BatchTimeout > 0 {
			bspOpts = append(bspOpts, sdktrace.WithBatchTimeout(cfg.Batch.BatchTimeout))
		}
		// ExportTimeout is applied to the BatchSpanProcessor so it controls the
		// deadline passed to ExportSpans. The ResilientExporter only enforces its
		// own timeout when no deadline is present on the incoming context, so
		// this is the effective place to configure per-export timeouts.
		if cfg.Batch.ExportTimeout > 0 {
			bspOpts = append(bspOpts, sdktrace.WithExportTimeout(cfg.Batch.ExportTimeout))
		}
		batcher := sdktrace.NewBatchSpanProcessor(resilient, bspOpts...)
		filtering := NewFilteringSpanProcessor(batcher, deploymentType)
		traceOpts = append(traceOpts, sdktrace.WithSpanProcessor(filtering))
		return sdktrace.NewTracerProvider(traceOpts...), resilient, nil
	}

	return sdktrace.NewTracerProvider(traceOpts...), nil, nil
}

func newMeterProvider(
	ctx context.Context,
	cfg Config,
	res *resource.Resource,
	policyEvaluator *PolicyEvaluator,
) (*sdkmetric.MeterProvider, error) {
	opts := []sdkmetric.Option{
		sdkmetric.WithResource(res),
	}

	if cfg.OTLPURL != "" && cfg.MetricsEnabled && policyEvaluator.IsExportEnabled(Tier2Operational) {
		exporter, err := otlpmetrichttp.New(
			ctx,
			metricHTTPOptions(cfg, "/v1/metrics")...,
		)
		if err != nil {
			return nil, fmt.Errorf("create metric exporter: %w", err)
		}
		reader := sdkmetric.NewPeriodicReader(exporter, sdkmetric.WithInterval(10*time.Second))
		opts = append(opts, sdkmetric.WithReader(reader))
	}

	return sdkmetric.NewMeterProvider(opts...), nil
}

func newLoggerProvider(
	ctx context.Context,
	cfg Config,
	res *resource.Resource,
	policy TelemetryPolicy,
) (*sdklog.LoggerProvider, error) {
	if cfg.OTLPURL == "" || !cfg.LogsEnabled {
		return nil, nil
	}

	loggingPolicy := GetLoggingPolicy(policy)
	if loggingPolicy.ExportMode == LogExportModeLocalOnly {
		return nil, nil
	}

	exporter, err := otlploghttp.New(ctx, logHTTPOptions(cfg, "/v1/logs")...)
	if err != nil {
		return nil, fmt.Errorf("create log exporter: %w", err)
	}

	batch := sdklog.NewBatchProcessor(exporter)
	processor := NewPolicyAwareLogProcessor(loggingPolicy, batch)
	provider := sdklog.NewLoggerProvider(
		sdklog.WithProcessor(processor),
		sdklog.WithResource(res),
	)
	return provider, nil
}

func shutdownLoggerProvider(ctx context.Context, provider *sdklog.LoggerProvider) error {
	if provider == nil {
		return nil
	}
	return provider.Shutdown(ctx)
}

func traceHTTPOptions(cfg Config, path string) []otlptracehttp.Option {
	opts := []otlptracehttp.Option{
		otlptracehttp.WithEndpointURL(signalURL(cfg.OTLPURL, path)),
	}
	if len(cfg.Headers) > 0 {
		opts = append(opts, otlptracehttp.WithHeaders(cfg.Headers))
	}
	if strings.HasPrefix(cfg.OTLPURL, "http://") {
		opts = append(opts, otlptracehttp.WithInsecure())
	}
	return opts
}

func metricHTTPOptions(cfg Config, path string) []otlpmetrichttp.Option {
	opts := []otlpmetrichttp.Option{
		otlpmetrichttp.WithEndpointURL(signalURL(cfg.OTLPURL, path)),
		otlpmetrichttp.WithTemporalitySelector(func(sdkmetric.InstrumentKind) metricdata.Temporality {
			return metricdata.DeltaTemporality
		}),
	}
	if len(cfg.Headers) > 0 {
		opts = append(opts, otlpmetrichttp.WithHeaders(cfg.Headers))
	}
	if strings.HasPrefix(cfg.OTLPURL, "http://") {
		opts = append(opts, otlpmetrichttp.WithInsecure())
	}
	return opts
}

func logHTTPOptions(cfg Config, path string) []otlploghttp.Option {
	opts := []otlploghttp.Option{
		otlploghttp.WithEndpointURL(signalURL(cfg.OTLPURL, path)),
	}
	if len(cfg.Headers) > 0 {
		opts = append(opts, otlploghttp.WithHeaders(cfg.Headers))
	}
	if strings.HasPrefix(cfg.OTLPURL, "http://") {
		opts = append(opts, otlploghttp.WithInsecure())
	}
	return opts
}

func signalURL(baseURL, signalPath string) string {
	baseURL = strings.TrimSpace(baseURL)
	if baseURL == "" {
		return ""
	}
	trimmed := strings.TrimSuffix(baseURL, "/")
	for _, suffix := range []string{"/v1/traces", "/v1/metrics", "/v1/logs"} {
		trimmed = strings.TrimSuffix(trimmed, suffix)
	}
	return trimmed + signalPath
}

func newNoOpInstance(cfg Config, policy TelemetryPolicy) *Instance {
	policyEvaluator := NewPolicyEvaluator(policy)
	meterProvider := otel.GetMeterProvider()
	metricsClient := NewMetricsClient(meterProvider.Meter(cfg.ServiceName))

	instance := &Instance{}
	instance.PolicyEvaluator = policyEvaluator
	instance.MetricsClient = metricsClient
	instance.GetTracer = func(name string) trace.Tracer {
		if name == "" {
			name = cfg.ServiceName
		}
		return otel.GetTracerProvider().Tracer(name, trace.WithInstrumentationVersion(cfg.ServiceVersion))
	}
	instance.GetMeter = func(name string) otelmetric.Meter {
		if name == "" {
			name = cfg.ServiceName
		}
		return meterProvider.Meter(name, otelmetric.WithInstrumentationVersion(cfg.ServiceVersion))
	}
	instance.GetLogger = func(name string) otellog.Logger {
		if name == "" {
			name = cfg.ServiceName
		}
		return otellogglobal.Logger(name, otellog.WithInstrumentationVersion(cfg.ServiceVersion))
	}
	instance.Shutdown = func(context.Context) error {
		initMu.Lock()
		defer initMu.Unlock()
		if initialized == instance {
			initialized = nil
		}
		return metricsClient.Close()
	}

	return instance
}
