package plugin_executor

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"workers/ephemeral/task-manager/internal/plugin"

	"github.com/superblocksteam/agent/pkg/store"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

// mockStore implements store.Store for testing
type mockStore struct {
	data map[string]any
}

func newMockStore() *mockStore {
	return &mockStore{data: make(map[string]any)}
}

func (m *mockStore) Read(ctx context.Context, keys ...string) ([]any, error) {
	result := make([]any, len(keys))
	for i, key := range keys {
		result[i] = m.data[key]
	}
	return result, nil
}

func (m *mockStore) Write(ctx context.Context, kvs ...*store.KV) error {
	for _, kv := range kvs {
		m.data[kv.Key] = kv.Value
	}
	return nil
}

func (m *mockStore) Delete(ctx context.Context, keys ...string) error {
	for _, key := range keys {
		delete(m.data, key)
	}
	return nil
}

func (m *mockStore) Expire(ctx context.Context, ttl time.Duration, keys ...string) error {
	return nil
}

func (m *mockStore) Decr(ctx context.Context, key string) error {
	return nil
}

func (m *mockStore) Copy(ctx context.Context, src, dst string) error {
	m.data[dst] = m.data[src]
	return nil
}

func (m *mockStore) Scan(ctx context.Context, pattern string) ([]string, error) {
	var result []string
	for k := range m.data {
		result = append(result, k)
	}
	return result, nil
}

func (m *mockStore) Key(prefix, suffix string) (string, error) {
	return prefix + "." + suffix, nil
}

// Verify mockStore implements Store interface
var _ store.Store = (*mockStore)(nil)

// mockPlugin implements plugin.Plugin for testing
type mockPlugin struct {
	name         string
	executeFunc  func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error)
	streamFunc   func(ctx context.Context, props *transportv1.Request_Data_Data_Props, send func(message any), until func()) error
	metadataFunc func(ctx context.Context, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) (*transportv1.Response_Data_Data, error)
	testFunc     func(ctx context.Context, datasourceConfig *structpb.Struct) error
	preDeleteFn  func(ctx context.Context, datasourceConfig *structpb.Struct) error
}

func (m *mockPlugin) Name() string {
	return m.name
}

func (m *mockPlugin) Execute(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
	if m.executeFunc != nil {
		return m.executeFunc(ctx, props)
	}
	return &apiv1.Output{}, nil
}

func (m *mockPlugin) Stream(ctx context.Context, props *transportv1.Request_Data_Data_Props, send func(message any), until func()) error {
	if m.streamFunc != nil {
		return m.streamFunc(ctx, props, send, until)
	}
	return nil
}

func (m *mockPlugin) Metadata(ctx context.Context, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) (*transportv1.Response_Data_Data, error) {
	if m.metadataFunc != nil {
		return m.metadataFunc(ctx, datasourceConfig, actionConfig)
	}
	return &transportv1.Response_Data_Data{}, nil
}

func (m *mockPlugin) Test(ctx context.Context, datasourceConfig *structpb.Struct) error {
	if m.testFunc != nil {
		return m.testFunc(ctx, datasourceConfig)
	}
	return nil
}

func (m *mockPlugin) PreDelete(ctx context.Context, datasourceConfig *structpb.Struct) error {
	if m.preDeleteFn != nil {
		return m.preDeleteFn(ctx, datasourceConfig)
	}
	return nil
}

func (m *mockPlugin) Close() {
	// No-op for tests
}

// Verify mockPlugin implements Plugin interface
var _ plugin.Plugin = (*mockPlugin)(nil)

// newTestExecutor creates a plugin executor with mocked dependencies for testing
func newTestExecutor(language string) PluginExecutor {
	return NewPluginExecutor(&Options{
		Logger:   zap.NewNop(),
		Language: language,
		Store:    newMockStore(),
	})
}

func TestNewPluginExecutor(t *testing.T) {
	executor := newTestExecutor("python")

	if executor == nil {
		t.Fatal("NewPluginExecutor returned nil")
	}

	// Check that it returns correct type
	_, ok := executor.(*pluginExecutor)
	if !ok {
		t.Error("NewPluginExecutor should return *pluginExecutor")
	}
}

