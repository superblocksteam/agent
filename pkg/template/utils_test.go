package template

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"

	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	"github.com/superblocksteam/agent/pkg/template/plugins/mustache"
	"google.golang.org/protobuf/types/known/structpb"
)

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
