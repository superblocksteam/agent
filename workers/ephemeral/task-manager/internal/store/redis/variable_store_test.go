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
	"google.golang.org/grpc"
)

func TestNewVariableStoreGRPC(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

	assert.NotNil(t, server)
	assert.Equal(t, mockStore, server.kvStore)
	assert.Equal(t, logger, server.logger)
	assert.Equal(t, 50050, server.port)
}

func TestStop(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

	// Stop should not panic when server is nil
	server.Stop()

	assert.Nil(t, server.server)
}

func TestStop_CalledMultipleTimes(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50051),
	)

	// Use a channel to capture the server start result
	started := make(chan error, 1)
	go func() {
		started <- server.Start()
	}()

	// Give the server a moment to start listening
	time.Sleep(50 * time.Millisecond)

	// Should not panic when called multiple times
	server.Stop()
	server.Stop()
	server.Stop()

	// Verify server.Start() returned (due to Stop())
	select {
	case <-started:
		// Expected - Start() returned after Stop()
	case <-time.After(1 * time.Second):
		t.Fatal("server.Start() did not return after Stop()")
	}
}

func TestStop_CalledMultipleTimesConcurrently(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50052),
	)

	// Use a channel to capture the server start result
	started := make(chan error, 1)
	go func() {
		started <- server.Start()
	}()

	// Give the server a moment to start listening
	time.Sleep(50 * time.Millisecond)

	wg := sync.WaitGroup{}
	wg.Add(3)

	go func() {
		defer wg.Done()
		server.Stop()
	}()
	go func() {
		defer wg.Done()
		server.Stop()
	}()
	go func() {
		defer wg.Done()
		server.Stop()
	}()

	// Wait for all Stop() calls to complete with timeout
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		// All Stop() calls completed
	case <-time.After(1 * time.Second):
		t.Fatal("all calls to Stop should have returned by now")
	}

	// Verify server.Start() returned (due to Stop())
	select {
	case <-started:
		// Expected - Start() returned after Stop()
	case <-time.After(1 * time.Second):
		t.Fatal("server.Start() did not return after Stop()")
	}
}

