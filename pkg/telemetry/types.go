package telemetry

import (
	"context"

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
	DeploymentTypeCloudPrem DeploymentType = "cloud_prem"
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

type Config struct {
	ServiceName    string
	ServiceVersion string
	Environment    string

	OTLPURL string
	Headers map[string]string

	MetricsEnabled bool
	LogsEnabled    bool
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
