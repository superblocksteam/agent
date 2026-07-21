package redis

// The redis transport gates message intake on two signals — a boolean plugin
// health probe (ArePluginsAvailable: "is at least one sandbox healthy?") and a
// fixed concurrency counter (executionPool) — neither of which reflects the
// number of sandboxes actually ready to execute. In ephemeral mode every
// execution consumes (closes) its sandbox and the replacement takes seconds to
// become ready, so instantaneous capacity oscillates. The transport therefore
// reads messages off the stream that it has no sandbox for; those requests are
// XAck'd on receipt and fail with:
//
//	Internal: failed to acquire sandbox: sandbox pool: no ready sandbox available
//
// which is surfaced to the user as an InternalError instead of being executed
// or redelivered.
//
// The test wires the REAL transport, plugin executor, and sandbox pool
// (dynamic + ephemeral, mirroring production flags: --sandbox.pool.size=3,
// --transport.redis.execution.pool=2, --transport.redis.max.messages forced to
// 1 by ephemeral init) against miniredis and in-process sandbox gRPC servers
// whose replacement "pod startup" is artificially slow. It enqueues a burst of
// execute events and asserts the invariant:
//
//	every message the transport accepts off the stream is executed
//	(zero "no ready sandbox available" InternalErrors).
//
// Without the CapacityGate (admission gated only on a boolean health probe +
// fixed concurrency counter), a portion of the burst reliably came back as
// InternalError. With the gate wired (as in production main.go), the pool
// reserves a ready sandbox per admitted message and the invariant holds.
//
// Run with:
//
//	cd workers/ephemeral/task-manager
//	go test -v -count=1 -race ./internal/transport/redis/ -run TestRepro_TransportAcceptsMessagesWithoutSandboxCapacity

import (
	"context"
	"fmt"
	"net"
	"strings"
	"sync"
	"testing"
	"time"

	"workers/ephemeral/task-manager/internal/plugin/sandbox"
	"workers/ephemeral/task-manager/internal/plugin_executor"
	"workers/ephemeral/task-manager/internal/sandboxmanager"

	"github.com/alicebob/miniredis/v2"
	redis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/worker"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/encoding/protojson"
)

// loadDelayedExecutor delegates to the real PluginExecutor after a short
// delay. It models the scheduling latency between the transport admitting a
// message (spawning the handler goroutine in pollOnce) and that handler
// reaching acquireSandbox — which in production is widened by CPU load, GC,
// and the real-Redis round trips the handler performs first (XAck + inbox
// ack). The admission-control invariant under test must hold for any value of
// this latency: if a message is only accepted when capacity is actually
// reserved for it, this delay cannot cause a failure.
type loadDelayedExecutor struct {
	plugin_executor.PluginExecutor
	delay time.Duration
}

func (d *loadDelayedExecutor) Execute(
	ctx context.Context,
	pluginName string,
	reqData *transportv1.Request_Data_Data,
	pinned *transportv1.Request_Data_Pinned,
	perf *transportv1.Performance,
) (*transportv1.Response_Data_Data, error) {
	time.Sleep(d.delay)
	return d.PluginExecutor.Execute(ctx, pluginName, reqData, pinned, perf)
}

// reproSandboxServer is an in-process stand-in for the python/javascript
// sandbox: Health reports READY, Execute burns execDelay before succeeding.
type reproSandboxServer struct {
	workerv1.UnimplementedSandboxTransportServiceServer
	execDelay time.Duration
}

func (s *reproSandboxServer) Health(context.Context, *workerv1.HealthRequest) (*workerv1.HealthResponse, error) {
	return &workerv1.HealthResponse{Status: workerv1.HealthResponse_STATUS_READY}, nil
}

func (s *reproSandboxServer) Execute(ctx context.Context, _ *workerv1.ExecuteRequest) (*workerv1.ExecuteResponse, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-time.After(s.execDelay):
	}
	return &workerv1.ExecuteResponse{}, nil
}

// reproSandboxManager stands in for the k8s job manager. CreateSandbox starts
// a real gRPC server on localhost. The first bootstrapCount creations (the
// initial pool fill) are instant; every replacement after that sleeps
// slowStartup to model pod scheduling + image pull + boot under node pressure
// (prod: ~4-5s, worse during Karpenter churn — the incident condition).
type reproSandboxManager struct {
	bootstrapCount int
	slowStartup    time.Duration
	execDelay      time.Duration

	mu       sync.Mutex
	creation int
	servers  map[string]*grpc.Server // keyed by job name
}

