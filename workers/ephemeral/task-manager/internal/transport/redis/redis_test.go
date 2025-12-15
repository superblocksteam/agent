package redis

import (
	"sync"
	"testing"
	"time"

	r "github.com/redis/go-redis/v9"
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

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		BlockDuration: 5 * time.Second,
		MessageCount:  10,
		WorkerId:      "test-worker",
		ConsumerGroup: "test-group",
		ExecutionPool: 50,
		GRPCAddress:   "localhost:50050",
		Ephemeral:     false,
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

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		BlockDuration: 5 * time.Second,
		MessageCount:  10,
		WorkerId:      "test-worker",
		ConsumerGroup: "test-group",
		ExecutionPool: 1,
		Ephemeral:     true,
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

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		ExecutionPool: 1,
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

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		ExecutionPool: 1,
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

func TestRedisTransportFields(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		ExecutionPool: 1,
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

func TestRedisTransportGetVariableStore(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		ExecutionPool: 1,
	}

	transport := NewRedisTransport(options)

	store := transport.GetVariableStore()

	if store == nil {
		t.Fatal("GetVariableStore() returned nil")
	}

	if len(store) != 0 {
		t.Errorf("GetVariableStore() should be empty initially, got %d items", len(store))
	}
}

func TestRedisTransportGetVariableStoreLock(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		ExecutionPool: 1,
	}

	transport := NewRedisTransport(options)

	lock := transport.GetVariableStoreLock()

	if lock == nil {
		t.Fatal("GetVariableStoreLock() returned nil")
	}

	// Verify the lock works
	lock.Lock()
	lock.Unlock()
	lock.RLock()
	lock.RUnlock()
}

func TestRedisTransportGetRedisClient(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		ExecutionPool: 1,
	}

	transport := NewRedisTransport(options)

	result := transport.GetRedisClient()

	if result != client {
		t.Error("GetRedisClient() did not return the correct client")
	}
}

func TestCleanupExecution(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		ExecutionPool: 1,
	}

	transport := NewRedisTransport(options)

	// Add some data to the variable store
	transport.variableStoreLock.Lock()
	transport.variableStore["exec-1"] = map[string]string{"key": "value"}
	transport.variableStore["exec-2"] = map[string]string{"key": "value"}
	transport.variableStoreLock.Unlock()

	// Verify data exists
	if len(transport.variableStore) != 2 {
		t.Fatalf("expected 2 executions in store, got %d", len(transport.variableStore))
	}

	// Cleanup one execution
	transport.cleanupExecution("exec-1")

	// Verify only exec-2 remains
	if len(transport.variableStore) != 1 {
		t.Errorf("expected 1 execution in store after cleanup, got %d", len(transport.variableStore))
	}

	if _, ok := transport.variableStore["exec-1"]; ok {
		t.Error("exec-1 should have been removed")
	}

	if _, ok := transport.variableStore["exec-2"]; !ok {
		t.Error("exec-2 should still exist")
	}
}

func TestSignalEphemeralDone(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	t.Run("ephemeral mode sends signal", func(t *testing.T) {
		options := &Options{
			RedisClient:   client,
			StreamKeys:    []string{"test-stream"},
			Logger:        logger,
			ExecutionPool: 1,
			Ephemeral:     true,
		}

		transport := NewRedisTransport(options)

		// Signal completion
		go transport.signalEphemeralDone(nil)

		// Should receive the signal
		select {
		case err := <-transport.ephemeralDone:
			if err != nil {
				t.Errorf("expected nil error, got %v", err)
			}
		case <-time.After(1 * time.Second):
			t.Error("timeout waiting for ephemeral done signal")
		}
	})

	t.Run("non-ephemeral mode does not send signal", func(t *testing.T) {
		options := &Options{
			RedisClient:   client,
			StreamKeys:    []string{"test-stream"},
			Logger:        logger,
			ExecutionPool: 1,
			Ephemeral:     false,
		}

		transport := NewRedisTransport(options)

		// Signal completion - should not block
		transport.signalEphemeralDone(nil)

		// Should not receive signal in non-ephemeral mode
		select {
		case <-transport.ephemeralDone:
			t.Error("should not receive signal in non-ephemeral mode")
		case <-time.After(100 * time.Millisecond):
			// Expected - no signal
		}
	})
}

func TestVariableStoreConcurrency(t *testing.T) {
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	options := &Options{
		RedisClient:   client,
		StreamKeys:    []string{"test-stream"},
		Logger:        logger,
		ExecutionPool: 1,
	}

	transport := NewRedisTransport(options)

	var wg sync.WaitGroup
	iterations := 100

	// Concurrent writes
	for i := 0; i < iterations; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			transport.variableStoreLock.Lock()
			transport.variableStore["exec"] = map[string]string{"key": "value"}
			transport.variableStoreLock.Unlock()
		}(i)
	}

	// Concurrent reads
	for i := 0; i < iterations; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			transport.variableStoreLock.RLock()
			_ = transport.variableStore["exec"]
			transport.variableStoreLock.RUnlock()
		}(i)
	}

	wg.Wait()
}

func TestXReadArgsStructure(t *testing.T) {
	// Test that xReadArgs are set correctly during construction
	logger := zap.NewNop()
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	streamKeys := []string{"stream1", "stream2"}
	options := &Options{
		RedisClient:   client,
		StreamKeys:    streamKeys,
		Logger:        logger,
		ExecutionPool: 1,
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
