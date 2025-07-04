package noop

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/template/plugins"
)

func TestScanner(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name  string
		input string
	}{
		{
			name:  "empty input",
			input: "",
		},
		{
			name:  "non-empty input",
			input: "foo bar",
		},
		{
			name:  "text with mustache templating is unchanged",
			input: "foo {{ bar }} baz {{ baz }}",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			plugin := Instance(&plugins.Input{Data: tc.input})
			assert.Equal(t, tc.input, plugin.Text())
			assert.Equal(t, tc.input, plugin.Value())

			assert.True(t, plugin.Scan())
			assert.False(t, plugin.Scan())
			assert.False(t, plugin.Scan())

			assert.Equal(t, tc.input, plugin.Text())
			assert.Equal(t, tc.input, plugin.Value())
		})
	}
}

func TestRender(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name             string
		input            string
		processed        []string
		expectedErrorStr string
	}{
		{
			name:             "empty processed values returns error",
			input:            "",
			processed:        []string{},
			expectedErrorStr: "noop plugin does not support empty processed values",
		},
		{
			name:             "multiple processed values returns error",
			input:            "[foo, bar, baz].join(',')",
			processed:        []string{"bar", "baz"},
			expectedErrorStr: "noop plugin does not support multiple processed values",
		},
		{
			name:      "single processed value is always returned",
			input:     "[foo, bar, baz].join(',')",
			processed: []string{"foo,bar,baz"},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			plugin := Instance(&plugins.Input{Data: tc.input})
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
