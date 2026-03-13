// Package telemetry provides policy-aware OpenTelemetry bootstrap for Go services.
//
// The package exposes a canonical initialization path (`Init`) with:
//   - tiered telemetry policy enforcement (Tier 1, Tier 2, Tier 3),
//   - resilient export behavior that does not block request paths, and
//   - source-side log sanitization helpers for secret redaction.
//
// Browser telemetry bootstrap is intentionally out of scope for this package.
package telemetry