func (m *reproSandboxManager) CreateSandbox(ctx context.Context, sandboxId string) (*sandboxmanager.SandboxInfo, error) {
	m.mu.Lock()
	m.creation++
	bootstrap := m.creation <= m.bootstrapCount
	m.mu.Unlock()

	if !bootstrap {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(m.slowStartup):
		}
	}

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	srv := grpc.NewServer()
	workerv1.RegisterSandboxTransportServiceServer(srv, &reproSandboxServer{execDelay: m.execDelay})
	go func() { _ = srv.Serve(lis) }()

	name := "sandbox-" + sandboxId
	m.mu.Lock()
	m.servers[name] = srv
	m.mu.Unlock()

	return &sandboxmanager.SandboxInfo{
		Name:    name,
		Id:      name + "-pod",
		Ip:      "127.0.0.1",
		Address: lis.Addr().String(),
	}, nil
}

func (m *reproSandboxManager) DeleteSandbox(_ context.Context, name string) error {
	m.mu.Lock()
	srv := m.servers[name]
	delete(m.servers, name)
	m.mu.Unlock()
	if srv != nil {
		go srv.Stop()
	}
	return nil
}

func (m *reproSandboxManager) WatchSandboxPod(context.Context, string) <-chan error {
	return make(chan error) // never fires; pods only die via DeleteSandbox in this repro
}

func (m *reproSandboxManager) stopAll() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for name, srv := range m.servers {
		srv.Stop()
		delete(m.servers, name)
	}
}

