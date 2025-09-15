package executor

import (
	"context"
	"testing"

	structpb "github.com/golang/protobuf/ptypes/struct"
	"github.com/stretchr/testify/assert"
	mocks "github.com/superblocksteam/agent/internal/flags/mock"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/plugin"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

func TestResolver_GetPluginNameForExecution(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name         string
		plugin       plugin.Plugin
		actionConfig *structpb.Struct
		goEnabled    bool
		expected     string
	}{
		{
			name:         "Non-Javascript plugin returns plugin",
			plugin:       &apiv1.Step_Mariadb{},
			actionConfig: &structpb.Struct{},
			goEnabled:    true,
			expected:     "mariadb",
		},
		{
			name:         "Empty action config defaults to v8",
			plugin:       &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{},
			goEnabled:    true,
			expected:     "v8",
		},
		{
			name:   "Missing body defaults to v8",
			plugin: &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{},
			},
			goEnabled: true,
			expected:  "v8",
		},
		{
			name:   "Nil body defaults to v8",
			plugin: &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": nil,
				},
			},
			goEnabled: true,
			expected:  "v8",
		},
		{
			name:   "Empty string code body defaults to v8",
			plugin: &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": {
						Kind: &structpb.Value_StringValue{
							StringValue: "",
						},
					},
				},
			},
			goEnabled: true,
			expected:  "v8",
		},
		{
			name:   "Code with only v8 supported modules returns v8",
			plugin: &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": {
						Kind: &structpb.Value_StringValue{
							StringValue: "var _ = require('lodash')\nconsole.log(_.Trim('hello world'))",
						},
					},
				},
			},
			goEnabled: true,
			expected:  "v8",
		},
		{
			name:   "Code with modules not supported by v8 falls back to javascript",
			plugin: &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": {
						Kind: &structpb.Value_StringValue{
							StringValue: "var axios = require('axios')\nconsole.log(axios({{Step1.url}}))",
						},
					},
				},
			},
			goEnabled: true,
			expected:  "javascript",
		},
		{
			name:   "Code with unsupported node globals falls back to javascript",
			plugin: &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": {
						Kind: &structpb.Value_StringValue{
							StringValue: "new WritableStream()",
						},
					},
				},
			},
			goEnabled: true,
			expected:  "javascript",
		},
		{
			name:   "Empty string code body defaults to javascript, when v8 is disabled",
			plugin: &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": {
						Kind: &structpb.Value_StringValue{
							StringValue: "",
						},
					},
				},
			},
			goEnabled: false,
			expected:  "javascript",
		},
		{
			name:   "Code with only v8 supported modules returns javascript, when v8 is disabled",
			plugin: &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": {
						Kind: &structpb.Value_StringValue{
							StringValue: "var _ = require('lodash')\nconsole.log(_.Trim('hello world'))",
						},
					},
				},
			},
			goEnabled: false,
			expected:  "javascript",
		},
		{
			name:   "Code with non-v8 modules returns javascript, when v8 is disabled",
			plugin: &apiv1.Step_Javascript{},
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"body": {
						Kind: &structpb.Value_StringValue{
							StringValue: "var axios = require('axios')\nconsole.log(axios({{Step1.url}}))",
						},
					},
				},
			},
			goEnabled: false,
			expected:  "javascript",
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			mockFlags := &mocks.Flags{}
			mockFlags.On("GetGoWorkerEnabled", "somePlan", "someOrgId").Return(testCase.goEnabled)

			r := &resolver{
				orgId:            "someOrgId",
				organizationPlan: "somePlan",
				v8SupportedModules: map[string]bool{
					"lodash": true,
					"moment": true,
				},
				flags: mockFlags,
			}

			retStream := r.getPluginNameForExecution(testCase.plugin, testCase.actionConfig)

			assert.Equal(t, testCase.expected, retStream)
		})
	}
}

