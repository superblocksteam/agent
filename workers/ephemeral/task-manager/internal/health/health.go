package health

import (
	"context"
	"net/http"
	"sync/atomic"
	"time"

	r "github.com/redis/go-redis/v9"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

// RedisChecker pings Redis for the readiness probe.
type RedisChecker interface {
	Ping(ctx context.Context) *r.StatusCmd
}

// PoolReadinessChecker reports whether the sandbox pool has finished warming.
type PoolReadinessChecker interface {
	Ready() bool
}

// Manager owns the worker health state and serves the Kubernetes probe endpoints.
//
// Liveness (/healthz) is deliberately decoupled from dependency reachability: it
// reflects only whether this loop is still ticking. A Redis or sandbox-pool
// outage must never fail liveness, or kubelet would kill otherwise-healthy pods —
// the regression that got probes disabled in #2001. Dependency health belongs on
// /readyz (rotation gating) and pool warmth on /startupz (cold-start gating).
type Manager struct {
	redis  RedisChecker
	pool   PoolReadinessChecker
	logger *zap.Logger

	pingTimeout       time.Duration
	checkInterval     time.Duration
	livenessThreshold time.Duration

	redisOK  atomic.Bool
	lastTick atomic.Int64 // unix-nano of the most recent loop iteration

	run.ForwardCompatibility
}

var _ run.Runnable = (*Manager)(nil)

// Options configure a Manager.
type Options struct {
	Redis             RedisChecker
	Pool              PoolReadinessChecker
	Logger            *zap.Logger
	PingTimeout       time.Duration
	CheckInterval     time.Duration
	LivenessThreshold time.Duration // default: 3 * CheckInterval
}

// NewManager creates a health Manager. Unset durations fall back to defaults.
func NewManager(opts *Options) *Manager {
	pingTimeout := opts.PingTimeout
	if pingTimeout == 0 {
		pingTimeout = 5 * time.Second
	}

	checkInterval := opts.CheckInterval
	if checkInterval == 0 {
		checkInterval = 5 * time.Second
	}

	livenessThreshold := opts.LivenessThreshold
	if livenessThreshold == 0 {
		livenessThreshold = 3 * checkInterval
	}

	return &Manager{
		redis:             opts.Redis,
		pool:              opts.Pool,
		logger:            opts.Logger,
		pingTimeout:       pingTimeout,
		checkInterval:     checkInterval,
		livenessThreshold: livenessThreshold,
	}
}

// Run implements run.Runnable. The liveness heartbeat (lastTick) advances on its
// own ticker, wholly independent of the Redis ping: a slow or hung ping can only
// stale redisOK (readiness), never the heartbeat (liveness). Decoupling them is
// the load-bearing anti-#2001 property — liveness must never track a dependency.
func (m *Manager) Run(ctx context.Context) error {
	m.logger.Info("starting health manager",
		zap.Duration("check_interval", m.checkInterval),
		zap.Duration("liveness_threshold", m.livenessThreshold),
	)

	// Heartbeat is fresh from the instant Run starts, before the first ping.
	m.lastTick.Store(time.Now().UnixNano())

	go m.pingLoop(ctx)

	ticker := time.NewTicker(m.checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			m.lastTick.Store(time.Now().UnixNano())
		}
	}
}

// pingLoop refreshes redisOK on its own cadence, running the ping sequentially so
// at most one is ever in flight. A blocked ping delays only readiness, never the
// liveness heartbeat driven by Run.
func (m *Manager) pingLoop(ctx context.Context) {
	m.ping(ctx)

	ticker := time.NewTicker(m.checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			m.ping(ctx)
		}
	}
}

// ping updates redisOK from a single Redis PING bounded by pingTimeout. It never
// touches lastTick — see Run.
func (m *Manager) ping(ctx context.Context) {
	cctx, cancel := context.WithTimeout(ctx, m.pingTimeout)
	defer cancel()

	if err := m.redis.Ping(cctx).Err(); err != nil {
		m.redisOK.Store(false)
		m.logger.Warn("redis ping failed", zap.Error(err))
		return
	}
	m.redisOK.Store(true)
}

// Close implements run.Runnable.
func (m *Manager) Close(context.Context) error {
	m.logger.Info("shutting down health manager")
	return nil
}

// Name implements run.Runnable.
func (m *Manager) Name() string {
	return "healthManager"
}

// Alive implements run.Runnable.
func (m *Manager) Alive() bool {
	return true
}

// startupOK gates cold start until the sandbox pool is warm.
func (m *Manager) startupOK() bool {
	return m.pool.Ready()
}

// readyOK gates rotation: the worker serves traffic only when Redis is reachable
// and the pool is warm.
func (m *Manager) readyOK() bool {
	return m.redisOK.Load() && m.pool.Ready()
}

// liveOK reports whether the health loop is still ticking. It never consults
// dependency state — see the Manager doc comment.
func (m *Manager) liveOK() bool {
	last := m.lastTick.Load()
	if last == 0 {
		return false
	}
	return time.Since(time.Unix(0, last)) < m.livenessThreshold
}

// Handler returns the HTTP handler serving the probe endpoints.
func (m *Manager) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /startupz", statusHandler(m.startupOK))
	mux.HandleFunc("GET /readyz", statusHandler(m.readyOK))
	mux.HandleFunc("GET /healthz", statusHandler(m.liveOK))
	return mux
}

// statusHandler serves 200 when ok returns true, else 503.
func statusHandler(ok func() bool) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		if ok() {
			w.WriteHeader(http.StatusOK)
			return
		}
		w.WriteHeader(http.StatusServiceUnavailable)
	}
}
