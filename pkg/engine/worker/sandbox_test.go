package worker

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	pkgengine "github.com/superblocksteam/agent/pkg/engine"
	storemock "github.com/superblocksteam/agent/pkg/store/mock"
	"github.com/superblocksteam/agent/pkg/worker"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

// outputJSON builds a JSON string in the format the JS worker actually writes to the
// KV store. The worker uses the legacy "output" field name (matching OutputOld in
// event.pb.go), not the proto "result" field name. The custom Output.UnmarshalJSON
// codec (in types/gen/go/api/v1/codec.go) maps "output" → Result.
func outputJSON(t *testing.T, result *structpb.Value) string {
	t.Helper()
	if result == nil {
		return `{"output":null}`
	}
	resultJSON, err := result.MarshalJSON()
	require.NoError(t, err)
	return fmt.Sprintf(`{"output":%s}`, string(resultJSON))
}

// setupMocks creates mock worker and store, and wires them into an Options struct.
// The worker mock expects an Execute call for "javascriptwasm" and returns the given storeKey.
// The store mock expects a Read call for that storeKey and returns the given storeValue.
func setupMocks(t *testing.T, storeKey string, storeValue string) (*worker.MockClient, *storemock.Store, *Options) {
	t.Helper()
	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Return((*transportv1.Performance)(nil), storeKey, nil)

	mockStore.On("Read", mock.Anything, storeKey).
		Return([]interface{}{storeValue}, nil)

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
	}

	return mockWorker, mockStore, opts
}

// setupMocksCapture is like setupMocks but captures the Request_Data_Data passed to Execute
// so tests can inspect the generated JavaScript code.
func setupMocksCapture(t *testing.T, storeKey string, storeValue string) (*worker.MockClient, *storemock.Store, *Options, *transportv1.Request_Data_Data) {
	t.Helper()
	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	var captured *transportv1.Request_Data_Data

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Run(func(args mock.Arguments) {
			captured = args.Get(2).(*transportv1.Request_Data_Data)
		}).
		Return((*transportv1.Performance)(nil), storeKey, nil)

	mockStore.On("Read", mock.Anything, storeKey).
		Return([]interface{}{storeValue}, nil)

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
	}

	return mockWorker, mockStore, opts, captured
}

func TestSandboxEngineClose(t *testing.T) {
	t.Parallel()
	s := Sandbox(&Options{})
	e, err := s.Engine(context.Background())
	require.NoError(t, err)
	require.NotNil(t, e)

	// Close should not panic.
	e.Close()
	s.Close()
}

func TestFailed(t *testing.T) {
	t.Parallel()
	s := Sandbox(&Options{})
	e, _ := s.Engine(context.Background())

	expectedErr := errors.New("something broke")
	v := e.Failed(expectedErr)

	result, err := v.Result()
	assert.Nil(t, result)
	assert.ErrorIs(t, err, expectedErr)

	j, err := v.JSON()
	assert.Equal(t, "", j)
	assert.ErrorIs(t, err, expectedErr)

	assert.ErrorIs(t, v.Err(), expectedErr)
	assert.Nil(t, v.Console())
}

func TestResultBoolean(t *testing.T) {
	t.Parallel()
	_, _, opts := setupMocks(t, "key-bool", outputJSON(t, structpb.NewBoolValue(true)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ true }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, true, result)
}

func TestResultBooleanFalse(t *testing.T) {
	t.Parallel()
	_, _, opts := setupMocks(t, "key-bool-f", outputJSON(t, structpb.NewBoolValue(false)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ false }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, false, result)
}

func TestResultString(t *testing.T) {
	t.Parallel()
	_, _, opts := setupMocks(t, "key-str", outputJSON(t, structpb.NewStringValue("hello")))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 'hello' }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, "hello", result)
}

func TestResultInt32(t *testing.T) {
	t.Parallel()
	_, _, opts := setupMocks(t, "key-int", outputJSON(t, structpb.NewNumberValue(42)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 42 }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, int32(42), result)
}

func TestResultFloat(t *testing.T) {
	t.Parallel()
	_, _, opts := setupMocks(t, "key-float", outputJSON(t, structpb.NewNumberValue(3.14)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 3.14 }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, 3.14, result)
}

func TestResultNegativeInt(t *testing.T) {
	t.Parallel()
	_, _, opts := setupMocks(t, "key-neg", outputJSON(t, structpb.NewNumberValue(-5)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ -5 }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, int32(-5), result)
}

func TestResultNull(t *testing.T) {
	t.Parallel()
	_, _, opts := setupMocks(t, "key-null", outputJSON(t, structpb.NewNullValue()))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ null }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Nil(t, result)
}

