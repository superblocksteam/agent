package telemetry

import (
	_ "embed"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

//go:embed contracts/tier2-traces.json
var tier2TracesContract []byte

type tier2TracesJSON struct {
	ForbiddenSpanAttributes          []string `json:"forbidden_span_attributes"`
	DroppedHighCardinalityAttributes []string `json:"dropped_high_cardinality_attributes"`
}

func TestForbiddenAttributesOnPremIsNoop(t *testing.T) {
	onPrem := getSpanSanitizationConfig(DeploymentTypeOnPrem)

	assert.Empty(t, onPrem.forbiddenAttributes, "on-prem should strip no attributes")
	assert.Empty(t, onPrem.droppedAttributes, "on-prem should drop no attributes")
}

func TestForbiddenAttributesCloudPremIsSuperset(t *testing.T) {
	cloudPrem := getSpanSanitizationConfig(DeploymentTypeCloudPrem)
	cloud := getSpanSanitizationConfig(DeploymentTypeCloud)

	for attr := range cloud.forbiddenAttributes {
		assert.Contains(t, cloudPrem.forbiddenAttributes, attr,
			"cloud-prem should include everything cloud strips: %s", attr)
	}

	assert.Greater(t, len(cloudPrem.forbiddenAttributes), len(cloud.forbiddenAttributes),
		"cloud-prem should have stricter filtering than cloud")
}

func TestForbiddenAttributesMatchTSContract(t *testing.T) {
	var contract tier2TracesJSON
	require.NoError(t, json.Unmarshal(tier2TracesContract, &contract))

	tsAttrs := make(map[string]struct{}, len(contract.ForbiddenSpanAttributes))
	for _, attr := range contract.ForbiddenSpanAttributes {
		tsAttrs[attr] = struct{}{}
	}

	for attr := range tsAttrs {
		assert.Contains(t, forbiddenTier2SpanAttributes, attr,
			"Go missing TS attribute: %s", attr)
	}

	for attr := range forbiddenTier2SpanAttributes {
		assert.Contains(t, tsAttrs, attr,
			"Go has attribute not in TS contract: %s", attr)
	}
}

// TestV060CasingParityForbidden verifies the v0.6.0 dot/underscore spellings of
// already-forbidden attributes are themselves forbidden. Classification is an
// exact-literal map lookup, so a re-cased attribute must be listed independently
// or it leaks past the Tier 2 boundary.
func TestV060CasingParityForbidden(t *testing.T) {
	for _, attr := range []string{
		"api-key", "api.key", // secret api_key variants
		"api.name", "resource.name", // customer-meaningful resource names
		"widget_type", "widget.type", // widget-type variants
		"tool.input", "tool.output", // AI/Tier-1 content variants
		"file.path", "file.content", // sensitive payload variants
		"code.path", "code.function.name", // customer-code namespace
		"db.query_text",                       // legacy DB-statement name (cross-surface parity)
		"npm.token", "npm_token", "npm-token", // npm registry secret tokens
		"npm.registry.token", "npm.registry_token", "registry_token", "registry-token", "registry.token",
	} {
		assert.Contains(t, forbiddenTier2SpanAttributes, attr,
			"v0.6.0 forbidden spelling missing from Go denylist: %s", attr)
	}
}

// TestV060CasingParityAlwaysForbidden verifies the secret/AI-content/customer-code
// variants are stripped even in cloud mode (alwaysForbiddenAttributes).
func TestV060CasingParityAlwaysForbidden(t *testing.T) {
	for _, attr := range []string{
		"api-key", "api.key",
		"tool.input", "tool.output",
		"code.path", "code.function.name",
		"npm.token", "npm_token", "npm-token",
		"npm.registry.token", "npm.registry_token", "registry_token", "registry-token", "registry.token",
	} {
		assert.Contains(t, alwaysForbiddenAttributes, attr,
			"v0.6.0 always-forbidden spelling missing: %s", attr)
	}
}

// TestV060CasingParityDropped verifies the dot/kebab spellings of the dropped
// high-cardinality binding keys are dropped too.
func TestV060CasingParityDropped(t *testing.T) {
	for _, attr := range []string{"binding-keys", "binding.keys"} {
		assert.Contains(t, droppedHighCardinalityAttributes, attr,
			"v0.6.0 dropped spelling missing from Go drop set: %s", attr)
	}
}

func TestDroppedAttributesMatchTS(t *testing.T) {
	var contract tier2TracesJSON
	require.NoError(t, json.Unmarshal(tier2TracesContract, &contract))

	tsDropped := make(map[string]struct{}, len(contract.DroppedHighCardinalityAttributes))
	for _, attr := range contract.DroppedHighCardinalityAttributes {
		tsDropped[attr] = struct{}{}
	}

	for attr := range tsDropped {
		assert.Contains(t, droppedHighCardinalityAttributes, attr,
			"Go missing TS dropped attribute: %s", attr)
	}

	for attr := range droppedHighCardinalityAttributes {
		assert.Contains(t, tsDropped, attr,
			"Go has dropped attribute not in TS contract: %s", attr)
	}
}
