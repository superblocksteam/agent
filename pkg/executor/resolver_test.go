package executor

import (
	"testing"

	structpb "github.com/golang/protobuf/ptypes/struct"
	"github.com/stretchr/testify/assert"
	mocks "github.com/superblocksteam/agent/internal/flags/mock"
	"github.com/superblocksteam/agent/pkg/plugin"
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
