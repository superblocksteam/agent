package redis

import (
	"context"
	"testing"
	"time"

	mocks "workers/golang/mocks/internal_/plugin_executor"

	redismock "github.com/go-redis/redismock/v9"
	redis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/worker"
	v1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
)

func TestGenerateStreams(t *testing.T) {
	testCases := []struct {
		name       string
		streamKeys []string
		want       []string
	}{
		{
			name:       "empty stream keys",
			streamKeys: []string{},
			want:       []string{},
		},
		{
			name:       "single stream key",
			streamKeys: []string{"stream1"},
			want:       []string{"stream1", ">"},
		},
		{
			name:       "multiple stream keys",
			streamKeys: []string{"stream1", "stream2", "stream3"},
			want:       []string{"stream1", "stream2", "stream3", ">", ">", ">"},
		},
	}

	for _, tc := range testCases {
		got := generateXReadArgs(tc.streamKeys)
		assert.Equal(t, tc.want, got, tc.name)
	}
}

func TestPluginInvocationAfterPollingMessage(t *testing.T) {
	testCases := []struct {
		request *v1.Request
		method  string
	}{
		{
			request: &v1.Request{
				Inbox: "someInbox",
				Data: &v1.Request_Data{
					Data: &v1.Request_Data_Data{},
					Pinned: &v1.Request_Data_Pinned{
						Name:  "v8",
						Event: string(worker.EventExecute),
					},
				},
			},
			method: "Execute",
		},
		{
			request: &v1.Request{
				Inbox: "someInbox",
				Data: &v1.Request_Data{
					Data: &v1.Request_Data_Data{},
					Pinned: &v1.Request_Data_Pinned{
						Name:  "v8",
						Event: string(worker.EventMetadata),
					},
				},
			},
			method: "Metadata",
		},
		{
			request: &v1.Request{
				Inbox: "someInbox",
				Data: &v1.Request_Data{
					Data: &v1.Request_Data_Data{},
					Pinned: &v1.Request_Data_Pinned{
						Name:  "v8",
						Event: string(worker.EventPreDelete),
					},
				},
			},
			method: "PreDelete",
		},
		{
			request: &v1.Request{
				Inbox: "someInbox",
				Data: &v1.Request_Data{
					Data: &v1.Request_Data_Data{},
					Pinned: &v1.Request_Data_Pinned{
						Name:  "v8",
						Event: string(worker.EventTest),
					},
				},
			},
			method: "Test",
		},
	}

	for _, tc := range testCases {
		redisClient, redisMock := redismock.NewClientMock()
		mockPluginExecutor := mocks.NewPluginExecutor(t)
		redisTransport := NewRedisTransport(&Options{
			RedisClient:    redisClient,
			StreamKeys:     []string{"stream1"},
			WorkerId:       "worker1",
			ConsumerGroup:  "group1",
			BlockDuration:  5 * time.Second,
			MessageCount:   10,
			MaxBytes:       100,
			PluginExecutor: mockPluginExecutor,
			Logger:         zap.NewNop(),
			ExecutionPool:  10,
		})

		byteEncoded, _ := protojson.Marshal(tc.request)
		stringEncoded := string(byteEncoded)

		redisMock.ExpectXReadGroup(&redis.XReadGroupArgs{
			Streams:  []string{"stream1", ">"},
			Group:    "group1",
			Consumer: "worker1",
			Count:    10,
			Block:    5 * time.Second,
		}).SetVal([]redis.XStream{
			{
				Stream: "stream1",
				Messages: []redis.XMessage{
					{
						ID: "someId",
						Values: map[string]any{
							"data": stringEncoded,
						},
					},
				},
			},
		})

		redisMock.ExpectXAdd(&redis.XAddArgs{
			Stream: "someInbox",
			ID:     INBOX_ACK_MESSAGE_ID,
			Values: map[string]any{
				"data": "ack",
			},
		}).SetVal("someId")
		redisMock.ExpectXAck("stream1", "group1", "someId").SetVal(1)
		if tc.method == "Execute" {
			mockPluginExecutor.On(tc.method, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, nil)
		} else {
			mockPluginExecutor.On(tc.method, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, nil)
		}
		err := redisTransport.pollOnce()
		time.Sleep(100 * time.Millisecond)
		assert.NoError(t, err)
	}
}

