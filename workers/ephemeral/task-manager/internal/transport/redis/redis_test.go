package redis

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"
	redisstore "workers/ephemeral/task-manager/internal/store/redis"
	mocks "workers/ephemeral/task-manager/mocks/internal_/store/redis"

	r "github.com/redis/go-redis/v9"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
)

func TestGenerateXReadArgs(t *testing.T) {
	tests := []struct {
		name       string
		streamKeys []string
		expected   []string
	}{
		{
			name:       "single stream",
			streamKeys: []string{"stream1"},
			expected:   []string{"stream1", ">"},
		},
		{
			name:       "two streams",
			streamKeys: []string{"stream1", "stream2"},
			expected:   []string{"stream1", "stream2", ">", ">"},
		},
		{
			name:       "three streams",
			streamKeys: []string{"stream1", "stream2", "stream3"},
			expected:   []string{"stream1", "stream2", "stream3", ">", ">", ">"},
		},
		{
			name:       "empty streams",
			streamKeys: []string{},
			expected:   []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := generateXReadArgs(tt.streamKeys)

			if len(result) != len(tt.expected) {
				t.Errorf("generateXReadArgs() length = %v, want %v", len(result), len(tt.expected))
				return
			}

			for i, v := range tt.expected {
				if result[i] != v {
					t.Errorf("generateXReadArgs()[%d] = %v, want %v", i, result[i], v)
				}
			}
		})
	}
}

func TestNewRedisTransport(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	mockFileContextProvider := mocks.NewFileContextProvider(t)

	options := &Options{
		RedisClient:         client,
		StreamKeys:          []string{"test-stream"},
		Logger:              logger,
		BlockDuration:       5 * time.Second,
		MessageCount:        10,
		WorkerId:            "test-worker",
		ConsumerGroup:       "test-group",
		ExecutionPool:       50,
		Ephemeral:           false,
		FileContextProvider: mockFileContextProvider,
	}

	transport := NewRedisTransport(options)

	if transport == nil {
		t.Fatal("NewRedisTransport returned nil")
	}

	if transport.redis != client {
		t.Error("redis client not set correctly")
	}

	if len(transport.streamKeys) != 1 {
		t.Errorf("streamKeys length = %v, want 1", len(transport.streamKeys))
	}

	if transport.workerId != "test-worker" {
		t.Errorf("workerId = %v, want test-worker", transport.workerId)
	}

	if transport.consumerGroup != "test-group" {
		t.Errorf("consumerGroup = %v, want test-group", transport.consumerGroup)
	}

	if transport.blockDuration != 5*time.Second {
		t.Errorf("blockDuration = %v, want 5s", transport.blockDuration)
	}

	if transport.messageCount != 10 {
		t.Errorf("messageCount = %v, want 10", transport.messageCount)
	}

	if transport.executionPoolSize != 50 {
		t.Errorf("executionPoolSize = %v, want 50", transport.executionPoolSize)
	}

	if transport.ephemeral != false {
		t.Errorf("ephemeral = %v, want false", transport.ephemeral)
	}

	if transport.fileContextProvider == nil {
		t.Error("fileContextProvider should not be nil")
	}

	if !transport.alive.Load() {
		t.Error("transport should be alive initially")
	}
}

func TestNewRedisTransportEphemeral(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	mockFileContextProvider := mocks.NewFileContextProvider(t)

	options := &Options{
		RedisClient:         client,
		StreamKeys:          []string{"test-stream"},
		Logger:              logger,
		BlockDuration:       5 * time.Second,
		MessageCount:        10,
		WorkerId:            "test-worker",
		ConsumerGroup:       "test-group",
		ExecutionPool:       1,
		Ephemeral:           true,
		FileContextProvider: mockFileContextProvider,
	}

	transport := NewRedisTransport(options)

	if !transport.ephemeral {
		t.Error("ephemeral should be true")
	}
}

func TestRedisTransportName(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	mockFileContextProvider := mocks.NewFileContextProvider(t)

	options := &Options{
		RedisClient:         client,
		StreamKeys:          []string{"test-stream"},
		Logger:              logger,
		ExecutionPool:       1,
		FileContextProvider: mockFileContextProvider,
	}

	transport := NewRedisTransport(options)

	if transport.Name() != "redisTransport" {
		t.Errorf("Name() = %v, want redisTransport", transport.Name())
	}
}

