package utils

import (
	"sort"
	"testing"

	"github.com/stretchr/testify/assert"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestUnwrap(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name        string
		template    string
		expected    string
		expectError bool
	}{
		{
			name:        "Valid template",
			template:    "{{ hello }}",
			expected:    "hello",
			expectError: false,
		},
		{
			name:        "Invalid template - missing opening",
			template:    "hello }}",
			expectError: true,
		},
		{
			name:        "Invalid template - missing closing",
			template:    "{{ hello ",
			expectError: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, err := Unwrap(test.template)
			if test.expectError {
				if err == nil {
					t.Errorf("Expected an error, but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, but got: %v", err)
				}
				if result != test.expected {
					t.Errorf("Expected result to be %s, but got %s", test.expected, result)
				}
			}
		})
	}
}

func TestIsTemplate(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		template string
		expected bool
	}{
		{
			name:     "Valid template",
			template: "{{ hello }}",
			expected: true,
		},
		{
			name:     "Invalid template - missing opening",
			template: "hello }}",
			expected: false,
		},
		{
			name:     "Invalid template - missing closing",
			template: "{{ hello ",
			expected: false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result := IsTemplate(test.template)
			if result != test.expected {
				t.Errorf("Expected result to be %t, but got %t", test.expected, result)
			}
		})
	}
}

func TestConvertToString(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		input    any
		expected string
	}{
		{
			name:     "String",
			input:    "hello",
			expected: "hello",
		},
		{
			name:     "Int",
			input:    123,
			expected: "123",
		},
		{
			name:     "Int64",
			input:    int64(123),
			expected: "123",
		},
		{
			name:     "Float64",
			input:    float64(123.45),
			expected: "123.45",
		},
		{
			name:     "Bool",
			input:    true,
			expected: "true",
		},
		{
			name:     "Unknown type",
			input:    byte(1),
			expected: "",
		},
		{
			name:     "nil input",
			input:    nil,
			expected: "",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result := ConvertToString(test.input)
			assert.Equal(t, test.expected, result)
		})
	}
}

func TestEscape(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Escape newline",
			input:    "hello\nworld",
			expected: "hello\\nworld",
		},
		{
			name:     "No newline",
			input:    "hello world",
			expected: "hello world",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result := Escape(test.input)
			if result != test.expected {
				t.Errorf("Expected result to be %s, but got %s", test.expected, result)
			}
		})
	}
}

func TestMergeMaps(t *testing.T) {
	tests := []struct {
		name   string
		input  []map[string]any
		output map[string]any
	}{
		{
			name: "empty maps",
			input: []map[string]any{
				{},
				{},
			},
			output: map[string]any{},
		},
		{
			name: "single map",
			input: []map[string]any{
				{"a": 1, "b": 2},
			},
			output: map[string]any{"a": 1, "b": 2},
		},
		{
			name: "multiple maps, no overlap",
			input: []map[string]any{
				{"a": 1},
				{"b": 2},
			},
			output: map[string]any{"a": 1, "b": 2},
		},
		{
			name: "multiple maps, with overlap",
			input: []map[string]any{
				{"a": 1, "b": 2},
				{"b": 3, "c": 4},
			},
			output: map[string]any{"a": 1, "b": 3, "c": 4},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.output, MergeMaps(tt.input...))
		})
	}
}

func TestObjectKeys(t *testing.T) {
	tests := []struct {
		name   string
		input  map[string]any
		output []string
	}{
		{
			name:   "empty map",
			input:  map[string]any{},
			output: nil,
		},
		{
			name:   "non-empty map",
			input:  map[string]any{"a": 1, "b": 2, "c": 3},
			output: []string{"a", "b", "c"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			expected := tt.output
			actual := ObjectKeys(tt.input)

			sort.Strings(expected)
			sort.Strings(actual)

			assert.Equal(t, expected, actual)
		})
	}
}

