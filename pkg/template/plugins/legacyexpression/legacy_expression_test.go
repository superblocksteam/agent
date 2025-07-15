package legacyexpression

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/template/plugins"
)

func TestPlugin(t *testing.T) {
	input := &plugins.Input{
		Data: "test input",
	}

	plugin := Plugin(input)
	assert.NotNil(t, plugin)

	le, ok := plugin.(*legacyExpression)
	assert.True(t, ok)
	assert.Equal(t, "test input", le.input)
	assert.False(t, le.scanned)
	assert.Equal(t, "", le.value)
	assert.Equal(t, 0, le.start)
	assert.Equal(t, 0, le.pos)
}

func TestLegacyExpression_Text(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{
			name:  "simple text",
			input: "hello world",
		},
		{
			name:  "empty string",
			input: "",
		},
		{
			name:  "template literal",
			input: "`hello ${world}`",
		},
		{
			name:  "IIFE expression",
			input: "(() => { return 42; })()",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			le := &legacyExpression{
				input:   tt.input,
				scanned: false,
				value:   "",
				start:   0,
				pos:     0,
			}
			assert.Equal(t, tt.input, le.Text())
		})
	}
}

func TestLegacyExpression_Value(t *testing.T) {
	tests := []struct {
		name          string
		input         string
		expectedValue string
		shouldScan    bool
	}{
		{
			name:          "no scan performed",
			input:         "test",
			expectedValue: "",
			shouldScan:    false,
		},
		{
			name:          "after scan with empty value",
			input:         "simple text",
			expectedValue: "",
			shouldScan:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			le := &legacyExpression{
				input:   tt.input,
				scanned: false,
				value:   "",
				start:   0,
				pos:     0,
			}

			if tt.shouldScan {
				le.Scan()
			}

			assert.Equal(t, tt.expectedValue, le.Value())
		})
	}
}

func TestLegacyExpression_Scan(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		input          string
		expectedValues []string
	}{
		{
			name:           "empty string",
			input:          "",
			expectedValues: []string{},
		},
		{
			name:           "non-legacy expression (simple string)",
			input:          "hello world",
			expectedValues: []string{},
		},
		{
			name:           "IIFE expression",
			input:          "(() => { return 42; })()",
			expectedValues: []string{"(() => { return 42; })()"},
		},
		{
			name:           "IIFE expression with whitespace",
			input:          "\n\t(() => { return 42; })()\n\t",
			expectedValues: []string{"\n\t(() => { return 42; })()\n\t"},
		},
		{
			name:           "template literal with no nested expressions",
			input:          "`hello world`",
			expectedValues: []string{},
		},
		{
			name:  "template literal with expression",
			input: "`The input value received is: ${Input1.value}`",
			expectedValues: []string{
				"${Input1.value}",
			},
		},
		{
			name:  "template literal with multiple expressions",
			input: "`The result of executing ${API1.name} with '${Input1.value}' is: ${API1.output}. Thanks.`",
			expectedValues: []string{
				"${API1.name}",
				"${Input1.value}",
				"${API1.output}",
			},
		},
		{
			name:  "template literal with multiple expressions, with whitespace",
			input: "    \n`The result of executing ${API1.name} with '${Input1.value}' is: ${API1.output}. Thanks.`\n\t\t",
			expectedValues: []string{
				"${API1.name}",
				"${Input1.value}",
				"${API1.output}",
			},
		},
		{
			name:  "template literal with nested expressions",
			input: "`Testing ${API1.names[${Input1.pos}]} with '${Input1.value}' succeeded.`",
			expectedValues: []string{
				"${API1.names[${Input1.pos}]}",
				"${Input1.value}",
			},
		},
		{
			name:           "template literal with malformed expression",
			input:          "`Testing ${API1.names[0] with {{ Input1.value }} succeeded.`",
			expectedValues: []string{},
		},
		{
			name:  "template literal with valid and malformed expressions",
			input: "`Testing ${API1.names[${Input1.pos}] with '${Input1.value}' succeeded.`",
			expectedValues: []string{
				"${Input1.pos}",
				"${Input1.value}",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			le := Plugin(&plugins.Input{
				Data: tt.input,
			})

			for i := 0; i < len(tt.expectedValues); i++ {
				assert.True(t, le.Scan())
				assert.Equal(t, tt.expectedValues[i], le.Value())
			}

			assert.False(t, le.Scan())
			assert.Empty(t, le.Value())
		})
	}
}

