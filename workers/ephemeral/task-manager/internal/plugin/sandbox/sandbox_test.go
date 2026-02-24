package sandbox

import (
	"context"
	"errors"
	"fmt"
	"net"
	"testing"
	"time"

	"workers/ephemeral/task-manager/internal/sandboxmanager"

	"github.com/stretchr/testify/require"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
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

func TestSandboxPlugin_Run_ReturnsContextError_WhenSandboxDeadChannelSendsContextError(t *testing.T) {
	addr, cleanup := startSandboxGrpcServer(t)
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
			ch := make(chan error, 1)
			go func() {
				<-ctx.Done()
				ch <- ctx.Err()
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

	errCh := make(chan error, 1)
	go func() {
		errCh <- p.Run(ctx)
	}()

	// Give Run time to create sandbox and connect.
	time.Sleep(200 * time.Millisecond)
	cancel()

	err = <-errCh
	require.Error(t, err)
	require.ErrorIs(t, err, context.Canceled)
}

func TestSandboxPlugin_Run_ReturnsWrappedError_WhenSandboxDeadChannelSendsNonContextError(t *testing.T) {
	addr, cleanup := startSandboxGrpcServer(t)
	t.Cleanup(cleanup)

	ctx := context.Background()
	podDeletedErr := fmt.Errorf("sandbox pod deleted: sandbox-test-abc123")

	mgr := &mockSandboxManager{
		createFunc: func(context.Context, string) (*sandboxmanager.SandboxInfo, error) {
			return &sandboxmanager.SandboxInfo{
				Name:    "sandbox-test",
				Id:      "test-id",
				Ip:      "127.0.0.1",
				Address: addr,
			}, nil
		},
		watchFunc: func(context.Context, string) <-chan error {
			ch := make(chan error, 1)
			go func() {
				time.Sleep(100 * time.Millisecond)
				ch <- podDeletedErr
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

	errCh := make(chan error, 1)
	go func() {
		errCh <- p.Run(ctx)
	}()

	gotErr := <-errCh
	require.Error(t, gotErr)
	require.ErrorIs(t, gotErr, podDeletedErr)
	require.Contains(t, gotErr.Error(), "sandbox pod is no longer available")
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