func TestEmptyExecutionPoolSkipsPolling(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	redisTransport := NewRedisTransport(&Options{
		RedisClient:    redisClient,
		StreamKeys:     []string{"stream1"},
		WorkerId:       "worker1",
		ConsumerGroup:  "group1",
		BlockDuration:  5 * time.Second,
		MessageCount:   2,
		MaxBytes:       100,
		PluginExecutor: mockPluginExecutor,
		Logger:         zap.NewNop(),
		ExecutionPool:  4,
	})

	req := &v1.Request{
		Inbox: "someInbox",
		Data: &v1.Request_Data{
			Data: &v1.Request_Data_Data{},
			Pinned: &v1.Request_Data_Pinned{
				Name:  "v8",
				Event: string(worker.EventExecute),
			},
		},
	}
	byteEncoded, _ := protojson.Marshal(req)
	stringEncoded := string(byteEncoded)

	redisMock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams:  []string{"stream1", ">"},
		Group:    "group1",
		Consumer: "worker1",
		Count:    2,
		Block:    5 * time.Second,
	}).SetVal([]redis.XStream{
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId1",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
				{
					ID: "someId2",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
	})

	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")

	redisMock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams:  []string{"stream1", ">"},
		Group:    "group1",
		Consumer: "worker1",
		Count:    2,
		Block:    5 * time.Second,
	}).SetVal([]redis.XStream{
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId1",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
				{
					ID: "someI2",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
	})

	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")

	redisMock.ExpectXAck("stream1", "group1", "someId1").SetVal(1)
	redisMock.ExpectXAck("stream1", "group1", "someId2").SetVal(1)
	redisMock.ExpectXAck("stream1", "group1", "someId1").SetVal(1)
	redisMock.ExpectXAck("stream1", "group1", "someId2").SetVal(1)

	mockPluginExecutor.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).WaitUntil(time.After(300*time.Millisecond)).Return(nil, nil)

	err := redisTransport.pollOnce()
	assert.NoError(t, err)
	time.Sleep(100 * time.Millisecond)
	err = redisTransport.pollOnce()
	assert.NoError(t, err)
	err = redisTransport.pollOnce()
	assert.NoError(t, err)
	mockPluginExecutor.AssertNumberOfCalls(t, "Execute", 4)
}

func TestExecutesWhenWorkerReturnedToPool(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	redisTransport := NewRedisTransport(&Options{
		RedisClient:    redisClient,
		StreamKeys:     []string{"stream1"},
		WorkerId:       "worker1",
		ConsumerGroup:  "group1",
		BlockDuration:  5 * time.Second,
		MessageCount:   2,
		MaxBytes:       100,
		PluginExecutor: mockPluginExecutor,
		Logger:         zap.NewNop(),
		ExecutionPool:  2,
	})

	req := &v1.Request{
		Inbox: "someInbox",
		Data: &v1.Request_Data{
			Data: &v1.Request_Data_Data{},
			Pinned: &v1.Request_Data_Pinned{
				Name:  "v8",
				Event: string(worker.EventExecute),
			},
		},
	}
	byteEncoded, _ := protojson.Marshal(req)
	stringEncoded := string(byteEncoded)

	redisMock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams:  []string{"stream1", ">"},
		Group:    "group1",
		Consumer: "worker1",
		Count:    2,
		Block:    5 * time.Second,
	}).SetVal([]redis.XStream{
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId1",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
				{
					ID: "someId2",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
	})
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams:  []string{"stream1", ">"},
		Group:    "group1",
		Consumer: "worker1",
		Count:    1,
		Block:    5 * time.Second,
	}).SetVal([]redis.XStream{
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId1",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
	})
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAck("stream1", "group1", "someId1").SetVal(1)
	redisMock.ExpectXAck("stream1", "group1", "someId2").SetVal(1)
	redisMock.ExpectXAck("stream1", "group1", "someId1").SetVal(1)

	mockPluginExecutor.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).WaitUntil(time.After(300*time.Millisecond)).Return(nil, nil)
	mockPluginExecutor.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).WaitUntil(time.After(600*time.Millisecond)).Return(nil, nil)

	err := redisTransport.pollOnce()
	assert.NoError(t, err)
	err = redisTransport.pollOnce()
	assert.NoError(t, err)
	err = redisTransport.pollOnce()
	time.Sleep(100 * time.Millisecond)
	assert.NoError(t, err)
	mockPluginExecutor.AssertNumberOfCalls(t, "Execute", 3)
}

