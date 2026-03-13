package telemetry

import (
	"context"

	"go.opentelemetry.io/otel/attribute"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

// SanitizingExporter wraps a SpanExporter, stripping forbidden and
// high-cardinality attributes from spans before they leave the process.
// This is defense-in-depth: the OTel Collector also filters, but the SDK
// prevents sensitive data from ever hitting the wire.
type SanitizingExporter struct {
	delegate  sdktrace.SpanExporter
	forbidden map[string]struct{}
}

// NewSanitizingExporter creates a sanitizing wrapper around delegate.
func NewSanitizingExporter(delegate sdktrace.SpanExporter, dt DeploymentType) *SanitizingExporter {
	cfg := getSpanSanitizationConfig(dt)
	merged := make(map[string]struct{}, len(cfg.forbiddenAttributes)+len(cfg.droppedAttributes))
	for k := range cfg.forbiddenAttributes {
		merged[k] = struct{}{}
	}
	for k := range cfg.droppedAttributes {
		merged[k] = struct{}{}
	}
	return &SanitizingExporter{
		delegate:  delegate,
		forbidden: merged,
	}
}

func (e *SanitizingExporter) ExportSpans(ctx context.Context, spans []sdktrace.ReadOnlySpan) error {
	if len(e.forbidden) == 0 {
		return e.delegate.ExportSpans(ctx, spans)
	}

	sanitized := make([]sdktrace.ReadOnlySpan, len(spans))
	for i, s := range spans {
		if e.needsSanitization(s) {
			sanitized[i] = &sanitizedSpan{ReadOnlySpan: s, forbidden: e.forbidden}
		} else {
			sanitized[i] = s
		}
	}
	return e.delegate.ExportSpans(ctx, sanitized)
}

func (e *SanitizingExporter) Shutdown(ctx context.Context) error {
	return e.delegate.Shutdown(ctx)
}

func (e *SanitizingExporter) ForceFlush(ctx context.Context) error {
	type forceFlusher interface {
		ForceFlush(context.Context) error
	}
	if f, ok := e.delegate.(forceFlusher); ok {
		return f.ForceFlush(ctx)
	}
	return nil
}

// needsSanitization checks if any attribute key is forbidden, including
// attributes on span events (e.g. exception.stacktrace from RecordError)
// and span links.
func (e *SanitizingExporter) needsSanitization(s sdktrace.ReadOnlySpan) bool {
	for _, attr := range s.Attributes() {
		if _, ok := e.forbidden[string(attr.Key)]; ok {
			return true
		}
	}
	for _, event := range s.Events() {
		for _, attr := range event.Attributes {
			if _, ok := e.forbidden[string(attr.Key)]; ok {
				return true
			}
		}
	}
	for _, link := range s.Links() {
		for _, attr := range link.Attributes {
			if _, ok := e.forbidden[string(attr.Key)]; ok {
				return true
			}
		}
	}
	return false
}

// sanitizedSpan wraps a ReadOnlySpan and overrides Attributes(), Links(),
// and Events() to filter out forbidden keys. All other methods delegate via embedding.
type sanitizedSpan struct {
	sdktrace.ReadOnlySpan
	forbidden map[string]struct{}
}

func (s *sanitizedSpan) Attributes() []attribute.KeyValue {
	orig := s.ReadOnlySpan.Attributes()
	filtered := make([]attribute.KeyValue, 0, len(orig))
	for _, attr := range orig {
		if _, ok := s.forbidden[string(attr.Key)]; !ok {
			filtered = append(filtered, attr)
		}
	}
	return filtered
}

func (s *sanitizedSpan) DroppedAttributes() int {
	orig := s.ReadOnlySpan.Attributes()
	stripped := len(orig) - len(s.Attributes())
	return s.ReadOnlySpan.DroppedAttributes() + stripped
}

func (s *sanitizedSpan) Links() []sdktrace.Link {
	orig := s.ReadOnlySpan.Links()
	out := make([]sdktrace.Link, len(orig))
	for i, link := range orig {
		filtered := make([]attribute.KeyValue, 0, len(link.Attributes))
		for _, attr := range link.Attributes {
			if _, ok := s.forbidden[string(attr.Key)]; !ok {
				filtered = append(filtered, attr)
			}
		}
		out[i] = sdktrace.Link{
			SpanContext:           link.SpanContext,
			Attributes:            filtered,
			DroppedAttributeCount: link.DroppedAttributeCount + len(link.Attributes) - len(filtered),
		}
	}
	return out
}

func (s *sanitizedSpan) Events() []sdktrace.Event {
	orig := s.ReadOnlySpan.Events()
	out := make([]sdktrace.Event, len(orig))
	for i, event := range orig {
		filtered := make([]attribute.KeyValue, 0, len(event.Attributes))
		for _, attr := range event.Attributes {
			if _, ok := s.forbidden[string(attr.Key)]; !ok {
				filtered = append(filtered, attr)
			}
		}
		out[i] = sdktrace.Event{
			Name:                  event.Name,
			Time:                  event.Time,
			Attributes:            filtered,
			DroppedAttributeCount: event.DroppedAttributeCount + len(event.Attributes) - len(filtered),
		}
	}
	return out
}
