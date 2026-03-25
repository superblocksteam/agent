package executor

import (
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

// BuildPerformance converts transport-level performance data into the
// API-level Performance proto returned to clients.
//
// startMs/finishMs are the wall-clock start and end times in milliseconds
// (epoch). transportPerf carries the worker-reported timing observables
// (plugin execution, queue wait, KV store, etc.) in microseconds.
//
// The returned Performance includes:
//   - start, finish, total (ms)
//   - execution: plugin execution time (ms, from PluginExecution)
//   - overhead: total - execution (ms)
//   - custom: transport timing breakdown in milliseconds (queue_request_ms, etc.)
func BuildPerformance(startMs, finishMs int64, transportPerf *transportv1.Performance) *apiv1.Performance {
	if transportPerf == nil {
		return nil
	}

	perf := &apiv1.Performance{
		Start:  startMs,
		Finish: finishMs,
		Total:  finishMs - startMs,
	}

	if transportPerf.PluginExecution != nil {
		perf.Execution = int64(transportPerf.PluginExecution.Value) / 1000 // microseconds → milliseconds
		perf.Overhead = perf.Total - perf.Execution
		if perf.Overhead < 0 {
			perf.Overhead = 0
		}
	}

	// Surface transport-level timings via the custom map so clients
	// (load tests, diagnostics) can see dispatch/queue latency without
	// a proto change. Values are in milliseconds.
	custom := map[string]int64{}
	addTiming := func(name string, obs *transportv1.Performance_Observable) {
		if obs != nil && obs.Value > 0 {
			if ms := int64(obs.Value) / 1000; ms > 0 {
				custom[name] = ms
			}
		}
	}
	addTiming("queue_request_ms", transportPerf.QueueRequest)
	addTiming("queue_response_ms", transportPerf.QueueResponse)
	addTiming("kv_store_fetch_ms", transportPerf.KvStoreFetch)
	addTiming("kv_store_push_ms", transportPerf.KvStorePush)
	if len(custom) > 0 {
		perf.Custom = custom
	}

	return perf
}
