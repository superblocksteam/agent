package redis

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"

	sandboxmetrics "workers/ephemeral/task-manager/internal/metrics"
	"workers/ephemeral/task-manager/internal/plugin"
	mocks "workers/ephemeral/task-manager/mocks/internal_/plugin_executor"
	mocksstore "workers/ephemeral/task-manager/mocks/internal_/store/redis"

	redismock "github.com/go-redis/redismock/v9"
	redis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	redisstreams "github.com/superblocksteam/agent/pkg/redis/streams"
	"github.com/superblocksteam/agent/pkg/worker"
	v1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
	"google.golang.org/protobuf/encoding/protojson"
)

// registerSandboxMetricsForTest installs a fresh ManualReader and metric instruments
func registerSandboxMetricsForTest(t *testing.T) *metric.ManualReader {
	t.Helper()

	reader := metric.NewManualReader()
	provider := metric.NewMeterProvider(metric.WithReader(reader))
	otel.SetMeterProvider(provider)
	require.NoError(t, sandboxmetrics.RegisterMetricsWithMeter(provider.Meter(sandboxmetrics.MeterName)))
	return reader
}

func waitExecutionPoolRestored(t *testing.T, transport *redisTransport, want int64) {
	t.Helper()
	require.Eventually(t, func() bool {
		return transport.executionPool.Load() == want
	}, time.Second, 10*time.Millisecond, "execution pool should reach %d", want)
}

func collectXReadGroupMessagesRead(t *testing.T, reader *metric.ManualReader) int64 {
	t.Helper()

	var collected metricdata.ResourceMetrics
	require.NoError(t, reader.Collect(context.Background(), &collected))

	var total int64
	for _, scope := range collected.ScopeMetrics {
		for _, m := range scope.Metrics {
			if m.Name != "worker_redis_messages_read_total" {
				continue
			}
			for _, dp := range m.Data.(metricdata.Sum[int64]).DataPoints {
				for _, attr := range dp.Attributes.ToSlice() {
					if attr.Key == sandboxmetrics.AttrRedisMessageSource && attr.Value.AsString() == sandboxmetrics.RedisMessageSourceXReadGroup {
						total += dp.Value
					}
				}
			}
		}
	}
	return total
}

func TestGroupReaderOverflowCacheViaTransportReader(t *testing.T) {
	redisClient, redisMock := redismock.NewClientMock()
	transport := NewRedisTransport(&Options{
		RedisClient:   redisClient,
		StreamKeys:    []string{"stream1"},
		WorkerId:      "worker1",
		ConsumerGroup: "group1",
		MessageCount:  2,
		Logger:        zap.NewNop(),
		ExecutionPool: 2,
	})

	expectAutoClaimAllStreams(redisMock, []string{"stream1"}, "group1", "worker1", 2)
	redisMock.ExpectXReadGroup(multiStreamReadArgs([]string{"stream1"}, "group1", "worker1", 2, 0)).
		SetVal([]redis.XStream{{Stream: "stream1", Messages: []redis.XMessage{
			{ID: "1-0"}, {ID: "1-1"}, {ID: "1-2"},
		}}})

	_, stats, err := transport.groupReader.XReadGroupMaxCount(context.Background(), redisstreams.XReadGroupMaxCountArgs{
		MaxCount: 2,
		Block:    0,
	})
	require.NoError(t, err)
	require.Equal(t, int64(1), stats.CacheSize)
	require.NoError(t, redisMock.ExpectationsWereMet())
}

func TestPollOncePartialReadDispatchesAndLogs(t *testing.T) {
	registerSandboxMetricsForTest(t)

	core, logs := observer.New(zap.ErrorLevel)
	logger := zap.New(core)

	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       0,
		MessageCount:        2,
		PluginExecutor:      mockPluginExecutor,
		Logger:              logger,
		ExecutionPool:       2,
		FileContextProvider: mockFileContextProvider,
	})

	req := minimalExecuteRequest(t)
	payload := marshalRequest(t, req)

	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Return(plugin.PluginStatus{Available: true, DegradationState: plugin.DegradationState_NONE})

	mockPluginExecutor.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, nil).Times(3)
	mockFileContextProvider.On("SetFileContext", mock.Anything, mock.Anything).Return().Maybe()
	mockFileContextProvider.On("CleanupExecution", mock.Anything).Return().Maybe()

	// First poll: deliver two messages and cache a third (MessageCount=2).
	expectAutoClaimAllStreams(redisMock, []string{"stream1"}, "group1", "worker1", 2)
	redisMock.ExpectXReadGroup(multiStreamReadArgs([]string{"stream1"}, "group1", "worker1", 2, 0)).
		SetVal([]redis.XStream{{
			Stream: "stream1",
			Messages: []redis.XMessage{
				{ID: "1-0", Values: map[string]any{"data": payload}},
				{ID: "1-1", Values: map[string]any{"data": payload}},
				{ID: "1-2", Values: map[string]any{"data": payload}},
			},
		}})
	redisMock.ExpectXAck("stream1", "group1", "1-0").SetVal(1)
	redisMock.ExpectXAck("stream1", "group1", "1-1").SetVal(1)
	redisMock.MatchExpectationsInOrder(false)

	handled, err := transport.pollOnce()
	require.NoError(t, err)
	assert.True(t, handled)

	waitExecutionPoolRestored(t, transport, 2)

	// Execution pool fully restored (count=2); cached message plus xreadgroup failure → partial read log.
	expectAutoClaimAllStreams(redisMock, []string{"stream1"}, "group1", "worker1", 1)
	redisMock.ExpectXReadGroup(multiStreamReadArgs([]string{"stream1"}, "group1", "worker1", 1, 0)).
		SetErr(errors.New("xreadgroup unavailable"))
	redisMock.ExpectXAck("stream1", "group1", "1-2").SetVal(1)

	handled, err = transport.pollOnce()
	require.NoError(t, err)
	assert.True(t, handled)

	entries := logs.FilterMessage("partial redis read; returning messages collected before failure").All()
	require.Len(t, entries, 1)

	waitExecutionPoolRestored(t, transport, 2)
	require.NoError(t, redisMock.ExpectationsWereMet())
}

