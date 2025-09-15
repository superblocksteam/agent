package legacyexpression

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/utils"
)

func TestLegacyExpressionValue_Result(t *testing.T) {
	tests := []struct {
		name     string
		value    []string
		expected []string
	}{
		{
			name:     "empty slice",
			value:    []string{},
			expected: []string{},
		},
		{
			name:     "single item",
			value:    []string{"{{test}}"},
			expected: []string{"{{test}}"},
		},
		{
			name:     "multiple items",
			value:    []string{"{{item1}}", "{{item2}}", "{{item3}}"},
			expected: []string{"{{item1}}", "{{item2}}", "{{item3}}"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			l := &legacyExpressionValue{value: tt.value}
			result, err := l.Result()
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestLegacyExpressionValue_JSON(t *testing.T) {
	tests := []struct {
		name     string
		value    []string
		expected string
	}{
		{
			name:     "empty slice",
			value:    []string{},
			expected: "[]",
		},
		{
			name:     "single item",
			value:    []string{"{{test}}"},
			expected: `["{{test}}"]`,
		},
		{
			name:     "multiple items",
			value:    []string{"{{item1}}", "{{item2}}"},
			expected: `["{{item1}}","{{item2}}"]`,
		},
		{
			name:     "items with special characters",
			value:    []string{"{{item with spaces}}", "{{item\"with\"quotes}}"},
			expected: `["{{item with spaces}}","{{item\"with\"quotes}}"]`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			l := &legacyExpressionValue{value: tt.value}
			result, err := l.JSON()
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestLegacyExpressionValue_Err(t *testing.T) {
	l := &legacyExpressionValue{value: []string{"test"}}
	assert.NoError(t, l.Err())
}

func TestLegacyExpressionValue_Console(t *testing.T) {
	l := &legacyExpressionValue{value: []string{"test"}}
	assert.Nil(t, l.Console())
}

func TestResolver(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "simple input without wrappers",
			input:    "test",
			expected: []string{"{{test}}"},
		},
		{
			name:     "input with mustache wrappers",
			input:    "{{test}}",
			expected: []string{"{{test}}"},
		},
		{
			name:     "input with square brackets",
			input:    "[test]",
			expected: []string{"{{test}}"},
		},
		{
			name:     "input with both mustache and square brackets",
			input:    "{{[test]}}",
			expected: []string{"{{test}}"},
		},
		{
			name:     "input with both square brackets and mustache (reverse order)",
			input:    "[{{test}}]",
			expected: []string{"{{{{test}}}}"},
		},
		{
			name:     "multiple items separated by comma and space",
			input:    "item1, item2, item3",
			expected: []string{"{{item1}}", "{{item2}}", "{{item3}}"},
		},
		{
			name:     "multiple items with mustache wrappers",
			input:    "{{item1, item2, item3}}",
			expected: []string{"{{item1}}", "{{item2}}", "{{item3}}"},
		},
		{
			name:     "multiple items with square brackets",
			input:    "[item1, item2, item3]",
			expected: []string{"{{item1}}", "{{item2}}", "{{item3}}"},
		},
		{
			name:     "multiple items with both wrappers",
			input:    "{{[item1, item2, item3]}}",
			expected: []string{"{{item1}}", "{{item2}}", "{{item3}}"},
		},
		{
			name:     "input with ${} syntax",
			input:    "${variable}",
			expected: []string{"{{variable}}"},
		},
		{
			name:     "mixed ${} and regular syntax",
			input:    "${var1}, regular, ${var2}",
			expected: []string{"{{var1}}", "{{regular}}", "{{var2}}"},
		},
		{
			name:     "complex example with all wrappers and ${} syntax",
			input:    "  {{  [ ${var1},   regular, ${var2}    ] }}",
			expected: []string{"{{var1}}", "{{  regular}}", "{{var2}}"},
		},
		{
			name:     "single item with extra whitespace",
			input:    "  test  ",
			expected: []string{"{{test}}"},
		},
		{
			name:     "empty input",
			input:    "",
			expected: []string{},
		},
		{
			name:     "only mustache wrappers with no content",
			input:    "{{ }}",
			expected: []string{},
		},
		{
			name:     "only square brackets with no content",
			input:    "[ ]",
			expected: []string{},
		},
		{
			name:     "empty both wrappers",
			input:    "{{[]}}",
			expected: []string{},
		},
		{
			name:     "whitespace only",
			input:    "   ",
			expected: []string{},
		},
		{
			name:     "items with internal commas (no space after comma)",
			input:    "item1,item2,item3",
			expected: []string{"{{item1,item2,item3}}"},
		},
		{
			name:     "partial ${} syntax (missing closing brace)",
			input:    "${incomplete, normal",
			expected: []string{"{{${incomplete}}", "{{normal}}"},
		},
		{
			name:     "partial ${} syntax (missing opening brace)",
			input:    "incomplete}, normal",
			expected: []string{"{{incomplete}}}", "{{normal}}"},
		},
		{
			name:     "nested curly braces",
			input:    "{{object.{key}}}",
			expected: []string{"{{object.{key}}}"},
		},
		{
			name:     "comma-space escape sequence in input",
			input:    "{{ [ ${JSON.stringify(['apple'__SEPARATOR_ESCAPE__'banana'__SEPARATOR_ESCAPE__'orange'])} ] }}",
			expected: []string{"{{JSON.stringify(['apple', 'banana', 'orange'])}}"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			tokenJoiner, err := utils.NewTokenJoiner()
			require.NoError(t, err)

			result := Resolver(ctx, tokenJoiner, tt.input)

			// Cast to legacyExpressionValue to access the value
			lev, ok := result.(*legacyExpressionValue)
			assert.True(t, ok, "Result should be of type *legacyExpressionValue")
			assert.Equal(t, tt.expected, lev.value)

			// Also test the Result() method
			resultValue, err := result.Result()
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, resultValue)
		})
	}
}

func TestResolver_EngineValueInterface(t *testing.T) {
	ctx := context.Background()
	tokenJoiner, err := utils.NewTokenJoiner()
	require.NoError(t, err)

	result := Resolver(ctx, tokenJoiner, "test")

	// Verify that the result implements the engine.Value interface
	_, ok := result.(engine.Value)
	assert.True(t, ok, "Result should implement engine.Value interface")
}
