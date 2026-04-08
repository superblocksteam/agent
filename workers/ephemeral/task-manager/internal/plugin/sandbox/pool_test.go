package sandbox

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"

	"workers/ephemeral/task-manager/internal/plugin"
)

// attachSandboxPoolRunCtx sets the pool run context as Run() would. notifyPoolReadyChannels
// requires a non-nil runCtx to deliver to NotifyWhenReady waiters.
func attachSandboxPoolRunCtx(ctx context.Context, p *SandboxPool) {
	p.runMu.Lock()
	p.runCtx = ctx
	p.runMu.Unlock()
}

func mustTestSandboxPlugin(t *testing.T, sandboxID string) *SandboxPlugin {
	t.Helper()
	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress("127.0.0.1:65530"),
		WithSandboxId(sandboxID),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)
	return p
}

func TestSandboxPool_pickWithId_roundRobin(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "a")}
	e0.status.Store(uint32(poolEntryReady))
	e1 := &poolEntry{plug: mustTestSandboxPlugin(t, "b")}
	e1.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		rr:          &atomic.Uint32{},
		plugins:     map[string]*poolEntry{"id-0": e0, "id-1": e1},
		pluginOrder: []string{"id-0", "id-1"},
	}

	id1, ent1 := p.pickWithId(false)
	id2, ent2 := p.pickWithId(false)
	id3, ent3 := p.pickWithId(false)
	require.Equal(t, "id-0", id1)
	require.Same(t, e0, ent1)
	require.Equal(t, "id-1", id2)
	require.Same(t, e1, ent2)
	require.Equal(t, "id-0", id3)
	require.Same(t, e0, ent3)
}

func TestSandboxPool_pickWithId_skipsNotReady(t *testing.T) {
	t.Parallel()

	notReady := &poolEntry{plug: mustTestSandboxPlugin(t, "cold")}
	notReady.status.Store(uint32(poolEntryNotReady))
	ready := &poolEntry{plug: mustTestSandboxPlugin(t, "warm")}
	ready.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		rr:          &atomic.Uint32{},
		plugins:     map[string]*poolEntry{"id-0": notReady, "id-1": ready},
		pluginOrder: []string{"id-0", "id-1"},
	}

	for range 5 {
		id, ent := p.pickWithId(false)
		require.Equal(t, "id-1", id)
		require.Same(t, ready, ent)
	}
}

func TestSandboxPool_pickWithId_allNotReadyReturnsNil(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "x")}
	e0.status.Store(uint32(poolEntryNotReady))

	p := &SandboxPool{
		rr:          &atomic.Uint32{},
		plugins:     map[string]*poolEntry{"id-0": e0},
		pluginOrder: []string{"id-0"},
	}

	id, ent := p.pickWithId(false)
	require.Empty(t, id)
	require.Nil(t, ent)
}

func TestSandboxPool_pickWithId_reserveTrue_marksEntryReserved(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "res-a")}
	e0.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		rr:          &atomic.Uint32{},
		plugins:     map[string]*poolEntry{"id-0": e0},
		pluginOrder: []string{"id-0"},
	}

	id, ent := p.pickWithId(true)
	require.Equal(t, "id-0", id)
	require.Same(t, e0, ent)
	require.Equal(t, uint32(poolEntryReserved), e0.status.Load())
}

func TestSandboxPool_pickWithId_reserveFalse_leavesStatusReady(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "noreserve-a")}
	e0.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		rr:          &atomic.Uint32{},
		plugins:     map[string]*poolEntry{"id-0": e0},
		pluginOrder: []string{"id-0"},
	}

	_, _ = p.pickWithId(false)
	require.Equal(t, uint32(poolEntryReady), e0.status.Load())
}

