package redis_test

import (
	"testing"
	"time"

	"workers/ephemeral/task-manager/internal/plugin_executor"
	"workers/ephemeral/task-manager/internal/transport/redis"
	mocks_st "workers/ephemeral/task-manager/mocks/internal_/store/redis"
	mocks_ts "workers/ephemeral/task-manager/mocks/internal_/transport/redis"

	r "github.com/redis/go-redis/v9"
	"github.com/superblocksteam/agent/pkg/store/mock"
	"go.uber.org/zap"
)

func TestNewOptionsDefaults(t *testing.T) {
	opts := redis.NewOptions()

	if opts.ExecutionPool != 50 {
		t.Errorf("ExecutionPool = %v, want 50", opts.ExecutionPool)
	}
	if opts.BlockDuration != 5*time.Second {
		t.Errorf("BlockDuration = %v, want 5s", opts.BlockDuration)
	}
	if opts.MessageCount != 10 {
		t.Errorf("MessageCount = %v, want 10", opts.MessageCount)
	}
	if opts.DegradedModeBackoff != 1*time.Second {
		t.Errorf("DegradedModeBackoff = %v, want 1s", opts.DegradedModeBackoff)
	}
	if opts.MaxDegradedTime != 10*time.Minute {
		t.Errorf("MaxDegradedTime = %v, want 10m", opts.MaxDegradedTime)
	}
}

