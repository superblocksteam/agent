package utils

import (
	"context"
	"sync"

	"github.com/superblocksteam/agent/internal/metrics"
	"go.opentelemetry.io/otel/attribute"
	"go.uber.org/zap"
)

// Engine name constants for binding resolution metrics.
const (
	EngineNameJavascript = "javascript"
	EngineNameWorker     = "sandbox_worker"
)

// bindingResolutionLogger is set by SetBindingResolutionLogger and used to log
// binding resolution failures. Guarded by bindingResolutionLoggerMu.
var (
	bindingResolutionLogger   *zap.Logger
	bindingResolutionLoggerMu sync.RWMutex
)

// SetBindingResolutionLogger sets the logger used to record binding resolution
// failures. Call from main after creating the app logger. When nil, failures
// are not logged (metrics are still recorded).
func SetBindingResolutionLogger(l *zap.Logger) {
	bindingResolutionLoggerMu.Lock()
	defer bindingResolutionLoggerMu.Unlock()
	bindingResolutionLogger = l
}

// RecordBindingResolution records the bindings_total metric with the given engine
// and result. Call this after each binding resolution completes (success or failure).
// engine identifies which engine performed the resolution (e.g. EngineNameJavascript,
// EngineNameWorker). When err is non-nil, logs at ERROR level if a logger was set.
//
// NOTE(frank): It's important that this util is in the internal package, because
// it relies on metrics that are registered in the internal package.
func RecordBindingResolution(engine string, err error) {
	ctx := context.Background()
	result := "succeeded"
	if err != nil {
		result = "failed"
	}
	metrics.AddCounter(ctx, metrics.BindingsTotal,
		attribute.String("engine", engine),
		attribute.String("result", result))

	if err != nil {
		bindingResolutionLoggerMu.RLock()
		l := bindingResolutionLogger
		bindingResolutionLoggerMu.RUnlock()
		if l != nil {
			l.Error("binding resolution failed", zap.String("engine", engine), zap.Error(err))
		}
	}
}

// EngineAfterFunc records bindings_total for the javascript engine. Use as the
// AfterFunc callback for pkg/engine/javascript.Sandbox.
func EngineAfterFunc(err error) {
	RecordBindingResolution(EngineNameJavascript, err)
}

// EngineAfterFuncWorker records bindings_total for the worker engine. Use as the
// AfterFunc callback for pkg/engine/worker.Sandbox.
func EngineAfterFuncWorker(err error) {
	RecordBindingResolution(EngineNameWorker, err)
}
