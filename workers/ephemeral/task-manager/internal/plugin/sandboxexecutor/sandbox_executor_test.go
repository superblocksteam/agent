package sandbox_executor

import (
	"context"
	"errors"
	"testing"

	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestConvertToValue(t *testing.T) {
	tests := []struct {
		name     string
		input    interface{}
		expected string // String representation for comparison
	}{
		{
			name:     "string value",
			input:    "hello",
			expected: "hello",
		},
		{
			name:     "int value",
			input:    42,
			expected: "42",
		},
		{
			name:     "int32 value",
			input:    int32(42),
			expected: "42",
		},
		{
			name:     "int64 value",
			input:    int64(42),
			expected: "42",
		},
		{
			name:     "float64 value",
			input:    3.14,
			expected: "3.14",
		},
		{
			name:     "bool true",
			input:    true,
			expected: "true",
		},
		{
			name:     "bool false",
			input:    false,
			expected: "false",
		},
		{
			name:     "nil value",
			input:    nil,
			expected: "null",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertToValue(tt.input)
			if result == nil {
				t.Errorf("convertToValue returned nil")
				return
			}

			// Check the kind matches expected
			switch tt.input.(type) {
			case string:
				if result.GetStringValue() != tt.expected {
					t.Errorf("string value = %v, want %v", result.GetStringValue(), tt.expected)
				}
			case int, int32, int64, float64:
				// Numbers are compared as float64
			case bool:
				if result.GetBoolValue() != tt.input.(bool) {
					t.Errorf("bool value = %v, want %v", result.GetBoolValue(), tt.input)
				}
			case nil:
				if result.GetNullValue() != structpb.NullValue_NULL_VALUE {
					t.Errorf("expected null value")
				}
			}
		})
	}
}

func TestConvertToValueMap(t *testing.T) {
	input := map[string]interface{}{
		"key1": "value1",
		"key2": 42,
	}

	result := convertToValue(input)
	if result == nil {
		t.Fatal("convertToValue returned nil for map")
	}

	structVal := result.GetStructValue()
	if structVal == nil {
		t.Fatal("expected struct value for map input")
	}

	fields := structVal.GetFields()
	if len(fields) != 2 {
		t.Errorf("expected 2 fields, got %d", len(fields))
	}
}

func TestConvertToValueStructpbValue(t *testing.T) {
	original := structpb.NewStringValue("test")
	result := convertToValue(original)

	if result != original {
		t.Errorf("structpb.Value should be returned as-is")
	}
}

func TestConvertToValueUnknownType(t *testing.T) {
	// Custom type should be converted to string
	type CustomType struct{}
	result := convertToValue(CustomType{})

	if result.GetStringValue() != "{}" {
		t.Errorf("unknown type should be converted to string, got %v", result.GetStringValue())
	}
}

func TestConvertToStructFields(t *testing.T) {
	input := map[string]interface{}{
		"string": "hello",
		"number": 42,
		"bool":   true,
	}

	result := convertToStructFields(input)

	if len(result) != 3 {
		t.Errorf("expected 3 fields, got %d", len(result))
	}

	if result["string"].GetStringValue() != "hello" {
		t.Errorf("string field = %v, want hello", result["string"].GetStringValue())
	}

	if result["number"].GetNumberValue() != 42 {
		t.Errorf("number field = %v, want 42", result["number"].GetNumberValue())
	}

	if result["bool"].GetBoolValue() != true {
		t.Errorf("bool field = %v, want true", result["bool"].GetBoolValue())
	}
}

func TestConvertToStructFieldsEmpty(t *testing.T) {
	result := convertToStructFields(map[string]interface{}{})

	if len(result) != 0 {
		t.Errorf("expected 0 fields for empty map, got %d", len(result))
	}
}

func TestSandboxPluginName(t *testing.T) {
	plugin := &SandboxExecutorPlugin{
		language: "python",
	}

	if plugin.Name() != "python" {
		t.Errorf("Name() = %v, want python", plugin.Name())
	}

	plugin.language = "javascript"
	if plugin.Name() != "javascript" {
		t.Errorf("Name() = %v, want javascript", plugin.Name())
	}
}

