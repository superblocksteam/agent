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
