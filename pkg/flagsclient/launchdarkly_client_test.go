package flagsclient

import (
	"errors"
	"testing"

	"github.com/launchdarkly/go-sdk-common/v3/ldcontext"
	"github.com/launchdarkly/go-sdk-common/v3/ldvalue"
	"github.com/stretchr/testify/assert"
	mock "github.com/stretchr/testify/mock"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

func TestGetVariationCustomDims(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name       string
		dimensions map[string]string
		defaultVal any
		expected   any
		shouldErr  bool
	}{
		{
			name:       "nil dimensions success",
			dimensions: nil,
			defaultVal: false,
			expected:   true,
		},
		{
			name:       "empty dimensions success",
			dimensions: map[string]string{},
			defaultVal: false,
			expected:   true,
		},
		{
			name:       "populated dimensions success",
			dimensions: map[string]string{"key": "value"},
			defaultVal: false,
			expected:   true,
		},
		{
			name:       "build context error, returns default",
			dimensions: map[string]string{},
			defaultVal: false,
			expected:   false,
			shouldErr:  true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockLdClient := newMockLdClient(t)

			anyKey := "any.ld.key"
			orgId := "validOrgId"
			if test.shouldErr {
				orgId = ""
			} else {
				mockLdClient.On("BoolVariation", anyKey, mock.Anything, test.defaultVal).Return(test.expected.(bool), nil).Once()
			}

			observedCore, observedLogs := observer.New(zap.InfoLevel)
			observedLogger := zap.New(observedCore)

			actual := getVariationCustomDims(mockLdClient, anyKey, orgId, test.dimensions, test.defaultVal, observedLogger)

			assert.Equal(t, test.expected, actual)
			if test.shouldErr {
				assert.Len(t, observedLogs.FilterLevelExact(zap.ErrorLevel).All(), 1)
			}
		})
	}
}

func TestGetVariation(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name         string
		variation    string
		defaultVal   any
		variationErr error
		expected     any
	}{
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
			name:         "string variation success",
			variation:    "string",
			defaultVal:   "default",
			variationErr: nil,
			expected:     "success",
		},
		{
			name:         "string variation error logs and returns default",
			variation:    "string",
			defaultVal:   "default",
			variationErr: errors.New("key does not exist"),
			expected:     "default",
		},
		{
			name:         "string slice variation success",
			variation:    "string slice",
			defaultVal:   []string{"default", "value"},
			variationErr: nil,
			expected:     []string{"success", "value"},
		},
		{
			name:         "string variation error logs and returns default",
			variation:    "string slice",
			defaultVal:   []string{"default", "value"},
			variationErr: errors.New("key does not exist"),
			expected:     []string{"default", "value"},
		},
		{
			name:         "unsupported variation type returns default",
			variation:    "unsupported",
			defaultVal:   complex(3.0, 1.0),
			variationErr: errors.New("key does not exist"),
			expected:     complex(3.0, 1.0),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockLdClient := newMockLdClient(t)

			anyKey := "any.ld.key"

			observedCore, observedLogs := observer.New(zap.InfoLevel)
			observedLogger := zap.New(observedCore)

			switch test.variation {
			case "bool":
				mockLdClient.On("BoolVariation", anyKey, mock.Anything, test.defaultVal).Return(test.expected.(bool), test.variationErr)
			case "float":
				mockLdClient.On("Float64Variation", anyKey, mock.Anything, test.defaultVal).Return(test.expected.(float64), test.variationErr)
			case "int":
				mockLdClient.On("IntVariation", anyKey, mock.Anything, test.defaultVal).Return(test.expected.(int), test.variationErr)
			case "string":
				mockLdClient.On("StringVariation", anyKey, mock.Anything, test.defaultVal).Return(test.expected.(string), test.variationErr)
			case "string slice":
				toLdValue := func(values []string) ldvalue.Value {
					arrayBuilder := ldvalue.ValueArrayBuilder{}
					for _, v := range values {
						arrayBuilder.Add(ldvalue.String(v))
					}
					return arrayBuilder.Build().AsValue()
				}

				defaultValAsValue := toLdValue(test.defaultVal.([]string))
				expectedAsValue := toLdValue(test.expected.([]string))

				mockLdClient.On("JSONVariation", anyKey, mock.Anything, defaultValAsValue).Return(expectedAsValue, test.variationErr)
			}

			actual := getVariation(mockLdClient, anyKey, ldcontext.Context{}, test.defaultVal, observedLogger)

			assert.Equal(t, test.expected, actual)
			if test.variationErr != nil {
				assert.Len(t, observedLogs.FilterLevelExact(zap.WarnLevel).All(), 1)
			}
		})
	}
}