func TestRepro_TransportAcceptsMessagesWithoutSandboxCapacity(t *testing.T) {
	const (
		numMessages     = 10
		sandboxPoolSize = 3               // prod: --sandbox.pool.size=3
		executionPool   = 2               // prod: --transport.redis.execution.pool=2
		slowStartup     = 4 * time.Second // replacement pod startup under node pressure (prod: 4-5s+)
		execDelay       = 150 * time.Millisecond
		dispatchDelay   = 300 * time.Millisecond // admission-to-acquire gap (see loadDelayedExecutor)
		streamKey       = "agent.main.bucket.BA.plugin.python.event.execute"
	)

	logger := zap.NewNop()

	// Observed logger on the plugin executor: the detailed acquire-failure
	// message ("no ready sandbox available") is only visible in logs — the
	// response carries a generic InternalError.
	observedCore, observedLogs := observer.New(zap.ErrorLevel)
	executorLogger := zap.New(observedCore)

	// --- Real sandbox pool (dynamic + ephemeral), backed by fake "pods" ---
	mgr := &reproSandboxManager{
		bootstrapCount: sandboxPoolSize,
		slowStartup:    slowStartup,
		execDelay:      execDelay,
		servers:        map[string]*grpc.Server{},
	}
	t.Cleanup(mgr.stopAll)

	pool, err := sandbox.NewSandboxPool(
		sandbox.WithWorkerId("repro-worker"),
		sandbox.WithSandboxPoolSize(sandboxPoolSize),
		sandbox.WithEphemeralExecution(true),
		sandbox.WithPoolLogger(logger),
		sandbox.WithSandboxOptions(
			sandbox.WithConnectionMode(sandbox.SandboxConnectionModeDynamic),
			sandbox.WithSandboxManager(mgr),
			sandbox.WithLogger(logger),
		),
	)
	require.NoError(t, err)

	poolDone := make(chan struct{})
	go func() {
		defer close(poolDone)
		_ = pool.Run(context.Background())
	}()
	t.Cleanup(func() {
		closeCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = pool.Close(closeCtx)
		<-poolDone
	})

	// --- Real plugin executor ---
	pluginExec := plugin_executor.NewPluginExecutor(&plugin_executor.Options{
		Logger: executorLogger,
		Store:  store.Memory(),
	})
	require.NoError(t, pluginExec.RegisterPlugin("python", pool))

	// Model the production gap between message admission and sandbox
	// acquisition (goroutine scheduling under load + the Redis round trips the
	// handler performs before executing). See loadDelayedExecutor.
	delayedExec := &loadDelayedExecutor{PluginExecutor: pluginExec, delay: dispatchDelay}

	// --- Real redis (miniredis) + real transport ---
	mr, err := miniredis.Run()
	require.NoError(t, err)
	t.Cleanup(mr.Close)
	redisClient := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = redisClient.Close() })

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{streamKey},
		WorkerId:            "repro-worker",
		ConsumerGroup:       "main-sandbox-ephemeral",
		BlockDuration:       200 * time.Millisecond,
		MessageCount:        1, // forced to 1 by ephemeral init anyway
		PluginExecutor:      delayedExec,
		Logger:              logger,
		ExecutionPool:       executionPool,
		Ephemeral:           true,
		DegradedModeBackoff: 20 * time.Millisecond,
		MaxDegradedTime:     time.Hour,
		CapacityGate:        pool, // mirrors production wiring in main.go
	})

	transportDone := make(chan struct{})
	go func() {
		defer close(transportDone)
		_ = transport.Run(context.Background())
	}()
	t.Cleanup(func() {
		_ = transport.Close(context.Background())
		<-transportDone
	})

	// --- Enqueue a burst of execute events, one inbox per message ---
	inboxes := make([]string, 0, numMessages)
	for i := range numMessages {
		inbox := fmt.Sprintf("inbox-%02d", i)
		inboxes = append(inboxes, inbox)

		req := &transportv1.Request{
			Inbox: inbox,
			Data: &transportv1.Request_Data{
				Data: &transportv1.Request_Data_Data{
					Props: &transportv1.Request_Data_Data_Props{
						ExecutionId: fmt.Sprintf("exec-%02d", i),
					},
				},
				Pinned: &transportv1.Request_Data_Pinned{
					Name:  "python",
					Event: string(worker.EventExecute),
				},
			},
		}
		encoded, err := protojson.Marshal(req)
		require.NoError(t, err)
		require.NoError(t, redisClient.XAdd(context.Background(), &redis.XAddArgs{
			Stream: streamKey,
			Values: map[string]any{"data": string(encoded)},
		}).Err())
	}

	// --- Collect one response per inbox (the transport responds to every
	// message it accepts, whether the execution succeeded or failed) ---
	responses := make(map[string]*transportv1.Response, numMessages)
	deadline := time.Now().Add(90 * time.Second)
	for len(responses) < numMessages && time.Now().Before(deadline) {
		for _, inbox := range inboxes {
			if _, done := responses[inbox]; done {
				continue
			}
			msgs, err := redisClient.XRange(context.Background(), inbox, INBOX_DATA_MESSAGE_ID, INBOX_DATA_MESSAGE_ID).Result()
			if err != nil || len(msgs) == 0 {
				continue
			}
			data, _ := msgs[0].Values["data"].(string)
			resp := &transportv1.Response{}
			require.NoError(t, protojson.Unmarshal([]byte(data), resp))
			responses[inbox] = resp
		}
		time.Sleep(100 * time.Millisecond)
	}
	require.Len(t, responses, numMessages, "transport accepted all messages, so all inboxes must receive a response")

	// --- The invariant under test: an accepted message is never failed for
	// lack of a sandbox. Today the transport admits messages based on a
	// boolean health probe + fixed concurrency, so some of the burst comes
	// back as InternalError with "no ready sandbox available" in the executor
	// logs. ---
	var failures, successes int
	for inbox, resp := range responses {
		if respErr := resp.GetData().GetData().GetErr(); respErr != nil {
			failures++
			t.Logf("%s failed after being accepted: name=%s message=%s", inbox, respErr.GetName(), respErr.GetMessage())
		} else {
			successes++
		}
	}

	// Attribute failures precisely via the executor's error logs.
	var noSandboxFailures int
	for _, entry := range observedLogs.All() {
		for _, field := range entry.Context {
			if field.Key == "error" {
				if err, ok := field.Interface.(error); ok && strings.Contains(err.Error(), "no ready sandbox available") {
					noSandboxFailures++
				}
			}
		}
	}

	t.Logf("accepted=%d executed=%d failed=%d (no-sandbox=%d)",
		numMessages, successes, failures, noSandboxFailures)

	require.Equal(t, failures, noSandboxFailures, "all failures in this repro should be capacity failures")
	require.Zero(t, noSandboxFailures,
		"transport accepted message(s) it had no sandbox capacity to execute; "+
			"admission must be gated on actual sandbox availability")
}