func TestLegacyExpression_Render(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		input     string
		processed []string
		expected  string
	}{
		{
			name:      "no changes to input",
			input:     "hello world",
			processed: []string{},
			expected:  "hello world",
		},
		{
			name:  "no changes to input (with processed data)",
			input: "hello world",
			processed: []string{
				"{{ hello world }}",
			},
			expected: "hello world",
		},
		{
			name:  "iife expression",
			input: "(() => 'hello world')()",
			processed: []string{
				"{{ (() => 'hello world')() }}",
			},
			expected: "{{ (() => 'hello world')() }}",
		},
		{
			name:      "template literal, no expressions",
			input:     "`hello world`",
			processed: []string{},
			expected:  "hello world",
		},
		{
			name:      "template literal, no expressions (with whitespace)",
			input:     " \t`hello world`\n     ",
			processed: []string{},
			expected:  " \thello world\n     ",
		},
		{
			name:  "template literal with expression",
			input: "`The input value received is: ${Input1.value}`",
			processed: []string{
				"{{ Input1.value }}",
			},
			expected: "The input value received is: {{ Input1.value }}",
		},
		{
			name:  "template literal with multiple expressions",
			input: "`The result of executing ${API1.name} with '${Input1.value}' is: ${API1.output}. Thanks.`",
			processed: []string{
				"{{ API1.name }}",
				"{{ Input1.value }}",
				"{{ API1.output }}",
			},
			expected: "The result of executing {{ API1.name }} with '{{ Input1.value }}' is: {{ API1.output }}. Thanks.",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			le := &legacyExpression{
				input:   tt.input,
				scanned: true,
			}

			result, err := le.Render(tt.processed)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestLegacyExpression_Render_FailsWhenNotPreviouslyScanned(t *testing.T) {
	le := &legacyExpression{
		input: "(() => 'hello world')()",
	}

	_, err := le.Render([]string{"{{ (() => 'hello world')() }}"})
	assert.EqualError(t, err, "render can only be invoked after a full scan")
}

func TestTrimBackticks(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "simple string without backticks",
			input:    "hello world",
			expected: "hello world",
		},
		{
			name:     "string with backticks",
			input:    "`hello world`",
			expected: "hello world",
		},
		{
			name:     "string with backticks and whitespace",
			input:    "  `hello world`  ",
			expected: "  hello world  ",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "empty backticks",
			input:    "``",
			expected: "",
		},
		{
			name:     "whitespace only inside backticks",
			input:    "`   `",
			expected: "   ",
		},
		{
			name:     "single backtick",
			input:    "`",
			expected: "`",
		},
		{
			name:     "string with only opening backtick",
			input:    "`hello world",
			expected: "`hello world",
		},
		{
			name:     "string with only closing backtick",
			input:    "hello world`",
			expected: "hello world`",
		},
		{
			name:     "nested backticks",
			input:    "`hello `nested` world`",
			expected: "hello `nested` world",
		},
		{
			name:     "string with backticks in middle",
			input:    "start `first` middle `second` end",
			expected: "start `first` middle `second` end",
		},
		{
			name:     "backticks with newlines",
			input:    "`hello\nworld`",
			expected: "hello\nworld",
		},
		{
			name:     "backticks with special characters",
			input:    "`hello @#$%^&*() world`",
			expected: "hello @#$%^&*() world",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := trimBackticks(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestLegacyExpression_Integration(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		input          string
		expectedValues []string
		transformFn    func(string) string
		expectedOutput string
	}{
		{
			name:           "simple text - no expressions",
			input:          "Hello world",
			expectedValues: []string{},
			transformFn:    func(s string) string { return fmt.Sprintf("{{ %s }}", s) },
			expectedOutput: "Hello world",
		},
		{
			name:           "IIFE expression",
			input:          "(() => { return 'Hello world'; })()",
			expectedValues: []string{"(() => { return 'Hello world'; })()"},
			transformFn:    func(s string) string { return fmt.Sprintf("{{ %s }}", s) },
			expectedOutput: "{{ (() => { return 'Hello world'; })() }}",
		},
		{
			name:           "template literal without expressions",
			input:          "`Hello world`",
			expectedValues: []string{},
			transformFn:    func(s string) string { return fmt.Sprintf("{{ %s }}", s) },
			expectedOutput: "Hello world",
		},
		{
			name:           "template literal with single expression",
			input:          "`Hello ${name}!`",
			expectedValues: []string{"${name}"},
			transformFn:    func(s string) string { return fmt.Sprintf("{{ Input1.%s }}", s[2:len(s)-1]) },
			expectedOutput: "Hello {{ Input1.name }}!",
		},
		{
			name:  "template literal with multiple expressions",
			input: "`The result of executing ${API1.name} with '${Input1.value}' is: ${API1.output}. Thanks.`",
			expectedValues: []string{
				"${API1.name}",
				"${Input1.value}",
				"${API1.output}",
			},
			transformFn: func(s string) string {
				// Transform ${variable} to {{ variable }}
				return fmt.Sprintf("{{ %s }}", s[2:len(s)-1])
			},
			expectedOutput: "The result of executing {{ API1.name }} with '{{ Input1.value }}' is: {{ API1.output }}. Thanks.",
		},
		{
			name:  "template literal with nested expressions",
			input: "`User ${user.name} has ${items[${user.id}].count} items`",
			expectedValues: []string{
				"${user.name}",
				"${items[${user.id}].count}",
			},
			transformFn: func(s string) string {
				// Transform ${variable} to {{ variable }}
				return fmt.Sprintf("{{ %s }}", s[2:len(s)-1])
			},
			expectedOutput: "User {{ user.name }} has {{ items[${user.id}].count }} items",
		},
		{
			name:  "template literal with whitespace",
			input: "   \n`Processing ${task.name} started at ${timestamp}`\t   ",
			expectedValues: []string{
				"${task.name}",
				"${timestamp}",
			},
			transformFn: func(s string) string {
				// Transform ${variable} to {{ variable }}
				return fmt.Sprintf("{{ %s }}", s[2:len(s)-1])
			},
			expectedOutput: "   \nProcessing {{ task.name }} started at {{ timestamp }}\t   ",
		},
		{
			name:  "complex integration with custom transformation",
			input: "`Alert: ${severity} - ${message} (Source: ${source.system})`",
			expectedValues: []string{
				"${severity}",
				"${message}",
				"${source.system}",
			},
			transformFn: func(s string) string {
				// Custom transformation that adds type information
				variable := s[2 : len(s)-1] // Remove ${ and }
				return fmt.Sprintf("{{ %s | default('unknown') }}", variable)
			},
			expectedOutput: "Alert: {{ severity | default('unknown') }} - {{ message | default('unknown') }} (Source: {{ source.system | default('unknown') }})",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create the plugin
			plugin := Plugin(&plugins.Input{
				Data: tt.input,
			})

			// Verify Text() method returns original input
			assert.Equal(t, tt.input, plugin.Text())

			// Step 1: Scan for all expressions
			scannedValues := []string{}
			for plugin.Scan() {
				value := plugin.Value()
				scannedValues = append(scannedValues, value)
			}

			// Verify we got the expected values
			assert.Equal(t, tt.expectedValues, scannedValues, "Scanned values should match expected")

			// Step 2: Transform the scanned values
			transformedValues := make([]string, len(scannedValues))
			for i, value := range scannedValues {
				transformedValues[i] = tt.transformFn(value)
			}

			// Step 3: Render with transformed values
			output, err := plugin.Render(transformedValues)
			require.NoError(t, err, "Render should not return an error")

			// Verify final output
			assert.Equal(t, tt.expectedOutput, output, "Final rendered output should match expected")
		})
	}
}
