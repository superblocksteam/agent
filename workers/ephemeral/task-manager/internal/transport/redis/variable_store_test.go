package redis

import (
	"context"
	"sync"
	"testing"

	r "github.com/redis/go-redis/v9"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.uber.org/zap"
)

// mockVariableStoreProvider implements VariableStoreProvider for testing
type mockVariableStoreProvider struct {
	store      map[string]map[string]string
	lock       sync.RWMutex
	mockClient *r.Client
}

func newMockProvider() *mockVariableStoreProvider {
	return &mockVariableStoreProvider{
		store: make(map[string]map[string]string),
	}
}

func newMockProviderWithRedis() *mockVariableStoreProvider {
	// Create a client that will fail (for testing error paths)
	client := r.NewClient(&r.Options{
		Addr: "localhost:16379", // Non-existent port
	})
	return &mockVariableStoreProvider{
		store:      make(map[string]map[string]string),
		mockClient: client,
	}
}

func (m *mockVariableStoreProvider) GetVariableStore() map[string]map[string]string {
	return m.store
}

func (m *mockVariableStoreProvider) GetVariableStoreLock() *sync.RWMutex {
	return &m.lock
}

func (m *mockVariableStoreProvider) GetRedisClient() *r.Client {
	return m.mockClient
}

func TestNewVariableStoreGRPC(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProvider()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	if server == nil {
		t.Fatal("NewVariableStoreGRPC returned nil")
	}

	if server.provider != provider {
		t.Error("provider not set correctly")
	}

	if server.logger != logger {
		t.Error("logger not set correctly")
	}

	if server.port != 50050 {
		t.Errorf("port = %v, want 50050", server.port)
	}
}

func TestVariableStoreGRPCStop(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProvider()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	// Stop should not panic when server is nil
	server.Stop()

	// This shouldn't cause any issues
	if server.server != nil {
		t.Error("server should be nil before Start")
	}
}

func TestVariableStoreProviderInterface(t *testing.T) {
	// Test that mockVariableStoreProvider satisfies the interface
	var _ VariableStoreProvider = (*mockVariableStoreProvider)(nil)
}

func TestMockProviderGetVariableStore(t *testing.T) {
	provider := newMockProvider()

	store := provider.GetVariableStore()
	if store == nil {
		t.Fatal("GetVariableStore returned nil")
	}

	// Add something and verify it's accessible
	store["exec-1"] = map[string]string{"key": "value"}

	store2 := provider.GetVariableStore()
	if store2["exec-1"]["key"] != "value" {
		t.Error("store should be the same reference")
	}
}

func TestMockProviderGetVariableStoreLock(t *testing.T) {
	provider := newMockProvider()

	lock := provider.GetVariableStoreLock()
	if lock == nil {
		t.Fatal("GetVariableStoreLock returned nil")
	}

	// Test that lock operations work
	lock.Lock()
	lock.Unlock()
	lock.RLock()
	lock.RUnlock()
}

func TestMockProviderGetRedisClient(t *testing.T) {
	provider := newMockProvider()

	// Initially nil
	client := provider.GetRedisClient()
	if client != nil {
		t.Error("client should be nil initially")
	}

	// Set a client
	newClient := r.NewClient(&r.Options{Addr: "localhost:6379"})
	defer newClient.Close()
	provider.mockClient = newClient

	client = provider.GetRedisClient()
	if client != newClient {
		t.Error("client should match the set client")
	}
}

func TestVariableStoreGRPCStopMultipleTimes(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProvider()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	// Should not panic when called multiple times
	server.Stop()
	server.Stop()
	server.Stop()
}

func TestGetVariableFromMemory(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	// Pre-populate the store
	provider.store["exec-1"] = map[string]string{
		"key1": "value1",
		"key2": "value2",
	}

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.GetVariableRequest{
		ExecutionId: "exec-1",
		Key:         "key1",
	}

	resp, err := server.GetVariable(ctx, req)

	if err != nil {
		t.Errorf("GetVariable() error = %v", err)
	}

	if resp == nil {
		t.Fatal("GetVariable() returned nil response")
	}

	if !resp.Found {
		t.Error("GetVariable() should find the variable")
	}

	if resp.Value != "value1" {
		t.Errorf("GetVariable() value = %v, want value1", resp.Value)
	}
}

func TestGetVariableExecutionNotFound(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.GetVariableRequest{
		ExecutionId: "unknown-exec",
		Key:         "key1",
	}

	resp, err := server.GetVariable(ctx, req)

	if err != nil {
		t.Errorf("GetVariable() error = %v", err)
	}

	if resp == nil {
		t.Fatal("GetVariable() returned nil response")
	}

	if resp.Found {
		t.Error("GetVariable() should not find the variable for unknown execution")
	}
}

func TestGetVariableKeyNotInMemory(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	// Execution exists but key doesn't
	provider.store["exec-1"] = map[string]string{}

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.GetVariableRequest{
		ExecutionId: "exec-1",
		Key:         "missing-key",
	}

	// This will try Redis and fail, returning not found
	resp, err := server.GetVariable(ctx, req)

	// May have error due to Redis connection, but should handle gracefully
	if resp != nil && resp.Found {
		t.Error("GetVariable() should not find missing key")
	}
	_ = err // Error is acceptable here since Redis is not available
}