func TestGetVariables(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

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

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

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

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

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

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

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

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

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

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

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

// ============================================================================
// Key Allowlisting Tests
// ============================================================================

func TestKeyAllowlisting(t *testing.T) {
	tests := map[string]struct {
		// Setup
		allowlistSetup map[string][]string // executionID -> allowed keys
		// Request
		executionID string
		requestKey  string   // for single key requests
		requestKeys []string // for batch requests (if set, uses GetVariables)
		// Mock setup
		mockReadKey    string   // key to mock Read for
		mockReadKeys   []string // keys to mock Read for (batch)
		mockReadResult []any
		// Expected
		expectError   bool
		expectValue   string
		expectValues  []string
		errorContains string
	}{
		"allowed_key_succeeds": {
			allowlistSetup: map[string][]string{"exec-1": {"allowed-key-1", "allowed-key-2"}},
			executionID:    "exec-1",
			requestKey:     "allowed-key-1",
			mockReadKey:    "allowed-key-1",
			mockReadResult: []any{"value1"},
			expectError:    false,
			expectValue:    "value1",
		},
		"disallowed_key_rejected": {
			allowlistSetup: map[string][]string{"exec-1": {"allowed-key-1", "allowed-key-2"}},
			executionID:    "exec-1",
			requestKey:     "secret-key",
			expectError:    true,
			errorContains:  "key not allowed",
		},
		"cross_execution_access_rejected": {
			allowlistSetup: map[string][]string{
				"exec-A": {"key-for-A"},
				"exec-B": {"key-for-B"},
			},
			executionID:   "exec-A",
			requestKey:    "key-for-B", // belongs to exec-B
			expectError:   true,
			errorContains: "key not allowed",
		},
		"batch_all_keys_allowed": {
			allowlistSetup: map[string][]string{"exec-1": {"key1", "key2", "key3"}},
			executionID:    "exec-1",
			requestKeys:    []string{"key1", "key2"},
			mockReadKeys:   []string{"key1", "key2"},
			mockReadResult: []any{"val1", "val2"},
			expectError:    false,
			expectValues:   []string{"val1", "val2"},
		},
		"batch_one_key_disallowed": {
			allowlistSetup: map[string][]string{"exec-1": {"key1", "key2"}},
			executionID:    "exec-1",
			requestKeys:    []string{"key1", "secret-key"},
			expectError:    true,
			errorContains:  "key not allowed",
		},
		"no_allowlist_allows_all": {
			allowlistSetup: map[string][]string{}, // empty - no allowlist set
			executionID:    "exec-no-allowlist",
			requestKey:     "any-key",
			mockReadKey:    "any-key",
			mockReadResult: []any{"value"},
			expectError:    false,
			expectValue:    "value",
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			logger := zap.NewNop()
			mockStore := mockstore.NewStore(t)
			server := NewVariableStoreGRPC(
				WithKvStore(mockStore),
				WithServer(grpc.NewServer()),
				WithLogger(logger),
				WithPort(50050),
			)

			// Setup allowlists
			for execID, keys := range tt.allowlistSetup {
				server.SetAllowedKeys(execID, keys)
			}

			ctx := context.Background()

			if len(tt.requestKeys) > 0 {
				// Batch request
				req := &workerv1.GetVariablesRequest{
					ExecutionId: tt.executionID,
					Keys:        tt.requestKeys,
				}

				if len(tt.mockReadKeys) > 0 {
					args := []any{mock.Anything}
					for _, k := range tt.mockReadKeys {
						args = append(args, k)
					}
					mockStore.On("Read", args...).Return(tt.mockReadResult, nil)
				}

				resp, err := server.GetVariables(ctx, req)

				if tt.expectError {
					assert.Error(t, err)
					assert.Nil(t, resp)
					if tt.errorContains != "" {
						assert.Contains(t, err.Error(), tt.errorContains)
					}
				} else {
					assert.NoError(t, err)
					assert.NotNil(t, resp)
					assert.Equal(t, tt.expectValues, resp.Values)
				}
			} else {
				// Single key request
				req := &workerv1.GetVariableRequest{
					ExecutionId: tt.executionID,
					Key:         tt.requestKey,
				}

				if tt.mockReadKey != "" {
					mockStore.On("Read", mock.Anything, tt.mockReadKey).Return(tt.mockReadResult, nil)
				}

				resp, err := server.GetVariable(ctx, req)

				if tt.expectError {
					assert.Error(t, err)
					assert.Nil(t, resp)
					if tt.errorContains != "" {
						assert.Contains(t, err.Error(), tt.errorContains)
					}
				} else {
					assert.NoError(t, err)
					assert.NotNil(t, resp)
					assert.Equal(t, tt.expectValue, resp.Value)
				}
			}
		})
	}
}

func TestAllowlistManagement(t *testing.T) {
	tests := map[string]struct {
		setup func(s *VariableStoreGRPC)
		check func(t *testing.T, s *VariableStoreGRPC)
	}{
		"cleanup_clears_allowlist": {
			setup: func(s *VariableStoreGRPC) {
				s.SetAllowedKeys("exec-1", []string{"key1"})
			},
			check: func(t *testing.T, s *VariableStoreGRPC) {
				assert.True(t, s.isKeyAllowed("exec-1", "key1"))
				s.CleanupExecution("exec-1")
				// After cleanup, no allowlist exists so all keys are allowed
				assert.True(t, s.isKeyAllowed("exec-1", "key1"))
				assert.True(t, s.isKeyAllowed("exec-1", "any-other-key"))
			},
		},
		"overwrite_replaces_previous": {
			setup: func(s *VariableStoreGRPC) {
				s.SetAllowedKeys("exec-1", []string{"old-key-1", "old-key-2"})
			},
			check: func(t *testing.T, s *VariableStoreGRPC) {
				assert.True(t, s.isKeyAllowed("exec-1", "old-key-1"))
				assert.False(t, s.isKeyAllowed("exec-1", "new-key-1"))

				s.SetAllowedKeys("exec-1", []string{"new-key-1", "new-key-2"})

				assert.False(t, s.isKeyAllowed("exec-1", "old-key-1"))
				assert.True(t, s.isKeyAllowed("exec-1", "new-key-1"))
			},
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			logger := zap.NewNop()
			mockStore := mockstore.NewStore(t)
			server := NewVariableStoreGRPC(
				WithKvStore(mockStore),
				WithServer(grpc.NewServer()),
				WithLogger(logger),
				WithPort(50050),
			)

			tt.setup(server)
			tt.check(t, server)
		})
	}
}

