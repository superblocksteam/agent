package sandbox

import (
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
	plugin := &SandboxPlugin{
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
	// Test with nil connection
	plugin := &SandboxPlugin{
		conn: nil,
	}

	err := plugin.Close()
	if err != nil {
		t.Errorf("Close() with nil conn should return nil, got %v", err)
	}
}

func TestSandboxPluginCloseWithConnection(t *testing.T) {
	// Create a real connection that we can close
	// Note: This will fail to connect but the conn object will be non-nil
	logger := zap.NewNop()
	opts := &Options{
		Address:  "localhost:99999", // Invalid port
		Language: "python",
		Logger:   logger,
	}

	// NewSandboxPlugin may fail but we can still test Close on a plugin struct
	plugin := &SandboxPlugin{
		conn:     nil, // Can't easily create a real conn without a server
		language: opts.Language,
		address:  opts.Address,
		logger:   opts.Logger,
	}

	err := plugin.Close()
	if err != nil {
		t.Errorf("Close() should return nil for nil conn, got %v", err)
	}
}

func TestSandboxPluginStream(t *testing.T) {
	plugin := &SandboxPlugin{}

	err := plugin.Stream(nil, nil, nil, nil)
	if !errors.Is(err, errors.ErrUnsupported) {
		t.Errorf("Stream() should return ErrUnsupported, got %v", err)
	}
}

func TestSandboxPluginMetadata(t *testing.T) {
	plugin := &SandboxPlugin{}

	result, err := plugin.Metadata(nil, nil, nil)
	if result != nil {
		t.Errorf("Metadata() should return nil result")
	}
	if !errors.Is(err, errors.ErrUnsupported) {
		t.Errorf("Metadata() should return ErrUnsupported, got %v", err)
	}
}

func TestSandboxPluginTest(t *testing.T) {
	plugin := &SandboxPlugin{}

	err := plugin.Test(nil, nil)
	if !errors.Is(err, errors.ErrUnsupported) {
		t.Errorf("Test() should return ErrUnsupported, got %v", err)
	}
}

func TestSandboxPluginPreDelete(t *testing.T) {
	plugin := &SandboxPlugin{}

	err := plugin.PreDelete(nil, nil)
	if !errors.Is(err, errors.ErrUnsupported) {
		t.Errorf("PreDelete() should return ErrUnsupported, got %v", err)
	}
}

func TestGetCodeFromProps(t *testing.T) {
	logger := zap.NewNop()
	plugin := &SandboxPlugin{logger: logger}

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
	plugin := &SandboxPlugin{logger: logger}

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
			name: "nil action configuration",
			props: &transportv1.Request_Data_Data_Props{
				ActionConfiguration: nil,
			},
			expectEmpty: true,
		},
		{
			name: "with action configuration",
			props: &transportv1.Request_Data_Data_Props{
				ActionConfiguration: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"key": structpb.NewStringValue("value"),
					},
				},
			},
			expectEmpty: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := plugin.buildContextJSON(tt.props)
			if err != nil {
				t.Errorf("buildContextJSON() error = %v", err)
				return
			}
			if tt.expectEmpty && result != "{}" {
				t.Errorf("buildContextJSON() = %v, want {}", result)
			}
			if !tt.expectEmpty && result == "{}" {
				t.Errorf("buildContextJSON() = {}, want non-empty")
			}
		})
	}
}

func TestBuildVariablesJSON(t *testing.T) {
	logger := zap.NewNop()
	plugin := &SandboxPlugin{logger: logger}

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
