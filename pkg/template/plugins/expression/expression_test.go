package expression

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/template/plugins"
)

func TestScanner(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name               string
		input              *plugins.Input
		expectedScanResult bool
		expectedValue      string
	}{
		{
			name:          "nil input",
			expectedValue: "",
		},
		{
			name:          "empty input",
			input:         &plugins.Input{Data: ""},
			expectedValue: "",
		},
		{
			name:          "not valid JavaScript expression",
			input:         &plugins.Input{Data: "not a JavaScript expression"},
			expectedValue: "",
		},
		{
			name:               "valid template literal",
			input:              &plugins.Input{Data: "`\tuser_${Date.now()}\n\t`"},
			expectedScanResult: true,
			expectedValue:      "`\tuser_${Date.now()}\n\t`",
		},
		{
			name:               "valid IIFE (immediatly invoked function expression)",
			input:              &plugins.Input{Data: "\n (() => false === true)()\n"},
			expectedScanResult: true,
			expectedValue:      "\n (() => false === true)()\n",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			plugin := Instance(tc.input)
			assert.Equal(t, tc.input.GetData(), plugin.Text())
			assert.Empty(t, plugin.Value())

			assert.Equal(t, tc.expectedScanResult, plugin.Scan())
			assert.False(t, plugin.Scan())

			assert.Equal(t, tc.input.GetData(), plugin.Text())
			assert.Equal(t, tc.expectedValue, plugin.Value())
		})
	}
}

func TestRender(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name             string
		input            *plugins.Input
		processed        []string
		expectedErrorStr string
	}{
		{
			name:             "empty processed values returns error",
			input:            &plugins.Input{},
			processed:        []string{},
			expectedErrorStr: "expression plugin does not support empty processed values",
		},
		{
			name: "multiple processed values returns error",
			input: &plugins.Input{
				Data: "(() => [foo, bar, baz].join(','))()",
			},
			processed:        []string{"bar", "baz"},
			expectedErrorStr: "expression plugin does not support multiple processed values",
		},
		{
			name: "single processed value is always returned",
			input: &plugins.Input{
				Data: "(() => [foo, bar, baz].join(','))()",
			},
			processed: []string{"foo,bar,baz"},
		},
		{
			name:      "single processed value is always returned (nil input)",
			processed: []string{"foo,bar,baz"},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			plugin := Instance(tc.input)
			rendered, err := plugin.Render(tc.processed)

			if tc.expectedErrorStr != "" {
				assert.EqualError(t, err, tc.expectedErrorStr)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.processed[0], rendered)
			}
		})
	}
}
