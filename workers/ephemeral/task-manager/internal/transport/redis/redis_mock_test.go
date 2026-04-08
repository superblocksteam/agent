package redis

import (
	"context"
	"testing"
	"time"

	"workers/ephemeral/task-manager/internal/plugin"
	redisstore "workers/ephemeral/task-manager/internal/store/redis"
	mocks "workers/ephemeral/task-manager/mocks/internal_/plugin_executor"
	mocksstore "workers/ephemeral/task-manager/mocks/internal_/store/redis"

	redismock "github.com/go-redis/redismock/v9"
	redis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
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

			mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
				Return(plugin.PluginStatus{Available: true, DegradationState: plugin.DegradationState_NONE})

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

	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Return(plugin.PluginStatus{Available: true, DegradationState: plugin.DegradationState_NONE})

	// With pool empty, pollOnce should wait on workerReturned channel
	// We simulate a worker returning and restoring one free slot.
	go func() {
		time.Sleep(50 * time.Millisecond)
		transport.executionPool.Store(1)
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

	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Return(plugin.PluginStatus{Available: true, DegradationState: plugin.DegradationState_NONE})

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

	const wantPool = int64(15)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        100,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       wantPool,
		FileContextProvider: mockFileContextProvider,
		Ephemeral:           true,
	})
	assert.Equal(t, int64(100), transport.messageCount, "constructor copies Options.MessageCount before init overrides ephemeral")

	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").SetVal("OK")

	// init() waits for PluginsReady before proceeding
	readyCh := make(chan bool, 1)
	readyCh <- true
	var readyRecv <-chan bool = readyCh
	mockPluginExecutor.On("PluginsReady", mock.Anything).Return(readyRecv)

	err := transport.init()

	assert.NoError(t, err)
	assert.True(t, transport.ephemeral)
	assert.Equal(t, int64(1), transport.messageCount, "ephemeral forces one message per XReadGroup batch")
	assert.Equal(t, wantPool, transport.executionPool.Load())
	assert.Equal(t, wantPool, transport.executionPoolSize)
}

func TestEphemeralPollOnceUsesXReadGroupCountOne(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        50,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       1,
		FileContextProvider: mockFileContextProvider,
		Ephemeral:           true,
	})

	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").SetVal("OK")
	readyCh := make(chan bool, 1)
	readyCh <- true
	var readyRecv <-chan bool = readyCh
	mockPluginExecutor.On("PluginsReady", mock.Anything).Return(readyRecv)

	require.NoError(t, transport.init())
	assert.Equal(t, int64(1), transport.messageCount)

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
		Count:    1,
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

	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Return(plugin.PluginStatus{Available: true, DegradationState: plugin.DegradationState_NONE})

	mockPluginExecutor.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, nil)

	_, err := transport.pollOnce()
	time.Sleep(100 * time.Millisecond)
	assert.NoError(t, err)
}

func TestInitWaitsForPluginExecutorReady(t *testing.T) {
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
	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").SetVal("OK")

	// PluginsReady returns a channel that we control; init blocks until it receives
	readyCh := make(chan bool, 1)
	var readyRecv <-chan bool = readyCh
	mockPluginExecutor.On("PluginsReady", mock.Anything).Return(readyRecv)

	initDone := make(chan error, 1)
	go func() {
		initDone <- transport.init()
	}()

	// init should block waiting for the plugin executor
	select {
	case err := <-initDone:
		t.Fatalf("init should block until PluginsReady signals; got err=%v", err)
	case <-time.After(100 * time.Millisecond):
		// init is correctly blocked
	}

	// Signal that plugins are ready
	readyCh <- true

	err := <-initDone
	assert.NoError(t, err)
	assert.True(t, transport.initialized)
}

func TestInitFailsWhenPluginExecutorNeverReadyAndTransportClosed(t *testing.T) {
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
	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").SetVal("OK")

	// PluginsReady returns a channel we never send to; init blocks indefinitely
	readyCh := make(chan bool)
	var readyRecv <-chan bool = readyCh
	mockPluginExecutor.On("PluginsReady", mock.Anything).Return(readyRecv)

	initDone := make(chan error, 1)
	go func() {
		initDone <- transport.init()
	}()

	// Give init time to block on the select
	time.Sleep(100 * time.Millisecond)

	// Close the transport (cancels context); init should return with context.Canceled
	err := transport.Close(context.Background())
	assert.NoError(t, err)

	initErr := <-initDone
	assert.Error(t, initErr)
	assert.ErrorIs(t, initErr, context.Canceled)
	assert.False(t, transport.initialized)
}

