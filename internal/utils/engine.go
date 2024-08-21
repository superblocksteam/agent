package utils

import "github.com/superblocksteam/agent/internal/metrics"

// NOTE(frank): It's important that this util is in the internal package,
// because it relies on metrics that are registered in the internal package.
func EngineAfterFunc(err error) {
	if err != nil {
		metrics.BindingsTotal.WithLabelValues("failed").Inc()
	} else {
		metrics.BindingsTotal.WithLabelValues("succeeded").Inc()
	}
}
