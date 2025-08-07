package flags

import (
	"math"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/internal/flags/options"
	"go.uber.org/zap"
)

func TestGetStepRatePerPluginV2_ReturnsValueFromOptions(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name      string
		optionSet bool
		expected  int
	}{
		{
			name:      "option set",
			optionSet: true,
			expected:  1000,
		},
		{
			name:      "option not set",
			optionSet: false,
			expected:  math.MaxInt32,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			var flagOptions []options.Option
			if test.optionSet {
				flagOptions = append(flagOptions, options.WithDefaultStepRatePerPluginByOrg(test.expected))
			}
			flags := NoopFlags(flagOptions...)

			var anyStr, anyOrgStr, anyPluginId string
			actual := flags.GetStepRatePerPluginV2(anyStr, anyOrgStr, anyPluginId)

			assert.Equal(t, test.expected, actual)
		})
	}
}

func TestGetGoWorkerEnabled_ReturnsValueFromOptions(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		expected bool
	}{
		{
			name:     "disabled",
			expected: false,
		},
		{
			name:     "enabled",
			expected: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			flags := &noopFlags{
				options: options.Options{
					DefaultGoWorkerEnabled: test.expected,
				},
			}

			var anyStr, anyOtherStr string
			actual := flags.GetGoWorkerEnabled(anyStr, anyOtherStr)

			assert.Equal(t, test.expected, actual)
		})
	}
}

func TestGetWorkflowPluginInheritanceEnabled_ReturnsValueFromOptions(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		expected bool
	}{
		{
			name:     "disabled",
			expected: false,
		},
		{
			name:     "enabled",
			expected: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			flags := &noopFlags{
				options: options.Options{
					DefaultWorkflowPluginInheritanceEnabled: test.expected,
				},
			}

			var anyStr string
			actual := flags.GetWorkflowPluginInheritanceEnabled(anyStr)

			assert.Equal(t, test.expected, actual)
		})
	}
}

func TestNoopFlagsConstructor(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name            string
		settings        []options.Option
		expectedOptions options.Options
	}{
		{
			name:     "empty settings, uses default options",
			settings: []options.Option{},
			expectedOptions: options.Options{
				DefaultStepSizeByOrg:                    math.MaxInt32,
				DefaultStepRateByOrg:                    math.MaxInt32,
				DefaultStepRatePerApiByOrg:              math.MaxInt32,
				DefaultStepRatePerPluginByOrg:           math.MaxInt32,
				DefaultStepRatePerUserByOrg:             math.MaxInt32,
				DefaultStepDurationByOrg:                math.MaxInt32,
				DefaultMaxParallelPoolSizeByAPI:         math.MaxInt32,
				DefaultMaxStreamSendSizeByOrg:           math.MaxInt32,
				DefaultMaxComputeMinutesPerWeek:         float64(math.MaxInt32),
				DefaultApiTimeout:                       float64(time.Duration(1 * time.Hour).Milliseconds()),
				DefaultGoWorkerEnabled:                  false,
				DefaultWorkflowPluginInheritanceEnabled: false,
				DefaultBindingsExpressionSyntaxEnabled:  false,
				Logger:                                  zap.NewNop(),
				Config:                                  nil,
			},
		},
		{
			name: "settings used to build options",
			settings: []options.Option{
				options.WithDefaultStepRatePerPluginByOrg(20),
				options.WithDefaultMaxParallelPoolSizeByAPI(15),
				options.WithDefaultGoWorkerEnabled(true),
				options.WithDefaultBindingsLegacyConversionShimDisabled(true),
			},
			expectedOptions: options.Options{
				DefaultStepSizeByOrg:                   math.MaxInt32,
				DefaultStepRateByOrg:                   math.MaxInt32,
				DefaultStepRatePerApiByOrg:             math.MaxInt32,
				DefaultStepRatePerPluginByOrg:          20,
				DefaultStepRatePerUserByOrg:            math.MaxInt32,
				DefaultStepDurationByOrg:               math.MaxInt32,
				DefaultMaxParallelPoolSizeByAPI:        15,
				DefaultMaxStreamSendSizeByOrg:          math.MaxInt32,
				DefaultMaxComputeMinutesPerWeek:        float64(math.MaxInt32),
				DefaultApiTimeout:                      float64(time.Duration(1 * time.Hour).Milliseconds()),
				DefaultGoWorkerEnabled:                 true,
				DefaultBindingsExpressionSyntaxEnabled: true,
				Logger:                                 zap.NewNop(),
				Config:                                 nil,
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			flags := NoopFlags(test.settings...)

			assert.NotNil(t, flags)
			assert.NotNil(t, flags.(*noopFlags).ctx)
			assert.NotNil(t, flags.(*noopFlags).cancel)
			assert.Equal(t, test.expectedOptions, flags.(*noopFlags).options)
		})
	}
}
