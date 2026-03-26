package sandbox

import (
	"context"
	"errors"
	"net"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	commonErr "github.com/superblocksteam/agent/pkg/errors"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	metricnoop "go.opentelemetry.io/otel/metric/noop"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"

	sandboxmetrics "workers/ephemeral/task-manager/internal/metrics"
	"workers/ephemeral/task-manager/internal/plugin"
	"workers/ephemeral/task-manager/internal/sandboxmanager"
)

func TestNewSandboxPlugin_StaticMode(t *testing.T) {
	t.Parallel()

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress("localhost:50051"),
		WithSandboxId("test-sandbox"),
	)

	if err != nil {
		t.Fatalf("NewSandboxPlugin() error = %v", err)
	}
	if p == nil {
		t.Fatal("NewSandboxPlugin() returned nil")
	}
	if p.connectionMode != SandboxConnectionModeStatic {
		t.Errorf("connectionMode = %v, want SandboxConnectionModeStatic", p.connectionMode)
	}
	if p.sandboxAddress != "localhost:50051" {
		t.Errorf("sandboxAddress = %v, want localhost:50051", p.sandboxAddress)
	}
}

func TestNewSandboxPlugin_StaticMode_MissingAddress(t *testing.T) {
	t.Parallel()

	_, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
	)

	if err == nil {
		t.Fatal("NewSandboxPlugin() should return error when address is missing in static mode")
	}
}

func TestNewSandboxPlugin_DynamicMode_MissingManager(t *testing.T) {
	t.Parallel()

	_, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxId("test-sandbox"),
	)

	if err == nil {
		t.Fatal("NewSandboxPlugin() should return error when sandbox manager is missing in dynamic mode")
	}
}

func TestNewSandboxPlugin_DynamicMode_MissingSandboxId(t *testing.T) {
	t.Parallel()

	_, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxManager(&mockSandboxManager{}),
	)

	if err == nil {
		t.Fatal("NewSandboxPlugin() should return error when sandbox id is missing in dynamic mode")
	}
}

func TestNewSandboxPlugin_InvalidConnectionMode(t *testing.T) {
	t.Parallel()

	_, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeUnspecified),
	)

	if err == nil {
		t.Fatal("NewSandboxPlugin() should return error for invalid connection mode")
	}
}

func TestSandboxPlugin_Name(t *testing.T) {
	t.Parallel()

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress("localhost:50051"),
		WithSandboxId("python-abc123"),
	)
	if err != nil {
		t.Fatalf("NewSandboxPlugin() error = %v", err)
	}

	name := p.Name()
	if name != "sandbox.python-abc123" {
		t.Errorf("Name() = %v, want sandbox.python-abc123", name)
	}
}

func TestErrorMessageFromGrpcError_Nil(t *testing.T) {
	t.Parallel()

	p := &SandboxPlugin{}

	st, err := p.errorMessageFromGrpcError(nil)
	if st != nil {
		t.Errorf("errorMessageFromGrpcError(nil) status = %v, want nil", st)
	}
	if err != nil {
		t.Errorf("errorMessageFromGrpcError(nil) error = %v, want nil", err)
	}
}

func TestErrorMessageFromGrpcError_GrpcStatus(t *testing.T) {
	t.Parallel()

	p := &SandboxPlugin{}

	grpcErr := status.Error(codes.InvalidArgument, "bad request")
	st, err := p.errorMessageFromGrpcError(grpcErr)

	if st == nil {
		t.Fatal("errorMessageFromGrpcError() status should not be nil for gRPC error")
	}
	if st.Code() != codes.InvalidArgument {
		t.Errorf("status code = %v, want InvalidArgument", st.Code())
	}
	if err == nil {
		t.Fatal("errorMessageFromGrpcError() error should not be nil")
	}
	if err.Error() != "bad request" {
		t.Errorf("error = %v, want 'bad request'", err.Error())
	}
}

func TestErrorMessageFromGrpcError_NonGrpcError(t *testing.T) {
	t.Parallel()

	p := &SandboxPlugin{}

	plainErr := errors.New("plain error")
	st, err := p.errorMessageFromGrpcError(plainErr)

	// Non-gRPC errors pass through as-is
	if st != nil {
		t.Errorf("errorMessageFromGrpcError() status = %v, want nil for non-gRPC error", st)
	}
	if err != plainErr {
		t.Errorf("errorMessageFromGrpcError() should return original error")
	}
}

