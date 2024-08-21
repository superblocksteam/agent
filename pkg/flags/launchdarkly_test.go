package flags

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/flags/options"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

func TestGetApiTimeoutByOrgTier(t *testing.T) {
	t.Parallel()

	options := []options.Option{
		options.WithDefaultApiTimeout(500),
		options.WithLocal("../../flags.test.unit.json"),
	}
	client := LaunchDarkly("", options...)
	assert.NoError(t, client.(*launchdarkly).Init())

	t.Cleanup(func() {
		require.NoError(t, client.Close(nil))
	})

	for _, test := range []struct {
		name     string
		tier     string
		api      *apiv1.Api
		expected float64
	}{
		{
			name:     "nil api",
			tier:     "TRIAL",
			api:      nil,
			expected: 500,
		},
		{
			name:     "nil trigger",
			tier:     "TRIAL",
			api:      &apiv1.Api{},
			expected: 500,
		},
		{
			name: "application",
			tier: "TRIAL",
			api: &apiv1.Api{
				Trigger:  &apiv1.Trigger{Config: &apiv1.Trigger_Application_{}},
				Metadata: &commonv1.Metadata{Organization: "asdf"},
			},
			expected: 1000,
		},
		{
			name: "workflow",
			tier: "ENTERPRISE",
			api: &apiv1.Api{
				Trigger:  &apiv1.Trigger{Config: &apiv1.Trigger_Workflow_{}},
				Metadata: &commonv1.Metadata{Organization: "asdf"},
			},
			expected: 4000,
		},
		{
			name: "job",
			tier: "FREE",
			api: &apiv1.Api{
				Trigger:  &apiv1.Trigger{Config: &apiv1.Trigger_Job_{}},
				Metadata: &commonv1.Metadata{Organization: "asdf"},
			},
			expected: 6000,
		},
		{
			name:     "malformed trigger",
			tier:     "TRIAL",
			api:      &apiv1.Api{Trigger: &apiv1.Trigger{}},
			expected: 500,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expected, client.GetApiTimeoutV2(test.api, test.tier), test.name)
		})
	}
}

func TestGetVariations(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name         string
		variation    string
		defaultVal   any
		variationErr error
		expected     any
	}{
		{
			name:         "int variation success",
			variation:    "int",
			defaultVal:   0,
			variationErr: nil,
			expected:     25,
		},
		{
			name:         "int variation error logs and returns default",
			variation:    "int",
			defaultVal:   0,
			variationErr: errors.New("key does not exist"),
			expected:     0,
		},
		{
			name:         "float variation success",
			variation:    "float",
			defaultVal:   1.0,
			variationErr: nil,
			expected:     25.7,
		},
		{
			name:         "float variation error logs and returns default",
			variation:    "float",
			defaultVal:   1.0,
			variationErr: errors.New("key does not exist"),
			expected:     1.0,
		},
		{
			name:         "bool variation success",
			variation:    "bool",
			defaultVal:   false,
			variationErr: nil,
			expected:     true,
		},
		{
			name:         "bool variation error logs and returns default",
			variation:    "bool",
			defaultVal:   false,
			variationErr: errors.New("key does not exist"),
			expected:     false,
		},
		{
			name:         "bool by org variation success",
			variation:    "boolByOrg",
			defaultVal:   false,
			variationErr: nil,
			expected:     true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockLdClient := NewMockLdClient(t)

			anyKey := "any.ld.key"
			anyTier := "anyTier"
			anyOrgId := "anyOrgId"

			observedCore, observedLogs := observer.New(zap.InfoLevel)
			observedLogger := zap.New(observedCore)

			switch test.variation {
			case "bool", "boolByOrg":
				mockLdClient.On("BoolVariation", anyKey, mock.Anything, test.defaultVal).Return(test.expected.(bool), test.variationErr)
			case "float":
				mockLdClient.On("Float64Variation", anyKey, mock.Anything, test.defaultVal).Return(test.expected.(float64), test.variationErr)
			case "int":
				mockLdClient.On("IntVariation", anyKey, mock.Anything, test.defaultVal).Return(test.expected.(int), test.variationErr)
			}

			client := &launchdarkly{
				client: mockLdClient,
				logger: observedLogger,
			}

			var actual any
			switch test.variation {
			case "bool":
				actual = client.getBoolVariation(anyKey, anyTier, anyOrgId, test.defaultVal.(bool))
			case "boolByOrg":
				actual = client.getBoolVariationByOrg(anyKey, anyOrgId, test.defaultVal.(bool))
			case "float":
				actual = client.getFloatVariation(anyKey, anyTier, anyOrgId, test.defaultVal.(float64))
			case "int":
				actual = client.getIntVariationV2(anyKey, anyTier, anyOrgId, test.defaultVal.(int))
			}

			assert.Equal(t, test.expected, actual)
			if test.variationErr != nil {
				assert.Len(t, observedLogs.FilterLevelExact(zap.WarnLevel).All(), 1)
			}
		})
	}
}

func TestGetVariations_BuildCtxError(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name       string
		variation  string
		defaultVal any
	}{
		{
			name:       "int variation returns default",
			variation:  "int",
			defaultVal: 10,
		},
		{
			name:       "float variation returns default",
			variation:  "float",
			defaultVal: 3.5,
		},
		{
			name:       "bool variation returns default",
			variation:  "bool",
			defaultVal: true,
		},
		{
			name:       "bool by org variation returns default",
			variation:  "boolByOrg",
			defaultVal: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockLdClient := NewMockLdClient(t)

			anyKey := "any.ld.key"
			anyTier := "anyTier"
			var emptyOrgId string

			observedCore, observedLogs := observer.New(zap.InfoLevel)
			observedLogger := zap.New(observedCore)

			client := &launchdarkly{
				client: mockLdClient,
				logger: observedLogger,
			}

			var actual any
			switch test.variation {
			case "bool":
				actual = client.getBoolVariation(anyKey, anyTier, emptyOrgId, test.defaultVal.(bool))
			case "boolByOrg":
				actual = client.getBoolVariationByOrg(anyKey, emptyOrgId, test.defaultVal.(bool))
			case "float":
				actual = client.getFloatVariation(anyKey, anyTier, emptyOrgId, test.defaultVal.(float64))
			case "int":
				actual = client.getIntVariationV2(anyKey, anyTier, emptyOrgId, test.defaultVal.(int))
			}

			assert.Equal(t, test.defaultVal, actual)
			assert.Len(t, observedLogs.FilterLevelExact(zap.ErrorLevel).All(), 1)
		})
	}
}
