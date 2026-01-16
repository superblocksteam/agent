package plugin_executor_test

import (
	"context"
	"errors"
	"sort"
	"testing"

	. "workers/golang/internal/plugin_executor"
	mocks "workers/golang/mocks/internal_/plugin"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/constants"
	commonErr "github.com/superblocksteam/agent/pkg/errors"
	mockStore "github.com/superblocksteam/agent/pkg/store/mock"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.opentelemetry.io/otel/propagation"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
	"google.golang.org/protobuf/types/known/structpb"
)

func registerPlugins(t *testing.T, pe PluginExecutor) {
	mockPlugin := mocks.NewPlugin(t)
	pe.RegisterPlugin("postgres", mockPlugin)
	mockPlugin.On(
		"Execute",
		mock.Anything,
		mock.Anything,
		mock.Anything,
		mock.Anything,
		mock.Anything,
	).Return(&workerv1.ExecuteResponse{Output: &apiv1.OutputOld{Output: structpb.NewStringValue("ex result")}}, nil)
}

func structuredLogsFromOutput(output *apiv1.Output) []*workerv1.StructuredLog {
	var structuredLogs []*workerv1.StructuredLog
	for _, log := range output.GetStdout() {
		structuredLogs = append(structuredLogs, &workerv1.StructuredLog{
			Level:   workerv1.StructuredLog_LEVEL_INFO,
			Message: log,
		})
	}
	for _, log := range output.GetStderr() {
		structuredLogs = append(structuredLogs, &workerv1.StructuredLog{
			Level:   workerv1.StructuredLog_LEVEL_ERROR,
			Message: log,
		})
	}

	return structuredLogs
}

func TestExecute(t *testing.T) {
	for _, tt := range []struct {
		name        string
		req         *transportv1.Request_Data_Data
		perf        *transportv1.Performance
		resp        *transportv1.Response_Data_Data
		expectedErr error
	}{
		{
			name: "happy path",
			req: &transportv1.Request_Data_Data{Props: &transportv1.Request_Data_Data_Props{ActionConfiguration: &structpb.Struct{Fields: map[string]*structpb.Value{
				"pluginId": structpb.NewStringValue("postgres"),
			}}, ExecutionId: "eid"}, Quotas: &transportv1.Request_Data_Data_Quota{Size: 10, Duration: 1000000}},
			perf:        nil,
			resp:        nil,
			expectedErr: nil,
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			// redisClient, redisClientMock := redismock.NewClientMock()
			// kvStore := store.Redis(redisClient)
			// pluginExecutor := NewPluginExecutor(NewOptions(WithLogger(zap.NewNop()), WithKvStore(kvStore)))
			// registerPlugins(t, pluginExecutor)
			// // redisClientMock.ExpectMGet("foobar.context.global.foo", "foobar.context.output.bar", "myKey1").SetVal([]interface{}{"foo", "bar", "myValue"})
			// // redisClientMock.ExpectTxPipeline()
			// // // redisClientMock.ExpectGet("key").SetVal("value")
			// // // redisClientMock.ExpectSet("foo", &apiv1.Output{Result: structpb.NewStringValue("ex result")}, 1000000).SetVal("OK")
			// // redisClientMock.ExpectSet(mock.Anything, mock.Anything, 1)

			// // pipe = db.TxPipeline()
			// // pipe.Get(ctx, "key")
			// // pipe.Set(ctx, "key", "value", 1)
			// // pipe.Exec(ctx)
			// resp, err := pluginExecutor.Execute(tt.req, tt.perf)
			// assert.Equal(t, resp, tt.resp)
			// if tt.expectedErr != nil {
			// 	assert.Equal(t, tt.expectedErr, err)
			// } else {
			// 	assert.Nil(t, err)
			// }
		})
	}
}

