package plugins

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestInputMetadata_GetFieldName(t *testing.T) {
	tests := []struct {
		name     string
		metadata *InputMetadata
		expected string
	}{
		{
			name:     "nil metadata returns empty string",
			metadata: nil,
			expected: "",
		},
		{
			name:     "empty field name returns empty string",
			metadata: &InputMetadata{FieldName: ""},
			expected: "",
		},
		{
			name:     "valid field name returns field name",
			metadata: &InputMetadata{FieldName: "testField"},
			expected: "testField",
		},
		{
			name:     "field name with spaces",
			metadata: &InputMetadata{FieldName: "field with spaces"},
			expected: "field with spaces",
		},
		{
			name:     "field name with special characters",
			metadata: &InputMetadata{FieldName: "field_name-123"},
			expected: "field_name-123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.metadata.GetFieldName()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestInput_GetData(t *testing.T) {
	tests := []struct {
		name     string
		input    *Input
		expected string
	}{
		{
			name:     "nil input returns empty string",
			input:    nil,
			expected: "",
		},
		{
			name:     "empty data returns empty string",
			input:    &Input{Data: ""},
			expected: "",
		},
		{
			name:     "valid data returns data",
			input:    &Input{Data: "test data"},
			expected: "test data",
		},
		{
			name:     "data with newlines",
			input:    &Input{Data: "line1\nline2\nline3"},
			expected: "line1\nline2\nline3",
		},
		{
			name:     "data with template syntax",
			input:    &Input{Data: "Hello {{ name }}!"},
			expected: "Hello {{ name }}!",
		},
		{
			name:     "data with special characters",
			input:    &Input{Data: "special chars: !@#$%^&*()"},
			expected: "special chars: !@#$%^&*()",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.input.GetData()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestInput_GetMeta(t *testing.T) {
	tests := []struct {
		name     string
		input    *Input
		expected *InputMetadata
	}{
		{
			name:     "nil input returns nil",
			input:    nil,
			expected: nil,
		},
		{
			name:     "nil metadata returns nil",
			input:    &Input{Meta: nil},
			expected: nil,
		},
		{
			name:     "valid metadata returns metadata",
			input:    &Input{Meta: &InputMetadata{FieldName: "testField"}},
			expected: &InputMetadata{FieldName: "testField"},
		},
		{
			name:     "empty metadata returns empty metadata",
			input:    &Input{Meta: &InputMetadata{}},
			expected: &InputMetadata{},
		},
		{
			name: "input with both data and metadata",
			input: &Input{
				Data: "some data",
				Meta: &InputMetadata{FieldName: "dataField"},
			},
			expected: &InputMetadata{FieldName: "dataField"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.input.GetMeta()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestInput_Integration(t *testing.T) {
	tests := []struct {
		name         string
		input        *Input
		expectedData string
		expectedMeta *InputMetadata
	}{
		{
			name:         "nil input returns defaults",
			input:        nil,
			expectedData: "",
			expectedMeta: nil,
		},
		{
			name: "complete input with data and metadata",
			input: &Input{
				Data: "template content {{ value }}",
				Meta: &InputMetadata{FieldName: "templateField"},
			},
			expectedData: "template content {{ value }}",
			expectedMeta: &InputMetadata{FieldName: "templateField"},
		},
		{
			name: "input with data but no metadata",
			input: &Input{
				Data: "just data",
				Meta: nil,
			},
			expectedData: "just data",
			expectedMeta: nil,
		},
		{
			name: "input with metadata but no data",
			input: &Input{
				Data: "",
				Meta: &InputMetadata{FieldName: "emptyDataField"},
			},
			expectedData: "",
			expectedMeta: &InputMetadata{FieldName: "emptyDataField"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data := tt.input.GetData()
			meta := tt.input.GetMeta()

			assert.Equal(t, tt.expectedData, data)
			assert.Equal(t, tt.expectedMeta, meta)

			// If metadata is not nil, test GetFieldName as well
			if tt.expectedMeta != nil {
				assert.Equal(t, tt.expectedMeta.FieldName, meta.GetFieldName())
			}
		})
	}
}
