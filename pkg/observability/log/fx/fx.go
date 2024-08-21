package logfx

import (
	"github.com/superblocksteam/agent/pkg/observability/log"

	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

func init() {
	//
	// defaults are for local dev; production must set specific details
	// in the deployment config
	//
	pflag.String("log.level", "debug", "The logging level.")
}

var Module = fx.Module("log",
	fx.Provide(
		New,
		ProvideDefaultOptions,
	),
)

func ProvideDefaultOptions() *log.Options {
	return &log.Options{
		Level: viper.GetString("log.level"),
	}
}

func New(options *log.Options) (*zap.Logger, error) {
	return log.Logger(options)
}
