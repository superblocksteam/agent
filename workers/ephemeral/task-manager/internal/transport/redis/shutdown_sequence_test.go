package redis

import (
	"context"
	"fmt"
	"net"
	"sync"
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
	mockstore "github.com/superblocksteam/agent/pkg/store/mock"
	"github.com/superblocksteam/agent/pkg/worker"
	v1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/encoding/protojson"
)

func getFreePortForShutdownTest(t *testing.T) int {
	t.Helper()

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	port := lis.Addr().(*net.TCPAddr).Port
	require.NoError(t, lis.Close())
	return port
}

func assertVariableStoreReachableAtPort(t *testing.T, port int) {
	t.Helper()

	conn, err := grpc.NewClient(
		fmt.Sprintf("127.0.0.1:%d", port),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	require.NoError(t, err)
	defer conn.Close()

	client := workerv1.NewSandboxVariableStoreServiceClient(conn)
	_, err = client.GetVariable(context.Background(), &workerv1.GetVariableRequest{
		ExecutionId: "exec-shutdown-sequence",
		Key:         "exec-shutdown-sequence.context.probe",
	})
	require.NoError(t, err)
}

func TestShutdownSequence_VariableStoreReachableDuringTransportDrain(t *testing.T) {
	drainCompleteCh := make(chan struct{})

	variableStorePort := getFreePortForShutdownTest(t)
	mockKvStore := mockstore.NewStore(t)
	mockKvStore.On("Read", mock.Anything, mock.Anything).Return([]any{"value"}, nil).Maybe()

	variableStore := redisstore.NewVariableStoreGRPC(
		redisstore.WithKvStore(mockKvStore),
		redisstore.WithServer(grpc.NewServer()),
		redisstore.WithLogger(zap.NewNop()),
		redisstore.WithPort(variableStorePort),
	)

	groupCtx, groupCancel := context.WithCancel(context.Background())
	defer groupCancel()

	varStoreErrCh := make(chan error, 1)
	go func() { varStoreErrCh <- variableStore.Run(groupCtx) }()

	require.Eventually(t, func() bool {
		conn, err := net.DialTimeout("tcp", fmt.Sprintf("127.0.0.1:%d", variableStorePort), 100*time.Millisecond)
		if err != nil {
			return false
		}
		_ = conn.Close()
		return true
	}, 5*time.Second, 50*time.Millisecond)

	redisClient, redisMock := redismock.NewClientMock()
	mockPluginExecutor := mocks.NewPluginExecutor(t)
	mockFileContextProvider := mocksstore.NewFileContextProvider(t)

	executeStarted := make(chan struct{})
	executeUnblock := make(chan struct{})

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
	byteEncoded, err := protojson.Marshal(req)
	require.NoError(t, err)
	stringEncoded := string(byteEncoded)

	expectGroupReaderRead(redisMock, []string{"stream1"}, "group1", "worker1", 1, 5*time.Second, []redis.XStream{
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
	}, nil)

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
		On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Run(func(mock.Arguments) {
			close(executeStarted)
			<-executeUnblock
		}).
		Return(nil, nil)

	transport := NewRedisTransport(&Options{
		RedisClient:         redisClient,
		StreamKeys:          []string{"stream1"},
		WorkerId:            "worker1",
		ConsumerGroup:       "group1",
		BlockDuration:       5 * time.Second,
		MessageCount:        1,
		PluginExecutor:      mockPluginExecutor,
		Logger:              zap.NewNop(),
		ExecutionPool:       1,
		FileContextProvider: mockFileContextProvider,
		DrainCompleteCh:     drainCompleteCh,
	})

	go func() {
		_, pollErr := transport.pollOnce()
		assert.NoError(t, pollErr)
	}()

	select {
	case <-executeStarted:
	case <-time.After(5 * time.Second):
		t.Fatal("execute did not start")
	}

	groupCancel()

	select {
	case err := <-varStoreErrCh:
		require.NoError(t, err)
	case <-time.After(5 * time.Second):
		t.Fatal("variable store Run did not exit after group cancellation")
	}

	assert.True(t, variableStore.Alive())
	assertVariableStoreReachableAtPort(t, variableStorePort)

	closeStarted := make(chan struct{})
	closeDone := make(chan error, 1)
	go func() {
		close(closeStarted)
		closeDone <- transport.Close(context.Background())
	}()
	<-closeStarted

	assertVariableStoreReachableAtPort(t, variableStorePort)

	close(executeUnblock)

	select {
	case err := <-closeDone:
		require.NoError(t, err)
	case <-time.After(5 * time.Second):
		t.Fatal("transport Close did not complete")
	}

	select {
	case <-drainCompleteCh:
	default:
		t.Fatal("drainCompleteCh was not closed after transport drain")
	}

	require.NoError(t, variableStore.Close(context.Background()))
	assert.False(t, variableStore.Alive())
}

func TestShutdownSequence_CloseOrderRespectsTransportDrain(t *testing.T) {
	drainCompleteCh := make(chan struct{})

	var closeOrder []string
	var closeOrderMu sync.Mutex

	recordClose := func(name string) func(context.Context) error {
		return func(context.Context) error {
			closeOrderMu.Lock()
			closeOrder = append(closeOrder, name)
			closeOrderMu.Unlock()
			return nil
		}
	}

	transportDrainStarted := make(chan struct{})
	transportDrainDone := make(chan struct{})

	transportClose := func(ctx context.Context) error {
		closeOrderMu.Lock()
		closeOrder = append(closeOrder, "transport")
		closeOrderMu.Unlock()

		close(transportDrainStarted)

		select {
		case <-transportDrainDone:
			close(drainCompleteCh)
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	}

	sandboxClose := recordClose("sandbox")

	_, groupCancel := context.WithCancel(context.Background())
	defer groupCancel()

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		_ = transportClose(context.Background())
	}()

	go func() {
		defer wg.Done()
		<-drainCompleteCh
		_ = sandboxClose(context.Background())
	}()

	groupCancel()

	select {
	case <-transportDrainStarted:
	case <-time.After(time.Second):
		t.Fatal("transport drain did not start")
	}

	closeOrderMu.Lock()
	currentOrder := append([]string(nil), closeOrder...)
	closeOrderMu.Unlock()
	require.Equal(t, []string{"transport"}, currentOrder)

	close(transportDrainDone)

	wg.Wait()

	closeOrderMu.Lock()
	finalOrder := append([]string(nil), closeOrder...)
	closeOrderMu.Unlock()
	require.Equal(t, []string{"transport", "sandbox"}, finalOrder)
}
