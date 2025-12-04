/**
 * Metrics definitions using OpenTelemetry SDK.
 *
 * Provides application metrics that are exported via both:
 * - Prometheus (pull-based) at /metrics endpoint
 * - OTLP (push-based) to configured collector
 */

package metrics

import (
	"context"
	"strings"
	"sync"
	"sync/atomic"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
)

// Shadow counters for metrics that need to be read programmatically.
// OTEL counters don't support reading values, so we maintain separate atomic counters.
var (
	apiExecutionEventsSucceededApi      atomic.Int64
	apiExecutionEventsFailedApi         atomic.Int64
	apiExecutionEventsSucceededWorkflow atomic.Int64
	apiExecutionEventsFailedWorkflow    atomic.Int64
)

// StepMetricLabels contains labels for step-related metrics.
type StepMetricLabels struct {
	PluginName  string
	Bucket      string
	PluginEvent string
	Result      string
	ApiType     string
}

// ToAttributes converts StepMetricLabels to OTEL attributes.
func (l *StepMetricLabels) ToAttributes() []attribute.KeyValue {
	return []attribute.KeyValue{
		attribute.String("plugin_name", l.PluginName),
		attribute.String("bucket", l.Bucket),
		attribute.String("plugin_event", l.PluginEvent),
		attribute.String("result", l.Result),
		attribute.String("api_type", l.ApiType),
	}
}

// Global OTEL metric instruments.
var (
	// Counters
	BlocksTotal                metric.Int64Counter
	BlocksLoopForeverTotal     metric.Int64Counter
	BlocksLoopIterationsTotal  metric.Int64Counter
	BlocksParallelPathsTotal   metric.Int64Counter
	BlocksStreamEventsTotal    metric.Int64Counter
	VariablesTotal             metric.Int64Counter
	KafkaConsumedMessagesTotal metric.Int64Counter
	BindingsTotal              metric.Int64Counter
	ApiExecutionEventsTotal    metric.Int64Counter
	ApiFetchRequestsTotal      metric.Int64Counter
	TransportErrorsTotal       metric.Int64Counter
	QuotaErrorsTotal           metric.Int64Counter
	TrackedErrorsTotal         metric.Int64Counter
	SecretsCacheLookupsTotal   metric.Int64Counter
	IntegrationErrorsTotal     metric.Int64Counter

	// UpDownCounters (for values that can increase or decrease)
	StreamBufferCapacityTotal metric.Int64UpDownCounter
	StreamBufferItemsTotal    metric.Int64UpDownCounter

	// Gauges (synchronous gauges for "last value" semantics)
	ComputeUnitsRemainingMillisTotal metric.Int64Gauge
	ComputeUnitsPerWeekMillisTotal   metric.Int64Gauge

	// Histograms
	StepEstimateErrorPercentage metric.Float64Histogram
	StepOverhead                metric.Float64Histogram
	PluginExecutionDuration     metric.Float64Histogram
	QueueRequestDuration        metric.Float64Histogram
	QueueResponseDuration       metric.Float64Histogram
	KvStoreFetchDuration        metric.Float64Histogram
	KvStorePushDuration         metric.Float64Histogram
	KvStorePushSize             metric.Float64Histogram
	TotalDuration               metric.Float64Histogram

	mutex     = &sync.RWMutex{}
	initiated = false
)

// ResetForTesting resets the metrics state for testing purposes.
// This should only be used in tests.
func ResetForTesting() {
	mutex.Lock()
	defer mutex.Unlock()
	initiated = false

	// Reset shadow counters
	apiExecutionEventsSucceededApi.Store(0)
	apiExecutionEventsFailedApi.Store(0)
	apiExecutionEventsSucceededWorkflow.Store(0)
	apiExecutionEventsFailedWorkflow.Store(0)
}

// SetupForTesting initializes metrics with a no-op meter provider for testing.
// Returns a cleanup function that should be deferred.
// This should only be used in tests.
func SetupForTesting() func() {
	mutex.Lock()
	defer mutex.Unlock()

	// Reset shadow counters
	apiExecutionEventsSucceededApi.Store(0)
	apiExecutionEventsFailedApi.Store(0)
	apiExecutionEventsSucceededWorkflow.Store(0)
	apiExecutionEventsFailedWorkflow.Store(0)

	// Register metrics with nil instruments - the helper functions handle nil gracefully
	initiated = true

	return func() {
		ResetForTesting()
	}
}

