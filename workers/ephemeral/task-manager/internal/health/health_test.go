package health

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	r "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

// fakeRedis is a RedisChecker whose Ping result is controlled by err.
type fakeRedis struct {
	err error
}

func (f fakeRedis) Ping(ctx context.Context) *r.StatusCmd {
	cmd := r.NewStatusCmd(ctx)
	if f.err != nil {
		cmd.SetErr(f.err)
	} else {
		cmd.SetVal("PONG")
	}
	return cmd
}

// fakePool is a PoolReadinessChecker with a fixed readiness.
type fakePool struct {
	ready bool
}

func (f fakePool) Ready() bool { return f.ready }

func newTestManager(redis RedisChecker, pool PoolReadinessChecker) *Manager {
	return NewManager(&Options{
		Redis:             redis,
		Pool:              pool,
		Logger:            zap.NewNop(),
		PingTimeout:       time.Second,
		CheckInterval:     10 * time.Millisecond,
		LivenessThreshold: 30 * time.Millisecond,
	})
}

func probe(t *testing.T, h http.Handler, path string) int {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec.Code
}

func TestManager_Startupz(t *testing.T) {
	tests := []struct {
		name      string
		poolReady bool
		want      int
	}{
		{"pool warm returns 200", true, http.StatusOK},
		{"pool cold returns 503", false, http.StatusServiceUnavailable},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m := newTestManager(fakeRedis{}, fakePool{ready: tt.poolReady})
			assert.Equal(t, tt.want, probe(t, m.Handler(), "/startupz"))
		})
	}
}

func TestManager_Readyz(t *testing.T) {
	tests := []struct {
		name      string
		redisOK   bool
		poolReady bool
		want      int
	}{
		{"redis up and pool warm returns 200", true, true, http.StatusOK},
		{"redis down returns 503", false, true, http.StatusServiceUnavailable},
		{"pool cold returns 503", true, false, http.StatusServiceUnavailable},
		{"both down returns 503", false, false, http.StatusServiceUnavailable},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m := newTestManager(fakeRedis{}, fakePool{ready: tt.poolReady})
			m.redisOK.Store(tt.redisOK)
			m.lastTick.Store(time.Now().UnixNano())
			assert.Equal(t, tt.want, probe(t, m.Handler(), "/readyz"))
		})
	}
}

// TestManager_Healthz_LivenessDecoupledFromDeps is the anti-#2001 invariant:
// liveness reflects only the loop heartbeat, never dependency reachability.
func TestManager_Healthz_LivenessDecoupledFromDeps(t *testing.T) {
	m := newTestManager(fakeRedis{}, fakePool{ready: false})

	// Redis DOWN and pool cold, but the loop just ticked.
	m.redisOK.Store(false)
	m.lastTick.Store(time.Now().UnixNano())

	assert.Equal(t, http.StatusOK, probe(t, m.Handler(), "/healthz"),
		"liveness must stay 200 while the loop is ticking, even with deps down")
	assert.Equal(t, http.StatusServiceUnavailable, probe(t, m.Handler(), "/readyz"),
		"readiness must be 503 when redis is down")
}

func TestManager_Healthz_StaleTickFails(t *testing.T) {
	m := newTestManager(fakeRedis{}, fakePool{ready: true})

	// Loop last ticked well beyond the liveness threshold.
	m.redisOK.Store(true)
	m.lastTick.Store(time.Now().Add(-time.Second).UnixNano())

	assert.Equal(t, http.StatusServiceUnavailable, probe(t, m.Handler(), "/healthz"),
		"liveness must fail once the loop stops ticking")
}

func TestManager_Healthz_NeverTickedFails(t *testing.T) {
	m := newTestManager(fakeRedis{}, fakePool{ready: true})
	// lastTick is zero: the loop has not run yet.
	assert.Equal(t, http.StatusServiceUnavailable, probe(t, m.Handler(), "/healthz"))
}