func TestShouldRenderActionConfig(t *testing.T) {
	t.Parallel()

	t.Run("Should return false for usePreparedSql: true", func(t *testing.T) {
		t.Parallel()
		action1 := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"usePreparedSql": {Kind: &structpb.Value_BoolValue{BoolValue: true}},
			},
		}
		assert.False(t, shouldRenderActionConfig(action1, "somePlugin", false))
	})

	t.Run("Should return false for Python and JavaScript plugins", func(t *testing.T) {
		t.Parallel()
		action2 := &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		}
		assert.False(t, shouldRenderActionConfig(action2, "python", false))
		assert.False(t, shouldRenderActionConfig(action2, "javascript", false))
	})

	t.Run("Should return false for REST API plugins", func(t *testing.T) {
		t.Parallel()
		action2 := &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		}
		assert.False(t, shouldRenderActionConfig(action2, "restapi", false))
		assert.False(t, shouldRenderActionConfig(action2, "restapiintegration", false))
	})

	t.Run("Should return false for useParameterized: true", func(t *testing.T) {
		t.Parallel()
		action3 := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"runSql": {Kind: &structpb.Value_StructValue{StructValue: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"useParameterized": {Kind: &structpb.Value_BoolValue{BoolValue: true}},
					},
				}}},
			},
		}
		assert.False(t, shouldRenderActionConfig(action3, "somePlugin", false))
	})

	t.Run("Should return false if readContents exists in a string field", func(t *testing.T) {
		t.Parallel()
		action4 := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"someField": {Kind: &structpb.Value_StringValue{StringValue: "readContents"}},
			},
		}
		assert.False(t, shouldRenderActionConfig(action4, "somePlugin", false))
	})

	t.Run("Should return true otherwise", func(t *testing.T) {
		t.Parallel()
		action5 := &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		}
		assert.True(t, shouldRenderActionConfig(action5, "somePlugin", false))
	})

	t.Run("Should return true if stream", func(t *testing.T) {
		t.Parallel()
		assert.True(t, shouldRenderActionConfig(nil, "somePlugin", true))
	})
}

func TestShouldConvertToLegacyBindings(t *testing.T) {
	t.Parallel()

	mockTemplatePlugin := func(*plugins.Input) plugins.Plugin { return nil }
	mockTemplateResolver := func(context.Context, *utils.TokenJoiner, string) engine.Value { return nil }

	tests := []struct {
		name                      string
		legacyTemplatePlugin      func(*plugins.Input) plugins.Plugin
		legacyTemplateResolver    func(context.Context, *utils.TokenJoiner, string) engine.Value
		legacyTemplateTokenJoiner *utils.TokenJoiner
		action                    *structpb.Struct
		pluginType                string
		stream                    bool
		expected                  bool
		description               string
	}{
		{
			name:                      "Should return false when legacy template plugin is nil",
			legacyTemplatePlugin:      nil,
			legacyTemplateResolver:    mockTemplateResolver,
			legacyTemplateTokenJoiner: utils.NoOpTokenJoiner,
			action:                    &structpb.Struct{},
			pluginType:                "somePlugin",
			stream:                    false,
			expected:                  false,
			description:               "Legacy template plugin is nil",
		},
		{
			name:                      "Should return false when legacy template resolver is nil",
			legacyTemplatePlugin:      mockTemplatePlugin,
			legacyTemplateResolver:    nil,
			legacyTemplateTokenJoiner: utils.NoOpTokenJoiner,
			action:                    &structpb.Struct{},
			pluginType:                "somePlugin",
			stream:                    false,
			expected:                  false,
			description:               "Legacy template resolver is nil",
		},
		{
			name:                      "Should return false when legacy template token joiner is nil",
			legacyTemplatePlugin:      mockTemplatePlugin,
			legacyTemplateResolver:    mockTemplateResolver,
			legacyTemplateTokenJoiner: nil,
			action:                    &structpb.Struct{},
			pluginType:                "somePlugin",
			stream:                    false,
			expected:                  false,
			description:               "Legacy template token joiner is nil",
		},
		{
			name:                      "Should return false when shouldRenderActionConfig returns true",
			legacyTemplatePlugin:      mockTemplatePlugin,
			legacyTemplateResolver:    mockTemplateResolver,
			legacyTemplateTokenJoiner: utils.NoOpTokenJoiner,
			action:                    &structpb.Struct{},
			pluginType:                "somePlugin",
			stream:                    true,
			expected:                  false,
			description:               "shouldRenderActionConfig returns true",
		},
		{
			name:                      "Should return false for python plugin type",
			legacyTemplatePlugin:      mockTemplatePlugin,
			legacyTemplateResolver:    mockTemplateResolver,
			legacyTemplateTokenJoiner: utils.NoOpTokenJoiner,
			action:                    &structpb.Struct{},
			pluginType:                "python",
			stream:                    false,
			expected:                  false,
			description:               "Python plugin type should not convert to legacy bindings",
		},
		{
			name:                      "Should return false for javascript plugin type",
			legacyTemplatePlugin:      mockTemplatePlugin,
			legacyTemplateResolver:    mockTemplateResolver,
			legacyTemplateTokenJoiner: utils.NoOpTokenJoiner,
			action:                    &structpb.Struct{},
			pluginType:                "javascript",
			stream:                    false,
			expected:                  false,
			description:               "JavaScript plugin type should not convert to legacy bindings",
		},
		{
			name:                      "Should return false for v8 plugin type",
			legacyTemplatePlugin:      mockTemplatePlugin,
			legacyTemplateResolver:    mockTemplateResolver,
			legacyTemplateTokenJoiner: utils.NoOpTokenJoiner,
			action:                    &structpb.Struct{},
			pluginType:                "v8",
			stream:                    false,
			expected:                  false,
			description:               "V8 plugin type should not convert to legacy bindings",
		},
		{
			name:                      "Should return true for restapi plugin type",
			legacyTemplatePlugin:      mockTemplatePlugin,
			legacyTemplateResolver:    mockTemplateResolver,
			legacyTemplateTokenJoiner: utils.NoOpTokenJoiner,
			action:                    &structpb.Struct{},
			pluginType:                "restapi",
			stream:                    false,
			expected:                  true,
			description:               "REST API plugin type should convert to legacy bindings",
		},
		{
			name:                      "Should return true for restapiintegration plugin type",
			legacyTemplatePlugin:      mockTemplatePlugin,
			legacyTemplateResolver:    mockTemplateResolver,
			legacyTemplateTokenJoiner: utils.NoOpTokenJoiner,
			action:                    &structpb.Struct{},
			pluginType:                "restapiintegration",
			stream:                    false,
			expected:                  true,
			description:               "REST API integration plugin type should convert to legacy bindings",
		},
		{
			name:                      "Should return true for plugins that use readContents",
			legacyTemplatePlugin:      mockTemplatePlugin,
			legacyTemplateResolver:    mockTemplateResolver,
			legacyTemplateTokenJoiner: utils.NoOpTokenJoiner,
			action: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"someField": {Kind: &structpb.Value_StringValue{StringValue: "readContents"}},
				},
			},
			pluginType:  "somePlugin",
			stream:      false,
			expected:    true,
			description: "returns true for plugins that use readContents",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			r := &resolver{
				legacyTemplatePlugin:      tt.legacyTemplatePlugin,
				legacyTemplateResolver:    tt.legacyTemplateResolver,
				legacyTemplateTokenJoiner: tt.legacyTemplateTokenJoiner,
			}

			result := r.shouldConvertToLegacyBindings(tt.action, tt.pluginType, tt.stream)
			assert.Equal(t, tt.expected, result, tt.description)
		})
	}
}