func TestApplyOptions_Defaults(t *testing.T) {
	t.Parallel()

	opts := ApplyOptions()

	if opts.Logger == nil {
		t.Error("ApplyOptions() should set default logger")
	}
	if opts.KvStore == nil {
		t.Error("ApplyOptions() should set default store")
	}
	if opts.ConnectionMode != SandboxConnectionModeUnspecified {
		t.Errorf("ApplyOptions() ConnectionMode = %v, want Unspecified", opts.ConnectionMode)
	}
}

func TestApplyOptions_Overrides(t *testing.T) {
	t.Parallel()

	mgr := &mockSandboxManager{}
	opts := ApplyOptions(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxManager(mgr),
		WithSandboxId("my-sandbox"),
		WithSandboxAddress("localhost:1234"),
		WithVariableStoreAddress("localhost:5678"),
	)

	if opts.ConnectionMode != SandboxConnectionModeDynamic {
		t.Errorf("ConnectionMode = %v, want Dynamic", opts.ConnectionMode)
	}
	if opts.SandboxManager != mgr {
		t.Error("SandboxManager should be set")
	}
	if opts.SandboxId != "my-sandbox" {
		t.Errorf("SandboxId = %v, want my-sandbox", opts.SandboxId)
	}
	if opts.SandboxAddress != "localhost:1234" {
		t.Errorf("SandboxAddress = %v, want localhost:1234", opts.SandboxAddress)
	}
	if opts.VariableStoreAddress != "localhost:5678" {
		t.Errorf("VariableStoreAddress = %v, want localhost:5678", opts.VariableStoreAddress)
	}
}

func TestConnectionModeConstants(t *testing.T) {
	t.Parallel()

	if SandboxConnectionModeUnspecified != 0 {
		t.Errorf("SandboxConnectionModeUnspecified = %d, want 0", SandboxConnectionModeUnspecified)
	}
	if SandboxConnectionModeStatic != 1 {
		t.Errorf("SandboxConnectionModeStatic = %d, want 1", SandboxConnectionModeStatic)
	}
	if SandboxConnectionModeDynamic != 2 {
		t.Errorf("SandboxConnectionModeDynamic = %d, want 2", SandboxConnectionModeDynamic)
	}
}

