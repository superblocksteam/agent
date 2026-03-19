package telemetry

// Forbidden Tier 2 span attributes.
// Source: https://github.com/superblocksteam/superblocks/blob/main/packages/telemetry/src/common/contracts/tier2-traces.ts
// Cloud-prem: full denylist applied at SDK level (defense in depth with Collector).
// Cloud: TS applies no SDK-level filtering (Collector only). Go intentionally
// diverges by stripping auth/secrets/AI content at SDK level via
// alwaysForbiddenAttributes -- see getSpanSanitizationConfig.
//
// Why Go diverges from TS in cloud mode: TS services sit behind the API gateway
// and rely on the OTel Collector pipeline to strip sensitive attributes before
// export. Go services (orchestrator, workers) handle agent keys and LLM payloads
// directly and may emit spans before reaching any Collector-level filtering, so
// we enforce a minimal SDK-level denylist even in cloud mode as defense in depth.
var forbiddenTier2SpanAttributes = map[string]struct{}{
	// AI/LLM content (Tier 1 only)
	"llmobs.input":  {},
	"llmobs.output": {},
	"prompt":        {},
	"code":          {},
	"tool_input":    {},
	"tool_output":   {},

	// Sensitive payloads
	"file_path":          {},
	"file_content":       {},
	"db.statement":       {},
	"db.query_text":      {},
	"db.query.text":      {},
	"http.request.body":  {},
	"http.response.body": {},
	"url.full":           {},
	"url.query":          {},
	"http.url":           {},
	"http.target":        {},

	// PII identifiers (plaintext)
	"user-email":    {},
	"user.email":    {},
	"user_email":    {},
	"enduser.email": {},

	// Names (high cardinality, customer data)
	"api-name":      {},
	"api_name":      {},
	"resource-name": {},
	"resource_name": {},
	"widget-type":   {},
	"branch":        {},

	// Stack traces
	"error.stack":          {},
	"exception.stacktrace": {},

	// Auth/secrets
	"auth_token":    {},
	"api_key":       {},
	"authorization": {},
	"cookie":        {},
	"x-api-key":     {},
}

// Dropped high-cardinality attributes with no hash value.
var droppedHighCardinalityAttributes = map[string]struct{}{
	"binding_keys": {},
}

// spanSanitizationConfig controls SDK-level span attribute filtering.
type spanSanitizationConfig struct {
	forbiddenAttributes map[string]struct{}
	droppedAttributes   map[string]struct{}
}

// getSpanSanitizationConfig returns the SDK-level span filtering config.
// Cloud: strip only auth/secrets and AI content (minimal set).
// Cloud-prem: full Tier 2 denylist.
func getSpanSanitizationConfig(dt DeploymentType) spanSanitizationConfig {
	switch dt {
	case DeploymentTypeCloudPrem:
		return spanSanitizationConfig{
			forbiddenAttributes: forbiddenTier2SpanAttributes,
			droppedAttributes:   droppedHighCardinalityAttributes,
		}
	case DeploymentTypeOnPrem:
		// No sanitization: pass spans through untouched to preserve existing OPA observability behavior.
		return spanSanitizationConfig{
			forbiddenAttributes: map[string]struct{}{},
			droppedAttributes:   map[string]struct{}{},
		}
	default:
		// Cloud: only strip things that should never leave the SDK
		return spanSanitizationConfig{
			forbiddenAttributes: alwaysForbiddenAttributes,
			droppedAttributes:   droppedHighCardinalityAttributes,
		}
	}
}

// alwaysForbiddenAttributes are stripped regardless of deployment type.
// These are secrets/auth that should never appear in exported telemetry.
var alwaysForbiddenAttributes = map[string]struct{}{
	"auth_token":    {},
	"api_key":       {},
	"authorization": {},
	"cookie":        {},
	"x-api-key":     {},
	"llmobs.input":  {},
	"llmobs.output": {},
	"prompt":        {},
	"code":          {},
	"tool_input":    {},
	"tool_output":   {},
}
