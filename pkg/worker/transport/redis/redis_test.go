package redis

import (
	"context"
	e "errors"
	"testing"
	"time"

	"github.com/go-redis/redismock/v9"
	redis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	mocks "github.com/superblocksteam/agent/internal/flags/mock"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/worker"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestRemote(t *testing.T) {
	t.Parallel()

	for _, tc := range []struct {
		name            string
		testCtx         context.Context
		plugin          string
		supportedEvents []string
		enabledPlugins  []string
		expectedStream  string
	}{
		{
			name:           "happy path - empty context",
			testCtx:        context.Background(),
			plugin:         "javascript",
			expectedStream: "agent.main.bucket.ba.plugin.javascript.event.execute",
		},
		{
			name:           "happy path - context with defined event",
			testCtx:        worker.WithEvent(context.Background(), worker.Event("metadata")),
			plugin:         "javascript",
			expectedStream: "agent.main.bucket.ba.plugin.javascript.event.metadata",
		},
		{
			name:           "happy path - stream event becomes execute",
			testCtx:        worker.WithEvent(context.Background(), worker.Event("stream")),
			plugin:         "javascript",
			expectedStream: "agent.main.bucket.ba.plugin.javascript.event.execute",
		},
		{
			name:            "happy path ephemeral - empty context",
			testCtx:         context.Background(),
			plugin:          "javascript",
			supportedEvents: []string{"execute", "metadata"},
			enabledPlugins:  []string{"javascript", "python"},
			expectedStream:  "agent.main.bucket.ba.ephemeral.plugin.javascript.event.execute",
		},
		{
			name:            "happy path ephemeral - context with event",
			testCtx:         worker.WithEvent(context.Background(), worker.Event("test")),
			plugin:          "python",
			supportedEvents: []string{"metadata", "test"},
			enabledPlugins:  []string{"javascript", "python"},
			expectedStream:  "agent.main.bucket.ba.ephemeral.plugin.python.event.test",
		},
		{
			name:            "ephemeral unsupported event - returns non-ephemeral stream",
			testCtx:         worker.WithEvent(context.Background(), worker.Event("execute")),
			plugin:          "python",
			supportedEvents: []string{"metadata", "test"},
			enabledPlugins:  []string{"javascript", "python"},
			expectedStream:  "agent.main.bucket.ba.plugin.python.event.execute",
		},
		{
			name:            "ephemeral unsupported plugin - returns non-ephemeral stream",
			testCtx:         worker.WithEvent(context.Background(), worker.Event("execute")),
			plugin:          "python",
			supportedEvents: []string{"execute", "metadata", "test"},
			enabledPlugins:  []string{"javascript"},
			expectedStream:  "agent.main.bucket.ba.plugin.python.event.execute",
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			buckets, err := NewBuckets(&Config{
				Analysis: "ba",
				Error:    "be",
			})
			require.NoError(t, err)

			anyOrgPlan := "anyOrgPlan"
			anyOrgId := "anyOrgId"

			mockFlags := mocks.NewFlags(t)
			mockFlags.On("GetEphemeralEnabledPlugins", anyOrgPlan, anyOrgId).Return(tc.enabledPlugins).Once()
			mockFlags.On("GetEphemeralSupportedEvents", anyOrgPlan, anyOrgId).Return(tc.supportedEvents).Once()

			tnspt := &transport{
				flags: mockFlags,
				options: &Options{
					buckets: buckets,
					logger:  zap.NewNop(),
				},
			}

			_, stream := tnspt.Remote(tc.testCtx, tc.plugin, anyOrgPlan, anyOrgId)
			assert.Equal(t, tc.expectedStream, stream)
		})
	}
}