func TestSandboxPool_pickWithId_reserveTrue_secondPickTakesNextReady(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "ephem-a")}
	e0.status.Store(uint32(poolEntryReady))
	e1 := &poolEntry{plug: mustTestSandboxPlugin(t, "ephem-b")}
	e1.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		rr:          &atomic.Uint32{},
		plugins:     map[string]*poolEntry{"id-0": e0, "id-1": e1},
		pluginOrder: []string{"id-0", "id-1"},
	}

	id1, ent1 := p.pickWithId(true)
	require.Equal(t, "id-0", id1)
	require.Same(t, e0, ent1)
	require.Equal(t, uint32(poolEntryReserved), e0.status.Load())
	require.Equal(t, uint32(poolEntryReady), e1.status.Load())

	id2, ent2 := p.pickWithId(true)
	require.Equal(t, "id-1", id2)
	require.Same(t, e1, ent2)
	require.Equal(t, uint32(poolEntryReserved), e0.status.Load())
	require.Equal(t, uint32(poolEntryReserved), e1.status.Load())
}

func TestSandboxPool_pickWithId_reserveTrue_returnsNilWhenAllReservedOrNotReady(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "solo-a")}
	e0.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		rr:          &atomic.Uint32{},
		plugins:     map[string]*poolEntry{"id-0": e0},
		pluginOrder: []string{"id-0"},
	}

	id1, ent1 := p.pickWithId(true)
	require.Equal(t, "id-0", id1)
	require.Same(t, e0, ent1)

	id2, ent2 := p.pickWithId(true)
	require.Empty(t, id2)
	require.Nil(t, ent2)
	require.Equal(t, uint32(poolEntryReserved), e0.status.Load())
}

func TestSandboxPool_pickWithId_reserveTrue_skipsUnavailableInRotation(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "skip-a")}
	e0.status.Store(uint32(poolEntryUnavailable))
	e1 := &poolEntry{plug: mustTestSandboxPlugin(t, "skip-b")}
	e1.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		rr:          &atomic.Uint32{},
		plugins:     map[string]*poolEntry{"id-0": e0, "id-1": e1},
		pluginOrder: []string{"id-0", "id-1"},
	}

	id, ent := p.pickWithId(true)
	require.Equal(t, "id-1", id)
	require.Same(t, e1, ent)
	require.Equal(t, uint32(poolEntryReserved), e1.status.Load())
}

func TestSandboxPool_IsAvailable_emptyPoolIsFatal(t *testing.T) {
	t.Parallel()

	p := &SandboxPool{
		plugins:     map[string]*poolEntry{},
		pluginOrder: []string{},
	}
	st := p.IsAvailable(context.Background())
	require.False(t, st.Available)
	require.Equal(t, plugin.DegradationState_FATAL, st.DegradationState)
	require.Error(t, st.Error)
}

// TestSandboxPool_IsAvailable_onlyNotReadySandboxes uses UNSPECIFIED degradation when every entry is still warming
// (skipped in the loop), so we do not report NONE by accident.
func TestSandboxPool_IsAvailable_onlyNotReadySandboxes(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "warming-a")}
	e0.status.Store(uint32(poolEntryNotReady))
	e1 := &poolEntry{plug: mustTestSandboxPlugin(t, "warming-b")}
	e1.status.Store(uint32(poolEntryNotReady))

	p := &SandboxPool{
		plugins: map[string]*poolEntry{
			"a": e0,
			"b": e1,
		},
		pluginOrder: []string{"a", "b"},
		logger:      zap.NewNop(),
	}

	st := p.IsAvailable(context.Background())
	require.False(t, st.Available)
	require.Equal(t, plugin.DegradationState_UNSPECIFIED, st.DegradationState)
}

func TestSandboxPool_IsAvailable_skipsReservedEntry_doesNotResetToReady(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "reserved-health")}
	e0.status.Store(uint32(poolEntryReserved))

	p := &SandboxPool{
		plugins:     map[string]*poolEntry{"id-0": e0},
		pluginOrder: []string{"id-0"},
		logger:      zap.NewNop(),
	}

	st := p.IsAvailable(context.Background())
	require.False(t, st.Available)
	require.Equal(t, uint32(poolEntryReserved), e0.status.Load(), "reserved status must not be overwritten by IsAvailable")
	require.Equal(t, plugin.DegradationState_UNSPECIFIED, st.DegradationState)
}