func TestHandleMessageSkipsWhenAlreadyAcked(t *testing.T) {
	registerSandboxMetricsForTest(t)

	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       1,
		FileContextProvider: mockFileContextProvider,
	})

	redisMock.ExpectXAck("stream1", "group1", "1-0").SetVal(0)

	transport.handleMessage(&redis.XMessage{
		ID:     "1-0",
		Values: map[string]any{"data": `{}`},
	}, "stream1")

	mockPluginExecutor.AssertNotCalled(t, "Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
	require.NoError(t, redisMock.ExpectationsWereMet())
}

func TestHandleMessageSkipsWhenAckErrors(t *testing.T) {
	registerSandboxMetricsForTest(t)

	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       1,
		FileContextProvider: mockFileContextProvider,
	})

	redisMock.ExpectXAck("stream1", "group1", "1-0").SetErr(errors.New("ack failed"))

	transport.handleMessage(&redis.XMessage{
		ID:     "1-0",
		Values: map[string]any{"data": `{}`},
	}, "stream1")

	mockPluginExecutor.AssertNotCalled(t, "Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
	require.NoError(t, redisMock.ExpectationsWereMet())
}

func TestPollOnceRecordsReadStatsViaObserver(t *testing.T) {
	metricReader := registerSandboxMetricsForTest(t)

	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       0,
		MessageCount:        1,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       1,
		FileContextProvider: mockFileContextProvider,
		FleetName:           "test-fleet",
		Ephemeral:           true,
	})

	payload := marshalRequest(t, minimalExecuteRequest(t))
	mockPluginExecutor.On("ArePluginsAvailable", mock.Anything).
		Return(plugin.PluginStatus{Available: true, DegradationState: plugin.DegradationState_NONE})
	expectGroupReaderRead(redisMock, []string{"stream1"}, "group1", "worker1", 1, 0, []redis.XStream{
		{Stream: "stream1", Messages: []redis.XMessage{{ID: "1-0", Values: map[string]any{"data": payload}}}},
	}, nil)
	redisMock.ExpectXAck("stream1", "group1", "1-0").SetVal(1)
	mockPluginExecutor.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, nil).Once()
	mockFileContextProvider.On("SetFileContext", mock.Anything, mock.Anything).Return().Maybe()
	mockFileContextProvider.On("CleanupExecution", mock.Anything).Return().Maybe()

	handled, err := transport.pollOnce()
	require.NoError(t, err)
	assert.True(t, handled)

	waitExecutionPoolRestored(t, transport, 1)
	require.NoError(t, redisMock.ExpectationsWereMet())

	require.Equal(t, int64(1), collectXReadGroupMessagesRead(t, metricReader))
}

func minimalExecuteRequest(t *testing.T) *v1.Request {
	t.Helper()
	return &v1.Request{
		Inbox: "inbox",
		Data: &v1.Request_Data{
			Data: &v1.Request_Data_Data{
				Props: &v1.Request_Data_Data_Props{ExecutionId: "exec-1", Version: "v3"},
			},
			Pinned: &v1.Request_Data_Pinned{
				Name:  "python",
				Event: string(worker.EventExecute),
			},
		},
	}
}

func marshalRequest(t *testing.T, req *v1.Request) string {
	t.Helper()
	payload, err := protojson.Marshal(req)
	require.NoError(t, err)
	return string(payload)
}

func collectWorkerDegradedMode(t *testing.T, reader *metric.ManualReader) int64 {
	t.Helper()

	var collected metricdata.ResourceMetrics
	require.NoError(t, reader.Collect(context.Background(), &collected))

	var total int64
	for _, scope := range collected.ScopeMetrics {
		for _, m := range scope.Metrics {
			if m.Name != "worker_degraded_mode" {
				continue
			}
			for _, dp := range m.Data.(metricdata.Gauge[int64]).DataPoints {
				total += dp.Value
			}
		}
	}
	return total
}

func TestClose_ClearsDegradedModeMetric(t *testing.T) {
	reader := registerSandboxMetricsForTest(t)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	executionPool := &atomic.Int64{}
	executionPool.Store(1) // no in-flight workers; Close returns immediately

	alive := newTestAlive()

	transport := &redisTransport{
		context:           ctx,
		cancel:            cancel,
		logger:            zap.NewNop(),
		fleetName:         "test-fleet",
		alive:             alive,
		serviceDegraded:   true,
		executionPool:     executionPool,
		executionPoolSize: 1,
		workerReturned:    make(chan int64, 1),
		drainCompleteCh:   make(chan struct{}),
	}
	require.NoError(t, transport.registerDegradedModeMetric())
	require.Equal(t, int64(1), collectWorkerDegradedMode(t, reader))

	closeCtx, closeCancel := context.WithTimeout(context.Background(), time.Second)
	defer closeCancel()
	require.NoError(t, transport.Close(closeCtx))
	require.False(t, transport.serviceDegraded)
	require.Equal(t, int64(0), collectWorkerDegradedMode(t, reader))
}