func TestRedisTransportAlive(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	mockFileContextProvider := mocks.NewFileContextProvider(t)

	options := &Options{
		RedisClient:         client,
		StreamKeys:          []string{"test-stream"},
		Logger:              logger,
		ExecutionPool:       1,
		FileContextProvider: mockFileContextProvider,
	}

	transport := NewRedisTransport(options)

	if !transport.Alive() {
		t.Error("transport should be alive initially")
	}

	transport.alive.Store(false)

	if transport.Alive() {
		t.Error("transport should not be alive after setting alive to false")
	}
}

func TestCloseDoesNotCloseWorkerReturnedChannel(t *testing.T) {
	alive := &atomic.Bool{}
	alive.Store(true)

	executionPool := &atomic.Int64{}
	executionPool.Store(1) // no in-flight workers; Close returns immediately

	transport := &redisTransport{
		logger:            zap.NewNop(),
		alive:             alive,
		executionPool:     executionPool,
		executionPoolSize: 1,
		workerReturned:    make(chan int64, 1),
		cancel:            func() {},
	}

	err := transport.Close(context.Background())
	if err != nil {
		t.Fatalf("Close() error = %v", err)
	}

	func() {
		defer func() {
			if recovered := recover(); recovered != nil {
				t.Fatalf("sending to workerReturned panicked after Close: %v", recovered)
			}
		}()
		transport.workerReturned <- 1
	}()

	select {
	case got := <-transport.workerReturned:
		if got != 1 {
			t.Fatalf("workerReturned value = %d, want 1", got)
		}
	default:
		t.Fatal("expected workerReturned to remain writable after Close")
	}
}

func TestNotifyWorkerReturnedDoesNotBlockWhenChannelFull(t *testing.T) {
	transport := &redisTransport{
		workerReturned: make(chan int64, 1),
	}
	transport.workerReturned <- 42

	done := make(chan struct{})
	go func() {
		defer close(done)
		transport.notifyWorkerReturned(1)
	}()

	select {
	case <-done:
	case <-time.After(100 * time.Millisecond):
		t.Fatal("notifyWorkerReturned blocked on full channel")
	}
}

func TestPollOnceIgnoresStaleWorkerReturnedSignals(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	executionPool := &atomic.Int64{}
	executionPool.Store(0)

	transport := &redisTransport{
		context:        ctx,
		executionPool:  executionPool,
		workerReturned: make(chan int64, 1),
	}
	transport.workerReturned <- 99 // stale wake-up while pool is still empty

	done := make(chan struct{})
	go func() {
		defer close(done)
		_, err := transport.pollOnce()
		if err != nil {
			t.Errorf("pollOnce() error = %v", err)
		}
	}()

	select {
	case <-done:
		t.Fatal("pollOnce returned before pool capacity became available")
	case <-time.After(50 * time.Millisecond):
	}

	transport.executionPool.Store(1)
	transport.notifyWorkerReturned(0)

	select {
	case <-done:
	case <-time.After(500 * time.Millisecond):
		t.Fatal("pollOnce did not return after pool capacity became available")
	}
}

func TestRedisTransportFields(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	mockFileContextProvider := mocks.NewFileContextProvider(t)

	options := &Options{
		RedisClient:         client,
		StreamKeys:          []string{"test-stream"},
		Logger:              logger,
		ExecutionPool:       1,
		FileContextProvider: mockFileContextProvider,
	}

	transport := NewRedisTransport(options)

	fields := transport.Fields()

	if fields == nil {
		t.Fatal("Fields() returned nil")
	}

	if len(fields) != 0 {
		t.Errorf("Fields() length = %v, want 0", len(fields))
	}
}

func TestXReadArgsStructure(t *testing.T) {
	// Test that xReadArgs are set correctly during construction
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	mockFileContextProvider := mocks.NewFileContextProvider(t)

	streamKeys := []string{"stream1", "stream2"}
	options := &Options{
		RedisClient:         client,
		StreamKeys:          streamKeys,
		Logger:              logger,
		ExecutionPool:       1,
		FileContextProvider: mockFileContextProvider,
	}

	transport := NewRedisTransport(options)

	expected := []string{"stream1", "stream2", ">", ">"}
	if len(transport.xReadArgs) != len(expected) {
		t.Errorf("xReadArgs length = %v, want %v", len(transport.xReadArgs), len(expected))
	}

	for i, v := range expected {
		if transport.xReadArgs[i] != v {
			t.Errorf("xReadArgs[%d] = %v, want %v", i, transport.xReadArgs[i], v)
		}
	}
}

type trackingExecutionContextProvider struct {
	mu sync.Mutex

	fileContexts map[string]*redisstore.ExecutionFileContext
	setFileCount map[string]int
	cleanupCount map[string]int
	allowCount   map[string]int
}

