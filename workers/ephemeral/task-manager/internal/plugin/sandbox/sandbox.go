package sandbox

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	sandboxmetrics "workers/ephemeral/task-manager/internal/metrics"
	"workers/ephemeral/task-manager/internal/plugin"
	"workers/ephemeral/task-manager/internal/sandboxmanager"

	commonErr "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/structpb"
)

// IpFilterSetter allows setting IP filters on the variable store
type IpFilterSetter interface {
	SetAllowedIps(ips ...string)
}

// SandboxPlugin executes code by forwarding to a gRPC sandbox server.
// The sandbox runs in a separate Kubernetes Job that is created at startup
// and deleted at shutdown.
type SandboxPlugin struct {
	// gRPC client to sandbox
	client workerv1.SandboxTransportServiceClient
	conn   *grpc.ClientConn

	// Plugin configuration
	logger *zap.Logger

	// Connection mode and address of the sandbox
	connectionMode SandboxConnectionMode
	sandboxAddress string
	sandboxId      string

	// Variable store address to pass to sandbox
	variableStoreAddress string

	// Store for reading context bindings from Redis
	store store.Store

	// Sandbox manager for creating/deleting sandboxes
	sandboxManager sandboxmanager.SandboxManager
	sandboxInfo    *sandboxmanager.SandboxInfo

	// IP filter for the variable store - only accept connections from sandbox
	ipFilterSetter IpFilterSetter

	// Mutex for cleanup
	mu sync.Mutex

	// Tracks the number of executions to determine warm vs cold start.
	executionCount atomic.Int64

	run.ForwardCompatibility
}

var _ plugin.Plugin = (*SandboxPlugin)(nil)
var _ run.Runnable = (*SandboxPlugin)(nil)

// NewSandboxPlugin creates a new sandbox plugin.
// In static mode, it connects directly to an existing sandbox.
// In dynamic mode, it creates a sandbox (via the sandbox manager) and connects to it.
func NewSandboxPlugin(options ...Option) (*SandboxPlugin, error) {
	opts := ApplyOptions(options...)
	if err := validateOptions(opts); err != nil {
		return nil, err
	}

	p := &SandboxPlugin{
		connectionMode:       opts.ConnectionMode,
		sandboxAddress:       opts.SandboxAddress,
		sandboxId:            opts.SandboxId,
		logger:               opts.Logger,
		variableStoreAddress: opts.VariableStoreAddress,
		store:                opts.KvStore,
		sandboxManager:       opts.SandboxManager,
		ipFilterSetter:       opts.IpFilterSetter,
	}

	return p, nil
}

func validateOptions(opts *Options) error {
	switch opts.ConnectionMode {
	case SandboxConnectionModeStatic:
		if opts.SandboxAddress == "" {
			return fmt.Errorf("sandbox address is required in static mode")
		}
	case SandboxConnectionModeDynamic:
		if opts.SandboxManager == nil {
			return fmt.Errorf("sandbox manager is required in dynamic mode")
		}
		if opts.SandboxId == "" {
			return fmt.Errorf("sandbox id is required in dynamic mode")
		}
	default:
		return fmt.Errorf("invalid connection mode: %d", opts.ConnectionMode)
	}

	return nil
}

// Name returns the name of the sandbox plugin
func (p *SandboxPlugin) Name() string {
	return fmt.Sprintf("sandbox.%s", p.sandboxId)
}

func (p *SandboxPlugin) Run(ctx context.Context) error {
	switch p.connectionMode {
	case SandboxConnectionModeStatic:
		if p.sandboxAddress == "" {
			return fmt.Errorf("sandbox address is required in static mode")
		}

		// Static mode: connect to existing sandbox at configured address
		p.logger.Info("sandbox plugin initialized (static mode)",
			zap.String("sandbox_id", p.sandboxId),
			zap.String("address", p.sandboxAddress),
		)
	case SandboxConnectionModeDynamic:
		if p.sandboxManager == nil {
			return fmt.Errorf("sandbox manager is required in dynamic mode")
		}

		// Dynamic mode: create a new sandbox on-demand
		sandboxInfo, err := p.sandboxManager.CreateSandbox(ctx, p.sandboxId)
		if err != nil {
			return fmt.Errorf("failed to create sandbox: %w", err)
		}
		p.sandboxInfo = sandboxInfo
		p.sandboxAddress = sandboxInfo.Address

		// Set IP filter on variable store - only accept connections from this sandbox
		if p.ipFilterSetter != nil {
			p.ipFilterSetter.SetAllowedIps(sandboxInfo.Ip)
		}

		p.logger.Info("sandbox plugin initialized (dynamic mode)",
			zap.String("sandbox_id", p.sandboxId),
			zap.String("job", sandboxInfo.Name),
			zap.String("address", sandboxInfo.Address),
			zap.String("sandbox_ip", sandboxInfo.Ip),
		)
	default:
		return fmt.Errorf("invalid connection mode: %d", p.connectionMode)
	}

	// Connect to the sandbox
	conn, client, err := p.connectToSandbox(p.sandboxAddress)
	if err != nil {
		// Cleanup the job if we can't connect (only in dynamic mode)
		if p.sandboxInfo != nil && p.sandboxManager != nil {
			_ = p.sandboxManager.DeleteSandbox(ctx, p.sandboxInfo.Id)
		}
		return fmt.Errorf("failed to connect to sandbox: %w", err)
	}

	p.conn = conn
	p.client = client

	<-ctx.Done()
	return ctx.Err()
}

