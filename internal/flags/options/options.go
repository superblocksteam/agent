package options

import (
	"math"
	"time"

	"go.uber.org/zap"
)

type Options struct {
	DefaultStepSizeByOrg                    int
	DefaultStepRateByOrg                    int
	DefaultStepRatePerApiByOrg              int
	DefaultStepRatePerPluginByOrg           int
	DefaultStepRatePerUserByOrg             int
	DefaultStepDurationByOrg                int
	DefaultMaxParallelPoolSizeByAPI         int
	DefaultMaxStreamSendSizeByOrg           int
	DefaultMaxComputeMinutesPerWeek         float64
	DefaultApiTimeout                       float64
	DefaultGoWorkerEnabled                  bool
	DefaultWorkflowPluginInheritanceEnabled bool
	DefaultBindingsExpressionSyntaxEnabled  bool
	Logger                                  *zap.Logger
	Config                                  *string
}

type Option func(*Options)

func WithLocal(config string) Option {
	return func(d *Options) {
		d.Config = &config
	}
}

func WithDefaultStepSizeByOrg(stepSizeByOrg int) Option {
	return func(d *Options) {
		d.DefaultStepSizeByOrg = stepSizeByOrg
	}
}

func WithDefaultStepRateByOrg(stepRateByOrg int) Option {
	return func(d *Options) {
		d.DefaultStepRateByOrg = stepRateByOrg
	}
}

func WithDefaultStepRatePerApiByOrg(stepRatePerApiByOrg int) Option {
	return func(d *Options) {
		d.DefaultStepRatePerApiByOrg = stepRatePerApiByOrg
	}
}

func WithDefaultStepRatePerPluginByOrg(stepRatePerPluginByOrg int) Option {
	return func(d *Options) {
		d.DefaultStepRatePerPluginByOrg = stepRatePerPluginByOrg
	}
}

func WithDefaultStepRatePerUserByOrg(stepRatePerUserByOrg int) Option {
	return func(d *Options) {
		d.DefaultStepRatePerUserByOrg = stepRatePerUserByOrg
	}
}

func WithDefaultStepDurationByOrg(stepDurationByOrg int) Option {
	return func(d *Options) {
		d.DefaultStepDurationByOrg = stepDurationByOrg
	}
}

func WithDefaultMaxParallelPoolSizeByAPI(maxParallelPoolSizeByAPI int) Option {
	return func(d *Options) {
		d.DefaultMaxParallelPoolSizeByAPI = maxParallelPoolSizeByAPI
	}
}

func WithDefaultMaxStreamSendSizeByOrg(maxStreamSendSizeByOrg int) Option {
	return func(d *Options) {
		d.DefaultMaxStreamSendSizeByOrg = maxStreamSendSizeByOrg
	}
}

func WithDefaultMaxComputeMinutesPerWeek(max float64) Option {
	return func(d *Options) {
		d.DefaultMaxComputeMinutesPerWeek = max
	}
}

func WithDefaultApiTimeout(apiTimeout float64) Option {
	return func(d *Options) {
		d.DefaultApiTimeout = apiTimeout
	}
}

func WithDefaultGoWorkerEnabled(goWorkerEnabled bool) Option {
	return func(d *Options) {
		d.DefaultGoWorkerEnabled = goWorkerEnabled
	}
}

func WithDefaultWorkflowPluginInheritanceEnabled(workflowPluginInheritanceEnabled bool) Option {
	return func(d *Options) {
		d.DefaultWorkflowPluginInheritanceEnabled = workflowPluginInheritanceEnabled
	}
}

func WithDefaultBindingsLegacyConversionShimDisabled(bindingsLegacyConversionShimDisabled bool) Option {
	return func(d *Options) {
		d.DefaultBindingsExpressionSyntaxEnabled = bindingsLegacyConversionShimDisabled
	}
}

func WithLogger(logger *zap.Logger) Option {
	return func(d *Options) {
		d.Logger = logger
	}
}

func Apply(opts ...Option) Options {
	d := Options{
		DefaultStepSizeByOrg:                    math.MaxInt32,
		DefaultStepRateByOrg:                    math.MaxInt32,
		DefaultStepRatePerApiByOrg:              math.MaxInt32,
		DefaultStepRatePerPluginByOrg:           math.MaxInt32,
		DefaultStepRatePerUserByOrg:             math.MaxInt32,
		DefaultStepDurationByOrg:                math.MaxInt32,
		DefaultMaxParallelPoolSizeByAPI:         math.MaxInt32,
		DefaultMaxStreamSendSizeByOrg:           math.MaxInt32,
		DefaultMaxComputeMinutesPerWeek:         float64(math.MaxInt32),
		DefaultApiTimeout:                       float64(time.Duration(1 * time.Hour).Milliseconds()), // NOTE(frank): This is arbitrary.
		DefaultGoWorkerEnabled:                  false,
		DefaultWorkflowPluginInheritanceEnabled: false,
		DefaultBindingsExpressionSyntaxEnabled:  false,
		Logger:                                  zap.NewNop(),
		Config:                                  nil,
	}

	for _, opt := range opts {
		opt(&d)
	}

	return d
}
