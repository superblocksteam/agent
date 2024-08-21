package observabilityfx

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/superblocksteam/agent/pkg/observability/obsup"

	"github.com/go-logr/logr"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("otelfx",
	fx.Provide(
		provideDefaultOptions,
		provide,
	),
	fx.Invoke(func(*trace.TracerProvider) {}), // force provide global
)

var version string = "unknown"

type Result struct {
	fx.Out

	Logger         logr.Logger
	Resource       *resource.Resource
	TracerProvider *trace.TracerProvider
}

func init() {
	//
	// defaults are for local dev; production must set specific details
	// in the deployment config
	//
	pflag.String("otelfx.otlp.url", "", "when empty, export to stdout; otherwise send to url (ie: datadog agent: http://127.0.0.1:4318)")

	//
	// only used when url set
	//
	pflag.Duration("otelfx.batcher.batch.timeout", 1*time.Second, "The maximum delay allowed for a BatchSpanProcessor before it will export any held span.")
	pflag.Duration("otelfx.batcher.export.timeout", 15*time.Second, "The amount of time a BatchSpanProcessor waits for an exporter to export before abandoning the export.")
	pflag.Int("otelfx.batcher.max.export.batch.size", 1000, "The maximum export batch size allowed for a BatchSpanProcessor.")
	pflag.Int("otelfx.batcher.max.queue.size", 5000, "The maximum queue size allowed for a BatchSpanProcessor.")
}

func provideDefaultOptions() obsup.Options {
	return obsup.Options{
		ServiceName:    filepath.Base(os.Args[0]),
		ServiceVersion: version,
		OtlpUrl:        viper.GetString("otelfx.otlp.url"),

		BatchOptions: []trace.BatchSpanProcessorOption{
			trace.WithBatchTimeout(viper.GetDuration("otelfx.batcher.batch.timeout")),
			trace.WithExportTimeout(viper.GetDuration("otelfx.batcher.export.timeout")),
			trace.WithMaxExportBatchSize(viper.GetInt("otelfx.batcher.max.export.batch.size")),
			trace.WithMaxQueueSize(viper.GetInt("otelfx.batcher.max.queue.size")),
		},
	}
}

func provide(lc fx.Lifecycle, logger *zap.Logger, opts obsup.Options) (Result, error) {
	r, shutdown, err := obsup.Setup(logger, opts)
	if err != nil {
		err = fmt.Errorf("obsup.Setup error: %w", err)
	}

	if shutdown != nil {
		lc.Append(fx.Hook{
			OnStop: shutdown,
		})
	}

	return Result{
		Logger:         r.Logger,
		Resource:       r.Resource,
		TracerProvider: r.TracerProvider,
	}, err
}