func TestWithRedisClient(t *testing.T) {
	client := r.NewClient(&r.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	opts := redis.NewOptions(redis.WithRedisClient(client))

	if opts.RedisClient != client {
		t.Error("RedisClient was not set correctly")
	}
}

func TestWithStreamKeys(t *testing.T) {
	keys := []string{"stream1", "stream2", "stream3"}
	opts := redis.NewOptions(redis.WithStreamKeys(keys))

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
	opts := redis.NewOptions(redis.WithLogger(logger))

	if opts.Logger != logger {
		t.Error("Logger was not set correctly")
	}
}

func TestWithBlockDuration(t *testing.T) {
	duration := 10 * time.Second
	opts := redis.NewOptions(redis.WithBlockDuration(duration))

	if opts.BlockDuration != duration {
		t.Errorf("BlockDuration = %v, want %v", opts.BlockDuration, duration)
	}
}

func TestWithMessageCount(t *testing.T) {
	count := int64(100)
	opts := redis.NewOptions(redis.WithMessageCount(count))

	if opts.MessageCount != count {
		t.Errorf("MessageCount = %v, want %v", opts.MessageCount, count)
	}
}

func TestWithWorkerId(t *testing.T) {
	workerId := "worker-123"
	opts := redis.NewOptions(redis.WithWorkerId(workerId))

	if opts.WorkerId != workerId {
		t.Errorf("WorkerId = %v, want %v", opts.WorkerId, workerId)
	}
}

func TestWithConsumerGroup(t *testing.T) {
	group := "test-group"
	opts := redis.NewOptions(redis.WithConsumerGroup(group))

	if opts.ConsumerGroup != group {
		t.Errorf("ConsumerGroup = %v, want %v", opts.ConsumerGroup, group)
	}
}

func TestWithPluginExecutor(t *testing.T) {
	store := mock.NewStore(t)

	// Create a real plugin executor (the interface is from the plugin_executor package)
	executor := plugin_executor.NewPluginExecutor(&plugin_executor.Options{
		Logger: zap.NewNop(),
		Store:  store,
	})
	opts := redis.NewOptions(redis.WithPluginExecutor(executor))

	if opts.PluginExecutor == nil {
		t.Error("PluginExecutor should be set")
	}
}

func TestWithCapacityGate(t *testing.T) {
	gate := mocks_ts.NewCapacityGate(t)
	opts := redis.NewOptions(redis.WithCapacityGate(gate))
	if opts.CapacityGate != gate {
		t.Errorf("CapacityGate = %v, want %v", opts.CapacityGate, gate)
	}
}

func TestWithExecutionPool(t *testing.T) {
	pool := int64(100)
	opts := redis.NewOptions(redis.WithExecutionPool(pool))

	if opts.ExecutionPool != pool {
		t.Errorf("ExecutionPool = %v, want %v", opts.ExecutionPool, pool)
	}
}

func TestWithFileContextProvider(t *testing.T) {
	provider := mocks_st.NewFileContextProvider(t)
	opts := redis.NewOptions(redis.WithFileContextProvider(provider))
	if opts.FileContextProvider != provider {
		t.Errorf("FileContextProvider = %v, want %v", opts.FileContextProvider, provider)
	}
}

func TestWithEphemeral(t *testing.T) {
	opts := redis.NewOptions(redis.WithEphemeral(true))

	if opts.Ephemeral != true {
		t.Errorf("Ephemeral = %v, want true", opts.Ephemeral)
	}

	opts = redis.NewOptions(redis.WithEphemeral(false))
	if opts.Ephemeral != false {
		t.Errorf("Ephemeral = %v, want false", opts.Ephemeral)
	}
}

func TestWithDrainCompleteCh(t *testing.T) {
	ch := make(chan struct{})
	close(ch)

	opts := redis.NewOptions(redis.WithDrainCompleteCh(ch))
	if opts.DrainCompleteCh != ch {
		t.Errorf("DrainCompleteCh = %v, want %v", opts.DrainCompleteCh, ch)
	}
}

func TestWithDegradedModeBackoff(t *testing.T) {
	duration := 10 * time.Second
	opts := redis.NewOptions(redis.WithDegradedModeBackoff(duration))
	if opts.DegradedModeBackoff != duration {
		t.Errorf("DegradedModeBackoff = %v, want %v", opts.DegradedModeBackoff, duration)
	}
}

func TestWithMaxDegradedTime(t *testing.T) {
	duration := 10 * time.Minute
	opts := redis.NewOptions(redis.WithMaxDegradedTime(duration))
	if opts.MaxDegradedTime != duration {
		t.Errorf("MaxDegradedTime = %v, want %v", opts.MaxDegradedTime, duration)
	}
}

func TestWithAutoClaimMinIdle(t *testing.T) {
	duration := 10 * time.Second
	opts := redis.NewOptions(redis.WithAutoClaimMinIdle(duration))
	if opts.AutoClaimMinIdle != duration {
		t.Errorf("AutoClaimMinIdle = %v, want %v", opts.AutoClaimMinIdle, duration)
	}
}
func TestOptionsChaining(t *testing.T) {
	logger := zap.NewNop()
	provider := mocks_st.NewFileContextProvider(t)

	opts := redis.NewOptions(
		redis.WithWorkerId("worker-1"),
		redis.WithConsumerGroup("group-1"),
		redis.WithExecutionPool(25),
		redis.WithBlockDuration(3*time.Second),
		redis.WithMessageCount(5),
		redis.WithFileContextProvider(provider),
		redis.WithEphemeral(true),
		redis.WithLogger(logger),
		redis.WithDegradedModeBackoff(30*time.Second),
		redis.WithMaxDegradedTime(5*time.Minute),
		redis.WithAutoClaimMinIdle(10*time.Second),
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
	if opts.DegradedModeBackoff != 30*time.Second {
		t.Errorf("DegradedModeBackoff = %v, want 30s", opts.DegradedModeBackoff)
	}
	if opts.MaxDegradedTime != 5*time.Minute {
		t.Errorf("MaxDegradedTime = %v, want 5m", opts.MaxDegradedTime)
	}
	if opts.AutoClaimMinIdle != 10*time.Second {
		t.Errorf("AutoClaimMinIdle = %v, want 10s", opts.AutoClaimMinIdle)
	}
}

func TestOptionsOverride(t *testing.T) {
	opts := redis.NewOptions(
		redis.WithExecutionPool(10),
		redis.WithExecutionPool(20), // Should override
		redis.WithExecutionPool(30), // Should override again
	)

	if opts.ExecutionPool != 30 {
		t.Errorf("ExecutionPool = %v, want 30 (last value should win)", opts.ExecutionPool)
	}
}