func TestExecute(t *testing.T) {
	defer metrics.SetupForTesting()()
	buckets, _ := load([]byte(`{"analysis":"ba","error":"be","custom":[{"label":"b1","integrations":["javascript","python"],"bound":100},{"label":"b2","integrations":["javascript","python"],"bound":500},{"label":"b3","integrations":["javascript","python"],"bound":3000},{"label":"b4","integrations":["javascript","python"],"bound":4294967295}]}`))
	dConfig, _ := structpb.NewStruct(map[string]any{"foo": "fighters"})
	aConfig, _ := structpb.NewStruct(map[string]any{"nirv": "ana"})

	for _, test := range []struct {
		name   string
		stream string
		event  string
		data   *transportv1.Request_Data_Data
	}{
		{
			name:   "happy path",
			stream: "agent.main.bucket.ba.plugin.javascript.event.execute",
			event:  "execute",
			data: &transportv1.Request_Data_Data{
				Props: &transportv1.Request_Data_Data_Props{
					ExecutionId: "foobarfighters",
				},
			},
		},
		{
			name:   "happy path - metadata",
			stream: "agent.main.bucket.ba.plugin.javascript.event.metadata",
			event:  "metadata",
			data: &transportv1.Request_Data_Data{
				DConfig: dConfig,
				AConfig: aConfig,
			},
		},
	} {
		client, clientMock := redismock.NewClientMock()

		mockFlags := &mocks.Flags{}
		mockFlags.On("GetEphemeralEnabledPlugins", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
		mockFlags.On("GetEphemeralSupportedEvents", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)

		tnspt := &transport{
			flags: mockFlags,
			options: &Options{
				buckets: buckets,
				redis:   client,
				logger:  zap.NewNop(),
			},
			inbox: func() (string, error) {
				return "abcd", nil
			},
		}

		ctx := context.Background()

		clientMock.ExpectXAdd(&redis.XAddArgs{
			Stream:     test.stream,
			NoMkStream: true,
			Values: map[string]any{
				"data": &transportv1.Request{
					Inbox: "abcd",
					Topic: "abcd",
					Data: &transportv1.Request_Data{
						Pinned: &transportv1.Request_Data_Pinned{
							Bucket:  "ba",
							Name:    "javascript",
							Version: "v0.0.1",
							Event:   test.event,
							Carrier: tracer.Propagate(ctx),
							Observability: &transportv1.Observability{
								Baggage: tracer.Propagate(ctx),
							},
						},
						Data: test.data,
					},
				},
			},
		})

		if test.event == "execute" {
			tnspt.Execute(ctx, "javascript", test.data)
		} else if test.event == "metadata" {
			tnspt.Metadata(ctx, "javascript", test.data.DConfig, test.data.AConfig)
		}

		assert.NoError(t, clientMock.ExpectationsWereMet(), test.name)
	}
}

func TestAckTimeoutReturnsWorkerUnavailableError(t *testing.T) {
	defer metrics.SetupForTesting()()

	buckets, _ := load([]byte(`{"analysis":"ba","error":"be","custom":[]}`))
	client, clientMock := redismock.NewClientMock()

	mockFlags := &mocks.Flags{}
	mockFlags.On("GetEphemeralEnabledPlugins", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
	mockFlags.On("GetEphemeralSupportedEvents", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)

	ctx := context.Background()
	carrier := tracer.Propagate(ctx)
	reqData := &transportv1.Request_Data_Data{}
	stream := "agent.main.bucket.ba.plugin.javascript.event.execute"

	tnspt := &transport{
		flags: mockFlags,
		options: &Options{
			buckets:           buckets,
			redis:             client,
			logger:            zap.NewNop(),
			heartbeatInterval: 1,
		},
		inbox: func() (string, error) {
			return "test-inbox", nil
		},
	}

	clientMock.ExpectXAdd(&redis.XAddArgs{
		Stream:     stream,
		NoMkStream: true,
		Values: map[string]any{
			"data": &transportv1.Request{
				Inbox: "test-inbox",
				Topic: "test-inbox",
				Data: &transportv1.Request_Data{
					Pinned: &transportv1.Request_Data_Pinned{
						Bucket:  "ba",
						Name:    "javascript",
						Version: "v0.0.1",
						Event:   "execute",
						Carrier: carrier,
						Observability: &transportv1.Observability{
							Baggage: carrier,
						},
					},
					Data: reqData,
				},
			},
		},
	}).SetVal("1-0")

	clientMock.ExpectXRead(&redis.XReadArgs{
		Streams: []string{"test-inbox", "0-0"},
		Count:   1,
		Block:   1,
	}).SetErr(redis.Nil)

	clientMock.ExpectDel("test-inbox").SetVal(1)
	clientMock.ExpectXDel(stream, "1-0").SetVal(1)

	_, _, err := tnspt.Execute(ctx, "javascript", reqData)
	require.Error(t, err)
	assert.True(t, errors.IsWorkerUnavailableError(err), "expected WorkerUnavailableError, got %T: %v", err, err)
}

func TestExecuteSendFailureReturnsInternalErrorAndRecordsInfrastructureMetric(t *testing.T) {
	defer metrics.SetupForTesting()()

	buckets, _ := load([]byte(`{"analysis":"ba","error":"be","custom":[]}`))
	client, clientMock := redismock.NewClientMock()

	mockFlags := &mocks.Flags{}
	mockFlags.On("GetEphemeralEnabledPlugins", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
	mockFlags.On("GetEphemeralSupportedEvents", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)

	ctx := context.Background()
	reqData := &transportv1.Request_Data_Data{}
	stream := "agent.main.bucket.ba.plugin.javascript.event.execute"

	tnspt := &transport{
		flags: mockFlags,
		options: &Options{
			buckets:           buckets,
			redis:             client,
			logger:            zap.NewNop(),
			heartbeatInterval: 1,
			timeout:           1,
		},
		inbox: func() (string, error) {
			return "test-inbox", nil
		},
	}

	clientMock.ExpectXAdd(&redis.XAddArgs{
		Stream:     stream,
		NoMkStream: true,
		Values: map[string]any{
			"data": &transportv1.Request{
				Inbox: "test-inbox",
				Topic: "test-inbox",
				Data: &transportv1.Request_Data{
					Pinned: &transportv1.Request_Data_Pinned{
						Bucket:  "ba",
						Name:    "javascript",
						Version: "v0.0.1",
						Event:   "execute",
						Carrier: tracer.Propagate(ctx),
						Observability: &transportv1.Observability{
							Baggage: tracer.Propagate(ctx),
						},
					},
					Data: reqData,
				},
			},
		},
	}).SetErr(e.New("xadd failed"))

	_, _, err := tnspt.Execute(ctx, "javascript", reqData)
	require.Error(t, err)
	assert.IsType(t, &errors.InternalError{}, err)
	assert.Equal(t, 1.0, metrics.GetExecuteInfrastructureErrorCount())
	assert.NoError(t, clientMock.ExpectationsWereMet())
}

func TestExecuteSendRedisNilFailureReturnsInternalErrorAndRecordsInfrastructureMetric(t *testing.T) {
	defer metrics.SetupForTesting()()

	buckets, _ := load([]byte(`{"analysis":"ba","error":"be","custom":[]}`))
	client, clientMock := redismock.NewClientMock()

	mockFlags := &mocks.Flags{}
	mockFlags.On("GetEphemeralEnabledPlugins", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
	mockFlags.On("GetEphemeralSupportedEvents", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)

	ctx := context.Background()
	reqData := &transportv1.Request_Data_Data{}
	stream := "agent.main.bucket.ba.plugin.javascript.event.execute"

	tnspt := &transport{
		flags: mockFlags,
		options: &Options{
			buckets:           buckets,
			redis:             client,
			logger:            zap.NewNop(),
			heartbeatInterval: 1,
			timeout:           1,
		},
		inbox: func() (string, error) {
			return "test-inbox", nil
		},
	}

	clientMock.ExpectXAdd(&redis.XAddArgs{
		Stream:     stream,
		NoMkStream: true,
		Values: map[string]any{
			"data": &transportv1.Request{
				Inbox: "test-inbox",
				Topic: "test-inbox",
				Data: &transportv1.Request_Data{
					Pinned: &transportv1.Request_Data_Pinned{
						Bucket:  "ba",
						Name:    "javascript",
						Version: "v0.0.1",
						Event:   "execute",
						Carrier: tracer.Propagate(ctx),
						Observability: &transportv1.Observability{
							Baggage: tracer.Propagate(ctx),
						},
					},
					Data: reqData,
				},
			},
		},
	}).SetErr(redis.Nil)

	_, _, err := tnspt.Execute(ctx, "javascript", reqData)
	require.Error(t, err)
	assert.IsType(t, &errors.InternalError{}, err)
	assert.Equal(t, 1.0, metrics.GetExecuteInfrastructureErrorCount())
	assert.NoError(t, clientMock.ExpectationsWereMet())
}

func TestExecuteReadResponseFailureReturnsInternalErrorAndRecordsInfrastructureMetric(t *testing.T) {
	defer metrics.SetupForTesting()()

	buckets, _ := load([]byte(`{"analysis":"ba","error":"be","custom":[]}`))
	client, clientMock := redismock.NewClientMock()

	mockFlags := &mocks.Flags{}
	mockFlags.On("GetEphemeralEnabledPlugins", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
	mockFlags.On("GetEphemeralSupportedEvents", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)

	ctx := context.Background()
	reqData := &transportv1.Request_Data_Data{}
	stream := "agent.main.bucket.ba.plugin.javascript.event.execute"

	tnspt := &transport{
		flags: mockFlags,
		options: &Options{
			buckets:           buckets,
			redis:             client,
			logger:            zap.NewNop(),
			heartbeatInterval: 1,
			timeout:           1,
		},
		inbox: func() (string, error) {
			return "test-inbox", nil
		},
	}

	carrier := tracer.Propagate(ctx)
	clientMock.ExpectXAdd(&redis.XAddArgs{
		Stream:     stream,
		NoMkStream: true,
		Values: map[string]any{
			"data": &transportv1.Request{
				Inbox: "test-inbox",
				Topic: "test-inbox",
				Data: &transportv1.Request_Data{
					Pinned: &transportv1.Request_Data_Pinned{
						Bucket:  "ba",
						Name:    "javascript",
						Version: "v0.0.1",
						Event:   "execute",
						Carrier: carrier,
						Observability: &transportv1.Observability{
							Baggage: carrier,
						},
					},
					Data: reqData,
				},
			},
		},
	}).SetVal("1-0")

	clientMock.ExpectXRead(&redis.XReadArgs{
		Streams: []string{"test-inbox", "0-0"},
		Count:   1,
		Block:   1,
	}).SetVal([]redis.XStream{{
		Stream: "test-inbox",
		Messages: []redis.XMessage{{
			ID:     "0-0",
			Values: map[string]any{"data": "ack"},
		}},
	}})

	clientMock.ExpectXRead(&redis.XReadArgs{
		Streams: []string{"test-inbox", "0-1"},
		Count:   1,
		Block:   1,
	}).SetErr(e.New("xread failed"))

	_, _, err := tnspt.Execute(ctx, "javascript", reqData)
	require.Error(t, err)
	assert.IsType(t, &errors.InternalError{}, err)
	assert.Equal(t, 1.0, metrics.GetExecuteInfrastructureErrorCount())
	assert.NoError(t, clientMock.ExpectationsWereMet())
}

func TestExecuteReadResponseTimeoutReturnsIntegrationTimeoutAndNoInfrastructureMetric(t *testing.T) {
	defer metrics.SetupForTesting()()

	buckets, _ := load([]byte(`{"analysis":"ba","error":"be","custom":[]}`))
	client, clientMock := redismock.NewClientMock()

	mockFlags := &mocks.Flags{}
	mockFlags.On("GetEphemeralEnabledPlugins", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
	mockFlags.On("GetEphemeralSupportedEvents", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)

	ctx := context.Background()
	reqData := &transportv1.Request_Data_Data{}
	stream := "agent.main.bucket.ba.plugin.javascript.event.execute"

	tnspt := &transport{
		flags: mockFlags,
		options: &Options{
			buckets:           buckets,
			redis:             client,
			logger:            zap.NewNop(),
			heartbeatInterval: 1,
			timeout:           1,
		},
		inbox: func() (string, error) {
			return "test-inbox", nil
		},
	}

	carrier := tracer.Propagate(ctx)
	clientMock.ExpectXAdd(&redis.XAddArgs{
		Stream:     stream,
		NoMkStream: true,
		Values: map[string]any{
			"data": &transportv1.Request{
				Inbox: "test-inbox",
				Topic: "test-inbox",
				Data: &transportv1.Request_Data{
					Pinned: &transportv1.Request_Data_Pinned{
						Bucket:  "ba",
						Name:    "javascript",
						Version: "v0.0.1",
						Event:   "execute",
						Carrier: carrier,
						Observability: &transportv1.Observability{
							Baggage: carrier,
						},
					},
					Data: reqData,
				},
			},
		},
	}).SetVal("1-0")

	clientMock.ExpectXRead(&redis.XReadArgs{
		Streams: []string{"test-inbox", "0-0"},
		Count:   1,
		Block:   1,
	}).SetVal([]redis.XStream{{
		Stream: "test-inbox",
		Messages: []redis.XMessage{{
			ID:     "0-0",
			Values: map[string]any{"data": "ack"},
		}},
	}})

	clientMock.ExpectXRead(&redis.XReadArgs{
		Streams: []string{"test-inbox", "0-1"},
		Count:   1,
		Block:   1,
	}).SetErr(redis.Nil)

	_, _, err := tnspt.Execute(ctx, "javascript", reqData)
	require.Error(t, err)

	integrationErr, ok := errors.IsIntegrationError(err)
	require.True(t, ok, "expected IntegrationError, got %T: %v", err, err)
	assert.Equal(t, commonv1.Code_CODE_INTEGRATION_QUERY_TIMEOUT, integrationErr.Code())
	assert.Equal(t, 0.0, metrics.GetExecuteInfrastructureErrorCount())
	assert.NoError(t, clientMock.ExpectationsWereMet())
}

func TestExecuteProcessInternalErrorRecordsInfrastructureMetric(t *testing.T) {
	defer metrics.SetupForTesting()()

	buckets, _ := load([]byte(`{"analysis":"ba","error":"be","custom":[]}`))
	client, clientMock := redismock.NewClientMock()

	mockFlags := &mocks.Flags{}
	mockFlags.On("GetEphemeralEnabledPlugins", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
	mockFlags.On("GetEphemeralSupportedEvents", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)

	ctx := context.Background()
	reqData := &transportv1.Request_Data_Data{}
	stream := "agent.main.bucket.ba.plugin.javascript.event.execute"

	tnspt := &transport{
		flags: mockFlags,
		options: &Options{
			buckets:           buckets,
			redis:             client,
			logger:            zap.NewNop(),
			heartbeatInterval: 1,
			timeout:           1,
		},
		inbox: func() (string, error) {
			return "test-inbox", nil
		},
	}

	carrier := tracer.Propagate(ctx)
	clientMock.ExpectXAdd(&redis.XAddArgs{
		Stream:     stream,
		NoMkStream: true,
		Values: map[string]any{
			"data": &transportv1.Request{
				Inbox: "test-inbox",
				Topic: "test-inbox",
				Data: &transportv1.Request_Data{
					Pinned: &transportv1.Request_Data_Pinned{
						Bucket:  "ba",
						Name:    "javascript",
						Version: "v0.0.1",
						Event:   "execute",
						Carrier: carrier,
						Observability: &transportv1.Observability{
							Baggage: carrier,
						},
					},
					Data: reqData,
				},
			},
		},
	}).SetVal("1-0")

	clientMock.ExpectXRead(&redis.XReadArgs{
		Streams: []string{"test-inbox", "0-0"},
		Count:   1,
		Block:   1,
	}).SetVal([]redis.XStream{{
		Stream: "test-inbox",
		Messages: []redis.XMessage{{
			ID:     "0-0",
			Values: map[string]any{"data": "ack"},
		}},
	}})

	clientMock.ExpectXRead(&redis.XReadArgs{
		Streams: []string{"test-inbox", "0-1"},
		Count:   1,
		Block:   1,
	}).SetVal([]redis.XStream{{
		Stream: "test-inbox",
		Messages: []redis.XMessage{{
			ID: "0-1",
			Values: map[string]any{
				"data": `{"data":{"data":{"key":"result-key","err":{"message":"InternalError"}}}}`,
			},
		}},
	}})

	_, _, err := tnspt.Execute(ctx, "javascript", reqData)
	require.Error(t, err)
	assert.IsType(t, &errors.InternalError{}, err)
	assert.Equal(t, 1.0, metrics.GetExecuteInfrastructureErrorCount())
	assert.NoError(t, clientMock.ExpectationsWereMet())
}

func TestProcess(t *testing.T) {
	defer metrics.SetupForTesting()()

	for _, test := range []struct {
		name        string
		data        []redis.XStream
		inbox       string
		key         string
		expectedMsg *transportv1.Response
		err         error
		proto       bool
	}{
		{
			name: "happy path - execute",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {"data": {"key": "gc_me"}}}`,
							},
						},
					},
				},
			},
			key:   "gc_me",
			inbox: "inbox.1234",
			err:   nil,
		},
		{
			name: "transport",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {}, "pinned": { "message": "error" } }`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			err: errors.IntegrationError(&commonv1.Error{
				Message: "error",
			}, commonv1.Code_CODE_UNSPECIFIED),
		},
		{
			name: "no data",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{}`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			err:   errors.RedisDataCorruptionError(),
		},
		{
			name: "happy path - metadata",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter_metadata",
							Values: map[string]any{
								"data": `{"data": {"data": {"dbSchema": { "tables": [] }}}}`,
							},
						},
					},
				},
			},
			expectedMsg: &transportv1.Response{
				Data: &transportv1.Response_Data{
					Data: &transportv1.Response_Data_Data{
						DbSchema: &apiv1.MetadataResponse_DatabaseSchemaMetadata{
							Tables: []*apiv1.MetadataResponse_DatabaseSchemaMetadata_Table{},
						},
					},
				},
			},
			inbox: "inbox.1234",
			err:   nil,
		},
		{
			name:  "no streams",
			data:  []redis.XStream{},
			inbox: "inbox.1234",
			err:   errors.RedisDataCorruptionError(e.New("expected exactly one stream")),
		},
		{
			name: "too many streams",
			data: []redis.XStream{
				{},
				{},
			},
			inbox: "inbox.1234",
			err:   errors.RedisDataCorruptionError(e.New("expected exactly one stream")),
		},
		{
			name: "wrong stream",
			data: []redis.XStream{
				{
					Stream: "inbox.4321",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"key": "gc_me",
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			err:   errors.RedisDataCorruptionError(e.New("unexpected stream")),
		},
		{
			name: "no messages",
			data: []redis.XStream{
				{
					Stream:   "inbox.1234",
					Messages: []redis.XMessage{},
				},
			},
			inbox: "inbox.1234",
			err:   errors.RedisDataCorruptionError(e.New("expected exactly one message from stream")),
		},
		{
			name: "too many messages",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{},
						{},
					},
				},
			},
			inbox: "inbox.1234",
			err:   errors.RedisDataCorruptionError(e.New("expected exactly one message from stream")),
		},
		{
			name: "invalid key",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {"data": {"key": 5}}}`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			err:   errors.RedisDataCorruptionError(),
			proto: true,
		},
		{
			name: "invalid err",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {"data": {"key": 5, "err": {"message": 5}}}}`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			err:   errors.RedisDataCorruptionError(),
			proto: true,
		},
		{
			name: "quota error",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {"data": {"key": "key", "err": {"message": "QuotaError"}}}}`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			key:   "key",
			err:   errors.StepSizeQuotaError("", 0),
		},
		{
			name: "duration error",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {"data": {"key": "key", "err": {"message": "DurationQuotaError"}}}}`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			key:   "key",
			err:   errors.StepDurationQuotaError("", 0),
		},
		{
			name: "internal error",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {"data": {"key": "key", "err": {"message": "InternalError"}}}}`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			key:   "key",
			err:   &errors.InternalError{},
		},
		{
			name: "other error",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {"data": {"key": "key", "err": {"message": "other"}}}}`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			key:   "key",
			err:   errors.IntegrationError(e.New("other"), commonv1.Code_CODE_UNSPECIFIED),
		},
		{
			name: "encoding (1/2)",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {}, "pinned": { "message": "\n" } }`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			err: errors.IntegrationError(&commonv1.Error{
				Message: "\\n",
			}, commonv1.Code_CODE_UNSPECIFIED),
		},
		{
			name: "encoding (2/2)",
			data: []redis.XStream{
				{
					Stream: "inbox.1234",
					Messages: []redis.XMessage{
						{
							ID: "does_not_matter",
							Values: map[string]any{
								"data": `{"data": {"data": {"key": "key", "err": {"message": "\n"}}}}`,
							},
						},
					},
				},
			},
			inbox: "inbox.1234",
			key:   "key",
			err:   errors.IntegrationError(e.New("\\n"), commonv1.Code_CODE_UNSPECIFIED),
		},
	} {
		mockFlags := &mocks.Flags{}
		mockFlags.On("GetEphemeralEnabledPlugins", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
		mockFlags.On("GetEphemeralSupportedEvents", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)

		tnspt := &transport{
			flags: mockFlags,
			options: &Options{
				redis:  nil,
				logger: zap.NewNop(),
			},
		}

		_, resp, key, err := tnspt.process(test.data, test.inbox, &transportv1.Request_Data_Data{})

		if test.err != nil {
			assert.Error(t, err, test.name)
			assert.IsType(t, test.err, err, test.name)

			if !test.proto {
				assert.Equal(t, test.err.Error(), err.Error(), test.name)
			}
		} else {
			assert.NoError(t, err, test.name)
			assert.Equal(t, key, test.key, test.name)
		}

		if test.expectedMsg != nil {
			assert.Equal(t, resp.String(), test.expectedMsg.String(), test.name)
		}
	}
}

func TestObserveInfrastructureError(t *testing.T) {
	defer metrics.SetupForTesting()()

	ctx := context.Background()
	_, span := tracer.Tracer().Start(ctx, "test.observe.infrastructure.error")
	defer span.End()

	observeInfrastructureError(ctx, span, "javascript", "execute", "ba", "process_response", &errors.InternalError{})
	assert.Equal(t, 1.0, metrics.GetExecuteInfrastructureErrorCount())

	observeInfrastructureError(ctx, span, "javascript", "execute", "ba", "process_response", errors.IntegrationError(e.New("boom"), commonv1.Code_CODE_UNSPECIFIED))
	assert.Equal(t, 1.0, metrics.GetExecuteInfrastructureErrorCount(), "non-internal errors must not increment infrastructure metric")
}

func TestExecuteComputesQueueRequestTimingFromEnqueueAndDequeue(t *testing.T) {
	defer metrics.SetupForTesting()()

	buildTransport := func(t *testing.T) (*transport, redismock.ClientMock) {
		t.Helper()

		buckets, err := load([]byte(`{"analysis":"ba","error":"be","custom":[]}`))
		require.NoError(t, err)

		client, clientMock := redismock.NewClientMock()
		clientMock.MatchExpectationsInOrder(false)

		mockFlags := &mocks.Flags{}
		mockFlags.On("GetEphemeralEnabledPlugins", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)
		mockFlags.On("GetEphemeralSupportedEvents", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(nil)

		tnspt := &transport{
			flags: mockFlags,
			options: &Options{
				buckets:           buckets,
				redis:             client,
				logger:            zap.NewNop(),
				heartbeatInterval: time.Millisecond,
				timeout:           time.Second,
			},
			inbox: func() (string, error) {
				return "timing-inbox", nil
			},
		}

		return tnspt, clientMock
	}

	buildResponseJSON := func(t *testing.T, endMicro float64) string {
		t.Helper()
		wrapped := utils.BinaryProtoWrapper[*transportv1.Response]{
			Message: &transportv1.Response{
				Data: &transportv1.Response_Data{
					Pinned: &transportv1.Performance{
						QueueRequest: &transportv1.Performance_Observable{
							End: endMicro,
						},
					},
					Data: &transportv1.Response_Data_Data{
						Key: "worker-output-key",
					},
				},
			},
		}
		raw, err := wrapped.MarshalBinary()
		require.NoError(t, err)
		return string(raw)
	}

	for _, tc := range []struct {
		name          string
		endOffsetMicr int64
		wantValueZero bool
	}{
		{
			name:          "positive delta sets queue request value",
			endOffsetMicr: int64(60 * time.Second / time.Microsecond),
			wantValueZero: false,
		},
		{
			name:          "negative delta is clamped to zero",
			endOffsetMicr: -int64(60 * time.Second / time.Microsecond),
			wantValueZero: true,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			tnspt, clientMock := buildTransport(t)
			ctx := context.Background()
			stream := "agent.main.bucket.ba.plugin.javascript.event.execute"

			enqueueBaseMicro := time.Now().UnixNano() / 1000
			queueEndMicro := float64(enqueueBaseMicro + tc.endOffsetMicr)
			reqData := &transportv1.Request_Data_Data{}
			carrier := tracer.Propagate(ctx)

			clientMock.ExpectXAdd(&redis.XAddArgs{
				Stream:     stream,
				NoMkStream: true,
				Values: map[string]any{
					"data": &transportv1.Request{
						Inbox: "timing-inbox",
						Topic: "timing-inbox",
						Data: &transportv1.Request_Data{
							Pinned: &transportv1.Request_Data_Pinned{
								Bucket:  "ba",
								Name:    "javascript",
								Version: "v0.0.1",
								Event:   "execute",
								Carrier: carrier,
								Observability: &transportv1.Observability{
									Baggage: carrier,
								},
							},
							Data: reqData,
						},
					},
				},
			}).SetVal("1-0")

			clientMock.ExpectXRead(&redis.XReadArgs{
				Streams: []string{"timing-inbox", redisAckID},
				Count:   1,
				Block:   time.Millisecond,
			}).SetVal([]redis.XStream{
				{
					Stream: "timing-inbox",
					Messages: []redis.XMessage{
						{
							ID: "ack-1",
							Values: map[string]any{
								"data": "{}",
							},
						},
					},
				},
			})

			clientMock.ExpectXRead(&redis.XReadArgs{
				Streams: []string{"timing-inbox", redisResponseID},
				Count:   1,
				Block:   time.Second,
			}).SetVal([]redis.XStream{
				{
					Stream: "timing-inbox",
					Messages: []redis.XMessage{
						{
							ID: "resp-1",
							Values: map[string]any{
								"data": buildResponseJSON(t, queueEndMicro),
							},
						},
					},
				},
			})

			clientMock.ExpectDel("timing-inbox").SetVal(1)
			clientMock.ExpectXDel(stream, "1-0").SetVal(1)

			perf, _, err := tnspt.Execute(ctx, "javascript", reqData)
			require.NoError(t, err)
			require.NotNil(t, perf)
			require.NotNil(t, perf.QueueRequest)
			assert.Equal(t, queueEndMicro, perf.QueueRequest.End)
			if tc.wantValueZero {
				assert.Equal(t, float64(0), perf.QueueRequest.Start)
				assert.Equal(t, float64(0), perf.QueueRequest.Value)
			} else {
				assert.Greater(t, perf.QueueRequest.Start, float64(0))
				assert.Greater(t, perf.QueueRequest.Value, float64(0))
				assert.InDelta(t, perf.QueueRequest.End-perf.QueueRequest.Start, perf.QueueRequest.Value, 1.0)
			}

			require.Eventually(t, func() bool {
				return clientMock.ExpectationsWereMet() == nil
			}, time.Second, 10*time.Millisecond)
		})
	}
}
