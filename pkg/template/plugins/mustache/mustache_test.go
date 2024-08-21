package mustache

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMustacheScanner(t *testing.T) {
	for _, test := range []struct {
		name          string
		input         string
		expectedText  []string
		expectedValue []string
	}{
		{
			name:          "teplates with text",
			input:         "foo bar {{ templatedValue }} car {{ anotherTemplatedValue }}",
			expectedText:  []string{"{{ templatedValue }}", "{{ anotherTemplatedValue }}"},
			expectedValue: []string{" templatedValue ", " anotherTemplatedValue "},
		},
		{
			name:          "just templates",
			input:         "{{ foo }} {{ bar }} {{ baz }}",
			expectedText:  []string{"{{ foo }}", "{{ bar }}", "{{ baz }}"},
			expectedValue: []string{" foo ", " bar ", " baz "},
		},
		{
			name:          "just one template",
			input:         "{{ foo }}",
			expectedText:  []string{"{{ foo }}"},
			expectedValue: []string{" foo "},
		},
		{
			name:          "handling empty template",
			input:         "ignore me {{ }}",
			expectedText:  []string{"{{ }}"},
			expectedValue: []string{" "},
		},
		{
			name:          "handling empty template with multiple spaces",
			input:         "ignore me {{     }}",
			expectedText:  []string{"{{     }}"},
			expectedValue: []string{"     "},
		},
		{
			input:         "",
			expectedText:  nil,
			expectedValue: nil,
		},
		{
			input:         "no templates here",
			expectedText:  nil,
			expectedValue: nil,
		},
		{
			input:         "{{ no templates here{{}",
			expectedText:  nil,
			expectedValue: nil,
		},
		{
			name:          "complex stuff",
			input:         "{{ 2 + 2 }}",
			expectedText:  []string{"{{ 2 + 2 }}"},
			expectedValue: []string{" 2 + 2 "},
		},
	} {
		plugin := Plugin(test.input)

		var text []string
		var value []string
		{
			for plugin.Scan() {
				text = append(text, plugin.Text())
				value = append(value, plugin.Value())
			}
		}

		assert.Equal(t, test.expectedText, text, test.name)
		assert.Equal(t, test.expectedValue, value, test.name)
	}
}