func TestExecute_LogsExecutionLogsAndErrors(t *testing.T) {
	testCases := []struct {
		name         string
		carrier      map[string]string
		apiOutput    *apiv1.Output
		pluginError  error
		storeError   error
		expectedLogs map[zapcore.Level][]observer.LoggedEntry
	}{
		{
			name: "no logs, no errors",
			carrier: map[string]string{
				"baggage": "id=api1,env=staging;shadow=true",
			},
			expectedLogs: map[zapcore.Level][]observer.LoggedEntry{},
		},
		{
			name: "logs with baggage data, no errors",
			carrier: map[string]string{
				"baggage": "id=api1,env=staging;shadow=true",
			},
			apiOutput: &apiv1.Output{
				Stdout: []string{
					"Step 1 started",
					"Step 2 started",
					"Step 1 completed",
				},
				Stderr: []string{
					"Step 2 failed",
				},
			},
			expectedLogs: map[zapcore.Level][]observer.LoggedEntry{
				zap.InfoLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Step 1 started",
							Level:   zap.InfoLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
							zap.String("id", "api1"),
							zap.String("env", "staging"),
						},
					},
					{
						Entry: zapcore.Entry{
							Message: "Step 2 started",
							Level:   zap.InfoLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
							zap.String("id", "api1"),
							zap.String("env", "staging"),
						},
					},
					{
						Entry: zapcore.Entry{
							Message: "Step 1 completed",
							Level:   zap.InfoLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
							zap.String("id", "api1"),
							zap.String("env", "staging"),
						},
					},
				},
				zap.ErrorLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Step 2 failed",
							Level:   zap.ErrorLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
							zap.String("id", "api1"),
							zap.String("env", "staging"),
						},
					},
				},
			},
		},
		{
			name: "logs no baggage data",
			apiOutput: &apiv1.Output{
				Stdout: []string{
					"Step 1 started",
				},
				Stderr: []string{
					"Step 1 failed",
				},
			},
			expectedLogs: map[zapcore.Level][]observer.LoggedEntry{
				zap.InfoLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Step 1 started",
							Level:   zap.InfoLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
						},
					},
				},
				zap.ErrorLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Step 1 failed",
							Level:   zap.ErrorLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
						},
					},
				},
			},
		},
		{
			name: "no logs, errors",
			carrier: map[string]string{
				"baggage": "id=aaaaa,env=production;shadow=true",
			},
			pluginError: errors.New("Unresolved Reference"),
			expectedLogs: map[zapcore.Level][]observer.LoggedEntry{
				zap.ErrorLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Unresolved Reference",
							Level:   zap.ErrorLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
							zap.String("id", "aaaaa"),
							zap.String("env", "production"),
						},
					},
				},
			},
		},
		{
			name: "logs and errors with baggage data",
			carrier: map[string]string{
				"baggage": "id=bbbbb,env=canary",
			},
			apiOutput: &apiv1.Output{
				Stdout: []string{
					"Step 1 started",
				},
				Stderr: []string{
					"Step 1 failed",
				},
			},
			pluginError: errors.New("Syntax Error"),
			expectedLogs: map[zapcore.Level][]observer.LoggedEntry{
				zap.InfoLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Step 1 started",
							Level:   zap.InfoLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
							zap.String("id", "bbbbb"),
							zap.String("env", "canary"),
						},
					},
				},
				zap.ErrorLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Step 1 failed",
							Level:   zap.ErrorLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
							zap.String("id", "bbbbb"),
							zap.String("env", "canary"),
						},
					},
					{
						Entry: zapcore.Entry{
							Message: "Syntax Error",
							Level:   zap.ErrorLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
							zap.String("id", "bbbbb"),
							zap.String("env", "canary"),
						},
					},
				},
			},
		},
		{
			name: "error logs for non-quota KV store error",
			apiOutput: &apiv1.Output{
				Stdout: []string{
					"Step 1 started",
					"Step 1 completed",
				},
			},
			storeError: errors.New("KV store error: no space left on device"),
			expectedLogs: map[zapcore.Level][]observer.LoggedEntry{
				zap.InfoLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Step 1 started",
							Level:   zap.InfoLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
						},
					},
					{
						Entry: zapcore.Entry{
							Message: "Step 1 completed",
							Level:   zap.InfoLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "worker.go"),
							zap.String("correlation-id", "step_id"),
							zap.String("remote", "true"),
						},
					},
				},
				zap.ErrorLevel: {
					{
						Entry: zapcore.Entry{
							Message: "unexpected error: failed to write output to store",
							Level:   zap.ErrorLevel,
						},
						Context: []zapcore.Field{
							zap.String("correlation-id", "step_id"),
							zap.Error(errors.New("KV store error: no space left on device")),
						},
					},
				},
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockPlugin := mocks.NewPlugin(t)
			defer mockPlugin.AssertExpectations(t)

			mockKvStore := mockStore.NewStore(t)
			defer mockKvStore.AssertExpectations(t)

			observedCore, observedLogs := observer.New(zap.InfoLevel)
			observedLogger := zap.New(observedCore)

			executor := NewPluginExecutor(
				&Options{
					Logger:  observedLogger,
					KVStore: mockKvStore,
				},
			)
			executor.RegisterPlugin("v8", mockPlugin)

			anyProps := &transportv1.Request_Data_Data_Props{ExecutionId: "step_id"}
			anyCtx := propagation.Baggage{}.Extract(context.Background(), propagation.MapCarrier(tc.carrier))
			ctxWithExecId := constants.WithExecutionID(anyCtx, anyProps.GetExecutionId())

			var expectedPluginOutput *workerv1.ExecuteResponse
			if tc.apiOutput != nil {
				expectedPluginOutput = &workerv1.ExecuteResponse{
					Output:        tc.apiOutput.ToOld(),
					StructuredLog: structuredLogsFromOutput(tc.apiOutput),
				}
			}

			mockPlugin.On(
				"Execute",
				mock.Anything,
				mock.Anything,
				anyProps,
				mock.Anything,
				mock.Anything,
			).Return(expectedPluginOutput, tc.pluginError).Once()
			mockKvStore.On("Write", mock.Anything, mock.Anything).Return(tc.storeError).Once()

			resp, err := executor.Execute(ctxWithExecId, "v8", anyProps, nil, &transportv1.Performance{})

			if tc.pluginError != nil {
				assert.NotNil(t, resp.Err)
				assert.Equal(t, tc.pluginError.Error(), resp.Err.Message)
			} else if tc.storeError != nil {
				assert.NotNil(t, err)
				assert.Equal(t, tc.storeError.Error(), err.Error())
			} else {
				assert.Nil(t, resp.Err)
			}

			var totalExepectedLogs int
			for level, expected := range tc.expectedLogs {
				totalExepectedLogs += len(expected)

				received := observedLogs.FilterLevelExact(level).AllUntimed()
				assert.Len(t, received, len(expected))

				sort.Slice(expected, func(i, j int) bool { return expected[i].Message < expected[j].Message })
				sort.Slice(received, func(i, j int) bool { return received[i].Message < received[j].Message })

				for i, log := range received {
					assert.Equal(t, expected[i].Entry, log.Entry)
					assert.ElementsMatch(t, expected[i].Context, log.Context)
				}
			}
			assert.Len(t, observedLogs.All(), totalExepectedLogs)
		})
	}
}

