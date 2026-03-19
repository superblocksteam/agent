package telemetry

import (
	"context"
	"regexp"
	"unicode/utf8"

	otellog "go.opentelemetry.io/otel/log"
	sdklog "go.opentelemetry.io/otel/sdk/log"
)

type LogExportMode string

const (
	LogExportModeWarnAndAbove LogExportMode = "warn_and_above"
	LogExportModeInfoAndAbove LogExportMode = "info_and_above"
	LogExportModeLocalOnly    LogExportMode = "local_only"
)

const defaultMaxBodyBytes = 32768

type LoggingPolicyConfig struct {
	ExportMode      LogExportMode
	LocalMaxLevel   string
	RedactPatterns  []*regexp.Regexp
	ForbiddenFields map[string]struct{}
	MaxBodyBytes    int
}

func GetLoggingPolicy(policy TelemetryPolicy) LoggingPolicyConfig {
	evaluator := NewPolicyEvaluator(policy)
	if !evaluator.IsExportEnabled(Tier2Operational) {
		return LoggingPolicyConfig{
			ExportMode:      LogExportModeLocalOnly,
			LocalMaxLevel:   "debug",
			RedactPatterns:  nil,
			ForbiddenFields: cloneStringSet(secretFields),
			MaxBodyBytes:    defaultMaxBodyBytes,
		}
	}

	switch policy.DeploymentType {
	case DeploymentTypeCloudPrem:
		return LoggingPolicyConfig{
			ExportMode:    LogExportModeWarnAndAbove,
			LocalMaxLevel: "debug",
			RedactPatterns: []*regexp.Regexp{
				regexp.MustCompile(`\b[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\b`),
				regexp.MustCompile(`(?i)(\bbearer\s+)[a-zA-Z0-9\-._~+/]+=*`),
				regexp.MustCompile(`(?i)(\bapi[_\s]?key[:\s=]+)[a-zA-Z0-9\-._~+/]+=*`),
			},
			ForbiddenFields: cloneStringSet(secretFields),
			MaxBodyBytes:    defaultMaxBodyBytes,
		}
	case DeploymentTypeOnPrem:
		// Same as cloud for now: export info-and-above, no redaction.
		return LoggingPolicyConfig{
			ExportMode:      LogExportModeInfoAndAbove,
			LocalMaxLevel:   "debug",
			RedactPatterns:  nil,
			ForbiddenFields: map[string]struct{}{},
			MaxBodyBytes:    defaultMaxBodyBytes,
		}
	}

	return LoggingPolicyConfig{
		ExportMode:      LogExportModeInfoAndAbove,
		LocalMaxLevel:   "debug",
		RedactPatterns:  nil,
		ForbiddenFields: map[string]struct{}{},
		MaxBodyBytes:    defaultMaxBodyBytes,
	}
}

type PolicyAwareLogProcessor struct {
	policy   LoggingPolicyConfig
	delegate sdklog.Processor
}

func NewPolicyAwareLogProcessor(policy LoggingPolicyConfig, delegate sdklog.Processor) *PolicyAwareLogProcessor {
	return &PolicyAwareLogProcessor{
		policy:   policy,
		delegate: delegate,
	}
}

func (p *PolicyAwareLogProcessor) OnEmit(ctx context.Context, record *sdklog.Record) error {
	if p.policy.ExportMode == LogExportModeLocalOnly {
		return nil
	}
	if !shouldExportSeverity(record.Severity(), p.policy.ExportMode) {
		return nil
	}

	sanitized := record.Clone()
	p.sanitizeRecord(&sanitized)
	return p.delegate.OnEmit(ctx, &sanitized)
}

func (p *PolicyAwareLogProcessor) Shutdown(ctx context.Context) error {
	return p.delegate.Shutdown(ctx)
}

func (p *PolicyAwareLogProcessor) ForceFlush(ctx context.Context) error {
	return p.delegate.ForceFlush(ctx)
}

func (p *PolicyAwareLogProcessor) sanitizeRecord(record *sdklog.Record) {
	body := SanitizeOtelLogValue(record.Body(), 0, p.sanitizeString)
	if p.policy.MaxBodyBytes > 0 && body.Kind() == otellog.KindString {
		s := body.AsString()
		if len(s) > p.policy.MaxBodyBytes {
			truncated := s[:p.policy.MaxBodyBytes]
			// Avoid splitting a multi-byte UTF-8 character at the boundary.
			for !utf8.ValidString(truncated) && len(truncated) > 0 {
				truncated = truncated[:len(truncated)-1]
			}
			body = otellog.StringValue(truncated + "... [TRUNCATED]")
		}
	}
	record.SetBody(body)

	attrs := make([]otellog.KeyValue, 0, record.AttributesLen())
	record.WalkAttributes(func(kv otellog.KeyValue) bool {
		if _, forbidden := p.policy.ForbiddenFields[kv.Key]; forbidden {
			return true
		}
		if IsSecretField(kv.Key) {
			return true
		}
		attrs = append(attrs, otellog.KeyValue{
			Key:   kv.Key,
			Value: SanitizeOtelLogValue(kv.Value, 0, p.sanitizeString),
		})
		return true
	})
	record.SetAttributes(attrs...)
}

func (p *PolicyAwareLogProcessor) sanitizeString(in string) string {
	// RedactStackTrace already calls SanitizeLogMessage internally,
	// so we don't call SanitizeLogMessage again at the end.
	out := RedactStackTrace(in)
	for _, re := range p.policy.RedactPatterns {
		out = re.ReplaceAllString(out, "${1}[REDACTED]")
	}
	return out
}

func shouldExportSeverity(severity otellog.Severity, mode LogExportMode) bool {
	switch mode {
	case LogExportModeLocalOnly:
		return false
	case LogExportModeWarnAndAbove:
		return severity >= otellog.SeverityWarn
	case LogExportModeInfoAndAbove:
		return severity >= otellog.SeverityInfo
	default:
		return false
	}
}

func cloneStringSet(in map[string]struct{}) map[string]struct{} {
	out := make(map[string]struct{}, len(in))
	for key := range in {
		out[key] = struct{}{}
	}
	return out
}
