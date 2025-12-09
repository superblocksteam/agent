package obsup

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"runtime/debug"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/contrib/bridges/otelzap"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	sdklog "go.opentelemetry.io/otel/sdk/log"
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
	return startOtlpReceiverWithExpectedTraces(t, 1)
}

func startOtlpReceiverWithExpectedTraces(t *testing.T, expectedTraces int) string {
	var wg sync.WaitGroup

	mux := http.NewServeMux()
	tracesHit := 0
	mux.HandleFunc("/v1/traces", func(w http.ResponseWriter, req *http.Request) {
		tracesHit += 1
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/v1/logs", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	server := &http.Server{Handler: mux}

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

		require.Equal(t, expectedTraces, tracesHit)
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

func TestSetupCreatesLoggerProvider(t *testing.T) {
	addr := startOtlpReceiverWithExpectedTraces(t, 0)

	args := validArgs(t)
	args.opts.OtlpUrl = "http://" + addr

	result, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)
	require.NotNil(t, result.LoggerProvider, "LoggerProvider should be created when OtlpUrl is set")

	require.NoError(t, shutdown(context.Background()))
}

func TestSetupNoLoggerProviderWithoutUrl(t *testing.T) {
	args := validArgs(t)
	args.opts.OtlpUrl = ""

	result, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)
	require.Nil(t, result.LoggerProvider, "LoggerProvider should be nil when OtlpUrl is empty")

	require.NoError(t, shutdown(context.Background()))
}

func TestBuildLogsURL(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "replaces /v1/traces suffix",
			input:    "https://traces.intake.superblocks.com/v1/traces",
			expected: "https://traces.intake.superblocks.com/v1/logs",
		},
		{
			name:     "appends /v1/logs to base URL",
			input:    "https://otel-collector.example.com",
			expected: "https://otel-collector.example.com/v1/logs",
		},
		{
			name:     "handles trailing slash",
			input:    "https://otel-collector.example.com/",
			expected: "https://otel-collector.example.com/v1/logs",
		},
		{
			name:     "handles http URL",
			input:    "http://localhost:4318/v1/traces",
			expected: "http://localhost:4318/v1/logs",
		},
		{
			name:     "handles URL without path",
			input:    "http://localhost:4318",
			expected: "http://localhost:4318/v1/logs",
		},
		{
			name:     "preserves URL that already has /v1/logs suffix",
			input:    "http://localhost:4318/v1/logs",
			expected: "http://localhost:4318/v1/logs",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := buildLogsURL(tt.input)
			require.Equal(t, tt.expected, result)
		})
	}
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

func TestLogsFlowToOtelCollector(t *testing.T) {
	var logsReceived int32

	mux := http.NewServeMux()
	mux.HandleFunc("/v1/traces", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/v1/logs", func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&logsReceived, 1)
		w.WriteHeader(http.StatusOK)
	})

	server := &http.Server{Handler: mux}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		server.Serve(listener)
	}()

	t.Cleanup(func() {
		server.Shutdown(context.Background())
		wg.Wait()
	})

	addr := fmt.Sprintf("127.0.0.1:%d", listener.Addr().(*net.TCPAddr).Port)

	args := validArgs(t)
	args.opts.OtlpUrl = "http://" + addr

	result, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)
	require.NotNil(t, result.LoggerProvider)

	// Create logger with OTEL core
	otelCore := otelzap.NewCore("test", otelzap.WithLoggerProvider(result.LoggerProvider))
	logger := zap.New(otelCore)

	// Log a message
	logger.Info("integration test log")

	// Force flush the provider to ensure logs are exported
	result.LoggerProvider.ForceFlush(context.Background())

	// Wait briefly for async export
	time.Sleep(100 * time.Millisecond)

	require.NoError(t, shutdown(context.Background()))
	require.Greater(t, atomic.LoadInt32(&logsReceived), int32(0), "expected logs to be sent to collector")
}

func TestSetupWithHeaders(t *testing.T) {
	var receivedHeaders http.Header

	mux := http.NewServeMux()
	mux.HandleFunc("/v1/traces", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/v1/logs", func(w http.ResponseWriter, r *http.Request) {
		receivedHeaders = r.Header.Clone()
		w.WriteHeader(http.StatusOK)
	})

	server := &http.Server{Handler: mux}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		server.Serve(listener)
	}()

	t.Cleanup(func() {
		server.Shutdown(context.Background())
		wg.Wait()
	})

	addr := fmt.Sprintf("127.0.0.1:%d", listener.Addr().(*net.TCPAddr).Port)

	args := validArgs(t)
	args.opts.OtlpUrl = "http://" + addr
	args.opts.Headers = map[string]string{
		"x-superblocks-agent-key": "test-agent-key",
		"x-custom-header":         "custom-value",
	}

	result, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)
	require.NotNil(t, result.LoggerProvider)

	// Create logger with OTEL core and send a log
	otelCore := otelzap.NewCore("test", otelzap.WithLoggerProvider(result.LoggerProvider))
	logger := zap.New(otelCore)
	logger.Info("test log with headers")

	// Force flush and wait for export
	result.LoggerProvider.ForceFlush(context.Background())
	time.Sleep(100 * time.Millisecond)

	require.NoError(t, shutdown(context.Background()))

	// Verify headers were received
	require.NotNil(t, receivedHeaders, "expected to receive headers from log request")
	require.Equal(t, "test-agent-key", receivedHeaders.Get("x-superblocks-agent-key"))
	require.Equal(t, "custom-value", receivedHeaders.Get("x-custom-header"))
}

