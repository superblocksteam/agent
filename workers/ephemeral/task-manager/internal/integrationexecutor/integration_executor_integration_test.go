package integrationexecutor

import (
	"context"
	"fmt"
	"net"
	"testing"
	"time"

	redisstore "workers/ephemeral/task-manager/internal/store/redis"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
)

// getFreePort finds a free TCP port by binding to :0 and immediately closing.
func getFreePort(t *testing.T) int {
	t.Helper()

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	port := lis.Addr().(*net.TCPAddr).Port
	require.NoError(t, lis.Close())
	return port
}

// TestIntegrationExecutorEndToEnd starts the full IntegrationExecutorService
// gRPC server, connects to it as a real gRPC client, and verifies the
// end-to-end flow through to a fake orchestrator.
func TestIntegrationExecutorEndToEnd(t *testing.T) {
	outputValue, err := structpb.NewValue(map[string]any{"result": "success"})
	require.NoError(t, err)

	profile := &commonv1.Profile{Name: strPtr("prod")}

	fake := &fakeOrchestratorServer{
		response: &apiv1.AwaitResponse{
			Execution: "orchestrator-exec-id",
			Output:    &apiv1.Output{Result: outputValue},
		},
	}
	orchestratorAddr := startFakeOrchestrator(t, fake)

	fileContexts := map[string]*redisstore.ExecutionFileContext{
		"exec-123": {JwtToken: "test-jwt-token", Profile: profile},
	}

	// Start the IntegrationExecutorService on a random port.
	port := getFreePort(t)
	grpcServer := grpc.NewServer()

	svc := New(
		WithServer(grpcServer),
		WithPort(port),
		WithLogger(zap.NewNop()),
		WithOrchestratorAddress(orchestratorAddr),
		WithFileContextProvider(&mockFileContextProvider{contexts: fileContexts}),
	)

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	errCh := make(chan error, 1)
	go func() {
		errCh <- svc.Run(ctx)
	}()

	// Wait for the server to be ready.
	serviceAddr := fmt.Sprintf("127.0.0.1:%d", port)
	require.Eventually(t, func() bool {
		conn, err := grpc.NewClient(
			serviceAddr,
			grpc.WithTransportCredentials(insecure.NewCredentials()),
		)
		if err != nil {
			return false
		}
		defer conn.Close()

		client := workerv1.NewSandboxIntegrationExecutorServiceClient(conn)
		// Send a probe request — we expect a real gRPC error (not connection refused).
		_, err = client.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{})
		if err == nil {
			return true
		}
		st, ok := status.FromError(err)
		return ok && st.Code() != codes.Unavailable
	}, 5*time.Second, 50*time.Millisecond, "service did not become ready")

	// Connect a real gRPC client to the integration executor service.
	conn, err := grpc.NewClient(
		serviceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	require.NoError(t, err)
	t.Cleanup(func() { conn.Close() })

	client := workerv1.NewSandboxIntegrationExecutorServiceClient(conn)

	t.Run("end-to-end happy path", func(t *testing.T) {
		actionConfig := &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"body": structpb.NewStringValue("SELECT * FROM users"),
			},
		}

		resp, err := client.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
			ExecutionId:         "exec-123",
			IntegrationId:       "my-integration",
			PluginId:            "postgres",
			ActionConfiguration: actionConfig,
			ViewMode:            apiv1.ViewMode_VIEW_MODE_DEPLOYED,
		})
		require.NoError(t, err)

		assert.Equal(t, "orchestrator-exec-id", resp.GetExecutionId())
		assert.Equal(t, outputValue.GetStructValue().AsMap(), resp.GetOutput().GetStructValue().AsMap())
		assert.Empty(t, resp.GetError())

		// Verify the orchestrator received the correct JWT in metadata.
		assert.Equal(t, "test-jwt-token", fake.lastJwtToken)

		// Verify the orchestrator received an inline Definition.
		def := fake.lastRequest.GetDefinition()
		require.NotNil(t, def)
		require.NotNil(t, def.GetApi())
		require.Len(t, def.GetApi().GetBlocks(), 1)

		block := def.GetApi().GetBlocks()[0]
		assert.Equal(t, "query", block.GetName())
		assert.Equal(t, "my-integration", block.GetStep().GetIntegration())
		assert.NotNil(t, block.GetStep().GetPostgres(), "expected postgres config")

		assert.Equal(t, apiv1.ViewMode_VIEW_MODE_DEPLOYED, fake.lastRequest.GetViewMode())
		assert.Equal(t, "prod", fake.lastRequest.GetProfile().GetName())
	})

	t.Run("end-to-end profile fallback", func(t *testing.T) {
		actionConfig := &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		}

		resp, err := client.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
			ExecutionId:         "exec-123",
			IntegrationId:       "my-integration",
			PluginId:            "postgres",
			ActionConfiguration: actionConfig,
			// No profile set — should fall back to the parent execution's profile.
		})
		require.NoError(t, err)

		assert.Equal(t, "orchestrator-exec-id", resp.GetExecutionId())
		assert.Empty(t, resp.GetError())

		// Profile should fall back to the stored execution context profile.
		assert.Equal(t, "prod", fake.lastRequest.GetProfile().GetName())
	})

	t.Run("end-to-end validation error - missing integration_id", func(t *testing.T) {
		_, err := client.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
			ExecutionId: "exec-123",
			PluginId:    "postgres",
			// Missing integration_id.
		})
		require.Error(t, err)

		st, ok := status.FromError(err)
		require.True(t, ok)
		assert.Equal(t, codes.InvalidArgument, st.Code())
	})

	t.Run("end-to-end validation error - missing plugin_id", func(t *testing.T) {
		_, err := client.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
			ExecutionId:   "exec-123",
			IntegrationId: "my-integration",
			// Missing plugin_id.
		})
		require.Error(t, err)

		st, ok := status.FromError(err)
		require.True(t, ok)
		assert.Equal(t, codes.InvalidArgument, st.Code())
	})

	t.Run("end-to-end unknown execution", func(t *testing.T) {
		_, err := client.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
			ExecutionId:   "does-not-exist",
			IntegrationId: "my-integration",
			PluginId:      "postgres",
		})
		require.Error(t, err)

		st, ok := status.FromError(err)
		require.True(t, ok)
		assert.Equal(t, codes.NotFound, st.Code())
	})

	t.Run("end-to-end orchestrator error", func(t *testing.T) {
		// Temporarily make the orchestrator return an error.
		fake.err = status.Error(codes.Internal, "orchestrator failure")
		t.Cleanup(func() { fake.err = nil })

		actionConfig := &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		}

		resp, err := client.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{
			ExecutionId:         "exec-123",
			IntegrationId:       "my-integration",
			PluginId:            "postgres",
			ActionConfiguration: actionConfig,
		})
		// The service returns a response with the error string rather than a gRPC error.
		require.NoError(t, err)
		assert.Contains(t, resp.GetError(), "orchestrator failure")
	})

	// Shutdown the service and verify it exits cleanly.
	cancel()
	select {
	case err := <-errCh:
		assert.ErrorIs(t, err, context.Canceled)
	case <-time.After(5 * time.Second):
		t.Fatal("service did not shut down in time")
	}
}

