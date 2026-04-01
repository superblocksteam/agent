package telemetry

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestInitRequiresPolicy(t *testing.T) {
	resetSingletonForTest()

	_, err := Init(context.Background(), Config{
		ServiceName:    "svc",
		ServiceVersion: "1.0.0",
		Environment:    "test",
	}, TelemetryPolicy{}, nil)
	require.Error(t, err)
}

func TestInitCloudPremTier1Blocked(t *testing.T) {
	resetSingletonForTest()

	instance, err := Init(context.Background(), Config{
		ServiceName:    "svc",
		ServiceVersion: "1.0.0",
		Environment:    "test",
	}, DefaultCloudPremPolicy(), nil)
	require.NoError(t, err)
	defer instance.Shutdown(context.Background())

	assert.False(t, instance.PolicyEvaluator.CanExport(Tier1Local, "0123456789abcdef0123456789abcdef"))
	assert.True(t, instance.PolicyEvaluator.CanExport(Tier2Operational, "0123456789abcdef0123456789abcdef"))
}

func TestInitReturnsSingleton(t *testing.T) {
	resetSingletonForTest()

	cfg := Config{
		ServiceName:    "svc",
		ServiceVersion: "1.0.0",
		Environment:    "test",
	}
	policy := DefaultCloudPolicy()

	a, err := Init(context.Background(), cfg, policy, nil)
	require.NoError(t, err)
	defer a.Shutdown(context.Background())

	b, err := Init(context.Background(), cfg, policy, nil)
	require.NoError(t, err)

	assert.Same(t, a, b)
}

func TestInitShutdownIdempotent(t *testing.T) {
	resetSingletonForTest()

	instance, err := Init(context.Background(), Config{
		ServiceName:    "svc",
		ServiceVersion: "1.0.0",
		Environment:    "test",
	}, DefaultCloudPolicy(), nil)
	require.NoError(t, err)

	require.NoError(t, instance.Shutdown(context.Background()))
	require.NoError(t, instance.Shutdown(context.Background()))
}

func TestInitCIUsesNoOp(t *testing.T) {
	resetSingletonForTest()
	t.Setenv("CI", "true")

	instance, err := Init(context.Background(), Config{
		ServiceName:    "svc",
		ServiceVersion: "1.0.0",
		Environment:    "test",
	}, DefaultCloudPolicy(), nil)
	require.NoError(t, err)

	assert.Nil(t, instance.TracerProvider)
	assert.Nil(t, instance.MeterProvider)
	assert.Nil(t, instance.LoggerProvider)
	require.NoError(t, instance.Shutdown(context.Background()))
}

func TestInitInvalidConfig(t *testing.T) {
	resetSingletonForTest()

	_, err := Init(context.Background(), Config{
		ServiceName:    "svc",
		ServiceVersion: "1.0.0",
		Environment:    "test",
		OTLPURL:        "://bad",
	}, DefaultCloudPolicy(), nil)
	require.Error(t, err)
}

func TestSignalURL(t *testing.T) {
	for _, test := range []struct {
		name     string
		baseURL  string
		signal   string
		expected string
	}{
		{name: "empty URL", baseURL: "", signal: "/v1/traces", expected: ""},
		{name: "whitespace only", baseURL: "   ", signal: "/v1/traces", expected: ""},
		{name: "bare URL", baseURL: "http://localhost:4318", signal: "/v1/traces", expected: "http://localhost:4318/v1/traces"},
		{name: "trailing slash", baseURL: "http://localhost:4318/", signal: "/v1/metrics", expected: "http://localhost:4318/v1/metrics"},
		{name: "existing /v1/traces suffix", baseURL: "http://localhost:4318/v1/traces", signal: "/v1/traces", expected: "http://localhost:4318/v1/traces"},
		{name: "existing /v1/metrics suffix replaced", baseURL: "http://localhost:4318/v1/metrics", signal: "/v1/logs", expected: "http://localhost:4318/v1/logs"},
		{name: "existing /v1/logs suffix replaced", baseURL: "http://localhost:4318/v1/logs", signal: "/v1/traces", expected: "http://localhost:4318/v1/traces"},
		{name: "trailing slash and suffix", baseURL: "http://localhost:4318/v1/traces/", signal: "/v1/traces", expected: "http://localhost:4318/v1/traces"},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expected, signalURL(test.baseURL, test.signal))
		})
	}
}