// A reserved sandbox stays reserved while another entry is evaluated; the neighbor may become unavailable.
func TestSandboxPool_IsAvailable_reservedUnaffectedWhenOtherEntryReportsUnhealthy(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "reserved-neighbor")}
	e0.status.Store(uint32(poolEntryReserved))
	e1 := &poolEntry{plug: mustTestSandboxPlugin(t, "ready-neighbor")}
	e1.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		plugins: map[string]*poolEntry{
			"id-0": e0,
			"id-1": e1,
		},
		pluginOrder: []string{"id-0", "id-1"},
		logger:      zap.NewNop(),
	}

	_ = p.IsAvailable(context.Background())

	require.Equal(t, uint32(poolEntryReserved), e0.status.Load(), "reserved entry must stay reserved")
	require.Equal(t, uint32(poolEntryUnavailable), e1.status.Load(), "unhealthy ready entry becomes unavailable")
}

func TestSandboxPool_NotifyWhenReady_immediateWhenAllEntriesReady(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "ready-a")}
	e0.status.Store(uint32(poolEntryReady))
	e1 := &poolEntry{plug: mustTestSandboxPlugin(t, "ready-b")}
	e1.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		plugins: map[string]*poolEntry{
			"a": e0,
			"b": e1,
		},
		pluginOrder: []string{"a", "b"},
		logger:      zap.NewNop(),
	}

	attachSandboxPoolRunCtx(context.Background(), p)
	p.tryMarkPoolReady()

	ch := make(chan bool, 1)
	p.NotifyWhenReady(ch)

	select {
	case v := <-ch:
		require.True(t, v)
	case <-time.After(2 * time.Second):
		t.Fatal("expected immediate notification when every entry is poolEntryReady")
	}
}

func TestSandboxPool_NotifyWhenReady_waitsUntilAllEntriesReady(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "warm-a")}
	e0.status.Store(uint32(poolEntryReady))
	e1 := &poolEntry{plug: mustTestSandboxPlugin(t, "warm-b")}
	e1.status.Store(uint32(poolEntryNotReady))

	p := &SandboxPool{
		plugins: map[string]*poolEntry{
			"a": e0,
			"b": e1,
		},
		pluginOrder: []string{"a", "b"},
		logger:      zap.NewNop(),
	}

	attachSandboxPoolRunCtx(context.Background(), p)

	ch := make(chan bool, 1)
	p.NotifyWhenReady(ch)

	select {
	case <-ch:
		t.Fatal("should not notify before every entry is poolEntryReady")
	default:
	}

	e1.status.Store(uint32(poolEntryReady))
	p.tryMarkPoolReady()

	select {
	case v := <-ch:
		require.True(t, v)
	case <-time.After(2 * time.Second):
		t.Fatal("expected notification after all entries became poolEntryReady")
	}
}

func TestSandboxPool_tryMarkPoolReady_idempotent(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "idemp-a")}
	e0.status.Store(uint32(poolEntryReady))
	p := &SandboxPool{
		plugins:     map[string]*poolEntry{"a": e0},
		pluginOrder: []string{"a"},
		logger:      zap.NewNop(),
	}
	attachSandboxPoolRunCtx(context.Background(), p)

	p.tryMarkPoolReady()
	require.True(t, p.poolReady.Load())

	p.tryMarkPoolReady()
	require.True(t, p.poolReady.Load())
}

func TestSandboxPool_NotifyWhenReady_multipleWaitersAllNotified(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "multi-a")}
	e0.status.Store(uint32(poolEntryReady))
	e1 := &poolEntry{plug: mustTestSandboxPlugin(t, "multi-b")}
	e1.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		plugins: map[string]*poolEntry{
			"a": e0,
			"b": e1,
		},
		pluginOrder: []string{"a", "b"},
		logger:      zap.NewNop(),
	}
	attachSandboxPoolRunCtx(context.Background(), p)

	ch1 := make(chan bool, 1)
	ch2 := make(chan bool, 1)
	p.NotifyWhenReady(ch1)
	p.NotifyWhenReady(ch2)

	p.tryMarkPoolReady()

	for i, ch := range []chan bool{ch1, ch2} {
		select {
		case v := <-ch:
			require.True(t, v, "waiter %d", i)
		case <-time.After(2 * time.Second):
			t.Fatalf("waiter %d: expected notification", i)
		}
	}
}

