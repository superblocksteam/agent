package tracer

import (
	"context"
	"net/http"
	"strings"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

func Tracer() trace.Tracer {
	return otel.Tracer("orchestrator")
}

func Propagate(ctx context.Context) map[string]string {
	carrier := propagation.MapCarrier(map[string]string{})
	p := propagation.Baggage{}
	p.Inject(ctx, carrier)
	otel.GetTextMapPropagator().Inject(ctx, carrier)
	return carrier
}

func DefaultHttpClient() *http.Client {
	return &http.Client{
		Transport: otelhttp.NewTransport(http.DefaultTransport, otelhttp.WithSpanNameFormatter(func(operation string, r *http.Request) string {
			return "http." + strings.ToLower(r.Method)
		})),
	}
}

func Logger(ctx context.Context, logger *zap.Logger) *zap.Logger {
	s := trace.SpanFromContext(ctx)
	c := s.SpanContext()

	if !s.IsRecording() || !c.IsValid() {
		return logger
	}

	return logger.With(
		zap.String("dd.trace_id", c.TraceID().String()),
		zap.String("dd.span_id", c.SpanID().String()),
	)
}

func Observe[T any](
	ctx context.Context,
	name string,
	tags map[string]any,
	fn func(context.Context, trace.Span) (T, error),
	process func(int64),
) (T, error) {
	start := time.Now().UnixMilli()
	spanCtx, span := Tracer().Start(ctx, name)

	var attributes []attribute.KeyValue
	{
		for k, v := range tags {
			switch a := v.(type) {
			case string:
				attributes = append(attributes, attribute.String(k, a))
			case bool:
				attributes = append(attributes, attribute.Bool(k, a))
			case []string:
				attributes = append(attributes, attribute.StringSlice(k, a))
			}
		}
	}

	span.SetAttributes(attributes...)

	defer func() {
		if process != nil {
			process(time.Now().UnixMilli() - start)
		}

		span.End()
	}()

	result, err := fn(spanCtx, span)

	if err != nil {
		span.SetStatus(codes.Error, err.Error())
	} else {
		span.SetStatus(codes.Ok, "")
	}

	return result, err
}