func TestValidateConfig(t *testing.T) {
	for _, test := range []struct {
		name    string
		cfg     Config
		wantErr string
	}{
		{
			name:    "empty service name",
			cfg:     Config{ServiceName: "", ServiceVersion: "1.0.0", Environment: "test"},
			wantErr: "service name is required",
		},
		{
			name:    "whitespace service name",
			cfg:     Config{ServiceName: "  ", ServiceVersion: "1.0.0", Environment: "test"},
			wantErr: "service name is required",
		},
		{
			name:    "empty service version",
			cfg:     Config{ServiceName: "svc", ServiceVersion: "", Environment: "test"},
			wantErr: "service version is required",
		},
		{
			name:    "empty environment",
			cfg:     Config{ServiceName: "svc", ServiceVersion: "1.0.0", Environment: ""},
			wantErr: "environment is required",
		},
		{
			name: "valid config no OTLPURL",
			cfg:  Config{ServiceName: "svc", ServiceVersion: "1.0.0", Environment: "test"},
		},
		{
			name: "valid config with OTLPURL",
			cfg:  Config{ServiceName: "svc", ServiceVersion: "1.0.0", Environment: "test", OTLPURL: "http://localhost:4318"},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			err := validateConfig(test.cfg)
			if test.wantErr != "" {
				require.ErrorContains(t, err, test.wantErr)
				return
			}
			require.NoError(t, err)
		})
	}
}

func TestNoOpInstanceClosureNaming(t *testing.T) {
	resetSingletonForTest()
	t.Setenv("CI", "true")

	instance, err := Init(context.Background(), Config{
		ServiceName:    "my-service",
		ServiceVersion: "2.0.0",
		Environment:    "test",
	}, DefaultCloudPolicy(), nil)
	require.NoError(t, err)
	defer instance.Shutdown(context.Background())

	// Empty name should not panic and should return valid providers.
	assert.NotNil(t, instance.GetTracer(""))
	assert.NotNil(t, instance.GetMeter(""))
	assert.NotNil(t, instance.GetLogger(""))

	// Explicit name should also work.
	assert.NotNil(t, instance.GetTracer("custom"))
	assert.NotNil(t, instance.GetMeter("custom"))
	assert.NotNil(t, instance.GetLogger("custom"))
}

func TestInitExportDisabled(t *testing.T) {
	resetSingletonForTest()
	t.Setenv("CI", "")

	instance, err := Init(context.Background(), Config{
		ServiceName:    "svc",
		ServiceVersion: "1.0.0",
		Environment:    "test",
		// No OTLPURL -- export disabled.
	}, DefaultCloudPolicy(), nil)
	require.NoError(t, err)
	defer instance.Shutdown(context.Background())

	// Providers are created (non-nil) but without exporters.
	assert.NotNil(t, instance.TracerProvider)
	assert.NotNil(t, instance.MeterProvider)
	// LoggerProvider is nil when OTLPURL is empty.
	assert.Nil(t, instance.LoggerProvider)

	// Closures still work.
	assert.NotNil(t, instance.GetTracer(""))
	assert.NotNil(t, instance.GetMeter(""))
	assert.NotNil(t, instance.GetLogger(""))
}

func TestInitDefaultBatchConfig(t *testing.T) {
	resetSingletonForTest()
	t.Setenv("CI", "")

	// An httptest server acts as the OTLP endpoint so newTraceProvider takes
	// the export-enabled path and actually constructs the ResilientExporter and
	// BatchSpanProcessor where BatchConfig is applied.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	// Zero-value BatchConfig should produce a functional instance — the
	// ResilientExporter uses its built-in defaults (maxQueueSize=2048,
	// exportTimeout=30s) and the BatchSpanProcessor uses SDK defaults.
	instance, err := Init(context.Background(), Config{
		ServiceName:    "svc",
		ServiceVersion: "1.0.0",
		Environment:    "test",
		OTLPURL:        srv.URL,
	}, DefaultCloudPolicy(), nil)
	require.NoError(t, err)
	defer instance.Shutdown(context.Background())

	assert.NotNil(t, instance.TracerProvider)
	assert.NotNil(t, instance.GetTracer(""))
}

func TestInitCustomBatchConfig(t *testing.T) {
	resetSingletonForTest()
	t.Setenv("CI", "")

	// An httptest server acts as the OTLP endpoint so the BatchConfig wiring
	// path in newTraceProvider is exercised.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	// Non-zero BatchConfig values should flow through to the ResilientExporter
	// and BatchSpanProcessor without error.
	instance, err := Init(context.Background(), Config{
		ServiceName:    "svc",
		ServiceVersion: "1.0.0",
		Environment:    "test",
		OTLPURL:        srv.URL,
		Batch: BatchConfig{
			MaxQueueSize:       4096,
			MaxExportBatchSize: 1024,
			BatchTimeout:       10 * time.Second,
			ExportTimeout:      60 * time.Second,
		},
	}, DefaultCloudPolicy(), nil)
	require.NoError(t, err)
	defer instance.Shutdown(context.Background())

	assert.NotNil(t, instance.TracerProvider)
	assert.NotNil(t, instance.GetTracer(""))
}

func resetSingletonForTest() {
	initMu.Lock()
	defer initMu.Unlock()
	initialized = nil
}