func TestSandboxPool_NotifyWhenReady_registerAfterPoolReady(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "late-a")}
	e0.status.Store(uint32(poolEntryReady))
	p := &SandboxPool{
		plugins:     map[string]*poolEntry{"a": e0},
		pluginOrder: []string{"a"},
		logger:      zap.NewNop(),
	}
	attachSandboxPoolRunCtx(context.Background(), p)

	p.tryMarkPoolReady()
	require.True(t, p.poolReady.Load())

	ch := make(chan bool, 1)
	p.NotifyWhenReady(ch)

	select {
	case v := <-ch:
		require.True(t, v)
	case <-time.After(2 * time.Second):
		t.Fatal("expected notification when registering after pool became ready")
	}
}

func TestSandboxPool_notifyPoolReadyChannels_noDeliveryWithoutRunCtx(t *testing.T) {
	t.Parallel()

	e0 := &poolEntry{plug: mustTestSandboxPlugin(t, "norun-a")}
	e0.status.Store(uint32(poolEntryReady))
	p := &SandboxPool{
		plugins:     map[string]*poolEntry{"a": e0},
		pluginOrder: []string{"a"},
		logger:      zap.NewNop(),
	}

	ch1 := make(chan bool, 1)
	p.NotifyWhenReady(ch1)
	p.tryMarkPoolReady()
	require.True(t, p.poolReady.Load())

	select {
	case v := <-ch1:
		t.Fatalf("unexpected notification without runCtx: %v", v)
	default:
	}

	attachSandboxPoolRunCtx(context.Background(), p)
	ch2 := make(chan bool, 1)
	p.NotifyWhenReady(ch2)

	for i, ch := range []chan bool{ch1, ch2} {
		select {
		case v := <-ch:
			require.True(t, v, "channel %d", i)
		case <-time.After(2 * time.Second):
			t.Fatalf("channel %d: expected delivery after runCtx is set", i)
		}
	}
}

func TestSandboxPool_Close_waitsUntilAllPluginsRemoved(t *testing.T) {
	t.Parallel()

	pool, err := NewSandboxPool(
		WithWorkerId("close-test"),
		WithSandboxPoolSize(2),
		WithSandboxAddresses([]string{"127.0.0.1:5011", "127.0.0.1:5012"}),
		WithSandboxOptions(
			WithConnectionMode(SandboxConnectionModeStatic),
			WithSandboxAddress("127.0.0.1:5011"),
			WithLogger(zap.NewNop()),
		),
	)
	require.NoError(t, err)
	require.Len(t, pool.plugins, 2)

	err = pool.Close(context.Background())
	require.NoError(t, err)

	pool.mu.RLock()
	n := len(pool.plugins)
	pool.mu.RUnlock()
	require.Zero(t, n, "Close should wait for all closePlugin calls to remove entries")
}

func TestSandboxPool_acquireSandbox_errWhenNoReadySandbox(t *testing.T) {
	t.Parallel()

	cold := &poolEntry{plug: mustTestSandboxPlugin(t, "acq-cold")}
	cold.status.Store(uint32(poolEntryNotReady))
	p := &SandboxPool{
		rr:                 &atomic.Uint32{},
		plugins:            map[string]*poolEntry{"id-0": cold},
		pluginOrder:        []string{"id-0"},
		logger:             zap.NewNop(),
		ephemeralExecution: false,
	}

	ctx := context.Background()
	_, span := otel.Tracer("pool.test").Start(ctx, "acquire")
	defer span.End()

	entry, cleanup, err := p.acquireSandbox(ctx, span)
	require.Error(t, err)
	require.Contains(t, err.Error(), "no ready sandbox")
	require.Nil(t, entry)
	require.Nil(t, cleanup)
}

