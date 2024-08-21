package metricsfx

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	pkghttp "github.com/superblocksteam/agent/pkg/http"
	"github.com/superblocksteam/run"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var (
	Module = fx.Module("metricsfx",
		fx.Provide(
			provideDefaultOptions,
			provide,
		),
		fx.Invoke(func(*http.ServeMux) {}), // force start metricsfx server
	)
	defaults = options{
		Addr:     "127.0.0.1",
		Port:     9090,
		Registry: prometheus.DefaultRegisterer,
		Gatherer: prometheus.DefaultGatherer,
	}
)

func init() {
	pflag.String("metricsfx.addr", "127.0.0.1", "metrics serving address")
	pflag.Int("metricsfx.port", 9090, "metrics serving port")
}

func provideDefaultOptions() []Option {
	return []Option{
		WithAddr(viper.GetString("metricsfx.addr")),
		WithPort(viper.GetInt("metricsfx.port")),
	}
}

func provide(log *zap.Logger, g *run.Group, opts []Option) *http.ServeMux {
	mux := http.NewServeMux()

	options := defaults
	for _, opt := range opts {
		opt(&options)
	}

	metricsHttpHandler := promhttp.InstrumentMetricHandler(
		options.Registry,
		promhttp.HandlerFor(options.Gatherer, promhttp.HandlerOpts{}),
	)
	mux.Handle("/metrics", metricsHttpHandler)

	runnable := pkghttp.Prepare(&pkghttp.Options{
		Name:         "metricsfx",
		InsecureAddr: options.Addr,
		InsecurePort: options.Port,
		Logger:       log.Named("metricsfx"),
		Handler:      mux,
	})

	g.Always(runnable)

	return mux
}