// connectToSandbox creates a gRPC connection to the sandbox pod
func (p *SandboxPlugin) connectToSandbox(address string) (*grpc.ClientConn, workerv1.SandboxTransportServiceClient, error) {
	keepaliveParams := keepalive.ClientParameters{
		Time:                10 * time.Second,
		Timeout:             5 * time.Second,
		PermitWithoutStream: true,
	}

	conn, err := grpc.NewClient(
		address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(keepaliveParams),
		grpc.WithConnectParams(grpc.ConnectParams{
			MinConnectTimeout: 5 * time.Second,
		}),
		grpc.WithDefaultCallOptions(
			grpc.MaxCallRecvMsgSize(100*1024*1024),
			grpc.MaxCallSendMsgSize(30*1024*1024),
		),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create gRPC connection: %w", err)
	}

	client := workerv1.NewSandboxTransportServiceClient(conn)
	return conn, client, nil
}

// Close cleans up any resources - closes connection and deletes sandbox Job.
// Called when the worker is shutting down.
func (p *SandboxPlugin) Close(context.Context) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.conn != nil {
		_ = p.conn.Close()
		p.conn = nil
		p.client = nil
	}

	if p.sandboxInfo != nil && p.sandboxManager != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		start := time.Now()
		if err := p.sandboxManager.DeleteSandbox(ctx, p.sandboxInfo.Id); err != nil {
			sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxTeardownDuration, time.Since(start).Seconds(),
				sandboxmetrics.AttrResult.String("failed"),
			)
			p.logger.Warn("failed to delete sandbox job",
				zap.String("job", p.sandboxInfo.Name),
				zap.String("sandbox_id", p.sandboxInfo.Id),
				zap.Error(err),
			)
			return err
		}

		sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxTeardownDuration, time.Since(start).Seconds(),
			sandboxmetrics.AttrResult.String("succeeded"),
		)

		p.logger.Info(
			"deleted sandbox job",
			zap.String("name", p.sandboxInfo.Name),
			zap.String("sandbox_id", p.sandboxInfo.Id),
		)
		p.sandboxInfo = nil
	}

	return nil
}

// ConnectionState returns the underlying gRPC connection state for health checking
func (p *SandboxPlugin) ConnectionState() connectivity.State {
	return p.conn.GetState()
}

// Execute runs code in the sandbox
func (p *SandboxPlugin) Execute(
	ctx context.Context,
	requestMeta *workerv1.RequestMetadata,
	props *transportv1.Request_Data_Data_Props,
	quotas *transportv1.Request_Data_Data_Quota,
	pinned *transportv1.Request_Data_Pinned,
) (*workerv1.ExecuteResponse, error) {
	pluginAttr := attribute.String("plugin_name", requestMeta.GetPluginName())

	codeExecStart := time.Now()
	resp, err := tracer.Observe(
		ctx,
		fmt.Sprintf("sandbox.%s.execute", requestMeta.GetPluginName()),
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.ExecuteResponse, error) {
			return p.client.Execute(ctx, &workerv1.ExecuteRequest{
				Metadata:             requestMeta,
				Props:                props,
				Quotas:               quotas,
				Pinned:               pinned,
				VariableStoreAddress: p.variableStoreAddress,
			})
		},
		nil,
	)
	codeExecDuration := time.Since(codeExecStart).Seconds()
	sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxCodeExecutionDuration, codeExecDuration, pluginAttr)

	result := "succeeded"
	if err != nil {
		result = "failed"
	}
	resultAttr := sandboxmetrics.AttrResult.String(result)

	warmStart := p.executionCount.Add(1) > 1
	sandboxmetrics.AddCounter(ctx, sandboxmetrics.SandboxExecutionsTotal,
		pluginAttr,
		resultAttr,
		sandboxmetrics.AttrWarmStart.Bool(warmStart),
	)

	if err != nil {
		return nil, err
	}

	return resp, nil
}