// RegisterMetrics initializes all OTEL metric instruments from the provided meter.
func RegisterMetrics(meter metric.Meter) error {
	mutex.Lock()
	defer mutex.Unlock()
	if initiated {
		return nil
	}

	var err error

	// Counters
	BlocksTotal, err = meter.Int64Counter(
		"api_blocks_total",
		metric.WithDescription("The total number of blocks visited."),
	)
	if err != nil {
		return err
	}

	BlocksLoopForeverTotal, err = meter.Int64Counter(
		"api_blocks_loop_forever_total",
		metric.WithDescription("The total number of forever loops executed."),
	)
	if err != nil {
		return err
	}

	BlocksLoopIterationsTotal, err = meter.Int64Counter(
		"api_blocks_loop_iterations_total",
		metric.WithDescription("The total number of loop iterations executed."),
	)
	if err != nil {
		return err
	}

	BlocksParallelPathsTotal, err = meter.Int64Counter(
		"api_blocks_parallel_paths_total",
		metric.WithDescription("The total number of parallel paths executed."),
	)
	if err != nil {
		return err
	}

	BlocksStreamEventsTotal, err = meter.Int64Counter(
		"api_blocks_stream_events_total",
		metric.WithDescription("The total number of stream events that have been received."),
	)
	if err != nil {
		return err
	}

	VariablesTotal, err = meter.Int64Counter(
		"api_variables_total",
		metric.WithDescription("The total number of variables instantiated."),
	)
	if err != nil {
		return err
	}

	KafkaConsumedMessagesTotal, err = meter.Int64Counter(
		"kafka_consumed_messages_total",
		metric.WithDescription("The total number of Kafka messages consumed."),
	)
	if err != nil {
		return err
	}

	BindingsTotal, err = meter.Int64Counter(
		"bindings_total",
		metric.WithDescription("The total number of bindings executed."),
	)
	if err != nil {
		return err
	}

	ApiExecutionEventsTotal, err = meter.Int64Counter(
		"api_execution_events_total",
		metric.WithDescription("The total number of api execution events."),
	)
	if err != nil {
		return err
	}

	ApiFetchRequestsTotal, err = meter.Int64Counter(
		"api_fetch_requests_total",
		metric.WithDescription("The total number of api fetch requests."),
	)
	if err != nil {
		return err
	}

	TransportErrorsTotal, err = meter.Int64Counter(
		"api_transport_errors_total",
		metric.WithDescription("The total number of errors caught by the transport middleware."),
	)
	if err != nil {
		return err
	}

	QuotaErrorsTotal, err = meter.Int64Counter(
		"quota_errors_total",
		metric.WithDescription("The total number of quota errors caught."),
	)
	if err != nil {
		return err
	}

	TrackedErrorsTotal, err = meter.Int64Counter(
		"tracked_errors_total",
		metric.WithDescription("The total number of errors that we are specifically tracking."),
	)
	if err != nil {
		return err
	}

	SecretsCacheLookupsTotal, err = meter.Int64Counter(
		"secrets_cache_lookups_total",
		metric.WithDescription("The total number of cache lookups."),
	)
	if err != nil {
		return err
	}

	IntegrationErrorsTotal, err = meter.Int64Counter(
		"integration_errors_total",
		metric.WithDescription("The total number of integration errors."),
	)
	if err != nil {
		return err
	}

	// Gauges (UpDownCounter in OTEL)
	StreamBufferCapacityTotal, err = meter.Int64UpDownCounter(
		"stream_buffer_capacity_total",
		metric.WithDescription("The number of items the buffer can hold before it blocks."),
	)
	if err != nil {
		return err
	}

	StreamBufferItemsTotal, err = meter.Int64UpDownCounter(
		"stream_buffer_items_total",
		metric.WithDescription("The current number of items in the buffer."),
	)
	if err != nil {
		return err
	}

	// Synchronous Gauges (for "last value" semantics)
	ComputeUnitsRemainingMillisTotal, err = meter.Int64Gauge(
		"compute_units_remaining_milliseconds_total",
		metric.WithDescription("The total number of compute units allocated left this week."),
	)
	if err != nil {
		return err
	}

	ComputeUnitsPerWeekMillisTotal, err = meter.Int64Gauge(
		"compute_units_per_week_milliseconds_total",
		metric.WithDescription("The total number of compute units per week."),
	)
	if err != nil {
		return err
	}

	// Histograms
	StepEstimateErrorPercentage, err = meter.Float64Histogram(
		"superblocks_step_estimate_error_percentage",
		metric.WithDescription("Percentages of how wrong we were with our estimates"),
	)
	if err != nil {
		return err
	}

	StepOverhead, err = meter.Float64Histogram(
		"superblocks_step_overhead_microseconds",
		metric.WithDescription("The raw overhead of a step"),
	)
	if err != nil {
		return err
	}

	PluginExecutionDuration, err = meter.Float64Histogram(
		"superblocks_step_plugin_duration_microseconds",
		metric.WithDescription("The duration of plugin execution"),
	)
	if err != nil {
		return err
	}

	QueueRequestDuration, err = meter.Float64Histogram(
		"superblocks_step_queue_request_duration_microseconds",
		metric.WithDescription("The duration of the request in the queue including network i/o"),
	)
	if err != nil {
		return err
	}

	QueueResponseDuration, err = meter.Float64Histogram(
		"superblocks_step_queue_response_duration_microseconds",
		metric.WithDescription("The duration of the response in the queue including network i/o"),
	)
	if err != nil {
		return err
	}

	KvStoreFetchDuration, err = meter.Float64Histogram(
		"superblocks_step_kv_fetch_duration_microseconds",
		metric.WithDescription("The time it takes to fetch any referenced bindings"),
	)
	if err != nil {
		return err
	}

	KvStorePushDuration, err = meter.Float64Histogram(
		"superblocks_step_kv_push_duration_microseconds",
		metric.WithDescription("The time it takes to write the output of this step"),
	)
	if err != nil {
		return err
	}

	KvStorePushSize, err = meter.Float64Histogram(
		"superblocks_step_kv_push_size_bytes",
		metric.WithDescription("How much data is written to the kv store"),
	)
	if err != nil {
		return err
	}

	TotalDuration, err = meter.Float64Histogram(
		"superblocks_step_total_duration_microseconds",
		metric.WithDescription("The total time for a step"),
	)
	if err != nil {
		return err
	}

	initiated = true
	return nil
}