// TestIntegrationExecutorLifecycle verifies the service lifecycle methods.
func TestIntegrationExecutorLifecycle(t *testing.T) {
	port := getFreePort(t)
	grpcServer := grpc.NewServer()

	svc := New(
		WithServer(grpcServer),
		WithPort(port),
		WithLogger(zap.NewNop()),
		WithOrchestratorAddress("127.0.0.1:9999"),
		WithFileContextProvider(&mockFileContextProvider{contexts: map[string]*redisstore.ExecutionFileContext{}}),
	)

	assert.Equal(t, "IntegrationExecutorService", svc.Name())
	assert.True(t, svc.Alive())

	ctx, cancel := context.WithCancel(context.Background())

	errCh := make(chan error, 1)
	go func() { errCh <- svc.Run(ctx) }()

	// Wait for server to start.
	require.Eventually(t, func() bool {
		conn, err := grpc.NewClient(
			fmt.Sprintf("127.0.0.1:%d", port),
			grpc.WithTransportCredentials(insecure.NewCredentials()),
		)
		if err != nil {
			return false
		}
		defer conn.Close()

		client := workerv1.NewSandboxIntegrationExecutorServiceClient(conn)
		_, err = client.ExecuteIntegration(context.Background(), &workerv1.ExecuteIntegrationRequest{})
		st, ok := status.FromError(err)
		return ok && st.Code() != codes.Unavailable
	}, 5*time.Second, 50*time.Millisecond)

	// Cancel context first so Run() returns, then Close() cleans up resources.
	cancel()
	select {
	case <-errCh:
	case <-time.After(5 * time.Second):
		t.Fatal("Run did not exit after context cancellation")
	}

	require.NoError(t, svc.Close(context.Background()))
	assert.False(t, svc.Alive())
}
