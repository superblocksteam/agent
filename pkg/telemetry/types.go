package telemetry

import (
	"context"
	"time"

	otellog "go.opentelemetry.io/otel/log"
	otelmetric "go.opentelemetry.io/otel/metric"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

type DeploymentType string

const (
	DeploymentTypeCloud     DeploymentType = "cloud"
	DeploymentTypeCloudPrem DeploymentType = "cloud-prem"
	DeploymentTypeOnPrem    DeploymentType = "on-prem"
)

type TelemetryTier string

const (
	Tier1Local        TelemetryTier = "tier_1_local"
	Tier2Operational  TelemetryTier = "tier_2_operational"
	Tier3AIExperience TelemetryTier = "tier_3_ai_experience"
)

const TIER_HINT_ATTRIBUTE = "superblocks.tier_hint"

type TierPolicyHint string

const (
	TierPolicyHintIncludeTier3 TierPolicyHint = "include_tier3"
	TierPolicyHintSkipExport   TierPolicyHint = "skip_export"
	TierPolicyHintTier1Only    TierPolicyHint = "tier1_only"
)

type EnforcementMode string

const (
	EnforcementModeAudit   EnforcementMode = "audit"
	EnforcementModeEnforce EnforcementMode = "enforce"
)

type TierConfig struct {
	Enabled       bool
	ExportEnabled bool
	SampleRate    float64
}

type Tier3ContentPolicy struct {
	ContentExportEnabled       bool
	MaxPromptBytes             int
	MaxResponseBytes           int
	SecretRedactionEnabled     bool
	ToolOutputFilteringEnabled bool
}

type TelemetryPolicy struct {
	DeploymentType  DeploymentType
	EnforcementMode EnforcementMode
	Tiers           map[TelemetryTier]TierConfig
	Tier3Content    Tier3ContentPolicy
	OrgOverrides    map[string]PartialPolicy
}

type PartialPolicy struct {
	EnforcementMode *EnforcementMode
	Tiers           map[TelemetryTier]PartialTierConfig
	Tier3Content    *PartialTier3ContentPolicy
}

type PartialTier3ContentPolicy struct {
	ContentExportEnabled       *bool
	MaxPromptBytes             *int
	MaxResponseBytes           *int
	SecretRedactionEnabled     *bool
	ToolOutputFilteringEnabled *bool
}

type PartialTierConfig struct {
	Enabled       *bool
	ExportEnabled *bool
	SampleRate    *float64
}

// BatchConfig controls the trace batch processor and resilient exporter.
// Zero values preserve existing defaults — callers only set fields they want to override.
type BatchConfig struct {
	// MaxQueueSize is the maximum number of spans queued for export.
	// Consumed by ResilientExporter. Default: 2048.
	MaxQueueSize int

	// MaxExportBatchSize is the maximum number of spans exported in a single batch.
	// Consumed by OTel SDK BatchSpanProcessor. Default: 512 (SDK default).
	MaxExportBatchSize int

	// BatchTimeout is how long the processor waits before flushing a partial batch.
	// Consumed by OTel SDK BatchSpanProcessor. Default: 5s (SDK default).
	BatchTimeout time.Duration

	// ExportTimeout is the per-export-call timeout for span exports.
	// Configures the OTel SDK BatchSpanProcessor export timeout (WithExportTimeout),
	// which is the effective deadline passed to ExportSpans. Also used by
	// ResilientExporter as a fallback when the incoming context has no deadline.
	// Default: 30s.
	ExportTimeout time.Duration
}

type Config struct {
	ServiceName    string
	ServiceVersion string
	Environment    string

	OTLPURL string
	Headers map[string]string

	MetricsEnabled bool
	LogsEnabled    bool

	Batch BatchConfig
}

type Instance struct {
	TracerProvider *sdktrace.TracerProvider
	MeterProvider  *sdkmetric.MeterProvider
	LoggerProvider *sdklog.LoggerProvider

	PolicyEvaluator *PolicyEvaluator
	MetricsClient   *MetricsClient

	GetTracer func(name string) trace.Tracer
	GetMeter  func(name string) otelmetric.Meter
	GetLogger func(name string) otellog.Logger
	Shutdown  func(ctx context.Context) error
}
