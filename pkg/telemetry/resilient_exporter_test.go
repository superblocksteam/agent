package telemetry

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

type mockSpanExporter struct {
	delay     time.Duration
	forceErr  error
	exportErr error
	calls     atomic.Int64
}

func (m *mockSpanExporter) ExportSpans(ctx context.Context, _ []sdktrace.ReadOnlySpan) error {
	m.calls.Add(1)
	if m.delay > 0 {
		select {
		case <-time.After(m.delay):
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return m.exportErr
}

func (m *mockSpanExporter) Shutdown(context.Context) error { return nil }

func (m *mockSpanExporter) ForceFlush(context.Context) error { return m.forceErr }

func TestResilientExporterSuccessfulExport(t *testing.T) {
	delegate := &mockSpanExporter{}
	exporter := NewResilientExporter(ResilientExporterConfig{Delegate: delegate})

	err := exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil})
	require.NoError(t, err)

	metrics := exporter.GetMetrics()
	assert.Equal(t, uint64(0), metrics.Dropped)
	assert.Equal(t, uint64(0), metrics.Failures)
	assert.Equal(t, int64(0), metrics.Queued)
}

func TestResilientExporterDelegateFailureIsSwallowed(t *testing.T) {
	delegate := &mockSpanExporter{exportErr: errors.New("boom")}
	var drops int64
	exporter := NewResilientExporter(ResilientExporterConfig{
		Delegate: delegate,
		OnDrop: func(count int, reason DropReason) {
			if reason == DropReasonExportFailed {
				atomic.AddInt64(&drops, int64(count))
			}
		},
	})

	err := exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil})
	require.NoError(t, err)
	assert.Equal(t, int64(1), atomic.LoadInt64(&drops))

	metrics := exporter.GetMetrics()
	assert.Equal(t, uint64(1), metrics.Dropped)
	assert.Equal(t, uint64(1), metrics.Failures)
}

func TestResilientExporterQueueFullDrops(t *testing.T) {
	delegate := &mockSpanExporter{delay: 100 * time.Millisecond}
	var dropped int64
	exporter := NewResilientExporter(ResilientExporterConfig{
		Delegate:     delegate,
		MaxQueueSize: 1,
		OnDrop: func(count int, reason DropReason) {
			if reason == DropReasonQueueFull {
				atomic.AddInt64(&dropped, int64(count))
			}
		},
	})

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		_ = exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil})
	}()
	time.Sleep(10 * time.Millisecond)

	err := exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil})
	require.NoError(t, err)
	wg.Wait()

	assert.Equal(t, int64(1), atomic.LoadInt64(&dropped))
}

func TestResilientExporterTimeout(t *testing.T) {
	delegate := &mockSpanExporter{delay: 200 * time.Millisecond}
	var timedOut int64
	exporter := NewResilientExporter(ResilientExporterConfig{
		Delegate:      delegate,
		ExportTimeout: 20 * time.Millisecond,
		OnDrop: func(count int, reason DropReason) {
			if reason == DropReasonTimeout {
				atomic.AddInt64(&timedOut, int64(count))
			}
		},
	})

	err := exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil})
	require.NoError(t, err)
	assert.Equal(t, int64(1), atomic.LoadInt64(&timedOut))
}

func TestResilientExporterShutdownStopsNewExports(t *testing.T) {
	delegate := &mockSpanExporter{}
	exporter := NewResilientExporter(ResilientExporterConfig{Delegate: delegate})

	require.NoError(t, exporter.Shutdown(context.Background()))
	require.NoError(t, exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil}))

	assert.Equal(t, int64(0), delegate.calls.Load())
}

func TestResilientExporterForceFlush(t *testing.T) {
	delegate := &mockSpanExporter{forceErr: errors.New("flush failed")}
	exporter := NewResilientExporter(ResilientExporterConfig{Delegate: delegate})

	err := exporter.ForceFlush(context.Background())
	require.Error(t, err)
}

type panicExporter struct{}

func (p *panicExporter) ExportSpans(context.Context, []sdktrace.ReadOnlySpan) error {
	panic("deliberate panic in ExportSpans")
}

func (p *panicExporter) Shutdown(context.Context) error { return nil }

func TestResilientExporterPanicRecovery(t *testing.T) {
	var drops int64
	exporter := NewResilientExporter(ResilientExporterConfig{
		Delegate: &panicExporter{},
		OnDrop: func(count int, reason DropReason) {
			atomic.AddInt64(&drops, int64(count))
		},
	})

	// Should not panic.
	err := exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil})
	require.NoError(t, err)

	metrics := exporter.GetMetrics()
	assert.Equal(t, uint64(1), metrics.Failures)
	assert.Equal(t, uint64(1), metrics.Dropped)
	assert.Equal(t, int64(1), atomic.LoadInt64(&drops))
}

func TestResilientExporterContextWithExistingDeadline(t *testing.T) {
	deadline := time.Now().Add(5 * time.Second)
	ctx, cancel := context.WithDeadline(context.Background(), deadline)
	defer cancel()

	var seenDeadline time.Time
	delegate := &mockSpanExporter{}
	// Wrap with a custom exporter that captures the context deadline.
	capturingDelegate := &deadlineCaptureExporter{delegate: delegate, captured: &seenDeadline}
	exporter := NewResilientExporter(ResilientExporterConfig{
		Delegate:      capturingDelegate,
		ExportTimeout: 30 * time.Second,
	})

	err := exporter.ExportSpans(ctx, []sdktrace.ReadOnlySpan{nil})
	require.NoError(t, err)
	// The original deadline should be preserved (not replaced by ExportTimeout).
	assert.WithinDuration(t, deadline, seenDeadline, time.Second)
}

type deadlineCaptureExporter struct {
	delegate *mockSpanExporter
	captured *time.Time
}

func (d *deadlineCaptureExporter) ExportSpans(ctx context.Context, spans []sdktrace.ReadOnlySpan) error {
	if dl, ok := ctx.Deadline(); ok {
		*d.captured = dl
	}
	return d.delegate.ExportSpans(ctx, spans)
}

func (d *deadlineCaptureExporter) Shutdown(ctx context.Context) error {
	return d.delegate.Shutdown(ctx)
}

func TestResilientExporterEmptySpans(t *testing.T) {
	delegate := &mockSpanExporter{}
	exporter := NewResilientExporter(ResilientExporterConfig{Delegate: delegate})

	err := exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{})
	require.NoError(t, err)
	assert.Equal(t, int64(0), delegate.calls.Load())
}

func TestResilientExporterResetMetrics(t *testing.T) {
	delegate := &mockSpanExporter{exportErr: errors.New("fail")}
	exporter := NewResilientExporter(ResilientExporterConfig{Delegate: delegate})

	_ = exporter.ExportSpans(context.Background(), []sdktrace.ReadOnlySpan{nil})
	metrics := exporter.GetMetrics()
	assert.Equal(t, uint64(1), metrics.Failures)
	assert.Equal(t, uint64(1), metrics.Dropped)

	exporter.ResetMetrics()
	metrics = exporter.GetMetrics()
	assert.Equal(t, uint64(0), metrics.Failures)
	assert.Equal(t, uint64(0), metrics.Dropped)
}
