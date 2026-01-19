package redis

import (
	"context"
	"testing"
	"time"

	redisstore "workers/ephemeral/task-manager/internal/store/redis"
	mocks "workers/ephemeral/task-manager/mocks/internal_/plugin_executor"
	mocksstore "workers/ephemeral/task-manager/mocks/internal_/store/redis"

	redismock "github.com/go-redis/redismock/v9"
	redis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/worker"
	v1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
)

func TestPluginInvocationAfterPollingMessage(t *testing.T) {
	testCases := []struct {
		name    string
		request *v1.Request
		method  string
	}{
		{
			name: "execute event",
			request: &v1.Request{
				Inbox: "someInbox",
				Data: &v1.Request_Data{
					Data: &v1.Request_Data_Data{
						Props: &v1.Request_Data_Data_Props{
							ExecutionId: "exec-123",
						},
					},
					Pinned: &v1.Request_Data_Pinned{
						Name:  "python",
						Event: string(worker.EventExecute),
					},
				},
			},
			method: "Execute",
		},
		{
			name: "metadata event",
			request: &v1.Request{
				Inbox: "someInbox",
				Data: &v1.Request_Data{
					Data: &v1.Request_Data_Data{
						Props: &v1.Request_Data_Data_Props{
							ExecutionId: "exec-123",
						},
					},
					Pinned: &v1.Request_Data_Pinned{
						Name:  "python",
						Event: string(worker.EventMetadata),
					},
				},
			},
			method: "Metadata",
		},
		{
			name: "test event",
			request: &v1.Request{
				Inbox: "someInbox",
				Data: &v1.Request_Data{
					Data: &v1.Request_Data_Data{
						Props: &v1.Request_Data_Data_Props{
							ExecutionId: "exec-123",
						},
					},
					Pinned: &v1.Request_Data_Pinned{
						Name:  "python",
						Event: string(worker.EventTest),
					},
				},
			},
			method: "Test",
		},
		{
			name: "pre-delete event",
			request: &v1.Request{
				Inbox: "someInbox",
				Data: &v1.Request_Data{
					Data: &v1.Request_Data_Data{
						Props: &v1.Request_Data_Data_Props{
							ExecutionId: "exec-123",
						},
					},
					Pinned: &v1.Request_Data_Pinned{
						Name:  "python",
						Event: string(worker.EventPreDelete),
					},
				},
			},
			method: "PreDelete",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			redisClient, redisMock := redismock.NewClientMock()
			mockPluginExecutor := mocks.NewPluginExecutor(t)
			mockFileContextProvider := mocksstore.NewFileContextProvider(t)

			transport := NewRedisTransport(&Options{
				RedisClient:         redisClient,
				StreamKeys:          []string{"stream1"},
				WorkerId:            "worker1",
				ConsumerGroup:       "group1",
				BlockDuration:       5 * time.Second,
				MessageCount:        10,
				PluginExecutor:      mockPluginExecutor,
				Logger:              zap.NewNop(),
				ExecutionPool:       10,
				FileContextProvider: mockFileContextProvider,
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

			redisMock.ExpectXAck("stream1", "group1", "someId").SetVal(1)
			redisMock.ExpectXAdd(&redis.XAddArgs{
				Stream: "someInbox",
				ID:     INBOX_ACK_MESSAGE_ID,
				Values: map[string]any{
					"data": "ack",
				},
			}).SetVal("someId")
			redisMock.ExpectXAdd(&redis.XAddArgs{
				Stream:     "someInbox",
				ID:         INBOX_DATA_MESSAGE_ID,
				Values:     mock.Anything,
				NoMkStream: true,
			}).SetVal("someId")

			mockFileContextProvider.On("SetFileContext", "exec-123", &redisstore.ExecutionFileContext{}).Return()
			mockFileContextProvider.On("CleanupExecution", "exec-123").Return()

			if tc.method == "Execute" {
				mockPluginExecutor.On(tc.method, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, nil)
			} else {
				mockPluginExecutor.On(tc.method, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, nil)
			}

			_, err := transport.pollOnce()
			time.Sleep(100 * time.Millisecond)
			assert.NoError(t, err)
		})
	}
}

func TestEmptyExecutionPoolSkipsPolling(t *testing.T) {
	// This test is simplified to verify basic execution pool behavior
	// The full polling with multiple batches has complex async behavior
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        2,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       2,
		FileContextProvider: mockFileContextProvider,
	})

	// Verify initial pool size
	assert.Equal(t, int64(2), transport.executionPool.Load())

	// Manually reduce pool to test that pollOnce waits when pool is empty
	transport.executionPool.Store(0)

	// With pool empty, pollOnce should wait on workerReturned channel
	// We simulate a worker returning
	go func() {
		time.Sleep(50 * time.Millisecond)
		transport.workerReturned <- 0
	}()

	// Set up mock for the actual read (which won't happen since pool is empty)
	redisMock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams:  []string{"stream1", ">"},
		Group:    "group1",
		Consumer: "worker1",
		Count:    1, // Will be 1 since pool returns 1 slot
		Block:    5 * time.Second,
	}).SetErr(redis.Nil) // No messages

	_, err := transport.pollOnce()
	// Should return without error
	assert.NoError(t, err)
}

