package plugin_executor

import (
	"testing"

	"go.uber.org/zap"
)

func TestNewOptions(t *testing.T) {
	tests := []struct {
		name     string
		opts     []Option
		expected Options
	}{
		{
			name:     "no options",
			opts:     nil,
			expected: Options{},
		},
		{
			name: "with language",
			opts: []Option{WithLanguage("python")},
			expected: Options{
				Language: "python",
			},
		},
		{
			name: "with language javascript",
			opts: []Option{WithLanguage("javascript")},
			expected: Options{
				Language: "javascript",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := NewOptions(tt.opts...)

			if result.Language != tt.expected.Language {
				t.Errorf("Language = %v, want %v", result.Language, tt.expected.Language)
			}
		})
	}
}

func TestWithLogger(t *testing.T) {
	logger := zap.NewNop()
	opts := NewOptions(WithLogger(logger))

	if opts.Logger != logger {
		t.Errorf("Logger was not set correctly")
	}
}

func TestOptionsChaining(t *testing.T) {
	logger := zap.NewNop()

	opts := NewOptions(
		WithLanguage("python"),
		WithLanguage("javascript"), // Should override
		WithLogger(logger),
	)

	if opts.Language != "javascript" {
		t.Errorf("Language = %v, want javascript (last value should win)", opts.Language)
	}
	if opts.Logger != logger {
		t.Errorf("Logger was not set correctly")
	}
}

func TestNewOptionsEmpty(t *testing.T) {
	opts := NewOptions()

	if opts.Language != "" {
		t.Errorf("Language should be empty string by default, got %v", opts.Language)
	}
	if opts.Logger != nil {
		t.Errorf("Logger should be nil by default")
	}
}
