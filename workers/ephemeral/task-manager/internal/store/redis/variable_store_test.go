package redis

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/store"
	mockstore "github.com/superblocksteam/agent/pkg/store/mock"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.uber.org/zap"
)

func TestNewVariableStoreGRPC(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50050)

	assert.NotNil(t, server)
	assert.Equal(t, mockStore, server.kvStore)
	assert.Equal(t, logger, server.logger)
	assert.Equal(t, 50050, server.port)
}

func TestStop(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50050)

	// Stop should not panic when server is nil
	server.Stop()

	assert.Nil(t, server.server)
}

func TestStop_CalledMultipleTimes(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50051)
	go func() {
		assert.NoError(t, server.Start())
	}()

	// Should not panic when called multiple times
	server.Stop()
	server.Stop()
	server.Stop()
}

func TestStop_CalledMultipleTimesConcurrently(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50052)
	go func() {
		assert.NoError(t, server.Start())
	}()

	allStopsDone := make(chan struct{})
	wg := sync.WaitGroup{}
	wg.Add(3)

	go func() {
		server.Stop()
		wg.Done()
	}()
	go func() {
		server.Stop()
		wg.Done()
	}()
	go func() {
		server.Stop()
		wg.Done()
	}()

	go func() {
		wg.Wait()
		close(allStopsDone)
	}()

	select {
	case <-allStopsDone:
		return
	case <-time.After(1 * time.Second):
		assert.FailNow(t, "all calls to Stop should have returned by now")
	}
}

func TestGetVariables(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50050)

	ctx := context.Background()
	req := &workerv1.GetVariablesRequest{
		ExecutionId: "exec-1",
		Keys:        []string{"key1", "key2"},
	}

	mockStore.On("Read", mock.Anything, "key1", "key2").Return([]any{"value1", "value2"}, nil)

	resp, err := server.GetVariables(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, []string{"value1", "value2"}, resp.Values)
}

func TestGetVariablesWithMissingKeys(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50050)

	ctx := context.Background()
	req := &workerv1.GetVariablesRequest{
		ExecutionId: "exec-1",
		Keys:        []string{"key1", "missing-key"},
	}

	mockStore.On("Read", mock.Anything, "key1", "missing-key").Return([]any{`"value1"`, nil}, nil)

	resp, err := server.GetVariables(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, []string{`"value1"`, "null"}, resp.Values)
}

func TestSetVariable(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50050)

	ctx := context.Background()
	req := &workerv1.SetVariableRequest{
		ExecutionId: "exec-1",
		Key:         "key1",
		Value:       "value1",
	}

	mockStore.On("Write", mock.Anything, &store.KV{Key: "key1", Value: "value1"}).Return(nil)

	resp, err := server.SetVariable(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.True(t, resp.Success)
}

func TestSetVariableNewExecution(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50050)

	ctx := context.Background()
	req := &workerv1.SetVariableRequest{
		ExecutionId: "new-exec",
		Key:         "key1",
		Value:       "value1",
	}

	mockStore.On("Write", mock.Anything, &store.KV{Key: "key1", Value: "value1"}).Return(nil)

	resp, err := server.SetVariable(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.True(t, resp.Success)
}

func TestSetVariables(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50050)

	ctx := context.Background()
	req := &workerv1.SetVariablesRequest{
		ExecutionId: "exec-1",
		Kvs: []*workerv1.KeyValue{
			{Key: "key1", Value: `"value1"`},
			{Key: "key2", Value: `"value2"`},
		},
	}

	mockStore.On(
		"Write",
		mock.Anything,
		&store.KV{Key: "key1", Value: `"value1"`},
		&store.KV{Key: "key2", Value: `"value2"`},
	).Return(nil)

	resp, err := server.SetVariables(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.True(t, resp.Success)
}

func TestSetVariablesEmpty(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(mockStore, logger, 50050)

	ctx := context.Background()
	req := &workerv1.SetVariablesRequest{
		ExecutionId: "exec-1",
		Kvs:         []*workerv1.KeyValue{},
	}

	mockStore.On("Write", mock.Anything).Return(nil)

	resp, err := server.SetVariables(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.True(t, resp.Success)
}
