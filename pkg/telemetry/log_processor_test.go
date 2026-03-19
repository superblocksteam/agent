package telemetry

import (
	"context"
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	otellog "go.opentelemetry.io/otel/log"
	sdklog "go.opentelemetry.io/otel/sdk/log"
)

type recordingProcessor struct {
	records []sdklog.Record
}

func (p *recordingProcessor) OnEmit(_ context.Context, record *sdklog.Record) error {
	p.records = append(p.records, record.Clone())
	return nil
}

func (p *recordingProcessor) Shutdown(context.Context) error { return nil }

func (p *recordingProcessor) ForceFlush(context.Context) error { return nil }

func TestGetLoggingPolicy(t *testing.T) {
	policy := DefaultCloudPremPolicy()
	logPolicy := GetLoggingPolicy(policy)
	assert.Equal(t, LogExportModeWarnAndAbove, logPolicy.ExportMode)
	assert.Equal(t, defaultMaxBodyBytes, logPolicy.MaxBodyBytes)

	policy = DefaultCloudPolicy()
	logPolicy = GetLoggingPolicy(policy)
	assert.Equal(t, LogExportModeInfoAndAbove, logPolicy.ExportMode)
	assert.Equal(t, defaultMaxBodyBytes, logPolicy.MaxBodyBytes)

	policy = DefaultOnPremPolicy()
	logPolicy = GetLoggingPolicy(policy)
	assert.Equal(t, LogExportModeInfoAndAbove, logPolicy.ExportMode)
	assert.Nil(t, logPolicy.RedactPatterns)
	assert.Empty(t, logPolicy.ForbiddenFields)
	assert.Equal(t, defaultMaxBodyBytes, logPolicy.MaxBodyBytes)
}

func TestPolicyAwareLogProcessorLocalOnlyBlocks(t *testing.T) {
	delegate := &recordingProcessor{}
	processor := NewPolicyAwareLogProcessor(LoggingPolicyConfig{
		ExportMode:      LogExportModeLocalOnly,
		ForbiddenFields: map[string]struct{}{},
	}, delegate)

	record := newRecord(otellog.SeverityError, "boom")
	require.NoError(t, processor.OnEmit(context.Background(), record))
	assert.Len(t, delegate.records, 0)
}

func TestPolicyAwareLogProcessorSeverityFiltering(t *testing.T) {
	delegate := &recordingProcessor{}
	processor := NewPolicyAwareLogProcessor(LoggingPolicyConfig{
		ExportMode:      LogExportModeWarnAndAbove,
		ForbiddenFields: map[string]struct{}{},
	}, delegate)

	require.NoError(t, processor.OnEmit(context.Background(), newRecord(otellog.SeverityInfo, "info")))
	require.NoError(t, processor.OnEmit(context.Background(), newRecord(otellog.SeverityWarn, "warn")))
	require.NoError(t, processor.OnEmit(context.Background(), newRecord(otellog.SeverityError, "error")))

	assert.Len(t, delegate.records, 2)
}

func TestPolicyAwareLogProcessorSanitizes(t *testing.T) {
	delegate := &recordingProcessor{}
	processor := NewPolicyAwareLogProcessor(LoggingPolicyConfig{
		ExportMode: LogExportModeInfoAndAbove,
		ForbiddenFields: map[string]struct{}{
			"token": {},
		},
	}, delegate)

	record := newRecord(
		otellog.SeverityError,
		"Authorization: Bearer abc123",
		otellog.String("token", "secret"),
		otellog.String("safe", "api_key: secret"),
	)
	require.NoError(t, processor.OnEmit(context.Background(), record))
	require.Len(t, delegate.records, 1)

	emitted := delegate.records[0]
	assert.Equal(t, "Authorization: Bearer [REDACTED]", emitted.Body().AsString())

	attrs := map[string]string{}
	emitted.WalkAttributes(func(kv otellog.KeyValue) bool {
		attrs[kv.Key] = kv.Value.AsString()
		return true
	})
	_, hasToken := attrs["token"]
	assert.False(t, hasToken)
	for _, value := range attrs {
		assert.NotContains(t, value, "secret")
	}
}

func TestPolicyAwareLogProcessorTruncatesLargeBody(t *testing.T) {
	delegate := &recordingProcessor{}
	maxBytes := 64
	processor := NewPolicyAwareLogProcessor(LoggingPolicyConfig{
		ExportMode:      LogExportModeInfoAndAbove,
		ForbiddenFields: map[string]struct{}{},
		MaxBodyBytes:    maxBytes,
	}, delegate)

	largeBody := strings.Repeat("x", 200)
	record := newRecord(otellog.SeverityError, largeBody)
	require.NoError(t, processor.OnEmit(context.Background(), record))
	require.Len(t, delegate.records, 1)

	body := delegate.records[0].Body().AsString()
	assert.True(t, strings.HasSuffix(body, "... [TRUNCATED]"))
	assert.Equal(t, maxBytes+len("... [TRUNCATED]"), len(body))

	// Body under the limit is not truncated.
	delegate.records = nil
	smallRecord := newRecord(otellog.SeverityError, "short message")
	require.NoError(t, processor.OnEmit(context.Background(), smallRecord))
	require.Len(t, delegate.records, 1)
	assert.Equal(t, "short message", delegate.records[0].Body().AsString())

	// Multi-byte UTF-8 characters are not split at the boundary.
	delegate.records = nil
	// Each emoji is 4 bytes. With maxBytes=64, naive slicing at byte 64
	// would split the 16th emoji mid-sequence.
	emojiBody := strings.Repeat("\U0001F600", 20) // 80 bytes, 20 runes
	emojiRecord := newRecord(otellog.SeverityError, emojiBody)
	require.NoError(t, processor.OnEmit(context.Background(), emojiRecord))
	require.Len(t, delegate.records, 1)
	emBody := delegate.records[0].Body().AsString()
	assert.True(t, strings.HasSuffix(emBody, "... [TRUNCATED]"))
	assert.True(t, utf8.ValidString(emBody), "truncated body must be valid UTF-8")
}

func TestGetLoggingPolicyExportDisabled(t *testing.T) {
	policy := DefaultCloudPolicy()
	cfg := policy.Tiers[Tier2Operational]
	cfg.ExportEnabled = false
	policy.Tiers[Tier2Operational] = cfg

	logPolicy := GetLoggingPolicy(policy)
	assert.Equal(t, LogExportModeLocalOnly, logPolicy.ExportMode)
	assert.NotEmpty(t, logPolicy.ForbiddenFields)
}

func TestPolicyAwareLogProcessorRedactPatterns(t *testing.T) {
	loggingPolicy := GetLoggingPolicy(DefaultCloudPremPolicy())
	delegate := &recordingProcessor{}
	proc := NewPolicyAwareLogProcessor(loggingPolicy, delegate)

	// Cloud-prem RedactPatterns include a JWT pattern. The JWT will be
	// caught by RedactStackTrace -> SanitizeLogMessage first, but a
	// bearer-prefixed token exercises the ${1} substitution in sanitizeString.
	body := "auth bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
	record := newRecord(otellog.SeverityError, body)
	require.NoError(t, proc.OnEmit(context.Background(), record))
	require.Len(t, delegate.records, 1)
	assert.NotContains(t, delegate.records[0].Body().AsString(), "eyJhbGciOiJIUzI1NiJ9")
}

func newRecord(severity otellog.Severity, body string, attrs ...otellog.KeyValue) *sdklog.Record {
	record := &sdklog.Record{}
	record.SetSeverity(severity)
	record.SetBody(otellog.StringValue(body))
	record.AddAttributes(attrs...)
	return record
}
