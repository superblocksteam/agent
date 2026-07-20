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
	"time"

	"github.com/superblocksteam/agent/pkg/telemetry"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.40.0"
)

// MeterName is the OpenTelemetry meter name for sandbox task-manager metrics.
const MeterName = "sandbox"

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

	// SandboxCodeExecutionDuration measures the time for the logical execution (after pool-level retries).
	// Labels include ephemeral, execute_attempts (0 implies pool never acquired a sandbox), etc.
	SandboxCodeExecutionDuration metric.Float64Histogram

	// SandboxCodeExecutionAttemptDuration measures only the gRPC call to the sandbox
	// (the actual code execution time, excluding overhead).
	SandboxCodeExecutionAttemptDuration metric.Float64Histogram

	// SandboxLifecycleDuration measures task-manager lifecycle operations that are
	// not part of plugin request handling (e.g., sandbox connect and teardown).
	SandboxLifecycleDuration metric.Float64Histogram

	// Counters

	// SandboxExecutionsTotal counts total sandbox executions (warm/cold, ephemeral, execute_attempts, …).
	SandboxExecutionsTotal metric.Int64Counter

	// SandboxCodeExecutionAttemptsTotal counts each gRPC Execute call (including pool retries).
	SandboxCodeExecutionAttemptsTotal metric.Int64Counter

	// SandboxConnectionStateTransitions counts gRPC connection state changes to sandbox
	SandboxConnectionStateTransitions metric.Int64Counter

	// Gauges (UpDownCounters)

	// SandboxExecutionPoolSize reports the configured maximum size of the execution pool.
	SandboxExecutionPoolSize metric.Int64Gauge

	// SandboxExecutionPoolInUse reports the number of currently active executions.
	SandboxExecutionPoolInUse metric.Int64UpDownCounter

	// SandboxPoolConfiguredSandboxes reports the number of sandboxes in the pool (static or dynamic).
	SandboxPoolConfiguredSandboxes metric.Int64Gauge

	// SandboxPoolEventsTotal counts pool lifecycle events (replacement skips, pick misses, etc.).
	// Use bounded attribute values only (see AttrPoolEvent).
	SandboxPoolEventsTotal metric.Int64Counter

	// WorkerDegradedModeTransitions counts Redis transport transitions into and out of degraded mode
	// (plugins unavailable). Attributes: transition (enter|recover), worker_id, ephemeral.
	WorkerDegradedModeTransitions metric.Int64Counter

	// WorkerDegradedMode reports whether this task-manager is currently in Redis transport degraded mode (0 or 1).
	WorkerDegradedMode metric.Int64ObservableGauge

	// WorkerRedisMessagesReadTotal counts messages delivered per GroupReader poll by source path.
	WorkerRedisMessagesReadTotal metric.Int64Counter

	// WorkerRedisAckSkippedTotal counts handleMessage early returns before execution.
	WorkerRedisAckSkippedTotal metric.Int64Counter

	// WorkerRedisReadCacheSize reports overflow-cache depth after each GroupReader poll.
	WorkerRedisReadCacheSize metric.Int64Gauge

	// SandboxPoolSandboxReadyDuration measures wall time from runPlugin start until the sandbox is ready for dispatch.
	SandboxPoolSandboxReadyDuration metric.Float64Histogram

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
func SetupMeterProvider(ctx context.Context, otlpURL, serviceName, serviceVersion, fleetName string, headers map[string]string, exportInterval time.Duration) (*sdkmetric.MeterProvider, error) {
	metricsURL := buildMetricsURL(otlpURL)

	opts := []otlpmetrichttp.Option{
		otlpmetrichttp.WithEndpointURL(metricsURL),
	}
	opts = append(opts, telemetry.OTLPMetricHeaderOptions(metricsURL, headers)...)

	if strings.HasPrefix(otlpURL, "http://") {
		opts = append(opts, otlpmetrichttp.WithInsecure())
	}

	exporter, err := otlpmetrichttp.New(ctx, opts...)
	if err != nil {
		return nil, err
	}

	attrs := []attribute.KeyValue{
		semconv.ServiceNameKey.String(serviceName),
		semconv.ServiceVersionKey.String(serviceVersion),
	}
	if fleetName != "" {
		attrs = append(attrs, attribute.String("fleet", fleetName))
	}

	res, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(semconv.SchemaURL, attrs...),
	)
	if err != nil {
		return nil, err
	}

	if exportInterval <= 0 {
		exportInterval = 10 * time.Second
	}

	views := histogramViews()

	providerOpts := []sdkmetric.Option{
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(exporter,
			sdkmetric.WithInterval(exportInterval),
		)),
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

	meter := otel.GetMeterProvider().Meter(MeterName)
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

	SandboxCodeExecutionAttemptDuration, err = meter.Float64Histogram(
		"sandbox_code_execution_attempt_duration_seconds",
		metric.WithDescription("Duration of a single gRPC Execute attempt to the sandbox"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return err
	}

	SandboxLifecycleDuration, err = meter.Float64Histogram(
		"sandbox_lifecycle_duration_seconds",
		metric.WithDescription("Time for sandbox lifecycle operations handled by task-manager"),
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

	SandboxCodeExecutionAttemptsTotal, err = meter.Int64Counter(
		"sandbox_code_execution_attempts_total",
		metric.WithDescription("Total gRPC Execute attempts to the sandbox (one per try, including retries)"),
		metric.WithUnit("{attempt}"),
	)
	if err != nil {
		return err
	}

	SandboxConnectionStateTransitions, err = meter.Int64Counter(
		"sandbox_connection_state_transitions_total",
		metric.WithDescription("gRPC connection state transitions to sandbox (for correlating with connection loss)"),
		metric.WithUnit("{transition}"),
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

	SandboxPoolConfiguredSandboxes, err = meter.Int64Gauge(
		"sandbox_pool_configured_sandboxes",
		metric.WithDescription("Number of sandboxes configured for this task-manager worker pool"),
		metric.WithUnit("{sandbox}"),
	)
	if err != nil {
		return err
	}

	SandboxPoolEventsTotal, err = meter.Int64Counter(
		"sandbox_pool_events_total",
		metric.WithDescription("Sandbox pool lifecycle events (bounded event label)"),
		metric.WithUnit("{event}"),
	)
	if err != nil {
		return err
	}

	WorkerDegradedModeTransitions, err = meter.Int64Counter(
		"worker_degraded_mode_transitions_total",
		metric.WithDescription("Sandbox worker transitions into or out of degraded mode (plugins unavailable)"),
		metric.WithUnit("{transition}"),
	)
	if err != nil {
		return err
	}

	WorkerDegradedMode, err = meter.Int64ObservableGauge(
		"worker_degraded_mode",
		metric.WithDescription("Whether the sandbox worker is in degraded mode (1) or not (0); sum by fleet for autoscaling"),
		metric.WithUnit("{worker}"),
	)
	if err != nil {
		return err
	}

	WorkerRedisMessagesReadTotal, err = meter.Int64Counter(
		"worker_redis_messages_read_total",
		metric.WithDescription("Redis transport messages delivered per poll by read path"),
		metric.WithUnit("{message}"),
	)
	if err != nil {
		return err
	}

	WorkerRedisAckSkippedTotal, err = meter.Int64Counter(
		"worker_redis_ack_skipped_total",
		metric.WithDescription("Redis transport message handlers that skipped execution after ack"),
		metric.WithUnit("{message}"),
	)
	if err != nil {
		return err
	}

	WorkerRedisReadCacheSize, err = meter.Int64Gauge(
		"worker_redis_read_cache_size",
		metric.WithDescription("GroupReader overflow cache size after the latest poll"),
		metric.WithUnit("{message}"),
	)
	if err != nil {
		return err
	}

	SandboxPoolSandboxReadyDuration, err = meter.Float64Histogram(
		"sandbox_pool_sandbox_ready_duration_seconds",
		metric.WithDescription("Time from pool sandbox start until sandbox plugin reports ready"),
		metric.WithUnit("s"),
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
		"sandbox_code_execution_attempt_duration_seconds",
		"sandbox_lifecycle_duration_seconds",
		"sandbox_pool_sandbox_ready_duration_seconds",
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

// RecordPoolEvent increments sandbox_pool_events_total with bounded labels (event + connection_mode).
func RecordPoolEvent(ctx context.Context, event string, connectionMode string) {
	AddCounter(ctx, SandboxPoolEventsTotal,
		AttrPoolEvent.String(event),
		AttrPoolConnectionMode.String(connectionMode),
	)
}

// Degraded mode transition values for worker_degraded_mode_transitions_total (bounded cardinality).
const (
	DegradedModeTransitionEnter   = "enter"
	DegradedModeTransitionRecover = "recover"
)

// RecordWorkerDegradedModeTransition increments worker_degraded_mode_transitions_total.
func RecordWorkerDegradedModeTransition(ctx context.Context, transition string, workerID string, ephemeral bool) {
	AddCounter(ctx, WorkerDegradedModeTransitions,
		AttrEphemeral.Bool(ephemeral),
		AttrDegradedModeTransition.String(transition),
		AttrWorkerID.String(workerID),
	)
}

// RegisterWorkerDegradedModeCallback registers an observable callback that reports the current
// degraded-mode state (0 or 1) on each metric collection.
func RegisterWorkerDegradedModeCallback(
	meter metric.Meter,
	value func() int64,
	attrs func() []attribute.KeyValue,
) (metric.Registration, error) {
	if WorkerDegradedMode == nil {
		return nil, nil
	}
	return meter.RegisterCallback(func(_ context.Context, observer metric.Observer) error {
		observer.ObserveInt64(WorkerDegradedMode, value(), metric.WithAttributes(attrs()...))
		return nil
	}, WorkerDegradedMode)
}

// Redis message read source values for worker_redis_messages_read_total (bounded cardinality).
const (
	RedisMessageSourceCache      = "cache"
	RedisMessageSourceAutoClaim  = "autoclaim"
	RedisMessageSourceXReadGroup = "xreadgroup"
)

// Redis ack skip reason values for worker_redis_ack_skipped_total (bounded cardinality).
const (
	RedisAckSkipReasonAlreadyAcked = "already_acked"
	RedisAckSkipReasonError        = "error"
)

// RecordWorkerRedisReadStats records per-poll GroupReader delivery stats (typically from a ReadObserver).
func RecordWorkerRedisReadStats(ctx context.Context, fromCache, fromAutoClaim, fromXReadGroup, cacheSize int64, attrs ...attribute.KeyValue) {
	recordSourceCount := func(source string, count int64) {
		if count <= 0 || WorkerRedisMessagesReadTotal == nil {
			return
		}
		WorkerRedisMessagesReadTotal.Add(ctx, count, metric.WithAttributes(append(attrs, AttrRedisMessageSource.String(source))...))
	}
	recordSourceCount(RedisMessageSourceCache, fromCache)
	recordSourceCount(RedisMessageSourceAutoClaim, fromAutoClaim)
	recordSourceCount(RedisMessageSourceXReadGroup, fromXReadGroup)
	RecordGauge(ctx, WorkerRedisReadCacheSize, cacheSize, attrs...)
}

// RecordWorkerRedisAckSkipped increments worker_redis_ack_skipped_total.
func RecordWorkerRedisAckSkipped(ctx context.Context, reason string, attrs ...attribute.KeyValue) {
	AddCounter(ctx, WorkerRedisAckSkippedTotal, append(attrs, AttrRedisAckSkipReason.String(reason))...)
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

func (r *meterProviderRunnable) Close(_ context.Context) error {
	if r.mp != nil {
		// Use a dedicated context so the final flush completes even if
		// the run-group context is already cancelled.
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
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
	AttrConnectionStateFrom    = attribute.Key("from_state")
	AttrConnectionStateTo      = attribute.Key("to_state")
	AttrDegradedModeTransition = attribute.Key("transition") // enter | recover
	AttrEphemeral              = attribute.Key("ephemeral")
	AttrExecuteAttempts        = attribute.Key("execute_attempts")
	AttrFleet                  = attribute.Key("fleet")
	AttrLanguage               = attribute.Key("language")
	AttrPlugin                 = attribute.Key("plugin_name")
	AttrOperation              = attribute.Key("operation")
	AttrPoolConnectionMode     = attribute.Key("connection_mode") // static | dynamic
	AttrPoolEvent              = attribute.Key("event")
	AttrRedisAckSkipReason     = attribute.Key("reason")
	AttrRedisMessageSource     = attribute.Key("source") // cache | autoclaim | xreadgroup
	AttrResult                 = attribute.Key("result")
	AttrWarmStart              = attribute.Key("warm_start")
	AttrWorkerID               = attribute.Key("worker_id")
)

// Pool event values for sandbox_pool_events_total (bounded cardinality).
const (
	PoolEventPickNoReadySandbox            = "pick_no_ready_sandbox"
	PoolEventReplaceCreateFailed           = "replace_create_failed"
	PoolEventReplaceSkippedAlreadyReplaced = "replace_skipped_already_replaced"
	PoolEventReplaceSkippedNotFound        = "replace_skipped_not_found"
	PoolEventReplaceSkippedStatic          = "replace_skipped_static"
	PoolEventRetryReplaceFailed            = "retry_replace_failed"
)
