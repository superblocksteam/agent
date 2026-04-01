# pkg/telemetry

Policy-aware OpenTelemetry bootstrap for Go services in `github.com/superblocksteam/agent`.

This package provides:
- required telemetry policy initialization,
- tier-aware export decisions (Tier 1/2/3),
- resilient trace exporting (fire-and-forget behavior),
- secret-safe log processing, and
- test helpers with in-memory exporters.

Browser telemetry bootstrap is intentionally out of scope.

## Quick Start

```go
package main

import (
  "context"
  "os"

  "github.com/superblocksteam/agent/pkg/telemetry"
  "go.uber.org/zap"
)

func main() {
  logger := zap.NewNop()
  policy := telemetry.DefaultCloudPremPolicy()

  instance, err := telemetry.Init(context.Background(), telemetry.Config{
    ServiceName:    "orchestrator",
    ServiceVersion: "1.0.0",
    Environment:    "production",
    OTLPURL:        os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"),
    Headers: map[string]string{
      "x-superblocks-agent-key": os.Getenv("SUPERBLOCKS_AGENT_KEY"),
    },
    MetricsEnabled: true,
    LogsEnabled:    true,
  }, policy, logger)
  if err != nil {
    panic(err)
  }
  defer instance.Shutdown(context.Background())

  tracer := instance.GetTracer("my-component")
  _, span := tracer.Start(context.Background(), "work")
  telemetry.MarkSensitive(span)
  span.End()
}
```

## Tier Hints

Use tier hints when instrumentation has stronger context than collector rules:

```go
telemetry.MarkSensitive(span)     // superblocks.tier_hint=tier1_only
telemetry.MarkForAIAnalysis(span) // superblocks.tier_hint=include_tier3
telemetry.MarkDebugOnly(span)     // superblocks.tier_hint=skip_export
```

You can also set the hint directly:

```go
telemetry.SetTierHint(span, telemetry.TierPolicyHintTier1Only)
```

## Policy Behavior

- `DefaultCloudPolicy()`: Tier 1/2/3 enabled and exported.
- `DefaultCloudPremPolicy()`: Tier 1 retained local only, Tier 2/3 exported.
- `PolicyEvaluator.IsExportEnabled(tier)`: use for exporter/provider setup.
- `PolicyEvaluator.CanExport(tier, traceID, orgID...)`: use for signal-level decisions.

## Metrics Client

`MetricsClient` provides lightweight helpers:

```go
metrics := instance.MetricsClient
metrics.Counter("requests_total").Inc(telemetry.Labels{"route": "/health"})
metrics.Histogram("latency_ms").Observe(telemetry.Labels{"route": "/health"}, 12.4)
metrics.Gauge("queue_depth").Set(telemetry.Labels{"queue": "worker"}, 3)
```

Gauge values are bounded in-memory using TTL + max-entry eviction to avoid unbounded growth.

## Batch Processor Configuration

The `BatchConfig` struct on `telemetry.Config` controls the trace batch processor
and resilient exporter. All fields default to zero, which preserves the existing
hardcoded defaults.

| Field | Type | Default | Component | Env Var |
|-------|------|---------|-----------|---------|
| `MaxQueueSize` | `int` | 2048 | `ResilientExporter` | `SUPERBLOCKS_TELEMETRY_MAX_QUEUE_SIZE` |
| `MaxExportBatchSize` | `int` | 512 (SDK) | `BatchSpanProcessor` | `SUPERBLOCKS_TELEMETRY_MAX_EXPORT_BATCH_SIZE` |
| `BatchTimeout` | `time.Duration` | 5s (SDK) | `BatchSpanProcessor` | `SUPERBLOCKS_TELEMETRY_BATCH_TIMEOUT` |
| `ExportTimeout` | `time.Duration` | 30s | `BatchSpanProcessor` / `ResilientExporter` (fallback) | `SUPERBLOCKS_TELEMETRY_EXPORT_TIMEOUT` |

Zero-value fields are ignored for queue/batch sizing and timeout: `ResilientExporter`
applies its own defaults (2048, 30s) and `BatchSpanProcessor` uses OTel SDK defaults
(512, 5s) when no options are passed. `ExportTimeout` configures the per-export timeout
on `BatchSpanProcessor` (`WithExportTimeout`) and is also used by `ResilientExporter` as
a fallback deadline when the incoming context has no deadline already.

Note: setting `MaxQueueSize` to a value smaller than `MaxExportBatchSize` (or smaller
than the SDK default of 512 when `MaxExportBatchSize` is not set) will cause the
`ResilientExporter` to drop every batch immediately, as the batch will be larger than
the queue. Set both together or leave both at zero.

The library does not read environment variables directly — services wire env vars via
viper pflags and pass them through `telemetry.Config.Batch`.

## Testing

Use `InitTestTelemetry` for deterministic telemetry tests with no network calls:

```go
tt, err := telemetry.InitTestTelemetry(context.Background(), telemetry.Config{
  ServiceName: "test-service",
  Environment: "test",
}, telemetry.DefaultCloudPolicy(), nil)
if err != nil {
  panic(err)
}
defer tt.Shutdown(context.Background())

tracer := telemetry.GetTestTracer("example")
_, span := tracer.Start(context.Background(), "test-span")
span.SetAttributes()
span.End()

spans := tt.SpanExporter.GetSpans()
_ = spans
```
