package telemetry

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"sync"

	"go.opentelemetry.io/otel"
	otellog "go.opentelemetry.io/otel/log"
	otellogglobal "go.opentelemetry.io/otel/log/global"
	"go.opentelemetry.io/otel/propagation"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

type InMemorySpanExporter struct {
	mu      sync.RWMutex
	spans   []sdktrace.ReadOnlySpan
	stopped bool
}

func (e *InMemorySpanExporter) ExportSpans(_ context.Context, spans []sdktrace.ReadOnlySpan) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.stopped {
		return nil
	}
	e.spans = append(e.spans, spans...)
	return nil
}

func (e *InMemorySpanExporter) Shutdown(context.Context) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.stopped = true
	return nil
}

func (e *InMemorySpanExporter) GetSpans() []sdktrace.ReadOnlySpan {
	e.mu.RLock()
	defer e.mu.RUnlock()
	out := make([]sdktrace.ReadOnlySpan, len(e.spans))
	copy(out, e.spans)
	return out
}

func (e *InMemorySpanExporter) Reset() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.spans = nil
}

func (e *InMemorySpanExporter) AssertNoAttribute(key string, forbidden *regexp.Regexp) error {
	e.mu.RLock()
	defer e.mu.RUnlock()
	for _, span := range e.spans {
		for _, kv := range span.Attributes() {
			if string(kv.Key) != key {
				continue
			}
			if forbidden.MatchString(kv.Value.Emit()) {
				return fmt.Errorf("found forbidden attribute %s on span %q", key, span.Name())
			}
		}
	}
	return nil
}

type InMemoryLogExporter struct {
	mu      sync.RWMutex
	records []sdklog.Record
	stopped bool
}

func (e *InMemoryLogExporter) Export(_ context.Context, records []sdklog.Record) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.stopped {
		return nil
	}
	for _, record := range records {
		cloned := record.Clone()
		e.records = append(e.records, cloned)
	}
	return nil
}

func (e *InMemoryLogExporter) Shutdown(context.Context) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.stopped = true
	return nil
}

func (e *InMemoryLogExporter) ForceFlush(context.Context) error {
	return nil
}

func (e *InMemoryLogExporter) GetRecords() []sdklog.Record {
	e.mu.RLock()
	defer e.mu.RUnlock()
	out := make([]sdklog.Record, len(e.records))
	copy(out, e.records)
	return out
}

func (e *InMemoryLogExporter) Reset() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.records = nil
}

type TestTelemetry struct {
	TracerProvider *sdktrace.TracerProvider
	MeterProvider  *sdkmetric.MeterProvider
	LoggerProvider *sdklog.LoggerProvider

	SpanExporter *InMemorySpanExporter
	MetricReader *sdkmetric.ManualReader
	LogExporter  *InMemoryLogExporter

	PolicyEvaluator *PolicyEvaluator
}

func InitTestTelemetry(ctx context.Context, cfg Config, policy TelemetryPolicy, logger *zap.Logger) (*TestTelemetry, error) {
	if logger == nil {
		logger = zap.NewNop()
	}
	if cfg.ServiceName == "" {
		cfg.ServiceName = "test-service"
	}
	if cfg.ServiceVersion == "" {
		cfg.ServiceVersion = "0.0.0-test"
	}
	if cfg.Environment == "" {
		cfg.Environment = "test"
	}
	if policy.DeploymentType == "" {
		policy = DefaultCloudPolicy()
	}
	if err := validatePolicy(policy); err != nil {
		return nil, err
	}

	res, err := BuildResource(cfg)
	if err != nil {
		return nil, err
	}

	spanExporter := &InMemorySpanExporter{}
	traceProvider := sdktrace.NewTracerProvider(
		sdktrace.WithResource(res),
		sdktrace.WithSpanProcessor(sdktrace.NewSimpleSpanProcessor(spanExporter)),
	)

	metricReader := sdkmetric.NewManualReader()
	meterProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
		sdkmetric.WithReader(metricReader),
	)

	logExporter := &InMemoryLogExporter{}
	logProvider := sdklog.NewLoggerProvider(
		sdklog.WithResource(res),
		sdklog.WithProcessor(sdklog.NewSimpleProcessor(logExporter)),
	)

	otel.SetTracerProvider(traceProvider)
	otel.SetMeterProvider(meterProvider)
	otellogglobal.SetLoggerProvider(logProvider)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	logger.Debug("initialized test telemetry")

	return &TestTelemetry{
		TracerProvider:  traceProvider,
		MeterProvider:   meterProvider,
		LoggerProvider:  logProvider,
		SpanExporter:    spanExporter,
		MetricReader:    metricReader,
		LogExporter:     logExporter,
		PolicyEvaluator: NewPolicyEvaluator(policy),
	}, nil
}

func (t *TestTelemetry) CollectMetrics(ctx context.Context) (metricdata.ResourceMetrics, error) {
	var rm metricdata.ResourceMetrics
	if t == nil || t.MetricReader == nil {
		return rm, fmt.Errorf("metric reader is not initialized")
	}
	return rm, t.MetricReader.Collect(ctx, &rm)
}

func (t *TestTelemetry) Reset() {
	if t == nil {
		return
	}
	if t.SpanExporter != nil {
		t.SpanExporter.Reset()
	}
	if t.LogExporter != nil {
		t.LogExporter.Reset()
	}
}

func (t *TestTelemetry) Shutdown(ctx context.Context) error {
	if t == nil {
		return nil
	}
	return errors.Join(
		shutdownLoggerProvider(ctx, t.LoggerProvider),
		func() error {
			if t.MeterProvider == nil {
				return nil
			}
			return t.MeterProvider.Shutdown(ctx)
		}(),
		func() error {
			if t.TracerProvider == nil {
				return nil
			}
			return t.TracerProvider.Shutdown(ctx)
		}(),
	)
}

func GetTestTracer(name string) trace.Tracer {
	if name == "" {
		name = "test"
	}
	return otel.GetTracerProvider().Tracer(name)
}

func GetTestLogger(name string) otellog.Logger {
	if name == "" {
		name = "test"
	}
	return otellogglobal.Logger(name)
}