func TestListPlugins(t *testing.T) {
	for _, tt := range []struct {
		name           string
		registered     []string
		expectedOutput []string
	}{
		{
			name:           "no plugins registered",
			registered:     []string{},
			expectedOutput: []string{},
		},
		{
			name:           "one plugin registered",
			registered:     []string{"postgres"},
			expectedOutput: []string{"postgres"},
		},
		{
			name:           "multiple plugins registered",
			registered:     []string{"postgres", "v8", "python"},
			expectedOutput: []string{"postgres", "python", "v8"},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			pluginExecutor := NewPluginExecutor(NewOptions(WithLogger(zap.NewNop())))
			for _, plugin := range tt.registered {
				pluginExecutor.RegisterPlugin(plugin, mocks.NewPlugin(t))
			}
			assert.ElementsMatch(t, tt.expectedOutput, pluginExecutor.ListPlugins())
		})
	}
}

func TestStream(t *testing.T) {
	testCases := []struct {
		name           string
		registerPlugin bool
		expectedErr    error
	}{
		{
			name:           "returns error when plugin is not registered",
			registerPlugin: false,
			expectedErr:    &commonErr.InternalError{},
		},
		{
			name:           "returns error when plugin returns error",
			registerPlugin: true,
			expectedErr:    errors.New("plugin error"),
		},
		{
			name:           "returns nil when plugin succeeds",
			registerPlugin: true,
			expectedErr:    nil,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockPlugin := mocks.NewPlugin(t)
			defer mockPlugin.AssertExpectations(t)

			anyCtx := context.Background()
			anyProps := &transportv1.Request_Data_Data_Props{ExecutionId: "step_id"}
			anyPerf := &transportv1.Performance{
				PluginExecution: &transportv1.Performance_Observable{},
			}
			anySendFn := func(message any) {}
			anyUntilFn := func() {}

			executor := NewPluginExecutor(&Options{})

			if tc.registerPlugin {
				executor.RegisterPlugin("v8", mockPlugin)
				mockPlugin.On(
					"Stream",
					anyCtx,
					mock.Anything,
					anyProps,
					mock.Anything,
					mock.Anything,
					mock.AnythingOfType("func(interface {})"),
					mock.AnythingOfType("func()"),
				).Return(tc.expectedErr).Once()
			}

			err := executor.Stream(anyCtx, "v8", anyProps, anyPerf, anySendFn, anyUntilFn)

			assert.Equal(t, tc.expectedErr, err)
		})
	}
}