func TestManager_Run_UpdatesHeartbeatAndRedisState(t *testing.T) {
	m := newTestManager(fakeRedis{}, fakePool{ready: true})

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- m.Run(ctx) }()

	// Heartbeat (liveness) is recorded at Run start.
	require.Eventually(t, func() bool {
		return probe(t, m.Handler(), "/healthz") == http.StatusOK
	}, time.Second, 5*time.Millisecond, "loop should record a heartbeat")

	// redisOK is set by the ping loop, a goroutine decoupled from the heartbeat,
	// so wait for it rather than asserting immediately after the heartbeat is up.
	require.Eventually(t, func() bool {
		return m.redisOK.Load() && probe(t, m.Handler(), "/readyz") == http.StatusOK
	}, time.Second, 5*time.Millisecond, "healthy redis ping should set redisOK and readiness")

	cancel()
	assert.NoError(t, <-done, "Run returns nil on context cancellation")
}

func TestManager_Run_RedisDownKeepsLivenessUp(t *testing.T) {
	m := newTestManager(fakeRedis{err: context.DeadlineExceeded}, fakePool{ready: true})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- m.Run(ctx) }()

	require.Eventually(t, func() bool {
		return m.lastTick.Load() != 0
	}, time.Second, 5*time.Millisecond, "loop should tick even when redis fails")

	assert.False(t, m.redisOK.Load(), "failed redis ping should clear redisOK")
	assert.Equal(t, http.StatusOK, probe(t, m.Handler(), "/healthz"),
		"liveness stays up while the loop ticks despite redis failures")
	assert.Equal(t, http.StatusServiceUnavailable, probe(t, m.Handler(), "/readyz"))

	cancel()
	assert.NoError(t, <-done)
}

// blockingRedis simulates a Redis ping that hangs past the liveness threshold,
// ignoring its context — the pathological case liveness must survive without a
// kubelet kill (the #2001 trap: liveness coupled to a stalled dependency).
type blockingRedis struct{ block time.Duration }

func (b blockingRedis) Ping(ctx context.Context) *r.StatusCmd {
	time.Sleep(b.block)
	cmd := r.NewStatusCmd(ctx)
	cmd.SetVal("PONG")
	return cmd
}

func TestManager_Run_BlockingPingDoesNotStallLiveness(t *testing.T) {
	// A ping that hangs far longer than the liveness threshold must not stall the
	// heartbeat: lastTick advances on its own ticker, so /healthz stays 200 while
	// the ping is stuck. Timings are generous (heartbeat 20ms vs threshold 250ms)
	// so the assertion is robust under the race detector, yet still fails if the
	// heartbeat ticker stops advancing — not merely if the initial store happened
	// (the gap a single Eventually window on the first tick would miss).
	m := NewManager(&Options{
		Redis:             blockingRedis{block: 3 * time.Second},
		Pool:              fakePool{ready: true},
		Logger:            zap.NewNop(),
		PingTimeout:       5 * time.Second,
		CheckInterval:     20 * time.Millisecond,
		LivenessThreshold: 250 * time.Millisecond,
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- m.Run(ctx) }()

	// Liveness comes up promptly (heartbeat stored at Run start, before any ping).
	require.Eventually(t, func() bool {
		return probe(t, m.Handler(), "/healthz") == http.StatusOK
	}, time.Second, 10*time.Millisecond, "liveness should come up at start")

	// Well past the threshold while the ping is still blocked: if the heartbeat
	// ticker weren't advancing, the initial lastTick would be stale and 503 by now.
	time.Sleep(600 * time.Millisecond)
	require.Equal(t, http.StatusOK, probe(t, m.Handler(), "/healthz"),
		"liveness must stay up past the threshold while the ping is blocked (heartbeat advances independently)")

	cancel()
	assert.NoError(t, <-done)
}

func TestManager_RunnableContract(t *testing.T) {
	m := newTestManager(fakeRedis{}, fakePool{ready: true})
	assert.Equal(t, "healthManager", m.Name())
	assert.True(t, m.Alive())
	assert.NoError(t, m.Close(context.Background()))
}

func TestNewManager_Defaults(t *testing.T) {
	m := NewManager(&Options{
		Redis:  fakeRedis{},
		Pool:   fakePool{},
		Logger: zap.NewNop(),
	})
	assert.Equal(t, 5*time.Second, m.pingTimeout)
	assert.Equal(t, 5*time.Second, m.checkInterval)
	assert.Equal(t, 15*time.Second, m.livenessThreshold, "defaults to 3x checkInterval")
}