func TestResultNilOutput(t *testing.T) {
	t.Parallel()
	// Simulate worker returning an output with no result field.
	_, _, opts := setupMocks(t, "key-nil", outputJSON(t, nil))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ undefined }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Nil(t, result)
}

func TestResultArrayOfStrings(t *testing.T) {
	t.Parallel()
	listVal, _ := structpb.NewList([]interface{}{"one", "two", "three"})
	_, _, opts := setupMocks(t, "key-arr-str", outputJSON(t, structpb.NewListValue(listVal)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ ['one', 'two', 'three'] }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, []string{"one", "two", "three"}, result)
}

func TestResultArrayOfNumbers(t *testing.T) {
	t.Parallel()
	listVal, _ := structpb.NewList([]interface{}{float64(1), float64(2), float64(3)})
	_, _, opts := setupMocks(t, "key-arr-num", outputJSON(t, structpb.NewListValue(listVal)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ [1, 2, 3] }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, []string{"1", "2", "3"}, result)
}

func TestResultArrayWithJSONEncodeItems(t *testing.T) {
	t.Parallel()
	listVal, _ := structpb.NewList([]interface{}{"one", "two"})
	_, _, opts := setupMocks(t, "key-arr-enc", outputJSON(t, structpb.NewListValue(listVal)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ ['one', 'two'] }}", nil)

	result, err := v.Result(pkgengine.WithJSONEncodeArrayItems())
	require.NoError(t, err)
	// With JSONEncodeArrayItems, string items are JSON-encoded (i.e. quoted).
	assert.Equal(t, []string{`"one"`, `"two"`}, result)
}

func TestResultArrayWithNullItems(t *testing.T) {
	t.Parallel()
	listVal, _ := structpb.NewList([]interface{}{nil, nil})
	_, _, opts := setupMocks(t, "key-arr-null", outputJSON(t, structpb.NewListValue(listVal)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ [null, null] }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, []string{"", ""}, result)
}

func TestResultJSON(t *testing.T) {
	t.Parallel()
	mapVal, _ := structpb.NewStruct(map[string]interface{}{"foo": "bar", "n": float64(1)})
	_, _, opts := setupMocks(t, "key-json", outputJSON(t, structpb.NewStructValue(mapVal)))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ {foo: 'bar', n: 1} }}", nil)

	j, err := v.JSON()
	require.NoError(t, err)

	// Parse and compare to avoid key-ordering issues.
	var parsed map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(j), &parsed))
	assert.Equal(t, "bar", parsed["foo"])
	assert.Equal(t, float64(1), parsed["n"])
}

func TestResultJSONNull(t *testing.T) {
	t.Parallel()
	_, _, opts := setupMocks(t, "key-json-null", outputJSON(t, nil))

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ undefined }}", nil)

	j, err := v.JSON()
	require.NoError(t, err)
	assert.Equal(t, "null", j)
}

func TestMustacheUnwrapping(t *testing.T) {
	t.Parallel()

	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	var capturedData *transportv1.Request_Data_Data

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Run(func(args mock.Arguments) {
			capturedData = args.Get(2).(*transportv1.Request_Data_Data)
		}).
		Return((*transportv1.Performance)(nil), "key-unwrap", nil)

	mockStore.On("Read", mock.Anything, "key-unwrap").
		Return([]interface{}{outputJSON(t, structpb.NewNumberValue(42))}, nil)

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
	}

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 40 + 2 }}", nil)

	_, err := v.Result()
	require.NoError(t, err)

	// The body sent to the worker should have the mustache delimiters stripped.
	body := capturedData.Props.ActionConfiguration.Fields["body"].GetStringValue()
	assert.Equal(t, "return 40 + 2", body)
}

func TestAsBooleanWrapsWithDoubleNegation(t *testing.T) {
	t.Parallel()

	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	var capturedData *transportv1.Request_Data_Data

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Run(func(args mock.Arguments) {
			capturedData = args.Get(2).(*transportv1.Request_Data_Data)
		}).
		Return((*transportv1.Performance)(nil), "key-asbool", nil)

	mockStore.On("Read", mock.Anything, "key-asbool").
		Return([]interface{}{outputJSON(t, structpb.NewBoolValue(true))}, nil)

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
	}

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 1 }}", nil)

	result, err := v.Result(pkgengine.WithAsBoolean())
	require.NoError(t, err)
	assert.Equal(t, true, result)

	// Verify the expression was wrapped in !!()
	body := capturedData.Props.ActionConfiguration.Fields["body"].GetStringValue()
	assert.Equal(t, "return !!(1)", body)
}