func TestSandboxPluginClose(t *testing.T) {
	// Test with nil connection and jobInfo
	plugin := &SandboxExecutorPlugin{
		conn:    nil,
		jobInfo: nil,
		logger:  zap.NewNop(),
	}

	// Should not panic
	plugin.Close(context.Background())
}

func TestSandboxPluginStream(t *testing.T) {
	plugin := &SandboxExecutorPlugin{}

	err := plugin.Stream(context.Background(), nil, nil, nil, nil, nil, nil)
	if !errors.Is(err, errors.ErrUnsupported) {
		t.Errorf("Stream() should return ErrUnsupported, got %v", err)
	}
}

func TestSandboxPluginMetadata(t *testing.T) {
	plugin := &SandboxExecutorPlugin{}

	result, err := plugin.Metadata(context.Background(), nil, nil, nil)
	if result != nil {
		t.Errorf("Metadata() should return nil result")
	}
	if !errors.Is(err, errors.ErrUnsupported) {
		t.Errorf("Metadata() should return ErrUnsupported, got %v", err)
	}
}

func TestSandboxPluginTest(t *testing.T) {
	plugin := &SandboxExecutorPlugin{}

	err := plugin.Test(context.Background(), nil, nil, nil)
	if !errors.Is(err, errors.ErrUnsupported) {
		t.Errorf("Test() should return ErrUnsupported, got %v", err)
	}
}

func TestSandboxPluginPreDelete(t *testing.T) {
	plugin := &SandboxExecutorPlugin{}

	err := plugin.PreDelete(context.Background(), nil, nil)
	if !errors.Is(err, errors.ErrUnsupported) {
		t.Errorf("PreDelete() should return ErrUnsupported, got %v", err)
	}
}

func TestGetCodeFromProps(t *testing.T) {
	logger := zap.NewNop()
	plugin := &SandboxExecutorPlugin{logger: logger}

	tests := []struct {
		name     string
		props    *transportv1.Request_Data_Data_Props
		expected string
	}{
		{
			name:     "nil props",
			props:    nil,
			expected: "",
		},
		{
			name: "with body field",
			props: &transportv1.Request_Data_Data_Props{
				ActionConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"body": structpb.NewStringValue("print('hello')"),
					},
				},
			},
			expected: "print('hello')",
		},
		{
			name: "without body field",
			props: &transportv1.Request_Data_Data_Props{
				ActionConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"other": structpb.NewStringValue("value"),
					},
				},
			},
			expected: "",
		},
		{
			name: "nil action configuration",
			props: &transportv1.Request_Data_Data_Props{
				ActionConfiguration: nil,
			},
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := plugin.getCodeFromProps(tt.props)
			if result != tt.expected {
				t.Errorf("getCodeFromProps() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestBuildContextJSON(t *testing.T) {
	logger := zap.NewNop()
	plugin := &SandboxExecutorPlugin{logger: logger}

	emptyContext := `{"globals":{},"outputs":{}}`

	tests := []struct {
		name           string
		props          *transportv1.Request_Data_Data_Props
		expectedResult string
	}{
		{
			name:           "nil props",
			props:          nil,
			expectedResult: emptyContext,
		},
		{
			name: "nil action configuration",
			props: &transportv1.Request_Data_Data_Props{
				ActionConfiguration: nil,
			},
			expectedResult: emptyContext,
		},
		{
			// Without a store or binding keys, even with action config, returns empty context
			name: "with action configuration but no store",
			props: &transportv1.Request_Data_Data_Props{
				ActionConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"key": structpb.NewStringValue("value"),
					},
				},
			},
			expectedResult: emptyContext,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := plugin.buildContextJSON(context.Background(), tt.props)
			if err != nil {
				t.Errorf("buildContextJSON() error = %v", err)
				return
			}
			if result != tt.expectedResult {
				t.Errorf("buildContextJSON() = %v, want %v", result, tt.expectedResult)
			}
		})
	}
}

