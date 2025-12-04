package metrics

import (
	"context"
	"math"
	"time"

	"github.com/superblocksteam/agent/internal/metrics"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.opentelemetry.io/otel/metric"
)

// Observe records performance metrics for a step execution.
// TODO(frank): Both `queueRequestStartMicro` and `pluginExecutionEstimateMicro` need to be pulled from `perf`.
func Observe(
	ctx context.Context,
	perf *transportv1.Performance,
	queueRequestStartMicro int64,
	pluginExecutionEstimateMicro int64,
	labels *metrics.StepMetricLabels,
) {
	if perf.GetError() {
		labels.Result = "failed"
	} else {
		labels.Result = "succeeded"
	}

	queueResponseEndMicro := time.Now().UnixNano() / 1000

	observations := observe(perf, queueRequestStartMicro, queueResponseEndMicro, pluginExecutionEstimateMicro)
	attrs := labels.ToAttributes()

	for hist, val := range observations {
		metrics.RecordHistogram(ctx, hist, val, attrs...)
	}
}

func observe(
	perf *transportv1.Performance,
	queueRequestStartMicro int64,
	queueResponseEndMicro int64,
	pluginExecutionEstimateMicro int64,
) map[metric.Float64Histogram]float64 {
	if perf.GetQueueRequest() != nil {
		perf.GetQueueRequest().Start = float64(queueRequestStartMicro)
	}

	if perf.GetQueueResponse() != nil {
		perf.GetQueueResponse().End = float64(queueResponseEndMicro)
	}

	CalculateElapsed(perf)

	pluginExecutionMicro := perf.GetPluginExecution().GetValue()
	queueRequestMicro := perf.GetQueueRequest().GetValue()
	queueResponseMicro := perf.GetQueueResponse().GetValue()
	kvStoreFetchMicro := perf.GetKvStoreFetch().GetValue()
	kvStorePushMicro := perf.GetKvStorePush().GetValue()
	kvStorePushBytes := perf.GetKvStorePush().GetBytes()
	totalMicro := perf.GetTotal().GetValue()
	overheadMicro := 0.0
	estimateErrorPercentage := 0.0

	if pluginExecutionMicro > 0 && totalMicro-pluginExecutionMicro > 0 {
		overheadMicro = totalMicro - pluginExecutionMicro
	}

	if pluginExecutionEstimateMicro > 0 && pluginExecutionMicro > 0 {
		estimateErrorPercentage = (math.Abs(pluginExecutionMicro-float64(pluginExecutionEstimateMicro)) / pluginExecutionMicro) * 100
	}

	return map[metric.Float64Histogram]float64{
		metrics.PluginExecutionDuration:     pluginExecutionMicro,
		metrics.QueueRequestDuration:        queueRequestMicro,
		metrics.QueueResponseDuration:       queueResponseMicro,
		metrics.KvStoreFetchDuration:        kvStoreFetchMicro,
		metrics.KvStorePushDuration:         kvStorePushMicro,
		metrics.KvStorePushSize:             kvStorePushBytes,
		metrics.TotalDuration:               totalMicro,
		metrics.StepOverhead:                overheadMicro,
		metrics.StepEstimateErrorPercentage: estimateErrorPercentage,
	}
}

func CalculateElapsed(perf *transportv1.Performance) {
	if perf == nil {
		return
	}

	total := int64(0)

	for _, observable := range []*transportv1.Performance_Observable{
		perf.GetPluginExecution(),
		perf.GetQueueRequest(),
		perf.GetQueueResponse(),
		perf.GetKvStoreFetch(),
		perf.GetKvStorePush(),
		perf.GetTotal(),
	} {
		if observable != nil && observable.Value == 0 && observable.Start > 0 && observable.End > 0 {
			observable.Value = observable.End - observable.Start
		}

		if observable != nil && observable.Value > 0 {
			total += int64(observable.Value)
		}
	}

	if perf.GetTotal().GetValue() == 0 {
		perf.Total = &transportv1.Performance_Observable{Value: float64(total)}
	}
}
