package streamingproxy

import (
	"context"
	"fmt"
	"net"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
)

func getFreePort(t *testing.T) int {
	t.Helper()

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	port := lis.Addr().(*net.TCPAddr).Port
	require.NoError(t, lis.Close())
	return port
}

func assertStreamingProxyReachable(t *testing.T, port int) {
	t.Helper()

	conn, err := grpc.NewClient(
		fmt.Sprintf("127.0.0.1:%d", port),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	require.NoError(t, err)
	defer conn.Close()

	client := workerv1.NewSandboxStreamingProxyServiceClient(conn)
	_, err = client.Send(context.Background(), &workerv1.SendRequest{Topic: "shutdown-test"})
	st, ok := status.FromError(err)
	require.True(t, ok, "expected gRPC status error, got %v", err)
	assert.NotEqual(t, codes.Unavailable, st.Code())
}

func TestStreamingProxyService_RunCancelKeepsServerAlive(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	t.Cleanup(mr.Close)

	port := getFreePort(t)
	svc := NewStreamingProxyService(
		WithServer(grpc.NewServer()),
		WithRedisClient(redis.NewClient(&redis.Options{Addr: mr.Addr()})),
		WithPort(port),
		WithLogger(zap.NewNop()),
	)

	ctx, cancel := context.WithCancel(context.Background())

	errCh := make(chan error, 1)
	go func() { errCh <- svc.Run(ctx) }()

	require.Eventually(t, func() bool {
		conn, err := grpc.NewClient(
			fmt.Sprintf("127.0.0.1:%d", port),
			grpc.WithTransportCredentials(insecure.NewCredentials()),
		)
		if err != nil {
			return false
		}
		defer conn.Close()

		client := workerv1.NewSandboxStreamingProxyServiceClient(conn)
		_, err = client.Send(context.Background(), &workerv1.SendRequest{Topic: "startup-probe"})
		st, ok := status.FromError(err)
		return ok && st.Code() != codes.Unavailable
	}, 5*time.Second, 50*time.Millisecond)

	cancel()

	select {
	case err := <-errCh:
		require.NoError(t, err)
	case <-time.After(5 * time.Second):
		t.Fatal("Run did not exit after context cancellation")
	}

	assert.True(t, svc.Alive())
	assertStreamingProxyReachable(t, port)

	require.NoError(t, svc.Close(context.Background()))
	assert.False(t, svc.Alive())
}
