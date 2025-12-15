package sandbox

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
			name: "with address",
			opts: []Option{WithAddress("localhost:50051")},
			expected: Options{
				Address: "localhost:50051",
			},
		},
		{
			name: "with language",
			opts: []Option{WithLanguage("python")},
			expected: Options{
				Language: "python",
			},
		},
		{
			name: "with variable store address",
			opts: []Option{WithVariableStoreAddress("localhost:50052")},
			expected: Options{
				VariableStoreAddress: "localhost:50052",
			},
		},
		{
			name: "with all options",
			opts: []Option{
				WithAddress("localhost:50051"),
				WithLanguage("javascript"),
				WithVariableStoreAddress("localhost:50052"),
			},
			expected: Options{
				Address:              "localhost:50051",
				Language:             "javascript",
				VariableStoreAddress: "localhost:50052",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := NewOptions(tt.opts...)

			if result.Address != tt.expected.Address {
				t.Errorf("Address = %v, want %v", result.Address, tt.expected.Address)
			}
			if result.Language != tt.expected.Language {
				t.Errorf("Language = %v, want %v", result.Language, tt.expected.Language)
			}
			if result.VariableStoreAddress != tt.expected.VariableStoreAddress {
				t.Errorf("VariableStoreAddress = %v, want %v", result.VariableStoreAddress, tt.expected.VariableStoreAddress)
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
		WithAddress("addr1"),
		WithAddress("addr2"), // Should override
		WithLanguage("python"),
		WithLogger(logger),
	)

	if opts.Address != "addr2" {
		t.Errorf("Address = %v, want addr2 (last value should win)", opts.Address)
	}
	if opts.Language != "python" {
		t.Errorf("Language = %v, want python", opts.Language)
	}
	if opts.Logger != logger {
		t.Errorf("Logger was not set correctly")
	}
}
