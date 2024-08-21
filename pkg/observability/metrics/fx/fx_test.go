package metricsfx

import (
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	logfx "github.com/superblocksteam/agent/pkg/observability/log/fx"
	runfx "github.com/superblocksteam/agent/pkg/run/fx"
	"github.com/superblocksteam/agent/pkg/utils"

	"github.com/stretchr/testify/require"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
)

type args struct {
	opts []Option

	addrport string
	url      string
	registry prometheus.Registerer
}

func validArgs(t *testing.T) *args {
	addr := "127.0.0.1"
	port := utils.RandomLocalhostPort(t)
	validMetrics := prometheus.NewRegistry()

	args := &args{
		opts: []Option{
			WithAddr(addr),
			WithPort(port),
			WithRegistry(validMetrics),
			WithGatherer(validMetrics),
		},
	}

	args.addrport = fmt.Sprintf("%s:%d", addr, port)
	args.url = "http://" + args.addrport
	args.registry = validMetrics

	return args
}

func start(t *testing.T, args *args) {
	app := fxtest.New(t,
		fx.Replace(args.opts),
		logfx.Module,
		runfx.Module,
		Module,
	).RequireStart()

	utils.WaitForReadyTimeout(t, 100*time.Millisecond, time.Second, args.addrport)

	t.Cleanup(func() {
		app.RequireStop()
	})
}

func TestOk(t *testing.T) {
	args := validArgs(t)
	start(t, args)

	counter := promauto.With(args.registry).NewCounter(prometheus.CounterOpts{
		Name: "counter",
		Help: "a test counter",
	})
	counter.Inc()

	resp, err := http.Get(args.url + "/metrics")
	require.NoError(t, err)

	defer func() {
		require.NoError(t, resp.Body.Close())
	}()

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	require.Contains(t, string(body), "counter 1")
}

func TestOk_NoOptions(t *testing.T) {
	args := &args{
		addrport: "127.0.0.1:9090",
		url:      "http://127.0.0.1:9090",
		registry: prometheus.DefaultRegisterer,
	}
	start(t, args)

	counter := promauto.With(args.registry).NewCounter(prometheus.CounterOpts{
		Name: "counter",
		Help: "a test counter",
	})
	counter.Inc()

	resp, err := http.Get(args.url + "/metrics")
	require.NoError(t, err)

	defer func() {
		require.NoError(t, resp.Body.Close())
	}()

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	require.Contains(t, string(body), "counter 1")
}

func TestErr(t *testing.T) {
	args := validArgs(t)
	args.opts = append(args.opts, WithAddr("not-an-addr"))

	app := fxtest.New(t,
		fx.Replace(args.opts),
		logfx.Module,
		runfx.Module,
		Module,
	)
	app.RequireStart()
	wait := <-app.Wait()
	app.RequireStop()
	require.Equal(t, 1, wait.ExitCode)
}
