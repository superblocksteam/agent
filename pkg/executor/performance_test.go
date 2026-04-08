package executor

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

func TestBuildPerformance(t *testing.T) {
	for _, test := range []struct {
		name     string
		startMs  int64
		finishMs int64
		perf     *transportv1.Performance
		wantNil  bool
		check    func(*testing.T, *BuildPerformanceResult)
	}{
		{
			name:    "nil transport perf returns nil",
			perf:    nil,
			wantNil: true,
		},
		{
			name:     "basic timing without plugin execution",
			startMs:  1000,
			finishMs: 1050,
			perf:     &transportv1.Performance{},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				assert.Equal(t, int64(1000), r.perf.Start)
				assert.Equal(t, int64(1050), r.perf.Finish)
				assert.Equal(t, int64(50), r.perf.Total)
				assert.Equal(t, int64(0), r.perf.Execution)
				assert.Nil(t, r.perf.Custom, "custom should be nil when no transport timings")
			},
		},
		{
			name:     "with plugin execution",
			startMs:  1000,
			finishMs: 1050,
			perf: &transportv1.Performance{
				PluginExecution: &transportv1.Performance_Observable{Value: 30000}, // 30ms in µs
			},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				assert.Equal(t, int64(30), r.perf.Execution)
				assert.Equal(t, int64(20), r.perf.Overhead)
				assert.Nil(t, r.perf.Custom)
			},
		},
		{
			name:     "overhead clamped to zero when negative",
			startMs:  1000,
			finishMs: 1010,
			perf: &transportv1.Performance{
				PluginExecution: &transportv1.Performance_Observable{Value: 20000}, // 20ms > total 10ms
			},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				assert.Equal(t, int64(20), r.perf.Execution)
				assert.Equal(t, int64(0), r.perf.Overhead)
			},
		},
		{
			name:     "custom map populated with transport timings in ms",
			startMs:  1000,
			finishMs: 1050,
			perf: &transportv1.Performance{
				PluginExecution: &transportv1.Performance_Observable{Value: 30000},
				QueueRequest:    &transportv1.Performance_Observable{Value: 1500}, // 1.5ms
				QueueResponse:   &transportv1.Performance_Observable{Value: 4000}, // 4ms
				KvStorePush:     &transportv1.Performance_Observable{Value: 3000}, // 3ms
			},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				assert.NotNil(t, r.perf.Custom)
				assert.Equal(t, int64(1), r.perf.Custom["queue_request_ms"])
				assert.Equal(t, int64(4), r.perf.Custom["queue_response_ms"])
				assert.Equal(t, int64(3), r.perf.Custom["kv_store_push_ms"])
				_, hasKvFetch := r.perf.Custom["kv_store_fetch_ms"]
				assert.False(t, hasKvFetch, "kv_store_fetch_ms should not be present when nil")
			},
		},
		{
			name:     "custom map with transport timings but no plugin execution",
			startMs:  1000,
			finishMs: 1050,
			perf: &transportv1.Performance{
				QueueRequest: &transportv1.Performance_Observable{Value: 2000}, // 2ms
			},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				assert.Equal(t, int64(0), r.perf.Execution, "execution should be 0 without PluginExecution")
				assert.NotNil(t, r.perf.Custom, "custom should still be populated from transport timings")
				assert.Equal(t, int64(2), r.perf.Custom["queue_request_ms"])
			},
		},
		{
			name:     "sub-millisecond values truncate to zero and are omitted",
			startMs:  1000,
			finishMs: 1050,
			perf: &transportv1.Performance{
				QueueRequest:  &transportv1.Performance_Observable{Value: 500}, // 0.5ms → 0ms → omitted
				QueueResponse: &transportv1.Performance_Observable{Value: 200}, // 0.2ms → 0ms → omitted
			},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				assert.Nil(t, r.perf.Custom, "custom should be nil when all ms values truncate to zero")
			},
		},
		{
			name:     "zero-value observables omitted from custom map",
			startMs:  1000,
			finishMs: 1050,
			perf: &transportv1.Performance{
				QueueRequest:  &transportv1.Performance_Observable{Value: 0},
				QueueResponse: &transportv1.Performance_Observable{Value: 0},
			},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				assert.Nil(t, r.perf.Custom, "custom should be nil when all values are zero")
			},
		},
		{
			name:     "bootstrap timing populated from transport fields",
			startMs:  1000,
			finishMs: 1100,
			perf: &transportv1.Performance{
				PluginExecution:        &transportv1.Performance_Observable{Value: 80_000},
				BootstrapSdkImport:     &transportv1.Performance_Observable{Value: 25_000}, // 25ms
				BootstrapBridgeSetup:   &transportv1.Performance_Observable{Value: 10_000}, // 10ms
				BootstrapRequireRoot:   &transportv1.Performance_Observable{Value: 5_000},  // 5ms
				BootstrapCodeExecution: &transportv1.Performance_Observable{Value: 40_000}, // 40ms
			},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				require.NotNil(t, r.perf.BootstrapTiming)
				assert.Equal(t, int64(25), r.perf.BootstrapTiming.SdkImportMs)
				assert.Equal(t, int64(10), r.perf.BootstrapTiming.BridgeSetupMs)
				assert.Equal(t, int64(5), r.perf.BootstrapTiming.RequireRootMs)
				assert.Equal(t, int64(40), r.perf.BootstrapTiming.CodeExecutionMs)
			},
		},
		{
			name:     "bootstrap timing nil when no bootstrap fields set",
			startMs:  1000,
			finishMs: 1050,
			perf: &transportv1.Performance{
				PluginExecution: &transportv1.Performance_Observable{Value: 30_000},
			},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				assert.Nil(t, r.perf.BootstrapTiming, "bootstrap timing should be nil when worker doesn't report it")
			},
		},
		{
			name:     "bootstrap timing nil when all bootstrap values are sub-millisecond",
			startMs:  1000,
			finishMs: 1050,
			perf: &transportv1.Performance{
				BootstrapSdkImport:     &transportv1.Performance_Observable{Value: 500}, // 0.5ms → 0
				BootstrapBridgeSetup:   &transportv1.Performance_Observable{Value: 200}, // 0.2ms → 0
				BootstrapRequireRoot:   &transportv1.Performance_Observable{Value: 100}, // 0.1ms → 0
				BootstrapCodeExecution: &transportv1.Performance_Observable{Value: 900}, // 0.9ms → 0
			},
			check: func(t *testing.T, r *BuildPerformanceResult) {
				assert.Nil(t, r.perf.BootstrapTiming, "bootstrap timing should be nil when all values truncate to zero")
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result := BuildPerformance(test.startMs, test.finishMs, test.perf)
			if test.wantNil {
				assert.Nil(t, result)
				return
			}
			assert.NotNil(t, result)
			if test.check != nil {
				test.check(t, &BuildPerformanceResult{perf: result})
			}
		})
	}
}

// BuildPerformanceResult wraps the result for test assertions.
type BuildPerformanceResult struct {
	perf *apiv1.Performance
}
