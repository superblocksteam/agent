package telemetry

// Forbidden Tier 2 span attributes (Go SDK mirror).
//
// THIS FILE IS A MIRROR, NOT THE SOURCE OF TRUTH. The canonical Tier 2 traces
// contract lives in the superblocksteam/engineering repo:
//   - projects/o11y-refactor/contracts/tier2-traces.v0.6.0.json  (canonical contract)
//   - projects/o11y-refactor/contracts/README.md                 (rationale, Versioning Policy, Review Checklist)
//
// Org-wide telemetry naming and the Tier 2 privacy boundary are documented in the
// superblocksteam/workspace repo: docs/naming-conventions.md and the observability
// skill (.agents/skills/observability/SKILL.md).
//
// These Go maps mirror the TS SDK
// (superblocks/packages/telemetry/src/common/contracts/tier2-traces.ts). The embedded
// contracts/tier2-traces.json is generated from that TS source via
// scripts/sync-ts-telemetry-contracts.sh (do not hand-edit it); tests
// TestForbiddenAttributesMatchTSContract / TestDroppedAttributesMatchTS guard map == JSON.
//
// CHANGING TIER 2 BEHAVIOR: update the canonical JSON in engineering FIRST, as a NEW
// version (per the README Versioning Policy), then propagate the SAME change to every
// mirror so they stay aligned -- this file, the TS SDK, and the embedded JSON
// (regenerate via the sync script). Editing one surface alone silently drifts from the
// contract and lets a re-cased or newly added attribute bypass the Tier 2 privacy boundary.
//
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
//
// Tier 2 contract v0.5.0 (AGENT-3255): opaque product-resource identifiers
// (application-id, api-id, integration-id, profile-id, resource-id, commit-id and
// their _id variants) are intentionally absent from this denylist -- they are
// random UUIDv4 handles for non-person resources and pass through. The contract's
// hashed identifiers (enduser.id, session.id, user-id/user.id/user_id) are classified
// "hashed", not forbidden; SDK-level HMAC hashing is not yet implemented in Go, so
// they are neither stripped nor hashed here. In cloud-prem the OTel collector router
// is the fail-safe (it deletes the full hashed set); in cloud mode the default config
// applies only alwaysForbiddenAttributes (which also omits them), so cloud likewise
// relies on the collector pipeline. Both modes therefore depend on collector-level
// removal of these identifiers until the Go/collector HMAC processor lands. Resource NAMES
// (api-name, resource-name), widget-type, and secrets stay forbidden below.
//
// Tier 2 contract v0.6.0: casing parity. Classification is an exact-literal map
// lookup, so the kebab/snake/dot spellings of every forbidden attribute are listed
// independently (e.g. api.name, resource.name, widget_type/widget.type, tool.input,
// file.path, code.path/code.function.name, api-key/api.key). Also forbids the npm
// registry secret tokens and the legacy db.query_text name so this denylist matches
// the contract and the TS mirror exactly (no cross-surface drift).
var forbiddenTier2SpanAttributes = map[string]struct{}{
	// AI/LLM content (Tier 1 only)
	"llmobs.input":       {},
	"llmobs.output":      {},
	"prompt":             {},
	"code":               {},
	"code.path":          {},
	"code.function.name": {},
	"tool_input":         {},
	"tool_output":        {},
	"tool.input":         {},
	"tool.output":        {},

	// Sensitive payloads
	"file_path":          {},
	"file_content":       {},
	"file.path":          {},
	"file.content":       {},
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
	"api.name":      {},
	"resource-name": {},
	"resource_name": {},
	"resource.name": {},
	"widget-type":   {},
	"widget_type":   {},
	"widget.type":   {},
	"branch":        {},

	// Stack traces
	"error.stack":          {},
	"exception.stacktrace": {},

	// Auth/secrets
	"auth_token":    {},
	"api_key":       {},
	"api-key":       {},
	"api.key":       {},
	"authorization": {},
	"cookie":        {},
	"x-api-key":     {},

	// npm registry secret tokens (APPS-4190)
	"npm.token":          {},
	"npm_token":          {},
	"npm-token":          {},
	"npm.registry.token": {},
	"npm.registry_token": {},
	"registry_token":     {},
	"registry-token":     {},
	"registry.token":     {},
}

// Dropped high-cardinality attributes with no hash value.
var droppedHighCardinalityAttributes = map[string]struct{}{
	"binding-keys": {},
	"binding_keys": {},
	"binding.keys": {},
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
	"auth_token":         {},
	"api_key":            {},
	"api-key":            {},
	"api.key":            {},
	"authorization":      {},
	"cookie":             {},
	"x-api-key":          {},
	"npm.token":          {},
	"npm_token":          {},
	"npm-token":          {},
	"npm.registry.token": {},
	"npm.registry_token": {},
	"registry_token":     {},
	"registry-token":     {},
	"registry.token":     {},
	"llmobs.input":       {},
	"llmobs.output":      {},
	"prompt":             {},
	"code":               {},
	"code.path":          {},
	"code.function.name": {},
	"tool_input":         {},
	"tool_output":        {},
	"tool.input":         {},
	"tool.output":        {},
}
