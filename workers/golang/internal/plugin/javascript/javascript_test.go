package javascript

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/engine"
	engineMocks "github.com/superblocksteam/agent/pkg/engine/mock"
	storeMocks "github.com/superblocksteam/agent/pkg/store/mock"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestExecute_ExecutesCode_ReturnsResult(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name            string
		userCode        string
		variables       map[string]*transportv1.Variable
		executionResult string
		infoLogStream   string
		errLogStream    string

		expectedCode   string
		expectedOutput *apiv1.Output
	}{
		{
			name:     "execution returning object, with info logs and variables",
			userCode: "console.log(success);console.log(err);return {id: '0000', name: 'Step1', success: true};",
			variables: map[string]*transportv1.Variable{
				"success": {Key: "success", Type: apiv1.Variables_TYPE_SIMPLE, Mode: apiv1.Variables_MODE_READ},
				"err":     {Key: "err", Type: apiv1.Variables_TYPE_SIMPLE, Mode: apiv1.Variables_MODE_READWRITE},
			},
			executionResult: "{\"id\": \"0000\", \"name\": \"Step1\", \"success\": true}",
			infoLogStream:   "info output 1\nerror output 1\n",
			errLogStream:    "",
			expectedCode:    "await (async () => { console.log(success);console.log(err);return {id: '0000', name: 'Step1', success: true}; })()",
			expectedOutput: &apiv1.Output{
				Stdout: []string{"info output 1", "error output 1"},
				Stderr: []string{},
				Result: &structpb.Value{
					Kind: &structpb.Value_StructValue{
						StructValue: &structpb.Struct{
							Fields: map[string]*structpb.Value{
								"id":      structpb.NewStringValue("0000"),
								"name":    structpb.NewStringValue("Step1"),
								"success": structpb.NewBoolValue(true),
							},
						},
					},
				},
				Request:   "console.log(success);console.log(err);return {id: '0000', name: 'Step1', success: true};",
				RequestV2: &apiv1.Output_Request{Summary: "console.log(success);console.log(err);return {id: '0000', name: 'Step1', success: true};"},
			},
		},
		{
			name:            "execution returning object, no logs, no variables",
			userCode:        "return {id: '0000', name: 'Step1', success: true};",
			executionResult: "{\"id\": \"0000\", \"name\": \"Step1\", \"success\": true}",
			expectedCode:    "await (async () => { return {id: '0000', name: 'Step1', success: true}; })()",
			expectedOutput: &apiv1.Output{
				Result: &structpb.Value{
					Kind: &structpb.Value_StructValue{
						StructValue: &structpb.Struct{
							Fields: map[string]*structpb.Value{
								"id":      structpb.NewStringValue("0000"),
								"name":    structpb.NewStringValue("Step1"),
								"success": structpb.NewBoolValue(true),
							},
						},
					},
				},
				Request:   "return {id: '0000', name: 'Step1', success: true};",
				RequestV2: &apiv1.Output_Request{Summary: "return {id: '0000', name: 'Step1', success: true};"},
			},
		},
		{
			name:            "execution returning primitive, empty string logs, no variables",
			userCode:        "return 5;",
			executionResult: "5",
			infoLogStream:   "starting stream\n\nstream interrupted\n",
			expectedCode:    "await (async () => { return 5; })()",
			expectedOutput: &apiv1.Output{
				Stdout: []string{"starting stream", "", "stream interrupted"},
				Stderr: []string{},
				Result: &structpb.Value{
					Kind: &structpb.Value_NumberValue{
						NumberValue: 5,
					},
				},
				Request:   "return 5;",
				RequestV2: &apiv1.Output_Request{Summary: "return 5;"},
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockSandbox := engineMocks.NewSandbox(t)
			mockEngine := engineMocks.NewEngine(t)
			mockValue := engineMocks.NewValue(t)

			observedCore, _ := observer.New(zap.InfoLevel)
			observedLogger := zap.New(observedCore)

			stdOutBuffer := &bytes.Buffer{}
			stdOutBuffer.WriteString(tc.infoLogStream)
			stdErrBuffer := &bytes.Buffer{}
			stdErrBuffer.WriteString(tc.errLogStream)

			consoleObj := &engine.Console{
				Stdout: stdOutBuffer,
				Stderr: stdErrBuffer,
			}

			anyCtx := context.Background()

			config := map[string]any{}
			if tc.userCode != "" {
				config["body"] = tc.userCode
			}
			actionConfig, _ := structpb.NewStruct(config)

			props := &transportv1.Request_Data_Data_Props{ActionConfiguration: actionConfig}
			if tc.variables != nil {
				props.Variables = tc.variables
			}
			expectedVariables := utils.NewMapFromGoMap[*transportv1.Variable](tc.variables)

			mockSandbox.On("Engine", anyCtx).Return(mockEngine, nil).Once()

			mockEngine.On("Resolve", anyCtx, tc.expectedCode, expectedVariables, mock.Anything).Return(mockValue).Once()
			mockEngine.On("Close").Return().Once()

			mockValue.On("JSON").Return(tc.executionResult, nil).Once()
			mockValue.On("Console").Return(consoleObj).Twice()

			// Act
			// TODO(bruce): fix this test so that we're using blackbox methods,
			// but currently that would involve us mocking the store methods in a certain way
			// that leaks the resolver implementation details
			plugin := &javascriptPlugin{
				logger: observedLogger,
			}
			output, err := plugin.execute(anyCtx, props, mockSandbox, observedLogger)

			// Assert
			assert.NoError(t, err)
			expectedOutput := proto.Clone(tc.expectedOutput).(*apiv1.Output)
			actualOutput := proto.Clone(output).(*apiv1.Output)
			assert.Equal(t, expectedOutput, actualOutput)
		})
	}
}

