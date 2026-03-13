package telemetry

import (
	"context"
	"errors"
	"sync/atomic"
	"time"

	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

type DropReason string

const (
	DropReasonExportFailed DropReason = "export_failed"
	DropReasonQueueFull    DropReason = "queue_full"
	DropReasonTimeout      DropReason = "timeout"
)

type ResilientExporterConfig struct {
	Delegate      sdktrace.SpanExporter
	MaxQueueSize  int
	ExportTimeout time.Duration
	OnDrop        func(count int, reason DropReason)
}

type ResilientExporterMetrics struct {
	Dropped  uint64
	Failures uint64
	Queued   int64
}

type ResilientExporter struct {
	delegate      sdktrace.SpanExporter
	exportTimeout time.Duration
	maxQueueSize  int64
	onDrop        func(count int, reason DropReason)

	queued   atomic.Int64
	dropped  atomic.Uint64
	failures atomic.Uint64
	shutting atomic.Bool
}

func NewResilientExporter(cfg ResilientExporterConfig) *ResilientExporter {
	maxQueueSize := cfg.MaxQueueSize
	if maxQueueSize <= 0 {
		maxQueueSize = 2048
	}
	exportTimeout := cfg.ExportTimeout
	if exportTimeout <= 0 {
		exportTimeout = 30 * time.Second
	}
	onDrop := cfg.OnDrop
	if onDrop == nil {
		onDrop = func(int, DropReason) {}
	}

	return &ResilientExporter{
		delegate:      cfg.Delegate,
		exportTimeout: exportTimeout,
		maxQueueSize:  int64(maxQueueSize),
		onDrop:        onDrop,
	}
}

func (r *ResilientExporter) ExportSpans(ctx context.Context, spans []sdktrace.ReadOnlySpan) (retErr error) {
	if len(spans) == 0 || r.shutting.Load() {
		return nil
	}

	n := int64(len(spans))
	if r.queued.Add(n) > r.maxQueueSize {
		r.queued.Add(-n)
		r.dropped.Add(uint64(len(spans)))
		r.onDrop(len(spans), DropReasonQueueFull)
		return nil
	}
	defer r.queued.Add(-n)

	defer func() {
		if recovered := recover(); recovered != nil {
			r.failures.Add(1)
			r.dropped.Add(uint64(len(spans)))
			r.onDrop(len(spans), DropReasonExportFailed)
			retErr = nil
		}
	}()

	exportCtx := ctx
	cancel := func() {}
	if _, ok := ctx.Deadline(); !ok {
		exportCtx, cancel = context.WithTimeout(ctx, r.exportTimeout)
	}
	defer cancel()

	err := r.delegate.ExportSpans(exportCtx, spans)
	if err == nil {
		return nil
	}

	reason := DropReasonExportFailed
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(exportCtx.Err(), context.DeadlineExceeded) {
		reason = DropReasonTimeout
	}

	r.failures.Add(1)
	r.dropped.Add(uint64(len(spans)))
	r.onDrop(len(spans), reason)
	return nil
}

func (r *ResilientExporter) Shutdown(ctx context.Context) error {
	if r.shutting.Swap(true) {
		return nil
	}
	return r.delegate.Shutdown(ctx)
}

func (r *ResilientExporter) ForceFlush(ctx context.Context) error {
	type forceFlusher interface {
		ForceFlush(context.Context) error
	}
	flusher, ok := r.delegate.(forceFlusher)
	if !ok {
		return nil
	}
	return flusher.ForceFlush(ctx)
}

func (r *ResilientExporter) GetMetrics() ResilientExporterMetrics {
	return ResilientExporterMetrics{
		Dropped:  r.dropped.Load(),
		Failures: r.failures.Load(),
		Queued:   r.queued.Load(),
	}
}

func (r *ResilientExporter) ResetMetrics() {
	r.dropped.Store(0)
	r.failures.Store(0)
}