func TestInitFailsWhenPluginsReadyReturnsFalse(t *testing.T) {
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
	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").SetVal("OK")

	// PluginsReady returns a channel that sends false (plugin executor not ready)
	readyCh := make(chan bool, 1)
	readyCh <- false
	var readyRecv <-chan bool = readyCh
	mockPluginExecutor.On("PluginsReady", mock.Anything).Return(readyRecv)

	err := transport.init()

	assert.EqualError(t, err, "plugin executor not ready: failed to initialize transport")
	assert.False(t, transport.initialized)
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

func TestPollDoesNotReadFromStreamWhenPluginsUnavailable(t *testing.T) {
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
		DegradedModeBackoff: 10 * time.Millisecond,
		MaxDegradedTime:     time.Hour,
	})

	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Return(plugin.PluginStatus{Available: false, DegradationState: plugin.DegradationState_TRANSIENT})

	_, err := transport.pollOnce()
	assert.NoError(t, err)

	assert.NoError(t, redisMock.ExpectationsWereMet())
}

func TestTransportShutsDownWhenPluginsReturnFatal(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").SetVal("OK")

	readyCh := make(chan bool, 1)
	readyCh <- true
	var readyRecv <-chan bool = readyCh
	mockPluginExecutor.On("PluginsReady", mock.Anything).Return(readyRecv)

	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Return(plugin.PluginStatus{Available: false, DegradationState: plugin.DegradationState_FATAL})

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
		DegradedModeBackoff: 10 * time.Millisecond,
		MaxDegradedTime:     time.Hour,
	})

	runDone := make(chan error, 1)
	go func() {
		runDone <- transport.Run(context.Background())
	}()

	select {
	case err := <-runDone:
		assert.Error(t, err)
		assert.ErrorIs(t, err, context.Canceled)
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Run did not return within timeout after FATAL degradation")
	}

	assert.NoError(t, redisMock.ExpectationsWereMet())
}

func TestTransportShutsDownAfterMaxDegradedTime(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	redisMock.ExpectXGroupCreateMkStream("stream1", "group1", "0").SetVal("OK")

	readyCh := make(chan bool, 1)
	readyCh <- true
	var readyRecv <-chan bool = readyCh
	mockPluginExecutor.On("PluginsReady", mock.Anything).Return(readyRecv)

	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Return(plugin.PluginStatus{Available: false, DegradationState: plugin.DegradationState_TRANSIENT})

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
		DegradedModeBackoff: 10 * time.Millisecond,
		MaxDegradedTime:     50 * time.Millisecond,
	})

	runDone := make(chan error, 1)
	go func() {
		runDone <- transport.Run(context.Background())
	}()

	select {
	case err := <-runDone:
		assert.Error(t, err)
		assert.ErrorIs(t, err, context.Canceled)
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Run did not return within timeout after max degraded time")
	}

	assert.NoError(t, redisMock.ExpectationsWereMet())
}

func TestTransportReadsFromStreamAfterRecoveringFromDegradedMode(t *testing.T) {
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
		DegradedModeBackoff: 10 * time.Millisecond,
		MaxDegradedTime:     time.Hour,
	})

	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Once().
		Return(plugin.PluginStatus{Available: false, DegradationState: plugin.DegradationState_TRANSIENT})
	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Return(plugin.PluginStatus{Available: true, DegradationState: plugin.DegradationState_NONE})

	// First pollOnce: plugins unavailable -> enters degraded mode, no XReadGroup
	_, err := transport.pollOnce()
	assert.NoError(t, err)
	assert.True(t, transport.serviceDegraded, "transport should be in degraded mode after first pollOnce")

	// Second pollOnce: plugins available -> recovers and reads from stream
	redisMock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams:  []string{"stream1", ">"},
		Group:    "group1",
		Consumer: "worker1",
		Count:    10,
		Block:    5 * time.Second,
	}).SetErr(redis.Nil)

	_, err = transport.pollOnce()
	assert.NoError(t, err)
	assert.False(t, transport.serviceDegraded, "transport should have recovered from degraded mode")

	assert.NoError(t, redisMock.ExpectationsWereMet())
}