func TestSandboxPool_acquireSandbox_nonEphemeral_successAndNoopCleanup(t *testing.T) {
	t.Parallel()

	warm := &poolEntry{plug: mustTestSandboxPlugin(t, "acq-warm")}
	warm.status.Store(uint32(poolEntryReady))
	p := &SandboxPool{
		rr:                 &atomic.Uint32{},
		plugins:            map[string]*poolEntry{"id-0": warm},
		pluginOrder:        []string{"id-0"},
		logger:             zap.NewNop(),
		ephemeralExecution: false,
	}

	ctx := context.Background()
	_, span := otel.Tracer("pool.test").Start(ctx, "acquire")
	defer span.End()

	entry, cleanup, err := p.acquireSandbox(ctx, span)
	require.NoError(t, err)
	require.Same(t, warm, entry)
	require.NotNil(t, cleanup)

	cleanup()

	p.mu.RLock()
	n := len(p.plugins)
	p.mu.RUnlock()
	require.Equal(t, 1, n, "non-ephemeral cleanup must not remove the sandbox")
}

// Ephemeral path: pick reserves the entry; pre-create may fail without runCtx; cleanup still closes the sandbox asynchronously.
func TestSandboxPool_acquireSandbox_ephemeral_reservedAndCleanupRemoves(t *testing.T) {
	t.Parallel()

	id := "id-eph-acq"
	plug := mustTestSandboxPlugin(t, "eph-acq-plug")
	entry := &poolEntry{plug: plug}
	entry.status.Store(uint32(poolEntryReady))

	p := &SandboxPool{
		rr:                        &atomic.Uint32{},
		plugins:                   map[string]*poolEntry{id: entry},
		pluginOrder:               []string{id},
		logger:                    zap.NewNop(),
		ephemeralExecution:        true,
		staticMode:                false,
		runCtx:                    nil,
		failedSandboxReplacements: make(chan struct{}, 2),
		sandboxOptions: []Option{
			WithConnectionMode(SandboxConnectionModeStatic),
			WithSandboxAddress("127.0.0.1:65530"),
			WithLogger(zap.NewNop()),
		},
	}

	ctx := context.Background()
	_, span := otel.Tracer("pool.test").Start(ctx, "acquire")
	defer span.End()

	got, cleanup, err := p.acquireSandbox(ctx, span)
	require.NoError(t, err)
	require.Same(t, entry, got)
	require.Equal(t, uint32(poolEntryReserved), entry.status.Load())
	require.NotNil(t, cleanup)

	cleanup()

	require.Eventually(t, func() bool {
		p.mu.RLock()
		defer p.mu.RUnlock()
		return p.plugins[id] == nil
	}, 2*time.Second, 10*time.Millisecond, "ephemeral cleanup should close and remove the sandbox")
}

func TestSandboxPool_closePlugin_skipsWhenAlreadyClosing(t *testing.T) {
	t.Parallel()

	id := "skip-dup"
	plug := mustTestSandboxPlugin(t, "skip-dup-plug")
	entry := &poolEntry{plug: plug}
	entry.closingPlugin.Store(true)

	pool := &SandboxPool{
		plugins:     map[string]*poolEntry{id: entry},
		pluginOrder: []string{id},
		logger:      zap.NewNop(),
	}

	pool.closePlugin(id)

	pool.mu.RLock()
	_, stillThere := pool.plugins[id]
	pool.mu.RUnlock()
	require.True(t, stillThere, "duplicate closePlugin must not remove entry while another close is in progress")
}

func TestSandboxPool_closePlugin_concurrentDuplicateReturnsWithoutBlockingOnWait(t *testing.T) {
	t.Parallel()

	id := "conc-dup"
	plug := mustTestSandboxPlugin(t, "conc-dup-plug")
	entry := &poolEntry{plug: plug}
	entry.wg.Add(1)

	pool := &SandboxPool{
		plugins:     map[string]*poolEntry{id: entry},
		pluginOrder: []string{id},
		logger:      zap.NewNop(),
	}

	var first sync.WaitGroup
	first.Add(1)
	go func() {
		defer first.Done()
		pool.closePlugin(id)
	}()

	require.Eventually(t, func() bool {
		return entry.closingPlugin.Load()
	}, time.Second, 5*time.Millisecond, "first closePlugin should take the closingPlugin gate")

	pool.closePlugin(id)

	entry.wg.Done()
	first.Wait()

	pool.mu.RLock()
	_, ok := pool.plugins[id]
	pool.mu.RUnlock()
	require.False(t, ok, "only one close path should run plug.Close and remove the entry")
}

