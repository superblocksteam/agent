package sandbox

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/utils"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.opentelemetry.io/otel"
	"go.uber.org/zap"
)

// newAdmissionTestPool builds an ephemeral pool with n entries connected to a
// shared in-process sandbox server, all in the Ready state.
func newAdmissionTestPool(t *testing.T, n int, server workerv1.SandboxTransportServiceServer) (*SandboxPool, []*poolEntry) {
	t.Helper()

	addr, cleanup := startSandboxGrpcServerWithServer(t, server)
	t.Cleanup(cleanup)

	pool := &SandboxPool{
		ephemeralExecution:        true,
		plugins:                   map[string]*poolEntry{},
		pluginOrder:               []string{},
		rr:                        &atomic.Uint32{},
		logger:                    zap.NewNop(),
		tracer:                    otel.Tracer("test"),
		failedSandboxReplacements: make(chan struct{}, n),
		reservedSandboxIds:        utils.NewSet[string](),
	}

	entries := make([]*poolEntry, 0, n)
	for i := 0; i < n; i++ {
		id := string(rune('a' + i))
		p, err := NewSandboxPlugin(
			WithConnectionMode(SandboxConnectionModeStatic),
			WithSandboxAddress(addr),
			WithSandboxId(id),
			WithLogger(zap.NewNop()),
		)
		require.NoError(t, err)
		connectSandboxPluginClient(t, p, addr)

		entry := &poolEntry{plug: p}
		entry.status.Store(uint32(poolEntryReady))
		// Suppress replacement creation on close for these hand-built pools.
		entry.alreadyReplaced.Store(true)
		pool.plugins[id] = entry
		pool.pluginOrder = append(pool.pluginOrder, id)
		entries = append(entries, entry)
	}
	attachSandboxPoolRunCtx(context.Background(), pool)
	return pool, entries
}

func countReady(pool *SandboxPool) int {
	ready := 0
	pool.mu.RLock()
	for _, e := range pool.plugins {
		if poolEntryStatus(e.status.Load()) == poolEntryReady {
			ready++
		}
	}
	pool.mu.RUnlock()
	return ready
}

func TestAcquireSlot_NoopForNonEphemeralPools(t *testing.T) {
	t.Parallel()

	pool := &SandboxPool{
		ephemeralExecution: false,
		plugins:            map[string]*poolEntry{},
		pluginOrder:        []string{},
		rr:                 &atomic.Uint32{},
		logger:             zap.NewNop(),
		reservedSandboxIds: utils.NewSet[string](),
	}

	require.Empty(t, pool.AcquireSlot())
	pool.ReleaseSlot("anything")
	require.True(t, pool.reservedSandboxIds.IsEmpty())
}

func TestAcquireSlot_ReservesReadyEntryAndReleaseReturnsIt(t *testing.T) {
	t.Parallel()

	pool, entries := newAdmissionTestPool(t, 1, &healthOKServer{})
	entry := entries[0]

	id := pool.AcquireSlot()
	require.NotEmpty(t, id)
	require.Equal(t, poolEntryReserved, poolEntryStatus(entry.status.Load()), "admission must reserve the entry")
	require.True(t, pool.reservedSandboxIds.Contains(id))
	require.Equal(t, 0, countReady(pool))

	// No execution consumed the reservation: release returns the entry to ready.
	pool.ReleaseSlot(id)
	require.Equal(t, poolEntryReady, poolEntryStatus(entry.status.Load()))
	require.False(t, pool.reservedSandboxIds.Contains(id))
	require.Equal(t, 1, countReady(pool))

	// Release of an untracked id is a no-op.
	pool.ReleaseSlot(id)
	require.Equal(t, poolEntryReady, poolEntryStatus(entry.status.Load()))
	require.Equal(t, 1, countReady(pool))
}