func TestBuildVariablesJSON(t *testing.T) {
	logger := zap.NewNop()
	plugin := &SandboxExecutorPlugin{logger: logger}

	tests := []struct {
		name        string
		props       *transportv1.Request_Data_Data_Props
		expectEmpty bool
	}{
		{
			name:        "nil props",
			props:       nil,
			expectEmpty: true,
		},
		{
			name: "nil variables",
			props: &transportv1.Request_Data_Data_Props{
				Variables: nil,
			},
			expectEmpty: true,
		},
		{
			name: "empty variables",
			props: &transportv1.Request_Data_Data_Props{
				Variables: map[string]*transportv1.Variable{},
			},
			expectEmpty: true,
		},
		{
			name: "with variables",
			props: &transportv1.Request_Data_Data_Props{
				Variables: map[string]*transportv1.Variable{
					"var1": {
						Key: "key1",
					},
				},
			},
			expectEmpty: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := plugin.buildVariablesJSON(tt.props)
			if err != nil {
				t.Errorf("buildVariablesJSON() error = %v", err)
				return
			}
			if tt.expectEmpty && result != "{}" {
				t.Errorf("buildVariablesJSON() = %v, want {}", result)
			}
			if !tt.expectEmpty && result == "{}" {
				t.Errorf("buildVariablesJSON() = {}, want non-empty")
			}
		})
	}
}

func TestParseResultJSON(t *testing.T) {
	tests := []struct {
		name           string
		jsonResult     string
		expectNil      bool
		expectedKind   string // "string", "number", "bool", "null", "struct", "list"
		expectedString string // for string values
		expectedNumber float64
		expectedBool   bool
	}{
		{
			name:       "empty string returns nil",
			jsonResult: "",
			expectNil:  true,
		},
		{
			name:       "null string returns nil",
			jsonResult: "null",
			expectNil:  true,
		},
		{
			name:           "string value",
			jsonResult:     `"hello"`,
			expectedKind:   "string",
			expectedString: "hello",
		},
		{
			name:           "string with spaces",
			jsonResult:     `"hello world"`,
			expectedKind:   "string",
			expectedString: "hello world",
		},
		{
			name:           "integer value",
			jsonResult:     `42`,
			expectedKind:   "number",
			expectedNumber: 42,
		},
		{
			name:           "float value",
			jsonResult:     `3.14`,
			expectedKind:   "number",
			expectedNumber: 3.14,
		},
		{
			name:         "boolean true",
			jsonResult:   `true`,
			expectedKind: "bool",
			expectedBool: true,
		},
		{
			name:         "boolean false",
			jsonResult:   `false`,
			expectedKind: "bool",
			expectedBool: false,
		},
		{
			name:         "object/struct",
			jsonResult:   `{"key": "value", "num": 123}`,
			expectedKind: "struct",
		},
		{
			name:         "array/list",
			jsonResult:   `[1, 2, 3]`,
			expectedKind: "list",
		},
		{
			name:         "nested object",
			jsonResult:   `{"outer": {"inner": "value"}}`,
			expectedKind: "struct",
		},
		{
			name:         "array of objects",
			jsonResult:   `[{"a": 1}, {"b": 2}]`,
			expectedKind: "list",
		},
		{
			name:           "invalid json falls back to string",
			jsonResult:     `not valid json`,
			expectedKind:   "string",
			expectedString: "not valid json",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseResultJSON(tt.jsonResult)

			if tt.expectNil {
				if result != nil {
					t.Errorf("parseResultJSON(%q) = %v, want nil", tt.jsonResult, result)
				}
				return
			}

			if result == nil {
				t.Fatalf("parseResultJSON(%q) = nil, want non-nil", tt.jsonResult)
			}

			switch tt.expectedKind {
			case "string":
				if result.GetStringValue() != tt.expectedString {
					t.Errorf("parseResultJSON(%q) string = %q, want %q", tt.jsonResult, result.GetStringValue(), tt.expectedString)
				}
			case "number":
				if result.GetNumberValue() != tt.expectedNumber {
					t.Errorf("parseResultJSON(%q) number = %v, want %v", tt.jsonResult, result.GetNumberValue(), tt.expectedNumber)
				}
			case "bool":
				if result.GetBoolValue() != tt.expectedBool {
					t.Errorf("parseResultJSON(%q) bool = %v, want %v", tt.jsonResult, result.GetBoolValue(), tt.expectedBool)
				}
			case "struct":
				if result.GetStructValue() == nil {
					t.Errorf("parseResultJSON(%q) expected struct, got %v", tt.jsonResult, result.GetKind())
				}
			case "list":
				if result.GetListValue() == nil {
					t.Errorf("parseResultJSON(%q) expected list, got %v", tt.jsonResult, result.GetKind())
				}
			}
		})
	}
}