// replacePlugin only runs replacement after canReplacePlugin succeeds (dynamic pool, known id, first replace).
// When createAndRunNewPlugin fails (e.g. runCtx canceled), it signals failedSandboxReplacements and defer closes the old sandbox.
func TestSandboxPool_replacePlugin_signalsFailedReplacementsWhenRunCtxDone(t *testing.T) {
	t.Parallel()

	runCtx, cancel := context.WithCancel(context.Background())
	cancel()

	sandboxID := "sandbox-1"
	entry := &poolEntry{plug: mustTestSandboxPlugin(t, "replace-fail")}
	entry.status.Store(uint32(poolEntryReady))

	pool := &SandboxPool{
		staticMode:                false,
		runCtx:                    runCtx,
		failedSandboxReplacements: make(chan struct{}, 2),
		logger:                    zap.NewNop(),
		sandboxOptions: []Option{
			WithConnectionMode(SandboxConnectionModeStatic),
			WithSandboxAddress("127.0.0.1:5020"),
			WithLogger(zap.NewNop()),
		},
		plugins:     map[string]*poolEntry{sandboxID: entry},
		pluginOrder: []string{sandboxID},
	}

	pool.replacePlugin(sandboxID)

	select {
	case <-pool.failedSandboxReplacements:
	default:
		t.Fatal("expected failedSandboxReplacements signal when replacement cannot create a new plugin")
	}

	require.Eventually(t, func() bool {
		pool.mu.RLock()
		defer pool.mu.RUnlock()
		return pool.plugins[sandboxID] == nil
	}, 2*time.Second, 10*time.Millisecond, "closePlugin should remove sandbox after failed replacement")
}

func TestSandboxPool_canReplacePlugin_falseWhenShuttingDown(t *testing.T) {
	t.Parallel()

	p := &SandboxPool{shuttingDown: atomic.Bool{}}
	p.shuttingDown.Store(true)
	require.False(t, p.canReplacePlugin("any-id"))
}

func TestSandboxPool_replacePlugin_staticModeDoesNothing(t *testing.T) {
	t.Parallel()

	pool, err := NewSandboxPool(
		WithWorkerId("static-replace"),
		WithSandboxPoolSize(1),
		WithSandboxAddresses([]string{"127.0.0.1:5030"}),
		WithSandboxOptions(
			WithConnectionMode(SandboxConnectionModeStatic),
			WithSandboxAddress("127.0.0.1:5030"),
			WithLogger(zap.NewNop()),
		),
	)
	require.NoError(t, err)
	require.True(t, pool.staticMode)

	id := pool.pluginOrder[0]
	require.Len(t, pool.plugins, 1)

	pool.failedSandboxReplacements = make(chan struct{}, 1)
	pool.replacePlugin(id)

	select {
	case <-pool.failedSandboxReplacements:
		t.Fatal("static mode must not attempt replacement or signal failures")
	default:
	}

	pool.mu.RLock()
	n := len(pool.plugins)
	_, ok := pool.plugins[id]
	pool.mu.RUnlock()
	require.Equal(t, 1, n)
	require.True(t, ok, "static sandbox must not be closed by replacePlugin")
}

func TestSandboxPool_replacePlugin_unknownIdDoesNothing(t *testing.T) {
	t.Parallel()

	pool := &SandboxPool{
		staticMode:                false,
		runCtx:                    context.Background(),
		failedSandboxReplacements: make(chan struct{}, 1),
		logger:                    zap.NewNop(),
		plugins:                   map[string]*poolEntry{},
		pluginOrder:               []string{},
	}

	pool.replacePlugin("unknown-id")

	select {
	case <-pool.failedSandboxReplacements:
		t.Fatal("unknown id must not enqueue failed replacement")
	default:
	}
}