func TestIsJavaScriptExpression(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{
			name:     "Should return true if the input is a JavaScript template literal",
			input:    "`JavaScript template literal ${Step1.url} string`",
			expected: true,
		},
		{
			name:     "Should return true if the input is a JavaScript IIFE",
			input:    "(() => { return Step1.url })()",
			expected: true,
		},
		{
			name:     "Should return false if the input is a legacy binding",
			input:    "{{Step1.url}}",
			expected: false,
		},
		{
			name:     "Should return false if the input is not a JavaScript expression",
			input:    "Step1.url",
			expected: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expected, isJavaScriptExpression(test.input))
		})
	}
}

func TestGetExpressionFromInput(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		input    string
		expected string
		errStr   string
	}{
		{
			name:     "Should return the input if it is a JavaScript template literal",
			input:    "`JavaScript template literal ${Step1.url} string`",
			expected: "`JavaScript template literal ${Step1.url} string`",
		},
		{
			name:     "Should return the input if it is a JavaScript IIFE",
			input:    "(() => { return Step1.url })()",
			expected: "(() => { return Step1.url })()",
		},
		{
			name:     "Should return the input if it is a legacy binding",
			input:    "{{Step1.url}}",
			expected: "Step1.url",
		},
		{
			name:   "Should return an error if the input is not a JavaScript expression or legacy binding",
			input:  "Step1.url",
			errStr: "binding (Step1.url) must be wrapped with {{ <expression> }}",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result, err := getExpressionFromInput(test.input)

			if test.errStr != "" {
				assert.EqualError(t, err, test.errStr)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.expected, result)
			}
		})
	}
}