func TestAcquireSlot_ReturnsEmptyWhenNoEntryReady(t *testing.T) {
	t.Parallel()

	pool, entries := newAdmissionTestPool(t, 1, &healthOKServer{})
	entry := entries[0]
	entry.status.Store(uint32(poolEntryNotReady))

	require.Empty(t, pool.AcquireSlot(), "no ready entry: acquisition must fail immediately")
	require.True(t, pool.reservedSandboxIds.IsEmpty())

	// Capacity restored: acquisition succeeds again.
	entry.status.Store(uint32(poolEntryReady))
	id := pool.AcquireSlot()
	require.NotEmpty(t, id)
	pool.ReleaseSlot(id)
}

func TestAcquireSlot_ReleaseSlot_EmptyID_NoOp(t *testing.T) {
	t.Parallel()

	pool, _ := newAdmissionTestPool(t, 1, &healthOKServer{})
	require.Equal(t, 1, countReady(pool))

	pool.ReleaseSlot("")
	require.Equal(t, 1, countReady(pool))
}

func TestAcquireSlot_ExecuteConsumesReservation(t *testing.T) {
	t.Parallel()

	server := &executeFuncServer{
		executeFunc: func(context.Context, *workerv1.ExecuteRequest) (*workerv1.ExecuteResponse, error) {
			return &workerv1.ExecuteResponse{}, nil
		},
	}
	pool, entries := newAdmissionTestPool(t, 1, server)
	entry := entries[0]

	id := pool.AcquireSlot()
	require.NotEmpty(t, id)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	t.Cleanup(cancel)

	// Execute pops the admission reservation instead of picking fresh —
	// with the single entry Reserved, a fresh pick would fail.
	resp, err := pool.Execute(ctx, &workerv1.RequestMetadata{PluginName: "python"}, &transportv1.Request_Data_Data_Props{}, nil, nil)
	require.NoError(t, err)
	require.NotNil(t, resp)
	require.False(t, pool.reservedSandboxIds.Contains(id), "execution must consume the reserved id")

	// The reservation was consumed: release must NOT return the (now closing,
	// ephemeral single-use) entry to ready.
	pool.ReleaseSlot(id)
	require.NotEqual(t, poolEntryReady, poolEntryStatus(entry.status.Load()))
}

func TestAcquireSlot_DoesNotOverAdmit(t *testing.T) {
	t.Parallel()

	const sandboxes = 3
	pool, _ := newAdmissionTestPool(t, sandboxes, &healthOKServer{})
	require.Equal(t, sandboxes, countReady(pool))

	var (
		mu       sync.Mutex
		acquired []string
		wg       sync.WaitGroup
		attempts = 20
	)

	wg.Add(attempts)
	for i := 0; i < attempts; i++ {
		go func() {
			defer wg.Done()
			if id := pool.AcquireSlot(); id != "" {
				mu.Lock()
				acquired = append(acquired, id)
				mu.Unlock()
			}
		}()
	}
	wg.Wait()

	require.Len(t, acquired, sandboxes)
	require.Equal(t, 0, countReady(pool))
	require.Equal(t, sandboxes, pool.reservedSandboxIds.Size())

	seen := make(map[string]struct{}, len(acquired))
	for _, id := range acquired {
		_, dup := seen[id]
		require.False(t, dup, "duplicate reservation for %s", id)
		seen[id] = struct{}{}
	}
}

func TestAcquireSandbox_RetryDoesNotStealAdmissionReservation(t *testing.T) {
	t.Parallel()

	pool, _ := newAdmissionTestPool(t, 2, &healthOKServer{})

	// Simulate two admitted messages: both sandboxes reserved.
	require.NotEmpty(t, pool.AcquireSlot())
	require.NotEmpty(t, pool.AcquireSlot())
	require.Equal(t, 2, pool.reservedSandboxIds.Size())

	ctx := context.Background()
	_, span := otel.Tracer("test").Start(ctx, "acquire")
	defer span.End()

	// First acquire consumes one admission reservation.
	entry, _, err := pool.acquireSandbox(ctx, span, true)
	require.NoError(t, err)
	require.NotNil(t, entry)
	require.Equal(t, 1, pool.reservedSandboxIds.Size())

	// Retry must not consume the remaining reservation (held for another message).
	_, _, err = pool.acquireSandbox(ctx, span, false)
	require.Error(t, err)
	require.Contains(t, err.Error(), "no ready sandbox")
	require.Equal(t, 1, pool.reservedSandboxIds.Size(), "retry must not steal the other admission reservation")

	remaining := pool.reservedSandboxIds.ToSlice()[0]
	require.Equal(t, poolEntryReserved, poolEntryStatus(pool.plugins[remaining].status.Load()))
}