func TestParseResultJSONStructContents(t *testing.T) {
	jsonResult := `{"name": "test", "count": 42, "active": true}`
	result := parseResultJSON(jsonResult)

	if result == nil {
		t.Fatal("parseResultJSON returned nil")
	}

	structVal := result.GetStructValue()
	if structVal == nil {
		t.Fatal("expected struct value")
	}

	fields := structVal.GetFields()

	// Check name field
	if nameVal, ok := fields["name"]; !ok {
		t.Error("missing 'name' field")
	} else if nameVal.GetStringValue() != "test" {
		t.Errorf("name = %q, want %q", nameVal.GetStringValue(), "test")
	}

	// Check count field
	if countVal, ok := fields["count"]; !ok {
		t.Error("missing 'count' field")
	} else if countVal.GetNumberValue() != 42 {
		t.Errorf("count = %v, want %v", countVal.GetNumberValue(), 42)
	}

	// Check active field
	if activeVal, ok := fields["active"]; !ok {
		t.Error("missing 'active' field")
	} else if activeVal.GetBoolValue() != true {
		t.Errorf("active = %v, want %v", activeVal.GetBoolValue(), true)
	}
}

func TestParseResultJSONListContents(t *testing.T) {
	jsonResult := `["a", "b", "c"]`
	result := parseResultJSON(jsonResult)

	if result == nil {
		t.Fatal("parseResultJSON returned nil")
	}

	listVal := result.GetListValue()
	if listVal == nil {
		t.Fatal("expected list value")
	}

	values := listVal.GetValues()
	if len(values) != 3 {
		t.Fatalf("expected 3 values, got %d", len(values))
	}

	expected := []string{"a", "b", "c"}
	for i, val := range values {
		if val.GetStringValue() != expected[i] {
			t.Errorf("values[%d] = %q, want %q", i, val.GetStringValue(), expected[i])
		}
	}
}

func TestParseResultJSONMixedList(t *testing.T) {
	jsonResult := `[1, "two", true, null]`
	result := parseResultJSON(jsonResult)

	if result == nil {
		t.Fatal("parseResultJSON returned nil")
	}

	listVal := result.GetListValue()
	if listVal == nil {
		t.Fatal("expected list value")
	}

	values := listVal.GetValues()
	if len(values) != 4 {
		t.Fatalf("expected 4 values, got %d", len(values))
	}

	// Check number
	if values[0].GetNumberValue() != 1 {
		t.Errorf("values[0] = %v, want 1", values[0].GetNumberValue())
	}

	// Check string
	if values[1].GetStringValue() != "two" {
		t.Errorf("values[1] = %q, want %q", values[1].GetStringValue(), "two")
	}

	// Check bool
	if values[2].GetBoolValue() != true {
		t.Errorf("values[2] = %v, want true", values[2].GetBoolValue())
	}

	// Check null
	if values[3].GetNullValue() != structpb.NullValue_NULL_VALUE {
		t.Errorf("values[3] expected null value")
	}
}
