package correlation

import (
	"context"
	"net"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/constants"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/test/bufconn"
)

type tdial func(ctx context.Context) *grpc.ClientConn

type testHealthService struct {
	grpc_health_v1.UnimplementedHealthServer
}

func (t *testHealthService) Check(ctx context.Context, req *grpc_health_v1.HealthCheckRequest) (*grpc_health_v1.HealthCheckResponse, error) {
	if constants.CorrelationID(ctx) == "" {
		panic("correlation-id must be set")
	}

	if constants.ExecutionID(ctx) == "" {
		panic("execution-id must be set")
	}

	return &grpc_health_v1.HealthCheckResponse{
		Status: grpc_health_v1.HealthCheckResponse_SERVING,
	}, nil
}

func (t *testHealthService) Watch(req *grpc_health_v1.HealthCheckRequest, stream grpc_health_v1.Health_WatchServer) error {
	if constants.CorrelationID(stream.Context()) == "" {
		panic("correlation-id must be set")
	}

	if constants.ExecutionID(stream.Context()) == "" {
		panic("execution-id must be set")
	}

	ticker := time.NewTicker(50 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-stream.Context().Done():
			return stream.Context().Err()
		case <-ticker.C:
			resp := &grpc_health_v1.HealthCheckResponse{
				Status: grpc_health_v1.HealthCheckResponse_SERVING,
			}
			err := stream.Send(resp)
			if err != nil {
				return err
			}
		}
	}
}

func testStartServer(t *testing.T) tdial {
	l := bufconn.Listen(1024 * 1024)
	s := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			UnaryServerInterceptor(),
		),
		grpc.ChainStreamInterceptor(
			StreamServerInterceptor(),
		),
	)

	grpc_health_v1.RegisterHealthServer(s, &testHealthService{})

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := s.Serve(l); err != nil {
			t.Logf("grpc.Serve error %s", err.Error())
		}
	}()

	t.Cleanup(func() {
		s.Stop()

		err := l.Close()
		if err != nil {
			t.Logf("grpc listener.Close error: %s", err.Error())
		}

		wg.Wait()
	})

	return func(ctx context.Context) *grpc.ClientConn {
		conn, err := grpc.DialContext(
			ctx,
			"bufnet",
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithContextDialer(func(ctx context.Context, address string) (net.Conn, error) {
				return l.DialContext(ctx)
			}),
		)
		if err != nil {
			t.Fatalf("cannot DialContext: %s", err.Error())
		}
		return conn
	}
}

type testHeader func(t *testing.T, ctx context.Context, hc grpc_health_v1.HealthClient, requestHeaderCorrelationId *string) string

// testUnary runs healthclient.Check adding the specified correlation id to the request
// and returning the response correlation id header
func testUnary(
	t *testing.T,
	ctx context.Context,
	hc grpc_health_v1.HealthClient,
	requestHeaderCorrelationId *string,
) string {
	if requestHeaderCorrelationId != nil {
		reqHeaders := metadata.New(nil)
		ctx = metadata.NewOutgoingContext(ctx, reqHeaders)
		reqHeaders.Set(constants.HeaderCorrelationId, *requestHeaderCorrelationId)
	}

	var respHeaders metadata.MD
	_, err := hc.Check(ctx, nil, grpc.Header(&respHeaders))
	require.NoError(t, err)

	return strings.Join(respHeaders.Get(constants.HeaderCorrelationId), ", ")
}

// testStream runs healthclient.Watch adding the specified correlation id to the request
// and returning the response correlation id header. It waits to receive two responses
// from the server before returning.
func testStream(
	t *testing.T,
	ctx context.Context,
	hc grpc_health_v1.HealthClient,
	requestHeaderCorrelationId *string,
) string {
	if requestHeaderCorrelationId != nil {
		reqHeaders := metadata.New(nil)
		ctx = metadata.NewOutgoingContext(ctx, reqHeaders)
		reqHeaders.Set(constants.HeaderCorrelationId, *requestHeaderCorrelationId)
	}

	stream, err := hc.Watch(ctx, nil)
	require.NoError(t, err)

	_, err = stream.Recv()
	require.NoError(t, err)

	_, err = stream.Recv()
	require.NoError(t, err)

	require.NoError(t, stream.CloseSend())

	respHeaders, _ := stream.Header()
	return strings.Join(respHeaders.Get(constants.HeaderCorrelationId), ", ")
}

func TestCorrelationId(t *testing.T) {
	t.Parallel()
	ctx := context.Background()

	dial := testStartServer(t)
	hc := grpc_health_v1.NewHealthClient(dial(ctx))

	correlationId := "test-correlation-id"
	for _, tf := range []testHeader{testUnary, testStream} {
		actual := tf(t, ctx, hc, &correlationId)
		require.Equal(t, correlationId, actual)
	}
}

func TestCorrelationIdIsCreated(t *testing.T) {
	t.Parallel()
	ctx := context.Background()

	dial := testStartServer(t)
	hc := grpc_health_v1.NewHealthClient(dial(ctx))

	correlationId := ""
	for _, tf := range []testHeader{testUnary, testStream} {
		actual := tf(t, ctx, hc, &correlationId)
		require.NotEqual(t, correlationId, actual)

		actual = tf(t, ctx, hc, nil)
		require.NotEqual(t, correlationId, actual)
	}
}
