package obsup

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"runtime/debug"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/sdk/trace"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"
)

type args struct {
	logger *zap.Logger
	opts   Options
}

func validArgs(t *testing.T) *args {
	return &args{
		logger: zaptest.NewLogger(t),
		opts: Options{
			ServiceName:    "test",
			ServiceVersion: "v1",
			OtlpUrl:        "",

			BatchOptions: []trace.BatchSpanProcessorOption{
				trace.WithBatchTimeout(1 * time.Second),
				trace.WithExportTimeout(15 * time.Second),
				trace.WithMaxExportBatchSize(1000),
				trace.WithMaxQueueSize(5000),
			},
		},
	}
}

func startOtlpReceiver(t *testing.T) string {
	var wg sync.WaitGroup

	var server http.Server

	tracesHit := 0
	http.HandleFunc("/v1/traces", func(w http.ResponseWriter, req *http.Request) {
		tracesHit += 1
		w.WriteHeader(http.StatusOK)
	})

	host := "127.0.0.1"
	listener, err := net.Listen("tcp", host+":0")
	require.NoError(t, err)

	wg.Add(1)
	go func() {
		defer wg.Done()
		require.ErrorIs(t, server.Serve(listener), http.ErrServerClosed)
	}()

	t.Cleanup(func() {
		require.NoError(t, server.Shutdown(context.Background()))
		_ = listener.Close()
		wg.Wait()

		require.Equal(t, 1, tracesHit)
	})

	return fmt.Sprintf("%s:%d", host, listener.Addr().(*net.TCPAddr).Port)
}

func TestSetupOk(t *testing.T) {
	args := validArgs(t)

	_, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)

	require.NoError(t, shutdown(context.Background()))
}

func TestSetupOkWithOtlpUrl(t *testing.T) {
	addr := startOtlpReceiver(t)

	args := validArgs(t)
	args.opts.OtlpUrl = "http://" + addr

	_, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)

	tracer := otel.Tracer("test")
	_, span := tracer.Start(context.Background(), "testspan")
	span.End()

	require.NoError(t, shutdown(context.Background()))
}

func TestSetupDdGit(t *testing.T) {
	info := debug.BuildInfo{
		Main: debug.Module{Path: "mod.path"},
		Settings: []debug.BuildSetting{
			{
				Key:   "vcs.revision",
				Value: "sha",
			},
		},
	}
	infoFactory := func() (debug.BuildInfo, bool) {
		return info, true
	}

	envRepo := "env-repo"
	envSha := "env-sha"

	for _, tt := range []struct {
		name            string
		infoFactory     func() (debug.BuildInfo, bool)
		envGitCommitSha string
		envGitRepoUrl   string
		expect          []attribute.KeyValue
	}{
		{
			name:        "buildinfo",
			infoFactory: infoFactory,
			expect: []attribute.KeyValue{
				attribute.Key("git.commit.sha").String(info.Settings[0].Value),
				attribute.Key("git.repository_url").String(info.Main.Path),
			},
		},
		{
			name:            "buildinfo + env",
			infoFactory:     infoFactory,
			envGitCommitSha: envSha,
			envGitRepoUrl:   envRepo,
			expect: []attribute.KeyValue{
				attribute.Key("git.commit.sha").String(envSha),
				attribute.Key("git.repository_url").String(envRepo),
			},
		},
		{
			name: "env",
			infoFactory: func() (debug.BuildInfo, bool) {
				return debug.BuildInfo{}, false
			},
			envGitCommitSha: envSha,
			envGitRepoUrl:   envRepo,
			expect: []attribute.KeyValue{
				attribute.Key("git.commit.sha").String(envSha),
				attribute.Key("git.repository_url").String(envRepo),
			},
		},
		{
			name: "nothing",
			infoFactory: func() (debug.BuildInfo, bool) {
				return debug.BuildInfo{}, false
			},
			expect: []attribute.KeyValue{},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("SB_GIT_COMMIT_SHA", tt.envGitCommitSha)
			t.Setenv("SB_GIT_REPOSITORY_URL", tt.envGitRepoUrl)

			info, ok := tt.infoFactory()
			infop := &info
			if !ok {
				infop = nil
			}
			require.Equal(t, tt.expect, setupDdGit(zaptest.NewLogger(t), infop))
		})
	}
}
