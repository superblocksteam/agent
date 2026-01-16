package redis

import (
	"testing"
	"time"
	mocks "workers/ephemeral/task-manager/mocks/internal_/store/redis"

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
