package redis

import (
	"context"
	e "errors"
	"testing"

	"github.com/go-redis/redismock/v9"
	redis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

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
		client, mock := redismock.NewClientMock()

		tnspt := &transport{
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

		mock.ExpectXAdd(&redis.XAddArgs{
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

		assert.NoError(t, mock.ExpectationsWereMet(), test.name)
	}
}

func TestProcess(t *testing.T) {
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
		tnspt := &transport{
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