func TestSandboxPlugin_NotifyWhenReady_NotifiesWhenSandboxBecomesReady(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServerWithHealth(t)
	t.Cleanup(cleanup)

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	// createFunc sleeps to give us time to call NotifyWhenReady before the sandbox connects
	createDone := make(chan struct{})
	mgr := &mockSandboxManager{
		createFunc: func(context.Context, string) (*sandboxmanager.SandboxInfo, error) {
			<-createDone
			return &sandboxmanager.SandboxInfo{
				Name:    "sandbox-test",
				Id:      "test-id",
				Ip:      "127.0.0.1",
				Address: addr,
			}, nil
		},
		watchFunc: func(ctx context.Context, _ string) <-chan error {
			ch := make(chan error)
			go func() {
				<-ctx.Done()
				close(ch)
			}()
			return ch
		},
	}

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxManager(mgr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	runErrCh := make(chan error, 1)
	go func() {
		runErrCh <- p.Run(ctx)
	}()

	// Call NotifyWhenReady before sandbox is ready (createFunc has not returned yet)
	notifyCh := make(chan bool, 1)
	p.NotifyWhenReady(notifyCh)

	// Now allow the sandbox to be created and connected
	close(createDone)

	// Channel should be notified when sandbox becomes ready
	v := <-notifyCh
	require.True(t, v, "expected true from notify channel")
}

func TestSandboxPlugin_NotifyWhenReady_NotifiesImmediatelyWhenAlreadyReady(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServerWithHealth(t)
	t.Cleanup(cleanup)

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	mgr := &mockSandboxManager{
		createFunc: func(context.Context, string) (*sandboxmanager.SandboxInfo, error) {
			return &sandboxmanager.SandboxInfo{
				Name:    "sandbox-test",
				Id:      "test-id",
				Ip:      "127.0.0.1",
				Address: addr,
			}, nil
		},
		watchFunc: func(ctx context.Context, _ string) <-chan error {
			ch := make(chan error)
			go func() {
				<-ctx.Done()
				close(ch)
			}()
			return ch
		},
	}

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxManager(mgr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	go func() {
		_ = p.Run(ctx)
	}()

	// Wait for sandbox to become ready (Run connects quickly)
	time.Sleep(500 * time.Millisecond)

	// Call NotifyWhenReady after sandbox is already ready
	notifyCh := make(chan bool, 1)
	p.NotifyWhenReady(notifyCh)

	// Channel should be notified
	v := <-notifyCh
	require.True(t, v, "expected true from notify channel")
}

func TestSandboxPlugin_NotifyWhenReady_DoesNotBlockWhenChannelNeverRead(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServerWithHealth(t)
	t.Cleanup(cleanup)

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	mgr := &mockSandboxManager{
		createFunc: func(context.Context, string) (*sandboxmanager.SandboxInfo, error) {
			return &sandboxmanager.SandboxInfo{
				Name:    "sandbox-test",
				Id:      "test-id",
				Ip:      "127.0.0.1",
				Address: addr,
			}, nil
		},
		watchFunc: func(ctx context.Context, _ string) <-chan error {
			ch := make(chan error)
			go func() {
				<-ctx.Done()
				close(ch)
			}()
			return ch
		},
	}

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxManager(mgr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	go func() {
		_ = p.Run(ctx)
	}()

	time.Sleep(500 * time.Millisecond)

	// NotifyWhenReady must return immediately
	notifyCh := make(chan bool)
	done := make(chan struct{})
	go func() {
		p.NotifyWhenReady(notifyCh)
		close(done)
	}()

	<-done
}

func TestSandboxPlugin_NotifyWhenReady_GoroutinesCleanedUpOnClose(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServerWithHealth(t)
	t.Cleanup(cleanup)

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	mgr := &mockSandboxManager{
		createFunc: func(context.Context, string) (*sandboxmanager.SandboxInfo, error) {
			return &sandboxmanager.SandboxInfo{
				Name:    "sandbox-test",
				Id:      "test-id",
				Ip:      "127.0.0.1",
				Address: addr,
			}, nil
		},
		watchFunc: func(ctx context.Context, _ string) <-chan error {
			ch := make(chan error)
			go func() {
				<-ctx.Done()
				close(ch)
			}()
			return ch
		},
	}

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxManager(mgr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	go func() {
		_ = p.Run(ctx)
	}()

	time.Sleep(500 * time.Millisecond)

	// Register multiple unbuffered channels that are never read - spawns goroutines
	// that block on send. Close() must cancel context so these goroutines exit.
	for i := 0; i < 5; i++ {
		p.NotifyWhenReady(make(chan bool))
	}

	// Close should return; internalCancel() allows blocked goroutines to exit
	closeDone := make(chan struct{})
	go func() {
		err := p.Close(ctx)
		require.NoError(t, err)
		close(closeDone)
	}()

	<-closeDone
}

func TestSandboxPlugin_IsAvailable_SandboxDead_ReturnsFatal(t *testing.T) {
	t.Parallel()

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress("localhost:50051"),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	p.sandboxDead.Store(true)

	status := p.IsAvailable(context.Background())

	require.False(t, status.Available)
	require.Equal(t, plugin.DegradationState_FATAL, status.DegradationState)
	require.Error(t, status.Error)
	require.Contains(t, status.Error.Error(), "sandbox is dead")
}

func TestSandboxPlugin_IsAvailable_ConnectionNotReady_ReturnsTransient(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServer(t)
	t.Cleanup(cleanup)

	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.NoError(t, err)
	t.Cleanup(func() { _ = conn.Close() })

	client := workerv1.NewSandboxTransportServiceClient(conn)

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress(addr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)
	p.conn = conn
	p.client = client

	// Close conn to put it in Shutdown; connectionReady will return false
	require.NoError(t, conn.Close())

	status := p.IsAvailable(context.Background())

	require.False(t, status.Available)
	require.Equal(t, plugin.DegradationState_TRANSIENT, status.DegradationState)
	require.Error(t, status.Error)
	require.Contains(t, status.Error.Error(), "connection not ready")
}

func TestSandboxPlugin_IsAvailable_HealthSucceeds_ReturnsAvailable(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServerWithHealth(t)
	t.Cleanup(cleanup)

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	mgr := &mockSandboxManager{
		createFunc: func(context.Context, string) (*sandboxmanager.SandboxInfo, error) {
			return &sandboxmanager.SandboxInfo{
				Name:    "sandbox-test",
				Id:      "test-id",
				Ip:      "127.0.0.1",
				Address: addr,
			}, nil
		},
		watchFunc: func(ctx context.Context, _ string) <-chan error {
			ch := make(chan error)
			go func() {
				<-ctx.Done()
				close(ch)
			}()
			return ch
		},
	}

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxManager(mgr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	go func() {
		_ = p.Run(ctx)
	}()

	time.Sleep(500 * time.Millisecond)

	status := p.IsAvailable(context.Background())

	require.True(t, status.Available)
	require.Equal(t, plugin.DegradationState_NONE, status.DegradationState)
	require.NoError(t, status.Error)
}

func TestSandboxPlugin_IsAvailable_HealthFails_ReturnsTransient(t *testing.T) {
	t.Parallel()

	// Unimplemented server returns error for Health RPC
	addr, cleanup := startSandboxGrpcServer(t)
	t.Cleanup(cleanup)

	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.NoError(t, err)
	t.Cleanup(func() { _ = conn.Close() })

	client := workerv1.NewSandboxTransportServiceClient(conn)

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress(addr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)
	p.conn = conn
	p.client = client

	// Conn is Idle; connectionReady returns true. Health RPC fails with Unimplemented.
	status := p.IsAvailable(context.Background())

	require.False(t, status.Available)
	require.Equal(t, plugin.DegradationState_TRANSIENT, status.DegradationState)
	require.Error(t, status.Error)
	require.Contains(t, status.Error.Error(), "health check failed")
}

func TestConnectToSandbox_HealthSucceeds_ReturnsConnAndClient(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServerWithHealth(t)
	t.Cleanup(cleanup)

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress(addr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	ctx := context.Background()
	conn, client, err := p.connectToSandbox(ctx, addr)
	require.NoError(t, err)
	defer func() { _ = conn.Close() }()

	require.NotNil(t, conn)
	require.NotNil(t, client)

	// Verify Health works
	_, err = client.Health(ctx, &workerv1.HealthRequest{})
	require.NoError(t, err)
}

func TestConnectToSandbox_HealthFails_TimesOutWithError(t *testing.T) {
	t.Parallel()

	// Server does not implement Health (returns Unimplemented)
	addr, cleanup := startSandboxGrpcServer(t)
	t.Cleanup(cleanup)

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress(addr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	t.Cleanup(cancel)

	conn, client, err := p.connectToSandbox(ctx, addr)
	require.Error(t, err)
	require.Nil(t, conn)
	require.Nil(t, client)
	require.Contains(t, err.Error(), "sandbox did not become ready")
}

func TestSandboxPlugin_Metadata_GrpcInternal_ReturnsInternalErrorWithWrappedMessage(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServerWithMetadataStatus(t, codes.Internal, "sandbox blew up")
	t.Cleanup(cleanup)

	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.NoError(t, err)
	t.Cleanup(func() { _ = conn.Close() })

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress(addr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)
	p.conn = conn
	p.client = workerv1.NewSandboxTransportServiceClient(conn)

	_, err = p.Metadata(context.Background(), &workerv1.RequestMetadata{}, nil, nil)
	require.Error(t, err)

	var internalErr *commonErr.InternalError
	require.ErrorAs(t, err, &internalErr)
	require.NotNil(t, internalErr.Err)
	require.Equal(t, "sandbox blew up", internalErr.Err.Error())
}

func TestSandboxPlugin_Metadata_GrpcInfraCodes_ReturnsEmptyInternalError(t *testing.T) {
	t.Parallel()

	for _, tc := range []struct {
		name string
		code codes.Code
	}{
		{name: "Aborted", code: codes.Aborted},
		{name: "ResourceExhausted", code: codes.ResourceExhausted},
		{name: "Unavailable", code: codes.Unavailable},
		{name: "Unknown", code: codes.Unknown},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			addr, cleanup := startSandboxGrpcServerWithMetadataStatus(t, tc.code, "do not leak this detail")
			t.Cleanup(cleanup)

			conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
			require.NoError(t, err)
			t.Cleanup(func() { _ = conn.Close() })

			p, err := NewSandboxPlugin(
				WithConnectionMode(SandboxConnectionModeStatic),
				WithSandboxAddress(addr),
				WithSandboxId("test-sandbox"),
				WithLogger(zap.NewNop()),
			)
			require.NoError(t, err)
			p.conn = conn
			p.client = workerv1.NewSandboxTransportServiceClient(conn)

			_, err = p.Metadata(context.Background(), &workerv1.RequestMetadata{}, nil, nil)
			require.Error(t, err)

			var internalErr *commonErr.InternalError
			require.ErrorAs(t, err, &internalErr)
			require.Nil(t, internalErr.Err)
			require.Equal(t, "InternalError", internalErr.Error())
		})
	}
}

func TestSandboxPlugin_Metadata_GrpcInvalidArgument_ReturnsIntegrationError(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServerWithMetadataStatus(t, codes.InvalidArgument, "bad config")
	t.Cleanup(cleanup)

	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.NoError(t, err)
	t.Cleanup(func() { _ = conn.Close() })

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress(addr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)
	p.conn = conn
	p.client = workerv1.NewSandboxTransportServiceClient(conn)

	_, err = p.Metadata(context.Background(), &workerv1.RequestMetadata{}, nil, nil)
	require.Error(t, err)

	var v1Err *commonv1.Error
	require.ErrorAs(t, err, &v1Err)
	require.Equal(t, "IntegrationError", v1Err.Name)
	require.Equal(t, "bad config", v1Err.Message)
}

func TestConnectToSandbox_ContextCancelled_ReturnsError(t *testing.T) {
	t.Parallel()

	addr, cleanup := startSandboxGrpcServer(t)
	t.Cleanup(cleanup)

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress(addr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	conn, client, err := p.connectToSandbox(ctx, addr)
	require.Error(t, err)
	require.Nil(t, conn)
	require.Nil(t, client)
	require.ErrorIs(t, err, context.Canceled)
}

func TestMonitorSandboxStatus_ErrorOnChannel_SetsSandboxDead(t *testing.T) {
	t.Parallel()

	sandboxDeadCh := make(chan error, 1)
	sandboxDeadCh <- errors.New("pod evicted")

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress("localhost:50051"),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	p.monitorSandboxStatus(sandboxDeadCh, zap.NewNop())

	// Give the goroutine time to process
	time.Sleep(50 * time.Millisecond)

	require.True(t, p.sandboxDead.Load())
}

func TestMonitorSandboxStatus_ContextCancelled_ExitsWithoutSettingSandboxDead(t *testing.T) {
	t.Parallel()

	sandboxDeadCh := make(chan error)
	defer close(sandboxDeadCh)

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress("localhost:50051"),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	p.monitorSandboxStatus(sandboxDeadCh, zap.NewNop())

	// Cancel context before any error is sent on sandboxDeadCh
	p.internalCancel()

	// Give the goroutine time to exit
	time.Sleep(50 * time.Millisecond)

	require.False(t, p.sandboxDead.Load())
}

func TestMonitorSandboxStatus_ChannelClosed_SetsSandboxDead(t *testing.T) {
	t.Parallel()

	sandboxDeadCh := make(chan error)
	close(sandboxDeadCh)

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeStatic),
		WithSandboxAddress("localhost:50051"),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	p.monitorSandboxStatus(sandboxDeadCh, zap.NewNop())

	// Receive from closed chan returns zero value; goroutine sets sandboxDead and returns
	time.Sleep(50 * time.Millisecond)

	require.True(t, p.sandboxDead.Load())
}

func TestRun_RecordsLifecycleConnectMetricOnSuccess(t *testing.T) {
	addr, cleanup := startSandboxGrpcServerWithHealth(t)
	t.Cleanup(cleanup)

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	mgr := &mockSandboxManager{
		createFunc: func(context.Context, string) (*sandboxmanager.SandboxInfo, error) {
			return &sandboxmanager.SandboxInfo{
				Name:    "sandbox-test",
				Id:      "test-id",
				Ip:      "127.0.0.1",
				Address: addr,
			}, nil
		},
		watchFunc: func(ctx context.Context, _ string) <-chan error {
			ch := make(chan error)
			go func() {
				<-ctx.Done()
				close(ch)
			}()
			return ch
		},
	}

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxManager(mgr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	// Ensure instrumentation path is enabled by setting a non-nil histogram.
	hist, histErr := metricnoop.NewMeterProvider().
		Meter("test").
		Float64Histogram("sandbox_lifecycle_duration_seconds")
	require.NoError(t, histErr)
	prevHist := sandboxmetrics.SandboxLifecycleDuration
	t.Cleanup(func() {
		sandboxmetrics.SandboxLifecycleDuration = prevHist
	})
	sandboxmetrics.SandboxLifecycleDuration = hist

	runErrCh := make(chan error, 1)
	go func() {
		runErrCh <- p.Run(ctx)
	}()

	time.Sleep(300 * time.Millisecond)
	cancel()
	<-runErrCh
}

func TestRun_RecordsLifecycleConnectMetricOnFailure(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	t.Cleanup(cancel)

	mgr := &mockSandboxManager{
		createFunc: func(context.Context, string) (*sandboxmanager.SandboxInfo, error) {
			// Unreachable address causes connectToSandbox to fail quickly.
			return &sandboxmanager.SandboxInfo{
				Name:    "sandbox-test",
				Id:      "test-id",
				Ip:      "127.0.0.1",
				Address: "127.0.0.1:1",
			}, nil
		},
		watchFunc: func(context.Context, string) <-chan error {
			ch := make(chan error)
			close(ch)
			return ch
		},
	}

	p, err := NewSandboxPlugin(
		WithConnectionMode(SandboxConnectionModeDynamic),
		WithSandboxManager(mgr),
		WithSandboxId("test-sandbox"),
		WithLogger(zap.NewNop()),
	)
	require.NoError(t, err)

	// Ensure failure path records into a non-nil histogram.
	hist, metricErr := metricnoop.NewMeterProvider().
		Meter("test").
		Float64Histogram("sandbox_lifecycle_duration_seconds")
	require.NoError(t, metricErr)
	prevHist := sandboxmetrics.SandboxLifecycleDuration
	t.Cleanup(func() {
		sandboxmetrics.SandboxLifecycleDuration = prevHist
	})
	sandboxmetrics.SandboxLifecycleDuration = hist

	runErr := p.Run(ctx)
	require.Error(t, runErr)
	require.Contains(t, runErr.Error(), "failed to connect to sandbox")
}

// healthOKServer implements Health and returns READY.
type healthOKServer struct {
	workerv1.UnimplementedSandboxTransportServiceServer
}

func (healthOKServer) Health(context.Context, *workerv1.HealthRequest) (*workerv1.HealthResponse, error) {
	return &workerv1.HealthResponse{Status: workerv1.HealthResponse_STATUS_READY}, nil
}

// metadataStatusTestServer implements Health (OK) and Metadata returning a fixed gRPC status.
type metadataStatusTestServer struct {
	healthOKServer
	code codes.Code
	msg  string
}

func (s *metadataStatusTestServer) Metadata(context.Context, *workerv1.MetadataRequest) (*transportv1.Response_Data_Data, error) {
	return nil, status.Error(s.code, s.msg)
}

// startSandboxGrpcServer starts a minimal gRPC server that implements SandboxTransportService
// and returns the address (caller must call the returned cleanup function)
func startSandboxGrpcServer(t *testing.T) (addr string, cleanup func()) {
	t.Helper()

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)

	grpcServer := grpc.NewServer()
	workerv1.RegisterSandboxTransportServiceServer(grpcServer, &workerv1.UnimplementedSandboxTransportServiceServer{})

	go func() {
		_ = grpcServer.Serve(lis)
	}()

	return lis.Addr().String(), func() {
		grpcServer.GracefulStop()
		_ = lis.Close()
	}
}

// startSandboxGrpcServerWithMetadataStatus starts a server with Health OK and Metadata failing with the given status.
func startSandboxGrpcServerWithMetadataStatus(t *testing.T, code codes.Code, msg string) (addr string, cleanup func()) {
	t.Helper()

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)

	grpcServer := grpc.NewServer()
	workerv1.RegisterSandboxTransportServiceServer(grpcServer, &metadataStatusTestServer{code: code, msg: msg})

	go func() {
		_ = grpcServer.Serve(lis)
	}()

	return lis.Addr().String(), func() {
		grpcServer.GracefulStop()
		_ = lis.Close()
	}
}

// startSandboxGrpcServerWithHealth starts a gRPC server that implements Health and returns READY.
func startSandboxGrpcServerWithHealth(t *testing.T) (addr string, cleanup func()) {
	t.Helper()

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)

	grpcServer := grpc.NewServer()
	workerv1.RegisterSandboxTransportServiceServer(grpcServer, &healthOKServer{})

	go func() {
		_ = grpcServer.Serve(lis)
	}()

	return lis.Addr().String(), func() {
		grpcServer.GracefulStop()
		_ = lis.Close()
	}
}
