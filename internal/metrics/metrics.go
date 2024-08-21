package metrics

import (
	"strings"
	"sync"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	dto "github.com/prometheus/client_model/go"
)

type StepMetricLabels struct {
	PluginName  string
	Bucket      string
	PluginEvent string
	Result      string
	ApiType     string
}

var (
	bigBuckets = []float64{
		10000, 12000, 15000, 20000, 30000, 40000, 60000, 100000, 150000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000, 3000000,
		4000000, 5000000, 7000000, 10000000, 20000000, 30000000, 60000000, 80000000, 100000000, 120000000, 600000000,
	}

	smallBuckets = []float64{
		1000, 2000, 3000, 4000, 6000, 8000, 10000, 15000, 20000, 50000, 100000, 200000, 400000, 600000, 800000, 1000000, 1500000, 2000000,
		3000000, 4000000, 5000000, 7000000, 10000000, 20000000,
	}

	sizeBuckets = []float64{
		5000, 10000, 15000, 50000, 100000, 200000, 300000, 400000, 500000, 600000, 800000, 1000000, 2000000, 4000000, 6000000, 10000000, 15000000,
		20000000, 50000000, 100000000, 500000000,
	}

	percentageBuckets = []float64{5, 7, 10, 15, 20, 25, 32, 40, 50, 60, 75, 100, 150, 200, 250, 400}

	stepMetricLabelsSlice []string = []string{"plugin_name", "bucket", "plugin_event", "result", "api_type"}

	BlocksTotal                      *prometheus.CounterVec
	BlocksLoopForeverTotal           *prometheus.CounterVec
	BlocksLoopIterationsTotal        *prometheus.CounterVec
	BlocksParallelPathsTotal         *prometheus.CounterVec
	BlocksStreamEventsTotal          *prometheus.CounterVec
	VariablesTotal                   *prometheus.CounterVec
	StreamBufferCapacityTotal        *prometheus.GaugeVec
	StreamBufferItemsTotal           *prometheus.GaugeVec
	StepEstimateErrorPercentage      *prometheus.HistogramVec
	StepOverhead                     *prometheus.HistogramVec
	PluginExecutionDuration          *prometheus.HistogramVec
	QueueRequestDuration             *prometheus.HistogramVec
	QueueResponseDuration            *prometheus.HistogramVec
	KvStoreFetchDuration             *prometheus.HistogramVec
	KvStorePushDuration              *prometheus.HistogramVec
	KvStorePushSize                  *prometheus.HistogramVec
	TotalDuration                    *prometheus.HistogramVec
	KafkaConsumedMessagesTotal       *prometheus.CounterVec
	BindingsTotal                    *prometheus.CounterVec
	ComputeUnitsRemainingMillisTotal *prometheus.GaugeVec
	ComputeUnitsPerWeekMillisTotal   *prometheus.GaugeVec
	// NOTE(frank): We're not using a guage here because we want to derive
	// a few piecies of info from this metric.
	ApiExecutionEventsTotal  *prometheus.CounterVec
	ApiFetchRequestsTotal    *prometheus.CounterVec
	TransportErrorsTotal     *prometheus.CounterVec
	QuotaErrorsTotal         *prometheus.CounterVec
	TrackedErrorsTotal       *prometheus.CounterVec
	SecretsCacheLookupsTotal *prometheus.CounterVec
	IntegrationErrorsTotal   *prometheus.CounterVec

	mutex     = &sync.RWMutex{}
	initiated = false
)