func TestExecute_ReturnsError(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name            string
		validSandboxFn  bool
		newEngineErr    error
		resolverErr     error
		stderrStream    string
		expectedErr     string
		expectNilOutput bool
	}{
		{
			name:            "sandbox new engine returns error",
			validSandboxFn:  true,
			newEngineErr:    errors.New("operation timed out"),
			expectedErr:     "operation timed out",
			expectNilOutput: true,
		},
		{
			name:            "resolver returns error",
			validSandboxFn:  true,
			resolverErr:     errors.New("unresolved reference"),
			expectedErr:     "unresolved reference",
			expectNilOutput: false,
		},
		{
			name:            "result contains error logs",
			validSandboxFn:  true,
			stderrStream:    "error output 1\nerror output 2\nerror output 3\n",
			expectedErr:     "error output 3",
			expectNilOutput: false,
		},
		{
			name:            "result contains empty string error log",
			validSandboxFn:  true,
			stderrStream:    "\n",
			expectedErr:     "",
			expectNilOutput: false,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockSandbox := &engineMocks.Sandbox{}
			mockEngine := &engineMocks.Engine{}
			mockValue := &engineMocks.Value{}

			observedCore, _ := observer.New(zap.InfoLevel)
			observedLogger := zap.New(observedCore)

			anyCtx := context.Background()
			anyConfig, _ := structpb.NewStruct(
				map[string]any{
					"body": "return 5;",
				},
			)
			anyProps := &transportv1.Request_Data_Data_Props{
				ActionConfiguration: anyConfig,
			}

			stdOutBuffer := &bytes.Buffer{}
			stdOutBuffer.WriteString("Script starting...\nScript finished\n")
			stdErrBuffer := &bytes.Buffer{}
			stdErrBuffer.WriteString(tc.stderrStream)

			consoleObj := &engine.Console{
				Stdout: stdOutBuffer,
				Stderr: stdErrBuffer,
			}

			mockSandbox.On("Engine", anyCtx).Return(mockEngine, tc.newEngineErr)

			mockEngine.On("Resolve", anyCtx, mock.AnythingOfType("string"), mock.Anything, mock.Anything).Return(mockValue)
			mockEngine.On("Close").Return()

			mockValue.On("JSON").Return("5", tc.resolverErr)
			mockValue.On("Console").Return(consoleObj)

			plugin := &javascriptPlugin{
				logger: observedLogger,
			}
			output, err := plugin.execute(anyCtx, anyProps, mockSandbox, observedLogger)
			assert.Equal(t, tc.expectNilOutput, output == nil)
			assert.Error(t, err)
			assert.EqualError(t, err, tc.expectedErr)
		})
	}
}