func TestWithoutAsBooleanNoWrapping(t *testing.T) {
	t.Parallel()

	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	var capturedData *transportv1.Request_Data_Data

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Run(func(args mock.Arguments) {
			capturedData = args.Get(2).(*transportv1.Request_Data_Data)
		}).
		Return((*transportv1.Performance)(nil), "key-nobool", nil)

	mockStore.On("Read", mock.Anything, "key-nobool").
		Return([]interface{}{outputJSON(t, structpb.NewNumberValue(1))}, nil)

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
	}

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 1 }}", nil)

	_, err := v.Result()
	require.NoError(t, err)

	// Without AsBoolean, no !!() wrapping.
	body := capturedData.Props.ActionConfiguration.Fields["body"].GetStringValue()
	assert.Equal(t, "return 1", body)
}

func TestWorkerExecuteError(t *testing.T) {
	t.Parallel()

	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Return((*transportv1.Performance)(nil), "", errors.New("worker exploded"))

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
	}

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 1 }}", nil)

	result, err := v.Result()
	assert.Nil(t, result)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "binding evaluation failed")
	assert.Contains(t, err.Error(), "worker exploded")
}

func TestStoreReadError(t *testing.T) {
	t.Parallel()

	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Return((*transportv1.Performance)(nil), "key-store-err", nil)

	mockStore.On("Read", mock.Anything, "key-store-err").
		Return([]interface{}(nil), errors.New("redis down"))

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
	}

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 1 }}", nil)

	result, err := v.Result()
	assert.Nil(t, result)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to read result from store")
}

func TestStoreReadEmptyResult(t *testing.T) {
	t.Parallel()

	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Return((*transportv1.Performance)(nil), "key-empty", nil)

	mockStore.On("Read", mock.Anything, "key-empty").
		Return([]interface{}{}, nil)

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
	}

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 1 }}", nil)

	result, err := v.Result()
	require.NoError(t, err)
	assert.Nil(t, result)
}

func TestCtxFuncIsApplied(t *testing.T) {
	t.Parallel()

	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	customCtx := context.WithValue(context.Background(), ctxKeyForTest("custom"), "value")

	var capturedCtx context.Context

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Run(func(args mock.Arguments) {
			capturedCtx = args.Get(0).(context.Context)
		}).
		Return((*transportv1.Performance)(nil), "key-ctx", nil)

	mockStore.On("Read", mock.Anything, "key-ctx").
		Return([]interface{}{outputJSON(t, structpb.NewNumberValue(1))}, nil)

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
		CtxFunc: func(_ context.Context) context.Context {
			return customCtx
		},
	}

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 1 }}", nil)

	_, err := v.Result()
	require.NoError(t, err)

	// The context passed to Execute should be the one returned by CtxFunc.
	assert.Equal(t, "value", capturedCtx.Value(ctxKeyForTest("custom")))
}

type ctxKeyForTest string

func TestPluginNameIsJavascriptwasm(t *testing.T) {
	t.Parallel()

	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	var capturedPlugin string

	mockWorker.On("Execute", mock.Anything, mock.AnythingOfType("string"), mock.Anything).
		Run(func(args mock.Arguments) {
			capturedPlugin = args.Get(1).(string)
		}).
		Return((*transportv1.Performance)(nil), "key-plugin", nil)

	mockStore.On("Read", mock.Anything, "key-plugin").
		Return([]interface{}{outputJSON(t, structpb.NewNumberValue(1))}, nil)

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "test-exec-id",
		FileServerURL: "http://localhost:8080",
	}

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 1 }}", nil)

	_, err := v.Result()
	require.NoError(t, err)
	assert.Equal(t, "javascriptwasm", capturedPlugin)
}

func TestRequestPropsAreCorrect(t *testing.T) {
	t.Parallel()

	mockWorker := worker.NewMockClient(t)
	mockStore := storemock.NewStore(t)

	var capturedData *transportv1.Request_Data_Data

	mockWorker.On("Execute", mock.Anything, "javascriptwasm", mock.Anything).
		Run(func(args mock.Arguments) {
			capturedData = args.Get(2).(*transportv1.Request_Data_Data)
		}).
		Return((*transportv1.Performance)(nil), "key-props", nil)

	mockStore.On("Read", mock.Anything, "key-props").
		Return([]interface{}{outputJSON(t, structpb.NewNumberValue(1))}, nil)

	opts := &Options{
		Worker:        mockWorker,
		Store:         mockStore,
		ExecutionID:   "my-exec-123",
		FileServerURL: "http://files.example.com",
	}

	s := Sandbox(opts)
	e, _ := s.Engine(context.Background())
	v := e.Resolve(context.Background(), "{{ 1 + 2 }}", nil)

	_, err := v.Result()
	require.NoError(t, err)

	props := capturedData.Props
	assert.Equal(t, "my-exec-123", props.ExecutionId)
	assert.Equal(t, "__binding_eval", props.StepName)
	assert.Equal(t, "http://files.example.com", props.FileServerUrl)
	assert.Equal(t, false, props.Render)
	assert.Equal(t, "v2", props.Version)
}