func TestSandboxPool_replacePlugin_alreadyReplacedDoesNothing(t *testing.T) {
	t.Parallel()

	id := "sandbox-1"
	entry := &poolEntry{plug: mustTestSandboxPlugin(t, "already")}
	entry.alreadyReplaced.Store(true)

	pool := &SandboxPool{
		staticMode:                false,
		runCtx:                    context.Background(),
		failedSandboxReplacements: make(chan struct{}, 1),
		logger:                    zap.NewNop(),
		plugins:                   map[string]*poolEntry{id: entry},
		pluginOrder:               []string{id},
	}

	pool.replacePlugin(id)

	select {
	case <-pool.failedSandboxReplacements:
		t.Fatal("already-replaced sandbox must not signal or close")
	default:
	}

	pool.mu.RLock()
	defer pool.mu.RUnlock()
	require.NotNil(t, pool.plugins[id])
}

func TestSandboxPool_monitorFailedSandboxReplacements_exitsWhenRunCtxCanceled(t *testing.T) {
	t.Parallel()

	runCtx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})

	pool := &SandboxPool{
		runCtx:                    runCtx,
		failedSandboxReplacements: make(chan struct{}, 1),
		logger:                    zap.NewNop(),
	}

	go func() {
		pool.monitorFailedSandboxReplacements()
		close(done)
	}()

	cancel()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("monitor should exit after runCtx is canceled")
	}
}

// monitor must return immediately when runCtx is nil (Run has not started), not block forever.
func TestSandboxPool_monitorFailedSandboxReplacements_exitsWhenRunCtxNil(t *testing.T) {
	t.Parallel()

	pool := &SandboxPool{
		runCtx:                    nil,
		failedSandboxReplacements: make(chan struct{}, 1),
		logger:                    zap.NewNop(),
	}

	done := make(chan struct{})
	go func() {
		pool.monitorFailedSandboxReplacements()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(500 * time.Millisecond):
		t.Fatal("monitor should return immediately when runCtx is nil")
	}
}

// Close can set shuttingDown before Run's context is cancelled. Failed-replacement retries must not
// invoke createAndRunNewPlugin (or chain further AfterFuncs) in that window — otherwise we'd log and
// backoff indefinitely even though registration would fail anyway.
func TestSandboxPool_scheduleFailedReplacementRetry_skipsWhenShuttingDownWhileRunCtxValid(t *testing.T) {
	core, observed := observer.New(zap.DebugLevel)
	logger := zap.New(core)

	runCtx := context.Background()
	pool := &SandboxPool{
		runCtx: runCtx,
		logger: logger,
	}
	pool.shuttingDown.Store(true)

	pool.scheduleFailedReplacementRetry(runCtx, 5*time.Millisecond)

	time.Sleep(50 * time.Millisecond)

	require.Empty(t, observed.All(), "retry callback should return before logging or scheduling chained retries when shuttingDown is set")

	// Control: without shuttingDown we enter the retry path while runCtx is still valid and log
	// "retrying failed sandbox replacement" before createAndRunNewPlugin runs.
	core2, observed2 := observer.New(zap.DebugLevel)
	pool2 := &SandboxPool{
		runCtx: runCtx,
		logger: zap.New(core2),
	}

	pool2.scheduleFailedReplacementRetry(runCtx, 5*time.Millisecond)

	require.Eventually(t, func() bool {
		for _, e := range observed2.All() {
			if e.Message == "retrying failed sandbox replacement after backoff" {
				return true
			}
		}
		return false
	}, 200*time.Millisecond, 10*time.Millisecond, "without shuttingDown, retry path should run once runCtx is still valid")
}

// createAndRunNewPlugin must error when runCtx is nil before Run starts.
func TestSandboxPool_createAndRunNewPlugin_errorsWhenRunNotStarted(t *testing.T) {
	t.Parallel()

	pool := &SandboxPool{
		runCtx: nil,
	}
	_, err := pool.createAndRunNewPlugin()
	require.Error(t, err)
	require.Contains(t, err.Error(), "sandbox pool run not started")
}