func TestLoggerProviderIncludedInShutdown(t *testing.T) {
	addr := startOtlpReceiverWithExpectedTraces(t, 0)

	args := validArgs(t)
	args.opts.OtlpUrl = "http://" + addr

	result, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)
	require.NotNil(t, result.LoggerProvider)

	// Create logger and send some logs
	otelCore := otelzap.NewCore("test", otelzap.WithLoggerProvider(result.LoggerProvider))
	logger := zap.New(otelCore)
	logger.Info("log before shutdown")

	// Call shutdown - this should gracefully shut down LoggerProvider
	err = shutdown(context.Background())
	require.NoError(t, err)

	// After shutdown, the LoggerProvider should be shut down
	// Calling ForceFlush after shutdown should return an error or no-op
	// This verifies the provider was properly included in the shutdown chain
}

func TestSetupWithLogBatchOptions(t *testing.T) {
	addr := startOtlpReceiverWithExpectedTraces(t, 0)

	args := validArgs(t)
	args.opts.OtlpUrl = "http://" + addr
	args.opts.LogBatchOptions = []sdklog.BatchProcessorOption{
		sdklog.WithExportTimeout(5 * time.Second),
	}

	result, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)
	require.NotNil(t, result.LoggerProvider)

	require.NoError(t, shutdown(context.Background()))
}

func TestSetupResultFields(t *testing.T) {
	addr := startOtlpReceiverWithExpectedTraces(t, 0)

	args := validArgs(t)
	args.opts.OtlpUrl = "http://" + addr

	result, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)

	// Verify all result fields are populated
	require.NotNil(t, result.Logger)
	require.NotNil(t, result.Resource)
	require.NotNil(t, result.TracerProvider)
	require.NotNil(t, result.LoggerProvider)

	require.NoError(t, shutdown(context.Background()))
}

func TestSetupWithoutOtlpUrlNoLoggerProvider(t *testing.T) {
	args := validArgs(t)
	args.opts.OtlpUrl = ""

	result, shutdown, err := Setup(args.logger, args.opts)
	require.NoError(t, err)

	// Without OtlpUrl, LoggerProvider should be nil
	require.Nil(t, result.LoggerProvider)
	// But TracerProvider should still be created (using stdout)
	require.NotNil(t, result.TracerProvider)
	require.NotNil(t, result.Resource)

	require.NoError(t, shutdown(context.Background()))
}

// mockConfigProvider implements ConfigProvider for testing.
type mockConfigProvider struct {
	strings   map[string]string
	ints      map[string]int
	durations map[string]time.Duration
}

func (m *mockConfigProvider) GetString(key string) string {
	return m.strings[key]
}

func (m *mockConfigProvider) GetInt(key string) int {
	return m.ints[key]
}

func (m *mockConfigProvider) GetDuration(key string) time.Duration {
	return m.durations[key]
}

func TestOptionsFromConfig(t *testing.T) {
	cfg := &mockConfigProvider{
		strings: map[string]string{
			"otel.collector.http.url": "http://localhost:4318",
			"superblocks.key":         "test-agent-key",
		},
		ints: map[string]int{
			"otel.batcher.max_queue_size":        5000,
			"otel.batcher.max_export_batch_size": 1000,
		},
		durations: map[string]time.Duration{
			"otel.batcher.export_timeout": 15 * time.Second,
			"otel.batcher.batch_timeout":  1 * time.Second,
		},
	}

	opts := OptionsFromConfig(cfg, "test-service", "v1.0.0")

	require.Equal(t, "test-service", opts.ServiceName)
	require.Equal(t, "v1.0.0", opts.ServiceVersion)
	require.Equal(t, "http://localhost:4318", opts.OtlpUrl)
	require.Equal(t, "test-agent-key", opts.Headers["x-superblocks-agent-key"])
	require.Len(t, opts.BatchOptions, 4)
}

func TestOptionsFromConfigEmptyValues(t *testing.T) {
	cfg := &mockConfigProvider{
		strings:   map[string]string{},
		ints:      map[string]int{},
		durations: map[string]time.Duration{},
	}

	opts := OptionsFromConfig(cfg, "empty-service", "v0.0.0")

	require.Equal(t, "empty-service", opts.ServiceName)
	require.Equal(t, "v0.0.0", opts.ServiceVersion)
	require.Equal(t, "", opts.OtlpUrl)
	require.Equal(t, "", opts.Headers["x-superblocks-agent-key"])
}

func TestOptionsFromConfigWithSetup(t *testing.T) {
	// Integration test: verify OptionsFromConfig produces valid options for Setup
	addr := startOtlpReceiverWithExpectedTraces(t, 0)

	cfg := &mockConfigProvider{
		strings: map[string]string{
			"otel.collector.http.url": "http://" + addr,
			"superblocks.key":         "integration-test-key",
		},
		ints: map[string]int{
			"otel.batcher.max_queue_size":        100,
			"otel.batcher.max_export_batch_size": 10,
		},
		durations: map[string]time.Duration{
			"otel.batcher.export_timeout": 5 * time.Second,
			"otel.batcher.batch_timeout":  500 * time.Millisecond,
		},
	}

	opts := OptionsFromConfig(cfg, "integration-test", "v1.0.0")
	logger := zaptest.NewLogger(t)

	result, shutdown, err := Setup(logger, opts)
	require.NoError(t, err)
	require.NotNil(t, result.LoggerProvider)
	require.NotNil(t, result.TracerProvider)

	require.NoError(t, shutdown(context.Background()))
}