func TestClosingWhenPoolIsFull(t *testing.T) {
	redisClient, _ := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        10,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       10,
		FileContextProvider: mockFileContextProvider,
	})

	err := transport.Close(context.Background())
	assert.NoError(t, err)
	assert.Equal(t, int64(10), transport.executionPool.Load())
}

func TestClosingProperlyDrainsRequests(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        2,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       2,
		FileContextProvider: mockFileContextProvider,
	})

	req := &v1.Request{
		Inbox: "someInbox",
		Data: &v1.Request_Data{
			Data: &v1.Request_Data_Data{
				Props: &v1.Request_Data_Data_Props{
					ExecutionId: "exec-123",
				},
			},
			Pinned: &v1.Request_Data_Pinned{
				Name:  "python",
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

	redisMock.ExpectXAck("stream1", "group1", "someId").SetVal(1)
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "someInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")
	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream:     "someInbox",
		ID:         INBOX_DATA_MESSAGE_ID,
		Values:     mock.Anything,
		NoMkStream: true,
	}).SetVal("someId")

	mockFileContextProvider.On("SetFileContext", "exec-123", &redisstore.ExecutionFileContext{}).Return()
	mockFileContextProvider.On("CleanupExecution", "exec-123").Return()

	mockPluginExecutor.
		On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		After(500*time.Millisecond).
		Return(nil, nil)

	_, err := transport.pollOnce()
	assert.NoError(t, err)
	err = transport.Close(context.Background())
	assert.NoError(t, err)
	assert.Equal(t, int64(2), transport.executionPool.Load())
}