func TestExecute_ReturnsError_WhenProtoUnmarshalFails(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name            string
		emptyCodeBlock  bool
		jsonResult      string
		expectNilOutput bool
	}{
		{
			name:            "unmarshal json to proto returns error",
			jsonResult:      "{invalid\"{ json}' object",
			expectNilOutput: false,
		},
		{
			name:            "empty code block returns error",
			emptyCodeBlock:  true,
			jsonResult:      "",
			expectNilOutput: false,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockSandbox := &engineMocks.Sandbox{}
			mockEngine := &engineMocks.Engine{}
			mockValue := &engineMocks.Value{}
			mockStore := &storeMocks.Store{}

			observedCore, _ := observer.New(zap.InfoLevel)
			observedLogger := zap.New(observedCore)

			anyCtx := context.Background()
			config := map[string]any{}
			if !tc.emptyCodeBlock {
				config["body"] = "return 42;"
			}
			anyConfig, _ := structpb.NewStruct(config)
			anyProps := &transportv1.Request_Data_Data_Props{
				ActionConfiguration: anyConfig,
			}
			anyConsole := &engine.Console{
				Stdout: &bytes.Buffer{},
				Stderr: &bytes.Buffer{},
			}

			mockSandbox.On("Engine", anyCtx).Return(mockEngine, nil)

			mockEngine.On("Resolve", anyCtx, mock.AnythingOfType("string"), mock.Anything, mock.Anything).Return(mockValue)
			mockEngine.On("Close").Return()

			mockValue.On("JSON").Return(tc.jsonResult, nil)
			mockValue.On("Console").Return(anyConsole)

			plugin := &javascriptPlugin{
				storeClient: mockStore,
				logger:      observedLogger,
			}
			output, err := plugin.execute(anyCtx, anyProps, mockSandbox, observedLogger)

			assert.Error(t, err)
			assert.Equal(t, tc.expectNilOutput, output == nil)
		})
	}
}

func TestRetrieveGetFileFunc(t *testing.T) {
	t.Parallel()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("x-superblocks-agent-key") != "test-agent-key" {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		w.WriteHeader(http.StatusOK)
		base64Data := createMockJSONResponse("test data")

		for i := 0; i < 3; i++ {
			_, _ = w.Write([]byte(base64Data))
			_, _ = w.Write([]byte("\n"))
		}
	}))
	defer srv.Close()

	testCases := []struct {
		name            string
		fileServerURL   string
		headers         map[string][]string
		path            string
		expectError     bool
		expectedContent string
	}{
		{
			name:            "valid request v2 server",
			fileServerURL:   srv.URL + "/v2",
			headers:         map[string][]string{"x-superblocks-agent-key": {"test-agent-key"}},
			path:            "/testpath",
			expectError:     false,
			expectedContent: strings.Repeat("test data", 3),
		},
		{
			name:          "invalid URL",
			fileServerURL: ":invalid-url",
			headers:       map[string][]string{"x-superblocks-agent-key": {"test-agent-key"}},
			path:          "/testpath",
			expectError:   true,
		},
		{
			name:          "unauthorized request",
			fileServerURL: srv.URL,
			headers:       map[string][]string{"x-superblocks-agent-key": {"invalidkey"}},
			path:          "/testpath",
			expectError:   true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			props := &transportv1.Request_Data_Data_Props{
				FileServerUrl: tc.fileServerURL,
			}
			getFileFunc := retrieveGetFileFunc(props, tc.headers)

			reader, err := getFileFunc(context.Background(), tc.path)
			if tc.expectError {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)
			content, err := io.ReadAll(reader)
			assert.NoError(t, err)
			assert.Equal(t, tc.expectedContent, string(content))
		})
	}
}