func TestEventExecutions(t *testing.T) {
	testCases := []struct {
		name           string
		event          string
		registerPlugin bool
		expectedResp   *transportv1.Response_Data_Data
		expectedErr    error
	}{
		{
			name:           "Metadata returns error when plugin is not registered",
			event:          "Metadata",
			registerPlugin: false,
			expectedErr:    &commonErr.InternalError{},
		},
		{
			name:           "Test returns error when plugin is not registered",
			event:          "Test",
			registerPlugin: false,
			expectedErr:    &commonErr.InternalError{},
		},
		{
			name:           "PreDelete returns error when plugin is not registered",
			event:          "PreDelete",
			registerPlugin: false,
			expectedErr:    &commonErr.InternalError{},
		},
		{
			name:           "Metadata returns error when plugin returns error",
			event:          "Metadata",
			registerPlugin: true,
			expectedErr:    errors.New("plugin error"),
		},
		{
			name:           "Test returns error when plugin returns error",
			event:          "Test",
			registerPlugin: true,
			expectedErr:    errors.New("plugin error"),
		},
		{
			name:           "PreDelete returns nil when plugin returns error",
			event:          "PreDelete",
			registerPlugin: true,
			expectedErr:    nil,
		},
		{
			name:           "Metadata returns plugin response when plugin succeeds",
			event:          "Metadata",
			registerPlugin: true,
			expectedResp:   &transportv1.Response_Data_Data{Key: "value"},
			expectedErr:    nil,
		},
		{
			name:           "Test returns empty response when plugin succeeds",
			event:          "Test",
			registerPlugin: true,
			expectedResp:   &transportv1.Response_Data_Data{},
			expectedErr:    nil,
		},
		{
			name:           "PreDelete returns nil when plugin succeeds",
			event:          "PreDelete",
			registerPlugin: true,
			expectedResp:   nil,
			expectedErr:    nil,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockPlugin := mocks.NewPlugin(t)
			defer mockPlugin.AssertExpectations(t)

			anyCtx := context.Background()

			actionConfig := &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"pluginId": structpb.NewStringValue("workflow"),
				},
			}
			dataConfig := &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"pluginId": structpb.NewStringValue("postgres"),
				},
			}
			props := &transportv1.Request_Data_Data_Props{
				ActionConfiguration:     actionConfig,
				DatasourceConfiguration: dataConfig,
			}

			anyPerf := &transportv1.Performance{
				PluginExecution: &transportv1.Performance_Observable{},
			}

			executor := NewPluginExecutor(&Options{})

			if tc.registerPlugin {
				executor.RegisterPlugin("v8", mockPlugin)

				switch tc.event {
				case "Metadata":
					mockPlugin.On(
						"Metadata",
						anyCtx,
						mock.Anything,
						dataConfig,
						actionConfig,
					).Return(tc.expectedResp, tc.expectedErr).Once()
				case "Test":
					mockPlugin.On("Test", anyCtx, mock.Anything, dataConfig, actionConfig).Return(tc.expectedErr).Once()
				case "PreDelete":
					mockPlugin.On("PreDelete", anyCtx, mock.Anything, dataConfig).Return(tc.expectedErr).Once()
				}
			}

			var resp *transportv1.Response_Data_Data
			var err error

			switch tc.event {
			case "Metadata":
				resp, err = executor.Metadata(anyCtx, "v8", props, anyPerf)
			case "Test":
				resp, err = executor.Test(anyCtx, "v8", props, anyPerf)
			case "PreDelete":
				resp, err = executor.PreDelete(anyCtx, "v8", props, anyPerf)
			}

			assert.Equal(t, tc.expectedResp, resp)
			assert.Equal(t, tc.expectedErr, err)
		})
	}
}
