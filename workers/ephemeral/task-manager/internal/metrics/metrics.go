// Package metrics defines OpenTelemetry metric instruments for sandbox operations.
//
// These metrics cover the full sandbox lifecycle:
//   - Creation and teardown of sandbox pods
//   - Execution pool utilization
//   - Code execution timing and overhead
//   - Warm vs cold start tracking
package metrics

import (
	"context"
	"strings"
	"sync"

	"github.com/superblocksteam/run"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.37.0"
)

const meterName = "sandbox"

// Global metric instruments.
var (
	// Histograms

	// SandboxCreationDuration measures time to create a sandbox pod (K8s Job creation + waitForPodReady).
	SandboxCreationDuration metric.Float64Histogram

	// SandboxTeardownDuration measures time to delete a sandbox pod during shutdown.
	SandboxTeardownDuration metric.Float64Histogram

	// SandboxExecutionDuration measures total wall-clock time for an execution request
	// (from receiving the request to returning the response, including all overhead).
	SandboxExecutionDuration metric.Float64Histogram

	// SandboxCodeExecutionDuration measures only the gRPC call to the sandbox
	// (the actual code execution time, excluding overhead).
	SandboxCodeExecutionDuration metric.Float64Histogram

	// Counters

	// SandboxExecutionsTotal counts total sandbox executions with warm/cold start labels.
	SandboxExecutionsTotal metric.Int64Counter

	// Gauges (UpDownCounters)

	// SandboxExecutionPoolSize reports the configured maximum size of the execution pool.
	SandboxExecutionPoolSize metric.Int64Gauge

	// SandboxExecutionPoolInUse reports the number of currently active executions.
	SandboxExecutionPoolInUse metric.Int64UpDownCounter

	mu        sync.Mutex
	initiated bool
)

// Histogram bucket configurations for sandbox metrics (in seconds).
var (
	// DurationBuckets covers the range from 1ms to 5 minutes for execution durations.
	DurationBuckets = []float64{
		0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300,
	}

	// CreationBuckets covers the range for sandbox creation (typically 1-120s).
	CreationBuckets = []float64{
		0.1, 0.25, 0.5, 1, 2, 3, 5, 7.5, 10, 15, 20, 30, 45, 60, 90, 120,
	}
)

// SetupMeterProvider creates and registers an OTLP-based meter provider for
// pushing sandbox metrics to the configured collector.
func SetupMeterProvider(ctx context.Context, otlpURL, serviceName, serviceVersion string) (*sdkmetric.MeterProvider, error) {
	metricsURL := buildMetricsURL(otlpURL)

	opts := []otlpmetrichttp.Option{
		otlpmetrichttp.WithEndpointURL(metricsURL),
	}

	if strings.HasPrefix(otlpURL, "http://") {
		opts = append(opts, otlpmetrichttp.WithInsecure())
	}

	exporter, err := otlpmetrichttp.New(ctx, opts...)
	if err != nil {
		return nil, err
	}

	res, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(semconv.SchemaURL,
			semconv.ServiceNameKey.String(serviceName),
			semconv.ServiceVersionKey.String(serviceVersion),
		),
	)
	if err != nil {
		return nil, err
	}

	views := histogramViews()

	providerOpts := []sdkmetric.Option{
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(exporter)),
		sdkmetric.WithResource(res),
	}
	providerOpts = append(providerOpts, views...)

	mp := sdkmetric.NewMeterProvider(providerOpts...)
	otel.SetMeterProvider(mp)

	return mp, nil
}

// RegisterMetrics initializes all metric instruments from the global meter provider.
// Must be called after SetupMeterProvider.
func RegisterMetrics() error {
	mu.Lock()
	defer mu.Unlock()

	if initiated {
		return nil
	}

	meter := otel.GetMeterProvider().Meter(meterName)
	return registerWithMeter(meter)
}

// RegisterMetricsWithMeter initializes all metric instruments with a specific meter.
// Used for testing with custom meter providers.
func RegisterMetricsWithMeter(meter metric.Meter) error {
	mu.Lock()
	defer mu.Unlock()

	return registerWithMeter(meter)
}

