package plugin_executor

import (
	"context"
	"errors"
	"testing"

	"workers/ephemeral/task-manager/internal/plugin"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

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

// Verify mockPlugin implements Plugin interface
var _ plugin.Plugin = (*mockPlugin)(nil)

func TestNewPluginExecutor(t *testing.T) {
	logger := zap.NewNop()
	opts := &Options{
		Logger:   logger,
		Language: "python",
	}

	executor := NewPluginExecutor(opts)

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

	executor.RegisterPlugin("python", &mockPlugin{name: "python"})
	executor.RegisterPlugin("javascript", &mockPlugin{name: "javascript"})
	executor.RegisterPlugin("go", &mockPlugin{name: "go"})

	plugins := executor.ListPlugins()
	if len(plugins) != 3 {
		t.Errorf("ListPlugins() = %d plugins, want 3", len(plugins))
	}
}

func TestListPluginsEmpty(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

	plugins := executor.ListPlugins()
	if len(plugins) != 0 {
		t.Errorf("ListPlugins() = %d plugins, want 0", len(plugins))
	}
}

func TestExecuteSuccess(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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

	// Execute should return error directly for consistent error handling
	if err == nil {
		t.Error("Execute() should return error directly")
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
}

func TestExecuteUnknownPlugin(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.Execute(ctx, "unknown", props, nil, nil)

	if err == nil {
		t.Error("Execute() should return error for unknown plugin")
	}
}

func TestExecuteLanguageMismatch(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{
		Logger:   logger,
		Language: "python", // This executor only handles python
	})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	err := executor.Stream(ctx, "unknown", props, nil, nil, nil)

	if err == nil {
		t.Error("Stream() should return error for unknown plugin")
	}
}

func TestStreamSuccess(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.Metadata(ctx, "unknown", props, nil)

	if err == nil {
		t.Error("Metadata() should return error for unknown plugin")
	}
}

func TestMetadataSuccess(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.Test(ctx, "unknown", props, nil)

	if err == nil {
		t.Error("Test() should return error for unknown plugin")
	}
}

func TestTestSuccess(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

	ctx := context.Background()
	props := &transportv1.Request_Data_Data_Props{}

	_, err := executor.PreDelete(ctx, "unknown", props, nil)

	if err == nil {
		t.Error("PreDelete() should return error for unknown plugin")
	}
}

func TestPreDeleteSuccess(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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

	// Error should be returned directly for consistent error handling
	if err == nil {
		t.Error("Execute() should return error directly")
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
}

func TestExecuteWithDeadlineExceeded(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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

	// DeadlineExceeded should be converted to DurationQuotaError and returned
	if err == nil {
		t.Error("Execute() should return DurationQuotaError")
	}
	if err != nil && err.Error() != "DurationQuotaError" {
		t.Errorf("Execute() should return DurationQuotaError, got %v", err)
	}
	if result == nil {
		t.Fatal("Execute() returned nil result")
	}
}

func TestStreamWithError(t *testing.T) {
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
	logger := zap.NewNop()
	executor := NewPluginExecutor(&Options{Logger: logger, Language: "python"})

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
