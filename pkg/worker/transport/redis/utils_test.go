package redis

import (
	"context"
	"testing"

	"github.com/go-redis/redismock/v9"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/worker"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestUnwrapOneRedisProtoMessageFromStream(t *testing.T) {
	for _, test := range []struct {
		name     string
		streams  []redis.XStream
		expected *structpb.Value
		err      bool
	}{
		{
			name: "successful unwrap",
			streams: []redis.XStream{
				{
					Stream: "stream",
					Messages: []redis.XMessage{
						{
							Values: map[string]interface{}{
								"data": `"hello"`,
							},
						},
					},
				},
			},
			expected: structpb.NewStringValue("hello"),
		},
		{
			name: "no values",
			streams: []redis.XStream{
				{
					Stream: "stream",
					Messages: []redis.XMessage{
						{},
					},
				},
			},
			err: true,
		},
		{
			name:    "error - wrong number of streams",
			streams: []redis.XStream{}, // no streams
			err:     true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, err := UnwrapOneRedisProtoMessageFromStream(
				test.streams,
				func() *structpb.Value { return &structpb.Value{} },
				"stream",
				"data",
			)

			if test.err {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.True(t, proto.Equal(test.expected, result))
			}
		})
	}
}

func TestUnwrapRedisProtoMessages(t *testing.T) {
	for _, test := range []struct {
		name     string
		messages []redis.XMessage
		expected []*structpb.Value
	}{
		{
			name: "simple",
			messages: []redis.XMessage{
				{
					Values: map[string]any{
						"data": `"hello"`,
					},
				},
			},
			expected: []*structpb.Value{
				structpb.NewStringValue("hello"),
			},
		},
		{
			name: "wrong location partial",
			messages: []redis.XMessage{
				{
					Values: map[string]any{
						"data": `"hello"`,
					},
				},
				{
					Values: map[string]any{
						"frank": `"hello"`,
					},
				},
				{
					Values: map[string]any{
						"data": 5,
					},
				},
			},
			expected: []*structpb.Value{
				structpb.NewStringValue("hello"),
				nil,
				nil,
			},
		},
		{
			name: "wrong location",
			messages: []redis.XMessage{
				{
					Values: map[string]any{
						"frank": `"hello"`,
					},
				},
			},
			expected: []*structpb.Value{nil},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, err := UnwrapRedisProtoMessages[*structpb.Value](
				test.messages,
				func() *structpb.Value { return &structpb.Value{} },
				"data",
			)

			assert.NoError(t, err)
			assert.Equal(t, len(result), len(test.expected))

			for idx, expected := range test.expected {
				assert.True(t, proto.Equal(expected, result[idx]))
			}
		})
	}
}

func TestSendWorkerMessage(t *testing.T) {
	for _, test := range []struct {
		name     string
		stream   string
		inbox    string
		bucket   string
		plugin   string
		event    worker.Event
		req      *transportv1.Request_Data_Data
		expected *transportv1.Request
	}{
		{
			name:   "simple",
			stream: "stream",
			inbox:  "inbox",
			bucket: "bucket",
			plugin: "plugin",
			event:  worker.EventExecute,
			req:    &transportv1.Request_Data_Data{},
			expected: &transportv1.Request{
				Inbox: "inbox",
				Topic: "inbox",
				Data: &transportv1.Request_Data{
					Pinned: &transportv1.Request_Data_Pinned{
						Bucket:  "bucket",
						Name:    "plugin",
						Version: "v0.0.1", // NOTE(frank): The version is meaningless here!
						Event:   string(worker.EventExecute),
						Carrier: map[string]string{},
					},
					Data: &transportv1.Request_Data_Data{},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			client, mock := redismock.NewClientMock()
			mock.ExpectXAdd(&redis.XAddArgs{
				Stream:     test.stream,
				NoMkStream: true,
				Values: map[string]any{
					"data": test.expected,
				},
			}).SetVal("0-0")
			_, err := SendWorkerMessage(worker.WithEvent(ctx, worker.Event(test.event)), client, test.stream, test.inbox, test.bucket, test.plugin, test.req)
			assert.NoError(t, err)
		})
	}
}
