package metrics

import (
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

func MergeIntoParentPerf(parent *transportv1.Performance, perf *transportv1.Performance) {
	if parent == nil || perf == nil {
		return
	}

	if perf.Error {
		parent.Error = true
	}

	parent.PluginExecution = MergeObservable(parent.PluginExecution, perf.PluginExecution)
	parent.QueueRequest = MergeObservable(parent.QueueRequest, perf.QueueRequest)
	parent.QueueResponse = MergeObservable(parent.QueueResponse, perf.QueueResponse)
	parent.KvStoreFetch = MergeObservable(parent.KvStoreFetch, perf.KvStoreFetch)
	parent.KvStorePush = MergeObservable(parent.KvStorePush, perf.KvStorePush)
	parent.Total = MergeObservable(parent.Total, perf.Total)
}

func MergeObservable(dest *transportv1.Performance_Observable, src *transportv1.Performance_Observable) *transportv1.Performance_Observable {
	if src == nil {
		return dest
	}

	result := dest
	if result == nil {
		result = &transportv1.Performance_Observable{}
	}

	if result.Start == 0 {
		result.Start = src.Start
	}
	if result.End == 0 {
		result.End = src.End
	}
	if result.Value == 0 {
		result.Value = src.Value
	}
	if result.Bytes == 0 {
		result.Bytes = src.Bytes
	}
	if result.Estimate == 0 {
		result.Estimate = src.Estimate
	}

	return result
}