func TestSetVariable(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.SetVariableRequest{
		ExecutionId: "exec-1",
		Key:         "key1",
		Value:       "value1",
	}

	resp, err := server.SetVariable(ctx, req)

	if err != nil {
		t.Errorf("SetVariable() error = %v", err)
	}

	if resp == nil {
		t.Fatal("SetVariable() returned nil response")
	}

	if !resp.Success {
		t.Error("SetVariable() should succeed")
	}

	// Verify the variable was stored in memory
	if provider.store["exec-1"]["key1"] != "value1" {
		t.Errorf("variable not stored in memory correctly, got %v", provider.store["exec-1"]["key1"])
	}
}

func TestSetVariableNewExecution(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.SetVariableRequest{
		ExecutionId: "new-exec",
		Key:         "key1",
		Value:       "value1",
	}

	resp, err := server.SetVariable(ctx, req)

	if err != nil {
		t.Errorf("SetVariable() error = %v", err)
	}

	if !resp.Success {
		t.Error("SetVariable() should succeed for new execution")
	}

	// Verify new execution was created
	if _, ok := provider.store["new-exec"]; !ok {
		t.Error("new execution should be created")
	}
}

func TestGetVariables(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	// Pre-populate the store
	provider.store["exec-1"] = map[string]string{
		"key1": "value1",
		"key2": "value2",
	}

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.GetVariablesRequest{
		ExecutionId: "exec-1",
		Keys:        []string{"key1", "key2"},
	}

	resp, err := server.GetVariables(ctx, req)

	if err != nil {
		t.Errorf("GetVariables() error = %v", err)
	}

	if resp == nil {
		t.Fatal("GetVariables() returned nil response")
	}

	if len(resp.Values) != 2 {
		t.Errorf("GetVariables() values length = %v, want 2", len(resp.Values))
	}

	if resp.Values[0] != "value1" {
		t.Errorf("GetVariables() values[0] = %v, want value1", resp.Values[0])
	}

	if resp.Values[1] != "value2" {
		t.Errorf("GetVariables() values[1] = %v, want value2", resp.Values[1])
	}
}

func TestGetVariablesWithMissingKeys(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	// Pre-populate the store with only some keys
	provider.store["exec-1"] = map[string]string{
		"key1": "value1",
	}

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.GetVariablesRequest{
		ExecutionId: "exec-1",
		Keys:        []string{"key1", "missing-key"},
	}

	resp, err := server.GetVariables(ctx, req)

	if err != nil {
		t.Errorf("GetVariables() error = %v", err)
	}

	if resp == nil {
		t.Fatal("GetVariables() returned nil response")
	}

	if len(resp.Values) != 2 {
		t.Errorf("GetVariables() values length = %v, want 2", len(resp.Values))
	}

	if resp.Values[0] != "value1" {
		t.Errorf("GetVariables() values[0] = %v, want value1", resp.Values[0])
	}
}

func TestGetVariablesNilExecution(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.GetVariablesRequest{
		ExecutionId: "unknown-exec",
		Keys:        []string{"key1"},
	}

	resp, err := server.GetVariables(ctx, req)

	if err != nil {
		t.Errorf("GetVariables() error = %v", err)
	}

	if resp == nil {
		t.Fatal("GetVariables() returned nil response")
	}
}

func TestSetVariables(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.SetVariablesRequest{
		ExecutionId: "exec-1",
		Kvs: []*workerv1.KeyValue{
			{Key: "key1", Value: "value1"},
			{Key: "key2", Value: "value2"},
		},
	}

	resp, err := server.SetVariables(ctx, req)

	if err != nil {
		t.Errorf("SetVariables() error = %v", err)
	}

	if !resp.Success {
		t.Error("SetVariables() should succeed")
	}

	// Verify variables were stored in memory
	if provider.store["exec-1"]["key1"] != "value1" {
		t.Errorf("key1 not stored correctly")
	}
	if provider.store["exec-1"]["key2"] != "value2" {
		t.Errorf("key2 not stored correctly")
	}
}

func TestSetVariablesNewExecution(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.SetVariablesRequest{
		ExecutionId: "new-exec",
		Kvs: []*workerv1.KeyValue{
			{Key: "key1", Value: "value1"},
		},
	}

	resp, err := server.SetVariables(ctx, req)

	if err != nil {
		t.Errorf("SetVariables() error = %v", err)
	}

	if !resp.Success {
		t.Error("SetVariables() should succeed")
	}

	// Verify new execution was created
	if _, ok := provider.store["new-exec"]; !ok {
		t.Error("new execution should be created")
	}
}

func TestSetVariablesEmpty(t *testing.T) {
	logger := zap.NewNop()
	provider := newMockProviderWithRedis()
	defer provider.mockClient.Close()

	server := NewVariableStoreGRPC(provider, logger, 50050)

	ctx := context.Background()
	req := &workerv1.SetVariablesRequest{
		ExecutionId: "exec-1",
		Kvs:         []*workerv1.KeyValue{},
	}

	resp, err := server.SetVariables(ctx, req)

	if err != nil {
		t.Errorf("SetVariables() error = %v", err)
	}

	if !resp.Success {
		t.Error("SetVariables() should succeed even with empty kvs")
	}
}