// ============================================================================
// Security Violation Handler Tests
// ============================================================================

func TestSecurityViolationHandler_CalledOnDisallowedKey(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

	executionID := "exec-violation-test"
	server.SetAllowedKeys(executionID, []string{"allowed-key"})

	// Track if handler was called
	var handlerCalled bool
	var capturedViolation SecurityViolation

	server.SetSecurityViolationHandler(func(v SecurityViolation) {
		handlerCalled = true
		capturedViolation = v
	})

	ctx := context.Background()
	req := &workerv1.GetVariableRequest{
		ExecutionId: executionID,
		Key:         "unauthorized-secret-key",
	}

	// Request should fail
	resp, err := server.GetVariable(ctx, req)

	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "key not allowed")

	// Handler should have been called with correct details
	assert.True(t, handlerCalled, "security violation handler should have been called")
	assert.Equal(t, executionID, capturedViolation.ExecutionID)
	assert.Equal(t, "unauthorized-secret-key", capturedViolation.RequestedKey)
	assert.Equal(t, "key_not_allowed", capturedViolation.ViolationType)
	assert.Contains(t, capturedViolation.AllowedKeys, "allowed-key")
}

func TestSecurityViolationHandler_CalledOnBatchDisallowedKey(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

	executionID := "exec-batch-violation-test"
	server.SetAllowedKeys(executionID, []string{"key1", "key2"})

	// Track if handler was called
	var handlerCalled bool
	var capturedViolation SecurityViolation

	server.SetSecurityViolationHandler(func(v SecurityViolation) {
		handlerCalled = true
		capturedViolation = v
	})

	ctx := context.Background()
	req := &workerv1.GetVariablesRequest{
		ExecutionId: executionID,
		Keys:        []string{"key1", "secret-database-password"}, // Second key is not allowed
	}

	// Request should fail
	resp, err := server.GetVariables(ctx, req)

	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "key not allowed")

	// Handler should have been called
	assert.True(t, handlerCalled, "security violation handler should have been called")
	assert.Equal(t, "secret-database-password", capturedViolation.RequestedKey)
}

func TestSecurityViolationHandler_NotCalledForAllowedKey(t *testing.T) {
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

	executionID := "exec-no-violation"
	server.SetAllowedKeys(executionID, []string{"allowed-key"})

	// Track if handler was called
	var handlerCalled bool

	server.SetSecurityViolationHandler(func(v SecurityViolation) {
		handlerCalled = true
	})

	ctx := context.Background()
	req := &workerv1.GetVariableRequest{
		ExecutionId: executionID,
		Key:         "allowed-key",
	}

	mockStore.On("Read", mock.Anything, "allowed-key").Return([]any{"value"}, nil)

	resp, err := server.GetVariable(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)

	// Handler should NOT have been called
	assert.False(t, handlerCalled, "security violation handler should NOT have been called for allowed key")
}

func TestSecurityViolationHandler_NotSetDoesNotPanic(t *testing.T) {
	// Ensure that if no handler is set, requesting a disallowed key still fails gracefully
	logger := zap.NewNop()
	mockStore := mockstore.NewStore(t)

	server := NewVariableStoreGRPC(
		WithKvStore(mockStore),
		WithServer(grpc.NewServer()),
		WithLogger(logger),
		WithPort(50050),
	)

	executionID := "exec-no-handler"
	server.SetAllowedKeys(executionID, []string{"allowed-key"})

	// Deliberately NOT setting a handler

	ctx := context.Background()
	req := &workerv1.GetVariableRequest{
		ExecutionId: executionID,
		Key:         "disallowed-key",
	}

	// Should not panic, just return error
	resp, err := server.GetVariable(ctx, req)

	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "key not allowed")
}
