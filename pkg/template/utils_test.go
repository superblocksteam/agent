package template

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/template/plugins/mustache"
	"google.golang.org/protobuf/types/known/structpb"
)

// TestRenderProtoValue_FieldNameMetadata tests that the InputMetadata.FieldName
// is correctly set for each field path when RenderProtoValue processes nested structures.
func TestRenderProtoValue_FieldNameMetadata(t *testing.T) {
	s := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer s.Close()

	tests := []struct {
		name           string
		input          map[string]any
		expectedFields []string
	}{
		{
			name: "root level field",
			input: map[string]any{
				"message": `{{ "Hello World" }}`,
			},
			expectedFields: []string{"message"},
		},
		{
			name: "deeply nested fields",
			input: map[string]any{
				"config": map[string]any{
					"database": map[string]any{
						"driver": `{{ "postgres" }}`,
						"connection": map[string]any{
							"host": `{{ "localhost" }}`,
							"port": `{{ "5432" }}`,
						},
						"credentials": map[string]any{
							"username": `{{ "admin" }}`,
							"password": `{{ "secret" }}`,
						},
					},
				},
			},
			expectedFields: []string{
				"config.database.driver",
				"config.database.connection.host",
				"config.database.connection.port",
				"config.database.credentials.username",
				"config.database.credentials.password",
			},
		},
		{
			name: "mixed structure with arrays",
			input: map[string]any{
				"app": map[string]any{
					"name":    `{{ "MyApp" }}`,
					"version": `{{ "1.0.0" }}`,
				},
				"servers": []any{
					`{{ "server1" }}`,
					`{{ "server2" }}`,
				},
			},
			expectedFields: []string{
				"app.name",
				"app.version",
				"servers",
				"servers",
			},
		},
		{
			name: "non-string fields",
			input: map[string]any{
				"string_field": `{{ "template" }}`,
				"number_field": 42,
				"bool_field":   true,
				"null_field":   nil,
				"nested": map[string]any{
					"another_string": `{{ "another template" }}`,
					"another_number": 99.5,
				},
			},
			expectedFields: []string{
				"string_field",
				"nested.another_string",
			},
		},
		{
			name: "nested arrays with templates",
			input: map[string]any{
				"matrix": []any{
					[]any{`{{ "a" }}`, `{{ "b" }}`},
					[]any{`{{ "c" }}`, `{{ "d" }}`},
				},
			},
			expectedFields: []string{
				"matrix", "matrix", "matrix", "matrix",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Track all the inputs passed to our plugin
			var capturedInputs []*plugins.Input

			// Create a custom plugin that captures the Input
			capturePlugin := func(input *plugins.Input) plugins.Plugin {
				capturedInputs = append(capturedInputs, input)
				return mustache.Plugin(input)
			}

			// Convert test input to structpb
			inputStruct, err := structpb.NewStruct(tt.input)
			require.NoError(t, err)

			// Call RenderProtoValue
			_, err = RenderProtoValue(apictx.New(&apictx.Context{
				Context: context.Background(),
			}), structpb.NewStructValue(inputStruct), capturePlugin, s, zap.NewNop())

			assert.NoError(t, err)

			// Verify we captured the expected number of inputs
			assert.Equal(t, len(tt.expectedFields), len(capturedInputs), "Number of captured inputs should match expected fields")

			// Verify each captured input has the correct FieldName
			actualFieldNames := make([]string, len(capturedInputs))
			for i, input := range capturedInputs {
				actualFieldNames[i] = input.GetMeta().GetFieldName()
			}

			assert.ElementsMatch(t, tt.expectedFields, actualFieldNames, "Field names should match expected values")

			// Verify that each input has non-nil metadata
			for i, input := range capturedInputs {
				assert.NotNil(t, input.GetMeta(), "Input %d should have non-nil metadata", i)
				assert.NotEmpty(t, input.GetData(), "Input %d should have non-empty data", i)
			}
		})
	}
}

// TestRenderProtoValue_FieldNameMetadata_NonStringValues tests that non-string values
// do not trigger plugin calls and therefore don't generate Input objects.
func TestRenderProtoValue_FieldNameMetadata_NonStructValue(t *testing.T) {
	s := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer s.Close()

	tests := []struct {
		name           string
		input          *structpb.Value
		expectedFields []string
	}{
		{
			name:           "string value",
			input:          structpb.NewStringValue("template"),
			expectedFields: []string{""},
		},
		{
			name:  "number value",
			input: structpb.NewNumberValue(42),
		},
		{
			name:  "bool value",
			input: structpb.NewBoolValue(true),
		},
		{
			name:  "null value",
			input: structpb.NewNullValue(),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var capturedInputs []*plugins.Input

			capturePlugin := func(input *plugins.Input) plugins.Plugin {
				capturedInputs = append(capturedInputs, input)
				return mustache.Plugin(input)
			}

			_, err := RenderProtoValue(apictx.New(&apictx.Context{
				Context: context.Background(),
			}), tt.input, capturePlugin, s, zap.NewNop())
			assert.NoError(t, err)

			assert.Equal(t, len(tt.expectedFields), len(capturedInputs), "Only string fields should trigger plugin calls")
			actualFieldNames := make([]string, len(capturedInputs))
			for i, input := range capturedInputs {
				actualFieldNames[i] = input.GetMeta().GetFieldName()
			}

			assert.ElementsMatch(t, tt.expectedFields, actualFieldNames)
		})
	}
}