// AfterFunc retries must not panic when Run has ended and runCtx is cancelled.
func TestSandboxPool_createAndRunNewPlugin_errorsWhenRunContextCanceled(t *testing.T) {
	t.Parallel()

	runCtx, cancel := context.WithCancel(context.Background())
	cancel()

	pool := &SandboxPool{
		runCtx: runCtx,
	}
	_, err := pool.createAndRunNewPlugin()
	require.Error(t, err)
	require.True(t, errors.Is(err, context.Canceled))
}

// Static mode must not use ephemeral single-use semantics even when opted in via pool options.
func TestNewSandboxPool_staticMode_disablesEphemeralExecutionEvenWhenOptedIn(t *testing.T) {
	t.Parallel()

	pool, err := NewSandboxPool(
		WithWorkerId("w"),
		WithSandboxPoolSize(1),
		WithSandboxAddresses([]string{"127.0.0.1:5001"}),
		WithEphemeralExecution(true),
		WithSandboxOptions(
			WithConnectionMode(SandboxConnectionModeStatic),
			WithLogger(zap.NewNop()),
		),
	)
	require.NoError(t, err)
	require.True(t, pool.staticMode)
	require.False(t, pool.ephemeralExecution, "static sandboxes are not ephemeral single-use")
}

func TestSandboxPool_Name(t *testing.T) {
	t.Parallel()

	p := &SandboxPool{}
	require.Equal(t, "sandboxPool", p.Name())
}

func TestSandboxPool_createAndRegisterPlugin_rejectsWhenShuttingDown(t *testing.T) {
	t.Parallel()

	pool := &SandboxPool{
		shuttingDown: atomic.Bool{},
		sandboxOptions: []Option{
			WithConnectionMode(SandboxConnectionModeStatic),
			WithSandboxAddress("127.0.0.1:65530"),
			WithLogger(zap.NewNop()),
		},
		plugins:     map[string]*poolEntry{},
		pluginOrder: []string{},
	}
	pool.shuttingDown.Store(true)

	_, err := pool.createAndRegisterPlugin()
	require.Error(t, err)
	require.Contains(t, err.Error(), "shutting down")
}

func TestNewSandboxPool_StaticMode_twoAddresses(t *testing.T) {
	t.Parallel()

	pool, err := NewSandboxPool(
		WithWorkerId("worker-1"),
		WithSandboxPoolSize(2),
		WithSandboxAddresses([]string{"127.0.0.1:5001", "127.0.0.1:5002"}),
		WithSandboxOptions(
			WithConnectionMode(SandboxConnectionModeStatic),
			WithLogger(zap.NewNop()),
		),
	)
	require.NoError(t, err)
	require.Len(t, pool.pluginOrder, 2)
	require.Len(t, pool.plugins, 2)
}

func TestNewSandboxPool_RejectsInvalidPoolSize(t *testing.T) {
	t.Parallel()

	_, err := NewSandboxPool(
		WithWorkerId("w"),
		WithSandboxPoolSize(0),
		WithSandboxOptions(
			WithConnectionMode(SandboxConnectionModeStatic),
			WithSandboxAddress("127.0.0.1:1"),
			WithLogger(zap.NewNop()),
		),
	)
	require.Error(t, err)
}

func TestNewSandboxPool_DynamicMode_requiresManagerInMergedOptions(t *testing.T) {
	t.Parallel()

	_, err := NewSandboxPool(
		WithWorkerId("w"),
		WithSandboxPoolSize(1),
		WithSandboxOptions(
			WithConnectionMode(SandboxConnectionModeDynamic),
			WithLogger(zap.NewNop()),
		),
	)
	require.Error(t, err)
}

func TestNewSandboxPool_RejectsEmpty(t *testing.T) {
	t.Parallel()
	if _, err := NewSandboxPool(nil); err == nil {
		t.Fatal("NewSandboxPool(nil) error = nil, want error")
	}
}