func RegisterMetrics() {
	mutex.Lock()
	defer mutex.Unlock()
	if !initiated {

		initiated = true
		BlocksTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "api_blocks_total",
				Help: "The total number of blocks visited.",
			},
			[]string{"block_type", "organization_id"},
		)
		BlocksLoopForeverTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "api_blocks_loop_forever_total",
				Help: "The total number of forever loops executed.",
			},
			[]string{},
		)
		BlocksLoopIterationsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "api_blocks_loop_iterations_total",
				Help: "The total number of loop iterations executed.",
			},
			[]string{"type"},
		)
		BlocksParallelPathsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "api_blocks_parallel_paths_total",
				Help: "The total number of parallel paths executed.",
			},
			[]string{"type", "wait"},
		)
		BlocksStreamEventsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "api_blocks_stream_events_total",
				Help: "The total number of stream events that have been received.",
			},
			[]string{},
		)
		VariablesTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "api_variables_total",
				Help: "The total number of variables instantiated.",
			},
			[]string{"type"},
		)
		StreamBufferCapacityTotal = promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "stream_buffer_capacity_total",
				Help: "The number of items the buffer can hold before it blocks.",
			},
			[]string{},
		)
		StreamBufferItemsTotal = promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "stream_buffer_items_total",
				Help: "The current number of items in the buffer.",
			},
			[]string{},
		)
		StepEstimateErrorPercentage = promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "superblocks_step_estimate_error_percentage",
				Help:    "Percentages of how wrong we were with our estimates",
				Buckets: percentageBuckets,
			},
			stepMetricLabelsSlice,
		)
		StepOverhead = promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "superblocks_step_overhead_microseconds",
				Help:    "The raw overhead of a step",
				Buckets: bigBuckets,
			},
			stepMetricLabelsSlice,
		)
		PluginExecutionDuration = promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "superblocks_step_plugin_duration_microseconds",
				Help:    "The duration of plugin execution",
				Buckets: bigBuckets,
			},
			stepMetricLabelsSlice,
		)
		QueueRequestDuration = promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "superblocks_step_queue_request_duration_microseconds",
				Help:    "The duration of the request in the queue including network i/o",
				Buckets: smallBuckets,
			},
			stepMetricLabelsSlice,
		)
		QueueResponseDuration = promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "superblocks_step_queue_response_duration_microseconds",
				Help:    "The duration of the response in the queue including network i/o",
				Buckets: smallBuckets,
			},
			stepMetricLabelsSlice,
		)
		KvStoreFetchDuration = promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "superblocks_step_kv_fetch_duration_microseconds",
				Help:    "The time it takes to fetch any referenced bindings",
				Buckets: smallBuckets,
			},
			stepMetricLabelsSlice,
		)
		KvStorePushDuration = promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "superblocks_step_kv_push_duration_microseconds",
				Help:    "The time it takes to write the output of this step",
				Buckets: smallBuckets,
			},
			stepMetricLabelsSlice,
		)
		KvStorePushSize = promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "superblocks_step_kv_push_size_bytes",
				Help:    "How much data is written to the kv store",
				Buckets: sizeBuckets,
			},
			stepMetricLabelsSlice,
		)
		TotalDuration = promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "superblocks_step_total_duration_microseconds",
				Help:    "The time it takes to write the output of this step",
				Buckets: bigBuckets,
			},
			stepMetricLabelsSlice,
		)
		KafkaConsumedMessagesTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "kafka_consumed_messages_total",
				Help: "The total number of Kafka messages consumed.",
			},
			[]string{"result", "topic"},
		)
		BindingsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "bindings_total",
				Help: "The total number of bindings executed.",
			},
			[]string{"result"},
		)
		ComputeUnitsRemainingMillisTotal = promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "compute_units_remaining_milliseconds_total",
				Help: "The total number of compute units allocated left this week.",
			},
			[]string{"organization_id", "tier"},
		)
		ComputeUnitsPerWeekMillisTotal = promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "compute_units_per_week_milliseconds_total",
				Help: "The total number of compute units per week.",
			},
			[]string{"organization_id", "tier"},
		)
		// NOTE(frank): We're not using a guage here because we want to derive
		// a few piecies of info from this metric.
		ApiExecutionEventsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "api_execution_events_total",
				Help: "The total number of api execution events.",
			},
			[]string{"event", "type"},
		)
		ApiFetchRequestsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "api_fetch_requests_total",
				Help: "The total number of api fetch reqeusts.",
			},
			[]string{"result"},
		)
		TransportErrorsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "api_transport_errors_total",
				Help: "The total number of errors caught by the transport middleware.",
			},
			[]string{"code"},
		)
		QuotaErrorsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "quota_errors_total",
				Help: "The total number of quota errors caught.",
			},
			[]string{"quota", "organization_id", "organization_name", "tier"},
		)
		TrackedErrorsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "tracked_errors_total",
				Help: "The total number of errors that we are specifically tracking.",
			},
			[]string{"code"},
		)
		SecretsCacheLookupsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "secrets_cache_lookups_total",
				Help: "The total number of cache lookups.",
			},
			[]string{"result"},
		)
		IntegrationErrorsTotal = promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "integration_errors_total",
				Help: "The total number of integration errors.",
			},
			[]string{"plugin_name", "code"},
		)
	}
}

func GetCounterValue(metric *prometheus.CounterVec, labels []string) float64 {
	var m = &dto.Metric{}
	if err := metric.WithLabelValues(labels...).Write(m); err != nil {
		return 0
	}
	return m.Counter.GetValue()
}

func MetricLabel(raw string) string {
	return strings.TrimSuffix(strings.ReplaceAll(strings.ToLower(raw), " ", "_"), ".")
}

func init() {
	// we could init them like we do in `metrics/reconciler` but
	// I don't care if they're undefined until they're hit
}