func newTrackingExecutionContextProvider() *trackingExecutionContextProvider {
	return &trackingExecutionContextProvider{
		fileContexts: map[string]*redisstore.ExecutionFileContext{},
		setFileCount: map[string]int{},
		cleanupCount: map[string]int{},
		allowCount:   map[string]int{},
	}
}

func (p *trackingExecutionContextProvider) GetFileContext(executionID string) *redisstore.ExecutionFileContext {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.fileContexts[executionID]
}

func (p *trackingExecutionContextProvider) SetFileContext(executionID string, ctx *redisstore.ExecutionFileContext) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.fileContexts[executionID] = ctx
	p.setFileCount[executionID]++
}

func (p *trackingExecutionContextProvider) CleanupExecution(executionID string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	delete(p.fileContexts, executionID)
	p.cleanupCount[executionID]++
}

func (p *trackingExecutionContextProvider) SetAllowedKeys(executionID string, keys []string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.allowCount[executionID]++
}

func (*trackingExecutionContextProvider) SetSecurityViolationHandler(handler redisstore.SecurityViolationHandler) {
}

type blockingCleanupExecutionContextProvider struct {
	mu sync.Mutex

	fileContexts map[string]*redisstore.ExecutionFileContext
	setFileCount map[string]int
	cleanupCount map[string]int
	allowCount   map[string]int

	cleanupStarted chan struct{}
	unblockCleanup chan struct{}
	cleanupOnce    sync.Once
}

func newBlockingCleanupExecutionContextProvider() *blockingCleanupExecutionContextProvider {
	return &blockingCleanupExecutionContextProvider{
		fileContexts:   map[string]*redisstore.ExecutionFileContext{},
		setFileCount:   map[string]int{},
		cleanupCount:   map[string]int{},
		allowCount:     map[string]int{},
		cleanupStarted: make(chan struct{}),
		unblockCleanup: make(chan struct{}),
	}
}

func (p *blockingCleanupExecutionContextProvider) GetFileContext(executionID string) *redisstore.ExecutionFileContext {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.fileContexts[executionID]
}

func (p *blockingCleanupExecutionContextProvider) SetFileContext(executionID string, ctx *redisstore.ExecutionFileContext) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.fileContexts[executionID] = ctx
	p.setFileCount[executionID]++
}

func (p *blockingCleanupExecutionContextProvider) CleanupExecution(executionID string) {
	p.cleanupOnce.Do(func() {
		close(p.cleanupStarted)
	})
	<-p.unblockCleanup

	p.mu.Lock()
	defer p.mu.Unlock()
	delete(p.fileContexts, executionID)
	p.cleanupCount[executionID]++
}

func (p *blockingCleanupExecutionContextProvider) SetAllowedKeys(executionID string, keys []string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.allowCount[executionID]++
}

func (*blockingCleanupExecutionContextProvider) SetSecurityViolationHandler(handler redisstore.SecurityViolationHandler) {
}

func TestExecutionContextLifecycleRefCountedCleanup(t *testing.T) {
	provider := newTrackingExecutionContextProvider()
	transport := &redisTransport{
		fileContextProvider:  provider,
		executionContextLock: &sync.Mutex{},
		executionContextRefs: map[string]int{},
		agentKey:             "agent-key",
	}

	props := &transportv1.Request_Data_Data_Props{
		ExecutionId:   "exec-1",
		FileServerUrl: "http://files",
		JwtToken:      "jwt",
		Variables: map[string]*transportv1.Variable{
			"foo": {Key: "VARIABLE.foo"},
		},
	}

	transport.setupExecutionContext("exec-1", props, nil)
	transport.setupExecutionContext("exec-1", props, nil)

	if got := provider.setFileCount["exec-1"]; got != 2 {
		t.Fatalf("SetFileContext calls = %d, want 2", got)
	}
	if got := provider.allowCount["exec-1"]; got != 2 {
		t.Fatalf("SetAllowedKeys calls = %d, want 2", got)
	}

	transport.teardownExecutionContext("exec-1")
	if got := provider.cleanupCount["exec-1"]; got != 0 {
		t.Fatalf("CleanupExecution calls after first teardown = %d, want 0", got)
	}

	transport.teardownExecutionContext("exec-1")
	if got := provider.cleanupCount["exec-1"]; got != 1 {
		t.Fatalf("CleanupExecution calls after second teardown = %d, want 1", got)
	}
}