func TestRegisterPlugin(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{name: "test-plugin"}
	err := executor.RegisterPlugin("test", mock)

	if err != nil {
		t.Errorf("RegisterPlugin() error = %v", err)
	}

	plugins := executor.ListPlugins()
	if len(plugins) != 1 {
		t.Errorf("ListPlugins() = %d plugins, want 1", len(plugins))
	}
	if plugins[0] != "test" {
		t.Errorf("ListPlugins()[0] = %v, want 'test'", plugins[0])
	}
}

func TestRegisterMultiplePlugins(t *testing.T) {
	executor := newTestExecutor("python")

	executor.RegisterPlugin("python", &mockPlugin{name: "python"})
	executor.RegisterPlugin("javascript", &mockPlugin{name: "javascript"})
	executor.RegisterPlugin("go", &mockPlugin{name: "go"})

	plugins := executor.ListPlugins()
	if len(plugins) != 3 {
		t.Errorf("ListPlugins() = %d plugins, want 3", len(plugins))
	}
}

func TestListPluginsEmpty(t *testing.T) {
	executor := newTestExecutor("python")

	plugins := executor.ListPlugins()
	if len(plugins) != 0 {
		t.Errorf("ListPlugins() = %d plugins, want 0", len(plugins))
	}
}

func TestExecuteSuccess(t *testing.T) {
	executor := newTestExecutor("python")

	expectedOutput := &apiv1.Output{
		Stdout: []string{"hello world"},
	}

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return expectedOutput, nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	result, err := executor.Execute(ctx, "python", props, nil, nil)

	if err != nil {
		t.Errorf("Execute() error = %v", err)
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
	// Result should not have an error
	if result.Err != nil {
		t.Errorf("Execute() result has error: %v", result.Err)
	}
}

func TestExecuteWithError(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return nil, errors.New("execution failed")
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	result, err := executor.Execute(ctx, "python", props, nil, nil)

	// Execute stores error in result.Err and returns nil when output is stored successfully
	if err != nil {
		t.Errorf("Execute() should not return error directly, got %v", err)
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
	// Error should be stored in result.Err
	if result.Err == nil {
		t.Error("Execute() result should have error in Err field")
	}
}

func TestExecuteUnknownPlugin(t *testing.T) {
	executor := newTestExecutor("python")

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.Execute(ctx, "unknown", props, nil, nil)

	if err == nil {
		t.Error("Execute() should return error for unknown plugin")
	}
}

func TestExecuteLanguageMismatch(t *testing.T) {
	executor := newTestExecutor("python") // This executor only handles python

	mock := &mockPlugin{name: "javascript"}
	executor.RegisterPlugin("javascript", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.Execute(ctx, "javascript", props, nil, nil)

	if err == nil {
		t.Error("Execute() should return error for language mismatch")
	}
}

func TestExecuteWithQuota(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return &apiv1.Output{}, nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}
	quota := &transportv1.Request_Data_Data_Quota{
		Duration: 5000, // 5 seconds
	}

	result, err := executor.Execute(ctx, "python", props, quota, nil)

	if err != nil {
		t.Errorf("Execute() error = %v", err)
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
}

func TestExecuteWithPerformance(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return &apiv1.Output{}, nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}
	perf := &transportv1.Performance{}

	_, err := executor.Execute(ctx, "python", props, nil, perf)

	if err != nil {
		t.Errorf("Execute() error = %v", err)
	}

	// Performance should be populated
	if perf.PluginExecution == nil {
		t.Error("Performance.PluginExecution should be set")
	}
}

func TestStreamUnknownPlugin(t *testing.T) {
	executor := newTestExecutor("python")

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	err := executor.Stream(ctx, "unknown", props, nil, nil, nil)

	if err == nil {
		t.Error("Stream() should return error for unknown plugin")
	}
}

func TestStreamSuccess(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		streamFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props, send func(message any), until func()) error {
			return nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	err := executor.Stream(ctx, "python", props, nil, nil, nil)

	if err != nil {
		t.Errorf("Stream() error = %v", err)
	}
}

func TestMetadataUnknownPlugin(t *testing.T) {
	executor := newTestExecutor("python")

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.Metadata(ctx, "unknown", props, nil)

	if err == nil {
		t.Error("Metadata() should return error for unknown plugin")
	}
}

func TestMetadataSuccess(t *testing.T) {
	executor := newTestExecutor("python")

	expectedResult := &transportv1.Response_Data_Data{
		Key: "metadata-key",
	}

	mock := &mockPlugin{
		name: "python",
		metadataFunc: func(ctx context.Context, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) (*transportv1.Response_Data_Data, error) {
			return expectedResult, nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	result, err := executor.Metadata(ctx, "python", props, nil)

	if err != nil {
		t.Errorf("Metadata() error = %v", err)
	}
	if result == nil {
		t.Fatal("Metadata() returned nil result")
	}
}

func TestTestUnknownPlugin(t *testing.T) {
	executor := newTestExecutor("python")

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.Test(ctx, "unknown", props, nil)

	if err == nil {
		t.Error("Test() should return error for unknown plugin")
	}
}

func TestTestSuccess(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		testFunc: func(ctx context.Context, datasourceConfig *structpb.Struct) error {
			return nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	result, err := executor.Test(ctx, "python", props, nil)

	if err != nil {
		t.Errorf("Test() error = %v", err)
	}
	if result == nil {
		t.Fatal("Test() returned nil result")
	}
}

func TestTestWithError(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		testFunc: func(ctx context.Context, datasourceConfig *structpb.Struct) error {
			return errors.New("test failed")
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.Test(ctx, "python", props, nil)

	if err == nil {
		t.Error("Test() should return error when plugin test fails")
	}
}

func TestPreDeleteUnknownPlugin(t *testing.T) {
	executor := newTestExecutor("python")

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.PreDelete(ctx, "unknown", props, nil)

	if err == nil {
		t.Error("PreDelete() should return error for unknown plugin")
	}
}

func TestPreDeleteSuccess(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		preDeleteFn: func(ctx context.Context, datasourceConfig *structpb.Struct) error {
			return nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	// PreDelete always returns nil, nil
	_, err := executor.PreDelete(ctx, "python", props, nil)

	if err != nil {
		t.Errorf("PreDelete() error = %v", err)
	}
}

func TestExecuteWithNilOutput(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return nil, nil // Return nil output, no error
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	result, err := executor.Execute(ctx, "python", props, nil, nil)

	if err != nil {
		t.Errorf("Execute() error = %v", err)
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
}

func TestExecuteWithStdoutStderr(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return &apiv1.Output{
				Stdout: []string{"stdout line 1", "stdout line 2"},
				Stderr: []string{"stderr line 1"},
			}, nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	result, err := executor.Execute(ctx, "python", props, nil, nil)

	if err != nil {
		t.Errorf("Execute() error = %v", err)
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
}

func TestExecuteWithStdoutStderrAndError(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return &apiv1.Output{
				Stdout: []string{"output"},
				Stderr: []string{"error output"},
			}, errors.New("execution error")
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	result, err := executor.Execute(ctx, "python", props, nil, nil)

	// Execute stores error in result.Err and returns nil when output is stored successfully
	if err != nil {
		t.Errorf("Execute() should not return error directly, got %v", err)
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
	// Error should be stored in result.Err
	if result.Err == nil {
		t.Error("Execute() result should have error in Err field")
	}
}

func TestExecuteWithDeadlineExceeded(t *testing.T) {
	executor := newTestExecutor("python")

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return &apiv1.Output{
				Stdout: []string{"should be cleared"},
				Stderr: []string{"should be cleared"},
			}, context.DeadlineExceeded
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	result, err := executor.Execute(ctx, "python", props, nil, nil)

	// DeadlineExceeded should be converted to DurationQuotaError and stored in result.Err
	if err != nil {
		t.Errorf("Execute() should not return error directly, got %v", err)
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
	// Error should be stored in result.Err
	if result.Err == nil {
		t.Error("Execute() result should have DurationQuotaError in Err field")
	}
	if result.Err != nil && result.Err.Message != "DurationQuotaError" {
		t.Errorf("Execute() result.Err.Message = %v, want DurationQuotaError", result.Err.Message)
	}
}

func TestStreamWithError(t *testing.T) {
	executor := newTestExecutor("python")

	expectedErr := errors.New("stream error")
	mock := &mockPlugin{
		name: "python",
		streamFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props, send func(message any), until func()) error {
			return expectedErr
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	err := executor.Stream(ctx, "python", props, nil, nil, nil)

	if err != expectedErr {
		t.Errorf("Stream() error = %v, want %v", err, expectedErr)
	}
}

func TestMetadataWithError(t *testing.T) {
	executor := newTestExecutor("python")

	expectedErr := errors.New("metadata error")
	mock := &mockPlugin{
		name: "python",
		metadataFunc: func(ctx context.Context, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) (*transportv1.Response_Data_Data, error) {
			return nil, expectedErr
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.Metadata(ctx, "python", props, nil)

	if err != expectedErr {
		t.Errorf("Metadata() error = %v, want %v", err, expectedErr)
	}
}

// ============================================================================
// Tests for KV Store functionality (critical for end-to-end behavior)
// ============================================================================

func TestExecuteStoresOutputInKVStore(t *testing.T) {
	mockStore := newMockStore()
	executor := NewPluginExecutor(&Options{
		Logger:   zap.NewNop(),
		Language: "python",
		Store:    mockStore,
	})

	expectedResult := "hello world"
	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return &apiv1.Output{
				Result: structpb.NewStringValue(expectedResult),
			}, nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{
		ExecutionId: "test-exec-123",
	}

	result, err := executor.Execute(ctx, "python", props, nil, nil)

	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}

	// Verify key is set and follows expected format
	if result.Key == "" {
		t.Fatal("Execute() result.Key should not be empty")
	}
	if !strings.HasPrefix(result.Key, "test-exec-123.output.") {
		t.Errorf("Execute() result.Key = %v, should start with 'test-exec-123.output.'", result.Key)
	}

	// Verify output was stored in the mock store
	if len(mockStore.data) == 0 {
		t.Fatal("Execute() should store output in KV store")
	}

	storedValue, exists := mockStore.data[result.Key]
	if !exists {
		t.Fatalf("Execute() output not found in store with key %s", result.Key)
	}

	// Verify the stored value contains the output
	storedStr, ok := storedValue.(string)
	if !ok {
		t.Fatalf("Stored value should be a string, got %T", storedValue)
	}
	if !strings.Contains(storedStr, expectedResult) {
		t.Errorf("Stored value should contain %q, got %s", expectedResult, storedStr)
	}
}

func TestExecuteKeyIsUnique(t *testing.T) {
	mockStore := newMockStore()
	executor := NewPluginExecutor(&Options{
		Logger:   zap.NewNop(),
		Language: "python",
		Store:    mockStore,
	})

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return &apiv1.Output{}, nil
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{
		ExecutionId: "test-exec-123",
	}

	// Execute twice with the same execution ID
	result1, err1 := executor.Execute(ctx, "python", props, nil, nil)
	result2, err2 := executor.Execute(ctx, "python", props, nil, nil)

	if err1 != nil || err2 != nil {
		t.Fatalf("Execute() errors: %v, %v", err1, err2)
	}

	// Keys should be different (unique UUID suffix)
	if result1.Key == result2.Key {
		t.Error("Execute() should generate unique keys for each execution")
	}

	// Both should be in the store
	if len(mockStore.data) != 2 {
		t.Errorf("Expected 2 entries in store, got %d", len(mockStore.data))
	}
}

func TestExecuteWithErrorStillStoresOutput(t *testing.T) {
	mockStore := newMockStore()
	executor := NewPluginExecutor(&Options{
		Logger:   zap.NewNop(),
		Language: "python",
		Store:    mockStore,
	})

	mock := &mockPlugin{
		name: "python",
		executeFunc: func(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
			return &apiv1.Output{
				Stderr: []string{"error occurred"},
			}, errors.New("execution failed")
		},
	}

	executor.RegisterPlugin("python", mock)

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{
		ExecutionId: "test-exec-error",
	}

	result, err := executor.Execute(ctx, "python", props, nil, nil)

	// Error should be in result.Err, not returned
	if err != nil {
		t.Errorf("Execute() should not return error directly, got %v", err)
	}
	if result.Err == nil {
		t.Error("Execute() result.Err should be set")
	}

	// Key should still be set
	if result.Key == "" {
		t.Error("Execute() result.Key should be set even on error")
	}

	// Output should still be stored
	if len(mockStore.data) == 0 {
		t.Error("Execute() should store output even when there's an error")
	}
}