// Stream is not supported for sandbox plugins
func (p *SandboxPlugin) Stream(
	ctx context.Context,
	topic string,
	requestMeta *workerv1.RequestMetadata,
	props *transportv1.Request_Data_Data_Props,
	quotas *transportv1.Request_Data_Data_Quota,
	pinned *transportv1.Request_Data_Pinned,
) error {

	_, err := tracer.Observe(
		ctx,
		fmt.Sprintf("sandbox.%s.stream", requestMeta.GetPluginName()),
		nil,
		func(ctx context.Context, span trace.Span) (*emptypb.Empty, error) {
			return p.client.Stream(ctx, &workerv1.StreamRequest{
				Request: &workerv1.ExecuteRequest{
					Metadata: requestMeta,
					Props:    props,
					Quotas:   quotas,
					Pinned:   pinned,
				},
				Topic: topic,
			})
		},
		nil,
	)

	_, err = p.errorMessageFromGrpcError(err)
	return err
}

func (p *SandboxPlugin) Metadata(
	ctx context.Context,
	requestMeta *workerv1.RequestMetadata,
	datasourceConfig *structpb.Struct,
	actionConfig *structpb.Struct,
) (*transportv1.Response_Data_Data, error) {

	resp, err := tracer.Observe(
		ctx,
		fmt.Sprintf("sandbox.%s.metadata", requestMeta.GetPluginName()),
		nil,
		func(ctx context.Context, span trace.Span) (*transportv1.Response_Data_Data, error) {
			return p.client.Metadata(ctx, &workerv1.MetadataRequest{
				Metadata:             requestMeta,
				DatasourceConfig:     datasourceConfig,
				ActionConfig:         actionConfig,
				VariableStoreAddress: p.variableStoreAddress,
			})
		},
		nil,
	)
	if err != nil {
		grpcErr, err := p.errorMessageFromGrpcError(err)
		if grpcErr.Code() == codes.Internal {
			return nil, &commonErr.InternalError{Err: err}
		}

		v1Err := commonErr.ToCommonV1(err)
		if v1Err.Name == "" {
			v1Err.Name = "IntegrationError"
		}

		return nil, v1Err
	}

	return resp, nil
}

func (p *SandboxPlugin) Test(ctx context.Context, requestMeta *workerv1.RequestMetadata, datasourceConfig, actionConfig *structpb.Struct) error {
	_, err := tracer.Observe(
		ctx,
		fmt.Sprintf("sandbox.%s.test", requestMeta.GetPluginName()),
		nil,
		func(ctx context.Context, span trace.Span) (*emptypb.Empty, error) {
			return p.client.Test(ctx, &workerv1.TestRequest{
				Metadata:             requestMeta,
				DatasourceConfig:     datasourceConfig,
				ActionConfig:         actionConfig,
				VariableStoreAddress: p.variableStoreAddress,
			})
		},
		nil,
	)

	_, err = p.errorMessageFromGrpcError(err)
	return err
}

func (p *SandboxPlugin) PreDelete(ctx context.Context, requestMeta *workerv1.RequestMetadata, datasourceConfig *structpb.Struct) error {
	_, err := tracer.Observe(
		ctx,
		fmt.Sprintf("sandbox.%s.pre_delete", requestMeta.GetPluginName()),
		nil,
		func(ctx context.Context, span trace.Span) (*emptypb.Empty, error) {
			return p.client.PreDelete(ctx, &workerv1.PreDeleteRequest{
				Metadata:         requestMeta,
				DatasourceConfig: datasourceConfig,
			})
		},
		nil,
	)

	_, err = p.errorMessageFromGrpcError(err)
	return err
}

func (*SandboxPlugin) errorMessageFromGrpcError(err error) (*status.Status, error) {
	if err == nil {
		return nil, nil
	}

	if grpcErr, ok := status.FromError(err); ok {
		return grpcErr, errors.New(grpcErr.Message())
	}

	return nil, err
}