func TestRenderProtoValue(t *testing.T) {
	s := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer s.Close()

	for _, test := range []struct {
		name string
		x, y map[string]any
	}{
		{
			name: "comprehensive",
			x: map[string]any{
				"empty": "",
				"num":   42,
				"nil":   nil,
				"list": []any{
					nil,
					`{{ "item1" }}`,
					`{{ "item2" }}`,
					`{{ "" }}`,
					[]any{`{{ "nested1" }}`, `{{ "nested2" }}`, nil, `{{ "" }}`},
				},
				"map": map[string]any{
					"empty": "",
					"num":   21,
					"nil":   nil,
					"list": []any{
						nil,
						`{{ "mitem1" }}`,
						`{{ "mitem2" }}`,
						`{{ "" }}`,
						[]any{`{{ "mnested1" }}`, `{{ "mnested2" }}`, nil, `{{ "" }}`},
					},
				},
			},
			y: map[string]any{
				"empty": "",
				"num":   42,
				"nil":   nil,
				"list": []any{
					nil,
					"item1",
					"item2",
					"",
					[]any{"nested1", "nested2", nil, ""},
				},
				"map": map[string]any{
					"empty": "",
					"num":   21,
					"nil":   nil,
					"list": []any{
						nil,
						"mitem1",
						"mitem2",
						"",
						[]any{"mnested1", "mnested2", nil, ""},
					},
				},
			},
		},
		{
			name: "deeply nested",
			x: map[string]any{
				"level1": map[string]any{
					"level2": map[string]any{
						"level3": map[string]any{
							"level4": map[string]any{
								"level5": map[string]any{
									"message": `{{ "Hello, deep world!" }}`,
								},
								"nil_val": nil,
								"num_val": 42,
							},
						},
					},
				},
			},
			y: map[string]any{
				"level1": map[string]any{
					"level2": map[string]any{
						"level3": map[string]any{
							"level4": map[string]any{
								"level5": map[string]any{
									"message": "Hello, deep world!",
								},
								"nil_val": nil,
								"num_val": 42,
							},
						},
					},
				},
			},
		},
		{
			name: "nil input",
			x:    nil,
			y:    nil,
		},
		{
			name: "empty input",
			x:    map[string]any{},
			y:    map[string]any{},
		},
		{
			name: "non-string value",
			x: map[string]any{
				"foo": 42,
			},
			y: map[string]any{
				"foo": 42,
			},
		},
		{
			name: "nested non-string value",
			x: map[string]any{
				"foo": map[string]any{
					"bar": 42,
				},
			},
			y: map[string]any{
				"foo": map[string]any{
					"bar": 42,
				},
			},
		},
		{
			name: "nil values",
			x: map[string]any{
				"foo": nil,
				"bar": map[string]any{
					"baz": nil,
				},
			},
			y: map[string]any{
				"foo": nil,
				"bar": map[string]any{
					"baz": nil,
				},
			},
		},
		{
			name: "list values",
			x: map[string]any{
				"list": []any{`{{ "item1" }}`, `{{ "item2" }}`},
			},
			y: map[string]any{
				"list": []any{"item1", "item2"},
			},
		},
		{
			name: "nested list values",
			x: map[string]any{
				"list": []any{
					[]any{`{{ "item1" }}`, `{{ "item2" }}`},
					[]any{`{{ "item3" }}`, `{{ "item4" }}`},
				},
			},
			y: map[string]any{
				"list": []any{
					[]any{"item1", "item2"},
					[]any{"item3", "item4"},
				},
			},
		},
		{
			name: "no nesting",
			x: map[string]any{
				"foo": `{{ "bar" }}`,
			},
			y: map[string]any{
				"foo": "bar",
			},
		},
		{
			name: "nesting",
			x: map[string]any{
				"foo": `{{ "bar" }}`,
				"bar": map[string]any{
					"foo": `{{ "car" }}`,
				},
			},
			y: map[string]any{
				"foo": "bar",
				"bar": map[string]any{
					"foo": "car",
				},
			},
		},
		{
			name: "crazy nesting",
			x: map[string]any{
				"foo": `{{ "bar" }}`,
				"bar": map[string]any{
					"bar": map[string]any{
						"bar": map[string]any{
							"bar": map[string]any{
								"foo": `{{ "car" }}`,
							},
							"frank": `{{ "greco" }}`,
						},
					},
				},
			},
			y: map[string]any{
				"foo": "bar",
				"bar": map[string]any{
					"bar": map[string]any{
						"bar": map[string]any{
							"bar": map[string]any{
								"foo": "car",
							},
							"frank": "greco",
						},
					},
				},
			},
		},
		{
			name: "list with empty string",
			x: map[string]any{
				"list": []any{`{{ "" }}`, `{{ "item2" }}`},
			},
			y: map[string]any{
				"list": []any{"", "item2"},
			},
		},
		{
			name: "list with nil values",
			x: map[string]any{
				"list": []any{nil, `{{ "item2" }}`},
			},
			y: map[string]any{
				"list": []any{nil, "item2"},
			},
		},
		{
			name: "nested list with empty string and nil values",
			x: map[string]any{
				"list": []any{
					[]any{`{{ "" }}`, `{{ "item2" }}`},
					[]any{nil, `{{ "item4" }}`},
				},
			},
			y: map[string]any{
				"list": []any{
					[]any{"", "item2"},
					[]any{nil, "item4"},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			x, err := structpb.NewStruct(test.x)
			assert.NoError(t, err)

			y, err := structpb.NewStruct(test.y)
			assert.NoError(t, err)

			result, err := RenderProtoValue(apictx.New(&apictx.Context{
				Context: context.Background(),
			}), structpb.NewStructValue(x), mustache.Instance, s, zap.NewNop())

			assert.NoError(t, err)
			assert.Equal(t, y.AsMap(), result.Kind.(*structpb.Value_StructValue).StructValue.AsMap(), test.name)
		})
	}
}