func TestReleaseUnusedSlot_ReturnsOneReservationToReady(t *testing.T) {
	t.Parallel()

	pool, entries := newAdmissionTestPool(t, 2, &healthOKServer{})

	idA := pool.AcquireSlot()
	idB := pool.AcquireSlot()
	require.NotEmpty(t, idA)
	require.NotEmpty(t, idB)
	require.Equal(t, 0, countReady(pool))

	pool.ReleaseUnusedSlot()
	require.Equal(t, 1, countReady(pool))
	require.Equal(t, 1, pool.reservedSandboxIds.Size())

	pool.ReleaseUnusedSlot()
	require.Equal(t, 2, countReady(pool))
	require.True(t, pool.reservedSandboxIds.IsEmpty())

	// No-op when nothing is reserved.
	pool.ReleaseUnusedSlot()
	require.Equal(t, 2, countReady(pool))

	for _, entry := range entries {
		require.Equal(t, poolEntryReady, poolEntryStatus(entry.status.Load()))
	}
}

func TestReleaseUnusedSlot_NoopForNonEphemeral(t *testing.T) {
	t.Parallel()

	pool := &SandboxPool{
		ephemeralExecution: false,
		plugins:            map[string]*poolEntry{},
		pluginOrder:        []string{},
		rr:                 &atomic.Uint32{},
		logger:             zap.NewNop(),
		reservedSandboxIds: utils.NewSet[string](),
	}

	pool.ReleaseUnusedSlot()
	require.True(t, pool.reservedSandboxIds.IsEmpty())
}

func TestReleaseSlot_OnlyReturnsOwnUnconsumedReservation(t *testing.T) {
	t.Parallel()

	execStarted := make(chan struct{}, 2)
	execRelease := make(chan struct{})
	server := &executeFuncServer{
		executeFunc: func(ctx context.Context, _ *workerv1.ExecuteRequest) (*workerv1.ExecuteResponse, error) {
			execStarted <- struct{}{}
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-execRelease:
			}
			return &workerv1.ExecuteResponse{}, nil
		},
	}
	pool, _ := newAdmissionTestPool(t, 2, server)

	// Two admissions: A will not execute (e.g. metadata event), B executes.
	idA := pool.AcquireSlot()
	require.NotEmpty(t, idA)
	idB := pool.AcquireSlot()
	require.NotEmpty(t, idB)
	require.NotEqual(t, idA, idB)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	t.Cleanup(cancel)

	execDone := make(chan error, 1)
	go func() {
		_, err := pool.Execute(ctx, &workerv1.RequestMetadata{PluginName: "python"}, &transportv1.Request_Data_Data_Props{}, nil, nil)
		execDone <- err
	}()
	<-execStarted // execute consumed one reserved id (set iteration order)

	// A's handler finishes without executing. If execute consumed A's id,
	// ReleaseSlot(A) is a no-op; B's reservation stays outstanding.
	// If execute consumed B's id, ReleaseSlot(A) returns A to ready.
	pool.ReleaseSlot(idA)

	remaining := pool.reservedSandboxIds.Size()
	require.LessOrEqual(t, remaining, 1, "at most one reservation should remain after releaseA + execute pop")
	require.GreaterOrEqual(t, remaining+countReady(pool), 0)

	close(execRelease)
	require.NoError(t, <-execDone)

	pool.ReleaseSlot(idB)
	require.True(t, pool.reservedSandboxIds.IsEmpty(), "both admissions released")
	// One sandbox was consumed by ephemeral execute; the other (if unconsumed) is ready.
	require.LessOrEqual(t, countReady(pool), 1)
}