func TestIntegrationsToSecretStores(t *testing.T) {
	cfg, err := structpb.NewStruct(map[string]interface{}{
		"provider": map[string]interface{}{
			"mock": map[string]interface{}{
				"data": map[string]interface{}{
					"shhh": "secret",
				},
			},
		},
	})
	assert.NoError(t, err)

	tests := []struct {
		name string
		in   []*integrationv1.Integration
		out  []*secretsv1.Store
		err  bool
	}{
		{
			name: "empty integration",
			in:   nil,
			out:  nil,
			err:  false,
		},
		{
			name: "empty configuration",
			in: []*integrationv1.Integration{
				{
					Configurations: []*integrationv1.Configuration{},
				},
			},
			out: nil,
			err: false,
		},
		{
			name: "more than one configuration",
			in: []*integrationv1.Integration{
				{
					Configurations: []*integrationv1.Configuration{
						{
							Id:            "c1",
							Configuration: cfg,
						},
						{
							Id:            "c1",
							Configuration: cfg,
						},
					},
				},
			},
			out: nil,
			err: true,
		},
		{
			name: "valid configuration",
			in: []*integrationv1.Integration{
				{
					Name:           "name",
					OrganizationId: "org",
					Slug:           "slug",
					Configurations: []*integrationv1.Configuration{
						{
							Id:            "c1",
							Configuration: cfg,
						},
					},
				},
			},
			out: []*secretsv1.Store{
				{
					ConfigurationId: "c1",
					Metadata: &commonv1.Metadata{
						Name:         "slug",
						Organization: "org",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_Mock{
							Mock: &secretsv1.MockStore{
								Data: map[string]string{
									"shhh": "secret",
								},
							},
						},
					},
				},
			},
			err: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			out, err := IntegrationsToSecretStores(tt.in)

			if tt.err {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)
			assert.Equal(t, len(out), len(tt.out))

			for idx, store := range out {
				assert.True(t, proto.Equal(tt.out[idx], store), "expected %v, got %v", tt.out[idx], store)
			}
		})
	}
}

func TestIsSubset(t *testing.T) {
	for _, test := range []struct {
		name   string
		a, b   map[string]any
		result bool
	}{
		{
			name:   "empty maps",
			a:      map[string]any{},
			b:      map[string]any{},
			result: true,
		},
		{
			name:   "empty map",
			a:      map[string]any{},
			b:      map[string]any{"a": 1},
			result: true,
		},
		{
			name:   "empty map",
			a:      map[string]any{"a": 1},
			b:      map[string]any{},
			result: false,
		},
		{
			name:   "subset",
			a:      map[string]any{"a": 1},
			b:      map[string]any{"a": 1, "b": 2},
			result: true,
		},
		{
			name:   "subset",
			a:      map[string]any{"a": 1},
			b:      map[string]any{"a": 2, "b": 2},
			result: false,
		},
		{
			name:   "subset",
			a:      map[string]any{"a": 1, "b": 2},
			b:      map[string]any{"a": 1},
			result: false,
		},
		{
			name:   "equal",
			a:      map[string]any{"a": 1, "b": 2},
			b:      map[string]any{"a": 1, "b": 2},
			result: true,
		},
		{
			name: "complex",
			a: map[string]any{
				"a": 1,
				"b": map[string]any{
					"c": 3,
				},
			},
			b: map[string]any{
				"a": 1,
				"b": map[string]any{
					"c": 3,
					"d": 4,
				},
			},
			result: true,
		},
		{
			name: "complex",
			a: map[string]any{
				"a": 1,
				"b": map[string]any{
					"c": 3,
				},
			},
			b: map[string]any{
				"a": 1,
				"b": map[string]any{
					"c": "3",
					"d": 4,
				},
			},
			result: false,
		},
		{
			name: "complex",
			a: map[string]any{
				"a": 1,
				"b": map[string]any{
					"c": 3,
				},
			},
			b: map[string]any{
				"a": 1,
				"b": map[string]any{
					"c": "3",
					"d": 4,
				},
			},
			result: false,
		},
		{
			a:      map[string]any{"a": 1},
			b:      map[string]any{"a": "1"},
			result: false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.result, IsSubset(test.a, test.b))
		})
	}
}