func registerWithMeter(meter metric.Meter) error {
	var err error

	// Histograms

	SandboxCreationDuration, err = meter.Float64Histogram(
		"sandbox_creation_duration_seconds",
		metric.WithDescription("Time to create a sandbox pod (K8s Job + waitForPodReady)"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return err
	}

	SandboxTeardownDuration, err = meter.Float64Histogram(
		"sandbox_teardown_duration_seconds",
		metric.WithDescription("Time to delete a sandbox pod during shutdown"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return err
	}

	SandboxExecutionDuration, err = meter.Float64Histogram(
		"sandbox_execution_duration_seconds",
		metric.WithDescription("Total wall-clock time for an execution request including all overhead"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return err
	}

	SandboxCodeExecutionDuration, err = meter.Float64Histogram(
		"sandbox_code_execution_duration_seconds",
		metric.WithDescription("Time for just the gRPC call to sandbox (actual code execution)"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return err
	}

	// Counters

	SandboxExecutionsTotal, err = meter.Int64Counter(
		"sandbox_executions_total",
		metric.WithDescription("Total sandbox executions"),
		metric.WithUnit("{execution}"),
	)
	if err != nil {
		return err
	}

	// Gauges

	SandboxExecutionPoolSize, err = meter.Int64Gauge(
		"sandbox_execution_pool_size",
		metric.WithDescription("Configured maximum size of the execution pool"),
		metric.WithUnit("{slot}"),
	)
	if err != nil {
		return err
	}

	SandboxExecutionPoolInUse, err = meter.Int64UpDownCounter(
		"sandbox_execution_pool_in_use",
		metric.WithDescription("Number of currently active executions"),
		metric.WithUnit("{execution}"),
	)
	if err != nil {
		return err
	}

	initiated = true
	return nil
}

// histogramViews returns OTEL views for configuring histogram bucket boundaries.
func histogramViews() []sdkmetric.Option {
	creationHistograms := []string{
		"sandbox_creation_duration_seconds",
		"sandbox_teardown_duration_seconds",
	}

	durationHistograms := []string{
		"sandbox_execution_duration_seconds",
		"sandbox_code_execution_duration_seconds",
	}

	views := make([]sdkmetric.Option, 0)

	for _, name := range creationHistograms {
		views = append(views, sdkmetric.WithView(sdkmetric.NewView(
			sdkmetric.Instrument{Name: name},
			sdkmetric.Stream{Aggregation: sdkmetric.AggregationExplicitBucketHistogram{Boundaries: CreationBuckets}},
		)))
	}

	for _, name := range durationHistograms {
		views = append(views, sdkmetric.WithView(sdkmetric.NewView(
			sdkmetric.Instrument{Name: name},
			sdkmetric.Stream{Aggregation: sdkmetric.AggregationExplicitBucketHistogram{Boundaries: DurationBuckets}},
		)))
	}

	return views
}

// Helper functions for recording metrics.

// RecordHistogram records a histogram value if the instrument is non-nil and value > 0.
func RecordHistogram(ctx context.Context, hist metric.Float64Histogram, value float64, attrs ...attribute.KeyValue) {
	if hist != nil && value > 0 {
		hist.Record(ctx, value, metric.WithAttributes(attrs...))
	}
}

// AddCounter increments a counter by 1 with the given attributes.
func AddCounter(ctx context.Context, counter metric.Int64Counter, attrs ...attribute.KeyValue) {
	if counter != nil {
		counter.Add(ctx, 1, metric.WithAttributes(attrs...))
	}
}

// RecordGauge records a gauge value with the given attributes.
func RecordGauge(ctx context.Context, gauge metric.Int64Gauge, value int64, attrs ...attribute.KeyValue) {
	if gauge != nil {
		gauge.Record(ctx, value, metric.WithAttributes(attrs...))
	}
}

// AddUpDownCounter adds a value to an UpDownCounter with the given attributes.
func AddUpDownCounter(ctx context.Context, counter metric.Int64UpDownCounter, value int64, attrs ...attribute.KeyValue) {
	if counter != nil {
		counter.Add(ctx, value, metric.WithAttributes(attrs...))
	}
}

// meterProviderRunnable wraps a MeterProvider as a run.Runnable so it
// participates in the run group lifecycle and shuts down cleanly (os.Exit
// skips deferred calls, so defer-based shutdown is unreliable).
type meterProviderRunnable struct {
	run.ForwardCompatibility
	mp *sdkmetric.MeterProvider
}

// NewRunnable returns a run.Runnable that blocks until context cancellation
// and then shuts down the meter provider, flushing any buffered metrics.
func NewRunnable(mp *sdkmetric.MeterProvider) run.Runnable {
	return &meterProviderRunnable{mp: mp}
}

func (r *meterProviderRunnable) Run(ctx context.Context) error {
	<-ctx.Done()
	return nil
}

func (r *meterProviderRunnable) Close(ctx context.Context) error {
	if r.mp != nil {
		return r.mp.Shutdown(ctx)
	}
	return nil
}

func (r *meterProviderRunnable) Alive() bool  { return true }
func (r *meterProviderRunnable) Name() string { return "meter-provider" }

// buildMetricsURL converts a collector URL to a metrics endpoint URL.
func buildMetricsURL(baseURL string) string {
	if strings.HasSuffix(baseURL, "/v1/traces") {
		return strings.TrimSuffix(baseURL, "/v1/traces") + "/v1/metrics"
	}
	if strings.HasSuffix(baseURL, "/v1/metrics") {
		return baseURL
	}
	return strings.TrimSuffix(baseURL, "/") + "/v1/metrics"
}

// Common attribute keys for sandbox metrics.
var (
	AttrLanguage  = attribute.Key("language")
	AttrResult    = attribute.Key("result")
	AttrWarmStart = attribute.Key("warm_start")
)