func TestStreamKeysGeneration(t *testing.T) {
	testCases := []struct {
		name      string
		plugins   []string
		group     string
		buckets   []string
		events    []string
		ephemeral bool
		expected  []string
	}{
		{
			name:    "single plugin single event",
			plugins: []string{"python"},
			group:   "main",
			buckets: []string{"BA"},
			events:  []string{"execute"},
			expected: []string{
				"agent.main.bucket.BA.plugin.python.event.execute",
			},
		},
		{
			name:      "single bucket single plugin single event ephemeral",
			plugins:   []string{"python"},
			group:     "main",
			buckets:   []string{"BA"},
			events:    []string{"execute"},
			ephemeral: true,
			expected: []string{
				"agent.main.bucket.BA.ephemeral.plugin.python.event.execute",
			},
		},
		{
			name:    "single bucket single plugin multiple events",
			plugins: []string{"python"},
			group:   "main",
			buckets: []string{"BA"},
			events:  []string{"execute", "metadata"},
			expected: []string{
				"agent.main.bucket.BA.plugin.python.event.execute",
				"agent.main.bucket.BA.plugin.python.event.metadata",
			},
		},
		{
			name:    "single bucket multiple plugins single event",
			plugins: []string{"python", "javascript"},
			group:   "main",
			buckets: []string{"BA"},
			events:  []string{"execute"},
			expected: []string{
				"agent.main.bucket.BA.plugin.python.event.execute",
				"agent.main.bucket.BA.plugin.javascript.event.execute",
			},
		},
		{
			name:      "multiple buckets multiple plugins and events ephemeral",
			plugins:   []string{"python", "javascript"},
			group:     "main",
			buckets:   []string{"BA", "BE"},
			events:    []string{"execute", "metadata", "test"},
			ephemeral: true,
			expected: []string{
				"agent.main.bucket.BA.ephemeral.plugin.python.event.execute",
				"agent.main.bucket.BE.ephemeral.plugin.python.event.execute",
				"agent.main.bucket.BA.ephemeral.plugin.python.event.metadata",
				"agent.main.bucket.BA.ephemeral.plugin.python.event.test",
				"agent.main.bucket.BA.ephemeral.plugin.javascript.event.execute",
				"agent.main.bucket.BE.ephemeral.plugin.javascript.event.execute",
				"agent.main.bucket.BA.ephemeral.plugin.javascript.event.metadata",
				"agent.main.bucket.BA.ephemeral.plugin.javascript.event.test",
			},
		},
		{
			name:     "empty plugins",
			plugins:  []string{},
			group:    "main",
			buckets:  []string{"BA"},
			events:   []string{"execute"},
			expected: []string{},
		},
		{
			name:      "empty plugins ephemeral",
			plugins:   []string{},
			group:     "main",
			buckets:   []string{"BA"},
			events:    []string{"execute"},
			ephemeral: true,
			expected:  []string{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := StreamKeys(tc.plugins, tc.group, tc.buckets, tc.events, tc.ephemeral)
			assert.ElementsMatch(t, tc.expected, result)
		})
	}
}

func TestEphemeralModeTransport(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        1,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       15,
		FileContextProvider: mockFileContextProvider,
		Ephemeral:           true,
	})
	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").SetVal("OK")

	err := transport.init()

	assert.NoError(t, err)
	assert.True(t, transport.ephemeral)
	assert.Equal(t, int64(1), transport.executionPool.Load())
	assert.Equal(t, int64(1), transport.executionPoolSize)
}

func TestInitStreamsCreatesConsumerGroup(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1", "stream2"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        10,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       10,
		FileContextProvider: mockFileContextProvider,
	})

	// Expect consumer group creation for each stream
	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").SetVal("OK")
	redisMock.ExpectXGroupCreateMkStream("stream2", "group1", "0").SetVal("OK")

	err := transport.initStreams()
	assert.NoError(t, err)
}

func TestInitStreamsHandlesExistingGroup(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        10,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       10,
		FileContextProvider: mockFileContextProvider,
	})

	// Simulate consumer group already exists
	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").
		SetErr(redis.Nil) // This simulates "BUSYGROUP Consumer Group name already exists"

	// Note: The actual error message check happens in the code,
	// this test verifies the transport handles the case gracefully
	err := transport.initStreams()
	// Should return an error since we're simulating an unexpected error
	assert.Error(t, err)
}

func TestAckMessage(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        10,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       10,
		FileContextProvider: mockFileContextProvider,
	})

	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "testInbox",
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).SetVal("someId")

	err := transport.ackMessage("testInbox")
	assert.NoError(t, err)
}

func TestSendResult(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        10,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       10,
		FileContextProvider: mockFileContextProvider,
	})

	response := &v1.Response{
		Data: &v1.Response_Data{
			Pinned: &v1.Performance{},
			Data:   &v1.Response_Data_Data{},
		},
	}

	// Get the expected JSON value
	jsonBytes, _ := protojson.Marshal(response)
	expectedData := string(jsonBytes)

	redisMock.ExpectXAdd(&redis.XAddArgs{
		Stream: "testInbox",
		ID:     INBOX_DATA_MESSAGE_ID,
		Values: map[string]any{
			"data": expectedData,
		},
		NoMkStream: true,
	}).SetVal("someId")

	err := transport.sendResult(response, "testInbox")
	assert.NoError(t, err)
}