// MetricLabel sanitizes a raw string for use as a metric label value.
func MetricLabel(raw string) string {
	return strings.TrimSuffix(strings.ReplaceAll(strings.ToLower(raw), " ", "_"), ".")
}

// Helper functions for recording metrics with attributes.

// AddCounter increments a counter by 1 with the given attributes.
func AddCounter(ctx context.Context, counter metric.Int64Counter, attrs ...attribute.KeyValue) {
	if counter != nil {
		counter.Add(ctx, 1, metric.WithAttributes(attrs...))
	}
}

// AddCounterN increments a counter by n with the given attributes.
func AddCounterN(ctx context.Context, counter metric.Int64Counter, n int64, attrs ...attribute.KeyValue) {
	if counter != nil {
		counter.Add(ctx, n, metric.WithAttributes(attrs...))
	}
}

// AddUpDownCounter adds a value to an UpDownCounter with the given attributes.
// Use for values that increment/decrement over time (e.g., active connections).
func AddUpDownCounter(ctx context.Context, counter metric.Int64UpDownCounter, value int64, attrs ...attribute.KeyValue) {
	if counter != nil {
		counter.Add(ctx, value, metric.WithAttributes(attrs...))
	}
}

// RecordHistogram records a histogram observation with the given attributes.
func RecordHistogram(ctx context.Context, hist metric.Float64Histogram, value float64, attrs ...attribute.KeyValue) {
	if hist != nil && value > 0 {
		hist.Record(ctx, value, metric.WithAttributes(attrs...))
	}
}

// RecordGauge records a gauge value with the given attributes.
// This uses synchronous gauge semantics (records current value).
func RecordGauge(ctx context.Context, gauge metric.Int64Gauge, value int64, attrs ...attribute.KeyValue) {
	if gauge != nil {
		gauge.Record(ctx, value, metric.WithAttributes(attrs...))
	}
}

// AddApiExecutionEvent increments the ApiExecutionEventsTotal counter and shadow counter.
// eventType should be "started", "succeeded", or "failed".
// apiType should be "api" or "workflow".
func AddApiExecutionEvent(ctx context.Context, eventType, apiType string) {
	AddCounter(ctx, ApiExecutionEventsTotal,
		attribute.String("event", eventType),
		attribute.String("type", apiType),
	)

	// Update shadow counters for metrics that need to be read
	if eventType == "succeeded" && apiType == "api" {
		apiExecutionEventsSucceededApi.Add(1)
	} else if eventType == "failed" && apiType == "api" {
		apiExecutionEventsFailedApi.Add(1)
	} else if eventType == "succeeded" && apiType == "workflow" {
		apiExecutionEventsSucceededWorkflow.Add(1)
	} else if eventType == "failed" && apiType == "workflow" {
		apiExecutionEventsFailedWorkflow.Add(1)
	}
}

// GetApiExecutionEventCount returns the count for a specific event/type combination.
// This reads from shadow counters since OTEL counters don't support reading values.
func GetApiExecutionEventCount(eventType, apiType string) float64 {
	if eventType == "succeeded" && apiType == "api" {
		return float64(apiExecutionEventsSucceededApi.Load())
	} else if eventType == "failed" && apiType == "api" {
		return float64(apiExecutionEventsFailedApi.Load())
	} else if eventType == "succeeded" && apiType == "workflow" {
		return float64(apiExecutionEventsSucceededWorkflow.Load())
	} else if eventType == "failed" && apiType == "workflow" {
		return float64(apiExecutionEventsFailedWorkflow.Load())
	}
	return 0
}