func TestExecutionContextLifecycleCleanupIsolatedByExecution(t *testing.T) {
	provider := newTrackingExecutionContextProvider()
	transport := &redisTransport{
		fileContextProvider:  provider,
		executionContextLock: &sync.Mutex{},
		executionContextRefs: map[string]int{},
		agentKey:             "agent-key",
	}

	propsA := &transportv1.Request_Data_Data_Props{ExecutionId: "exec-a", FileServerUrl: "http://files-a"}
	propsB := &transportv1.Request_Data_Data_Props{ExecutionId: "exec-b", FileServerUrl: "http://files-b"}

	transport.setupExecutionContext("exec-a", propsA, nil)
	transport.setupExecutionContext("exec-b", propsB, nil)

	transport.teardownExecutionContext("exec-a")
	if got := provider.cleanupCount["exec-a"]; got != 1 {
		t.Fatalf("CleanupExecution calls for exec-a = %d, want 1", got)
	}
	if got := provider.cleanupCount["exec-b"]; got != 0 {
		t.Fatalf("CleanupExecution calls for exec-b = %d, want 0", got)
	}

	transport.teardownExecutionContext("exec-b")
	if got := provider.cleanupCount["exec-b"]; got != 1 {
		t.Fatalf("CleanupExecution calls for exec-b = %d, want 1", got)
	}
}

func TestExecutionContextLifecycleInitializesZeroValueState(t *testing.T) {
	provider := newTrackingExecutionContextProvider()
	transport := &redisTransport{
		fileContextProvider: provider,
		agentKey:            "agent-key",
	}

	props := &transportv1.Request_Data_Data_Props{
		ExecutionId:   "exec-1",
		FileServerUrl: "http://files",
	}

	transport.setupExecutionContext("exec-1", props, nil)
	transport.teardownExecutionContext("exec-1")

	if transport.executionContextLock == nil {
		t.Fatal("executionContextLock was not initialized")
	}
	if transport.executionContextRefs == nil {
		t.Fatal("executionContextRefs was not initialized")
	}
	if got := provider.cleanupCount["exec-1"]; got != 1 {
		t.Fatalf("CleanupExecution calls for exec-1 = %d, want 1", got)
	}
}

func TestSetupExecutionContextStoresIntegrationsCallbackUrl(t *testing.T) {
	provider := newTrackingExecutionContextProvider()
	transport := &redisTransport{
		fileContextProvider:  provider,
		executionContextLock: &sync.Mutex{},
		executionContextRefs: map[string]int{},
		agentKey:             "agent-key",
	}

	props := &transportv1.Request_Data_Data_Props{
		ExecutionId:             "exec-1",
		FileServerUrl:           "http://files",
		JwtToken:                "jwt",
		IntegrationsCallbackUrl: "orchestrator-pr.internal:9000",
	}

	transport.setupExecutionContext("exec-1", props, nil)

	fileCtx := provider.GetFileContext("exec-1")
	if fileCtx == nil {
		t.Fatal("expected file context for execution")
	}
	if fileCtx.IntegrationsCallbackUrl != "orchestrator-pr.internal:9000" {
		t.Fatalf("IntegrationsCallbackUrl = %q, want %q", fileCtx.IntegrationsCallbackUrl, "orchestrator-pr.internal:9000")
	}
}

func TestExecutionContextLifecycleNoCleanupInterleavingWithNewSetup(t *testing.T) {
	provider := newBlockingCleanupExecutionContextProvider()
	transport := &redisTransport{
		fileContextProvider:  provider,
		executionContextLock: &sync.Mutex{},
		executionContextRefs: map[string]int{},
		agentKey:             "agent-key",
	}

	props := &transportv1.Request_Data_Data_Props{
		ExecutionId:   "exec-1",
		FileServerUrl: "http://files",
	}

	transport.setupExecutionContext("exec-1", props, nil)

	teardownDone := make(chan struct{})
	go func() {
		defer close(teardownDone)
		transport.teardownExecutionContext("exec-1")
	}()

	select {
	case <-provider.cleanupStarted:
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timed out waiting for cleanup to start")
	}

	setupDone := make(chan struct{})
	go func() {
		defer close(setupDone)
		transport.setupExecutionContext("exec-1", props, nil)
	}()

	select {
	case <-setupDone:
		t.Fatal("setup completed while cleanup was still blocked")
	case <-time.After(50 * time.Millisecond):
		// expected: setup blocks behind teardown's critical section
	}

	close(provider.unblockCleanup)

	select {
	case <-teardownDone:
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timed out waiting for teardown to complete")
	}

	select {
	case <-setupDone:
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timed out waiting for setup to complete")
	}

	if provider.GetFileContext("exec-1") == nil {
		t.Fatal("file context was unexpectedly cleaned after re-setup")
	}
}
