package utils

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNoOpTokenJoiner_PerformsTheSameAsStringSplitJoin(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input []string
	}{
		{
			name:  "nil input",
			input: nil,
		},
		{
			name:  "empty input",
			input: []string{},
		},
		{
			name:  "single input",
			input: []string{"foo"},
		},
		{
			name:  "multiple inputs",
			input: []string{"foo", "bar", "baz"},
		},
		{
			name:  "inputs with separator nested in content",
			input: []string{"foo, bar", "baz"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			noOpJoin := NoOpTokenJoiner.Join(tt.input)
			stdJoin := strings.Join(tt.input, ", ")

			assert.Equal(t, stdJoin, noOpJoin)

			noOpSplit := NoOpTokenJoiner.Split(noOpJoin)
			stdSplit := strings.Split(noOpJoin, ", ")

			assert.Equal(t, stdSplit, noOpSplit)
		})
	}
}

func TestNewTokenJoiner(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		opts           []Option
		expectedSep    string
		expectedEscape string
		expectError    bool
		errorStr       string
	}{
		{
			name:           "default configuration",
			opts:           []Option{},
			expectedSep:    ", ",
			expectedEscape: "__SEPARATOR_ESCAPE__",
			expectError:    false,
		},
		{
			name:           "custom separator",
			opts:           []Option{WithSeparator("|")},
			expectedSep:    "|",
			expectedEscape: "__SEPARATOR_ESCAPE__",
			expectError:    false,
		},
		{
			name:           "custom escape sequence",
			opts:           []Option{WithEscapeSequence("__CUSTOM__")},
			expectedSep:    ", ",
			expectedEscape: "__CUSTOM__",
			expectError:    false,
		},
		{
			name:           "custom separator and escape sequence",
			opts:           []Option{WithSeparator("::"), WithEscapeSequence("__ESC__")},
			expectedSep:    "::",
			expectedEscape: "__ESC__",
			expectError:    false,
		},
		{
			name:        "error when separator contains escape sequence",
			opts:        []Option{WithSeparator("__SEPARATOR_ESCAPE__test"), WithEscapeSequence("__SEPARATOR_ESCAPE__")},
			expectError: true,
			errorStr:    "separator \"__SEPARATOR_ESCAPE__test\" cannot contain \"__SEPARATOR_ESCAPE__\"",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			joiner, err := NewTokenJoiner(tt.opts...)

			if tt.expectError {
				assert.Nil(t, joiner)
				assert.EqualError(t, err, tt.errorStr)
			} else {
				assert.NotNil(t, joiner)
				assert.NoError(t, err)

				assert.Equal(t, tt.expectedSep, joiner.separator)
				assert.Equal(t, tt.expectedEscape, joiner.escapeSequence)
			}
		})
	}
}

func TestTokenJoiner_EmptyTokens(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		tokens []string
	}{
		{
			name:   "nil tokens",
			tokens: nil,
		},
		{
			name:   "empty tokens",
			tokens: []string{},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			joiner, err := NewTokenJoiner()
			require.NoError(t, err)

			joinResult := joiner.Join(tt.tokens)
			assert.Empty(t, joinResult)

			splitResult := joiner.Split(joinResult)
			assert.Equal(t, []string{""}, splitResult)
		})
	}
}

func TestTokenJoiner_JoinSplit(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name            string
		opts            []Option
		tokens          []string
		expectedJoinStr string
	}{
		{
			name:            "single token",
			opts:            []Option{},
			tokens:          []string{"token1"},
			expectedJoinStr: "token1",
		},
		{
			name:            "multiple tokens without separator in content",
			opts:            []Option{},
			tokens:          []string{"token1", "token2", "token3"},
			expectedJoinStr: "token1, token2, token3",
		},
		{
			name:            "tokens with separator in content",
			opts:            []Option{},
			tokens:          []string{"token1", "token, with, commas", "token3"},
			expectedJoinStr: "token1, token__SEPARATOR_ESCAPE__with__SEPARATOR_ESCAPE__commas, token3",
		},
		{
			name:            "custom separator and escape sequence",
			opts:            []Option{WithSeparator("|"), WithEscapeSequence("__CUSTOM__")},
			tokens:          []string{"token1", "token2", "token3"},
			expectedJoinStr: "token1|token2|token3",
		},
		{
			name:            "custom separator and escape sequence with content containing separator",
			opts:            []Option{WithSeparator("|"), WithEscapeSequence("__CUSTOM__")},
			tokens:          []string{"token1", "token|with|pipes", "token3"},
			expectedJoinStr: "token1|token__CUSTOM__with__CUSTOM__pipes|token3",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			joiner, err := NewTokenJoiner(tt.opts...)
			require.NoError(t, err)

			joinResult := joiner.Join(tt.tokens)
			assert.Equal(t, tt.expectedJoinStr, joinResult)

			splitResult := joiner.Split(joinResult)
			assert.Equal(t, tt.tokens, splitResult)
		})
	}
}
