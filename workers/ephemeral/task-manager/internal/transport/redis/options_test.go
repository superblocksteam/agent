package redis

import (
	"testing"
	"time"

	"workers/ephemeral/task-manager/internal/plugin_executor"
	mocks "workers/ephemeral/task-manager/mocks/internal_/store/redis"

	r "github.com/redis/go-redis/v9"
	"github.com/superblocksteam/agent/pkg/store/mock"
	"go.uber.org/zap"
)

func TestNewOptionsDefaults(t *testing.T) {
	opts := NewOptions()

	if opts.ExecutionPool != 50 {
		t.Errorf("ExecutionPool = %v, want 50", opts.ExecutionPool)
	}
	if opts.BlockDuration != 5*time.Second {
		t.Errorf("BlockDuration = %v, want 5s", opts.BlockDuration)
	}
	if opts.MessageCount != 10 {
		t.Errorf("MessageCount = %v, want 10", opts.MessageCount)
	}
}

func TestWithRedisClient(t *testing.T) {
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	opts := NewOptions(WithRedisClient(client))

	if opts.RedisClient != client {
		t.Error("RedisClient was not set correctly")
	}
}

func TestWithStreamKeys(t *testing.T) {
	keys := []string{"stream1", "stream2", "stream3"}
	opts := NewOptions(WithStreamKeys(keys))

	if len(opts.StreamKeys) != 3 {
		t.Errorf("StreamKeys length = %v, want 3", len(opts.StreamKeys))
	}
	for i, key := range keys {
		if opts.StreamKeys[i] != key {
			t.Errorf("StreamKeys[%d] = %v, want %v", i, opts.StreamKeys[i], key)
		}
	}
}

func TestWithLogger(t *testing.T) {
	logger := zap.NewNop()
	opts := NewOptions(WithLogger(logger))

	if opts.Logger != logger {
		t.Error("Logger was not set correctly")
	}
}

func TestWithBlockDuration(t *testing.T) {
	duration := 10 * time.Second
	opts := NewOptions(WithBlockDuration(duration))

	if opts.BlockDuration != duration {
		t.Errorf("BlockDuration = %v, want %v", opts.BlockDuration, duration)
	}
}

func TestWithMessageCount(t *testing.T) {
	count := int64(100)
	opts := NewOptions(WithMessageCount(count))

	if opts.MessageCount != count {
		t.Errorf("MessageCount = %v, want %v", opts.MessageCount, count)
	}
}

func TestWithWorkerId(t *testing.T) {
	workerId := "worker-123"
	opts := NewOptions(WithWorkerId(workerId))

	if opts.WorkerId != workerId {
		t.Errorf("WorkerId = %v, want %v", opts.WorkerId, workerId)
	}
}

func TestWithConsumerGroup(t *testing.T) {
	group := "test-group"
	opts := NewOptions(WithConsumerGroup(group))

	if opts.ConsumerGroup != group {
		t.Errorf("ConsumerGroup = %v, want %v", opts.ConsumerGroup, group)
	}
}

func TestWithExecutionPool(t *testing.T) {
	pool := int64(100)
	opts := NewOptions(WithExecutionPool(pool))

	if opts.ExecutionPool != pool {
		t.Errorf("ExecutionPool = %v, want %v", opts.ExecutionPool, pool)
	}
}

func TestWithFileContextProvider(t *testing.T) {
	provider := mocks.NewFileContextProvider(t)
	opts := NewOptions(WithFileContextProvider(provider))
	if opts.FileContextProvider != provider {
		t.Errorf("FileContextProvider = %v, want %v", opts.FileContextProvider, provider)
	}
}

func TestWithEphemeral(t *testing.T) {
	opts := NewOptions(WithEphemeral(true))

	if opts.Ephemeral != true {
		t.Errorf("Ephemeral = %v, want true", opts.Ephemeral)
	}

	opts = NewOptions(WithEphemeral(false))
	if opts.Ephemeral != false {
		t.Errorf("Ephemeral = %v, want false", opts.Ephemeral)
	}
}

func TestOptionsChaining(t *testing.T) {
	logger := zap.NewNop()
	provider := mocks.NewFileContextProvider(t)

	opts := NewOptions(
		WithWorkerId("worker-1"),
		WithConsumerGroup("group-1"),
		WithExecutionPool(25),
		WithBlockDuration(3*time.Second),
		WithMessageCount(5),
		WithFileContextProvider(provider),
		WithEphemeral(true),
		WithLogger(logger),
	)

	if opts.WorkerId != "worker-1" {
		t.Errorf("WorkerId = %v, want worker-1", opts.WorkerId)
	}
	if opts.ConsumerGroup != "group-1" {
		t.Errorf("ConsumerGroup = %v, want group-1", opts.ConsumerGroup)
	}
	if opts.ExecutionPool != 25 {
		t.Errorf("ExecutionPool = %v, want 25", opts.ExecutionPool)
	}
	if opts.BlockDuration != 3*time.Second {
		t.Errorf("BlockDuration = %v, want 3s", opts.BlockDuration)
	}
	if opts.MessageCount != 5 {
		t.Errorf("MessageCount = %v, want 5", opts.MessageCount)
	}
	if opts.FileContextProvider != provider {
		t.Errorf("FileContextProvider = %v, want %v", opts.FileContextProvider, provider)
	}
	if opts.Ephemeral != true {
		t.Errorf("Ephemeral = %v, want true", opts.Ephemeral)
	}
	if opts.Logger != logger {
		t.Error("Logger was not set correctly")
	}
}

func TestOptionsOverride(t *testing.T) {
	opts := NewOptions(
		WithExecutionPool(10),
		WithExecutionPool(20), // Should override
		WithExecutionPool(30), // Should override again
	)

	if opts.ExecutionPool != 30 {
		t.Errorf("ExecutionPool = %v, want 30 (last value should win)", opts.ExecutionPool)
	}
}

func TestWithPluginExecutor(t *testing.T) {
	store := mock.NewStore(t)

	// Create a real plugin executor (the interface is from the plugin_executor package)
	executor := plugin_executor.NewPluginExecutor(&plugin_executor.Options{
		Logger: zap.NewNop(),
		Store:  store,
	})
	opts := NewOptions(WithPluginExecutor(executor))

	if opts.PluginExecutor == nil {
		t.Error("PluginExecutor should be set")
	}
}