func TestClosingProperlyDrainsRequests(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	redisTransport := NewRedisTransport(&Options{
		RedisClient:    redisClient,
		StreamKeys:     []string{"stream1"},
		WorkerId:       "worker1",
		ConsumerGroup:  "group1",
		BlockDuration:  5 * time.Second,
		MessageCount:   2,
		MaxBytes:       100,
		PluginExecutor: mockPluginExecutor,
		Logger:         zap.NewNop(),
		ExecutionPool:  2,
	})

	req := &v1.Request{
		Inbox: "someInbox",
		Data: &v1.Request_Data{
			Data: &v1.Request_Data_Data{},
			Pinned: &v1.Request_Data_Pinned{
				Name:  "v8",
				Event: string(worker.EventExecute),
			},
		},
	}
	byteEncoded, _ := protojson.Marshal(req)
	stringEncoded := string(byteEncoded)

	redisMock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams:  []string{"stream1", ">"},
		Group:    "group1",
		Consumer: "worker1",
		Count:    2,
		Block:    5 * time.Second,
	}).SetVal([]redis.XStream{
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
	})
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAck("stream1", "group1", "someId").SetVal(1)

	mockPluginExecutor.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).After(500*time.Millisecond).Return(nil, nil)

	err := redisTransport.pollOnce()
	assert.NoError(t, err)
	err = redisTransport.Close(context.Background())
	assert.NoError(t, err)
	assert.Equal(t, int64(2), redisTransport.executionPool.Load())
}

func TestChannelClosing(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	redisTransport := NewRedisTransport(&Options{
		RedisClient:    redisClient,
		StreamKeys:     []string{"stream1"},
		WorkerId:       "worker1",
		ConsumerGroup:  "group1",
		BlockDuration:  5 * time.Second,
		MessageCount:   10,
		MaxBytes:       100,
		PluginExecutor: mockPluginExecutor,
		Logger:         zap.NewNop(),
		ExecutionPool:  10,
	})

	req := &v1.Request{
		Inbox: "someInbox",
		Data: &v1.Request_Data{
			Data: &v1.Request_Data_Data{},
			Pinned: &v1.Request_Data_Pinned{
				Name:  "v8",
				Event: string(worker.EventExecute),
			},
		},
	}
	byteEncoded, _ := protojson.Marshal(req)
	stringEncoded := string(byteEncoded)

	redisMock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams:  []string{"stream1", ">"},
		Group:    "group1",
		Consumer: "worker1",
		Count:    10,
		Block:    5 * time.Second,
	}).SetVal([]redis.XStream{
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
		{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{
					ID: "someId",
					Values: map[string]any{
						"data": stringEncoded,
					},
				},
			},
		},
	})
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAck("stream1", "group1", "someId").SetVal(1)

	mockPluginExecutor.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).After(time.Millisecond*200).Return(nil, nil)

	err := redisTransport.pollOnce()
	assert.NoError(t, err)
	err = redisTransport.Close(context.Background())
	assert.NoError(t, err)
	assert.Equal(t, int64(10), redisTransport.executionPool.Load())
}

func TestClosingWhenPoolIsFull(t *testing.T) {
	redisClient, _ := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	redisTransport := NewRedisTransport(&Options{
		RedisClient:    redisClient,
		StreamKeys:     []string{"stream1"},
		WorkerId:       "worker1",
		ConsumerGroup:  "group1",
		BlockDuration:  5 * time.Second,
		MessageCount:   10,
		MaxBytes:       100,
		PluginExecutor: mockPluginExecutor,
		Logger:         zap.NewNop(),
		ExecutionPool:  10,
	})
	err := redisTransport.Close(context.Background())
	assert.NoError(t, err)
	assert.Equal(t, int64(10), redisTransport.executionPool.Load())
}
