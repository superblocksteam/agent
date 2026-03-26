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
	"github.com/superblocksteam/agent/pkg/utils"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	// The delay between Health RPC retries when establishing initial connection to the sandbox
	sandboxHealthBackoff = 500 * time.Millisecond
	// The maximum time to wait for the sandbox to respond to the initial Health check during startup
	sandboxHealthTimeout = 5 * time.Minute

	// gRPC transport hard cap between task-manager and sandbox.
	// Keep this aligned with the Redis object-size hard cap class so
	// task-manager can enforce quotas when pushing to KV store.
	sandboxGrpcMsgMaxSize = 500 * 1024 * 1024
	// Default request/send cap stays small; response/recv cap can be large.
	sandboxGrpcRequestMaxSize = 30 * 1024 * 1024

	// Execute RPC retry: attempts and backoff for transient gRPC failures.
	sandboxExecuteMaxAttempts = 3
	sandboxExecuteBackoff     = 100 * time.Millisecond
)

// Transient gRPC codes that may succeed on retry (connection blips, resource exhaustion).
var (
	transientExecuteCodeSet = utils.NewSet[codes.Code](
		codes.Unavailable,
		codes.ResourceExhausted,
	)

	infraErrorGrpcCodes = utils.NewSet[codes.Code](
		codes.Aborted,
		codes.Internal,
		codes.ResourceExhausted,
		codes.Unavailable,
		codes.Unknown,
	)
)

// IpFilterSetter allows setting IP filters on the variable store
type IpFilterSetter interface {
	AddAllowedIps(ips ...string)
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

	// Integration executor address to pass to sandbox
	integrationExecutorAddress string

	// Sandbox transport gRPC hard caps.
	grpcMaxRequestSize  int
	grpcMaxResponseSize int

	// Store for reading context bindings from Redis
	store store.Store

	// Sandbox manager for creating/deleting sandboxes
	sandboxManager sandboxmanager.SandboxManager
	sandboxInfo    *sandboxmanager.SandboxInfo
	sandboxDead    atomic.Bool

	// IP filter for the variable store - only accept connections from sandbox
	ipFilterSetter IpFilterSetter

	// Mutex for cleanup
	mu sync.Mutex

	// Protects conn and client; written once in Run() after connect, read by IsAvailable/Execute/ConnectionState
	connMu sync.RWMutex

	// Bool and slice of channels for notifying when the plugin is ready for executions
	sandboxReady         atomic.Bool
	sandboxReadyNotifyCh []chan<- bool

	// Internal context and cancel function for shutting down the sandbox plugin cleanly (e.g. cleaning up go routines)
	internalCtx    context.Context
	internalCancel context.CancelFunc

	// Tracks the number of executions to determine warm vs cold start.
	executionCount atomic.Int64

	// drainCompleteCh allows dependent services to sequence their shutdown with the sandbox plugin.
	// Close blocks until this is closed before tearing down (deleting sandbox).
	drainCompleteCh <-chan struct{}

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

	ctx, cancel := context.WithCancel(context.Background())
	p := &SandboxPlugin{
		connectionMode:             opts.ConnectionMode,
		sandboxAddress:             opts.SandboxAddress,
		sandboxId:                  opts.SandboxId,
		logger:                     opts.Logger,
		variableStoreAddress:       opts.VariableStoreAddress,
		integrationExecutorAddress: opts.IntegrationExecutorAddress,
		store:                      opts.KvStore,
		sandboxManager:             opts.SandboxManager,
		ipFilterSetter:             opts.IpFilterSetter,
		internalCtx:                ctx,
		internalCancel:             cancel,
		drainCompleteCh:            opts.DrainCompleteCh,
		grpcMaxRequestSize:         opts.GrpcMaxRequestSize,
		grpcMaxResponseSize:        opts.GrpcMaxResponseSize,
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
	var sandboxDeadCh <-chan error
	logger := p.logger

	switch p.connectionMode {
	case SandboxConnectionModeStatic:
		if p.sandboxAddress == "" {
			return fmt.Errorf("sandbox address is required in static mode")
		}

		noopSandboxDeadCh := make(chan error)
		defer close(noopSandboxDeadCh)

		sandboxDeadCh = noopSandboxDeadCh

		// Static mode: connect to existing sandbox at configured address
		logger = logger.With(
			zap.String("sandbox_id", p.sandboxId),
			zap.String("address", p.sandboxAddress),
		)
		logger.Info("sandbox plugin initialized (static mode)")
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
			p.ipFilterSetter.AddAllowedIps(sandboxInfo.Ip)
		}

		sandboxDeadCh = p.sandboxManager.WatchSandboxPod(ctx, p.sandboxInfo.Name)

		logger = logger.With(
			zap.String("job", sandboxInfo.Name),
			zap.String("sandbox_pod", sandboxInfo.Id),
			zap.String("sandbox_ip", sandboxInfo.Ip),
			zap.String("address", sandboxInfo.Address),
		)
		logger.Info("sandbox plugin initialized (dynamic mode)")
	default:
		return fmt.Errorf("invalid connection mode: %d", p.connectionMode)
	}

	// Connect to the sandbox
	connectStart := time.Now()
	conn, client, err := p.connectToSandbox(ctx, p.sandboxAddress)
	if err != nil {
		sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxLifecycleDuration, time.Since(connectStart).Seconds(),
			sandboxmetrics.AttrOperation.String("connect"),
			sandboxmetrics.AttrResult.String("failed"),
		)
		// Cleanup the job if we can't connect (only in dynamic mode)
		if p.sandboxInfo != nil && p.sandboxManager != nil {
			_ = p.sandboxManager.DeleteSandbox(ctx, p.sandboxInfo.Name)
		}
		return fmt.Errorf("failed to connect to sandbox: %w", err)
	}
	sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxLifecycleDuration, time.Since(connectStart).Seconds(),
		sandboxmetrics.AttrOperation.String("connect"),
		sandboxmetrics.AttrResult.String("succeeded"),
	)

	p.connMu.Lock()
	p.conn = conn
	p.client = client
	p.connMu.Unlock()

	logger.Info("successfully connected to sandbox, sandbox is ready for plugin executions")
	p.sandboxReady.Store(true)
	p.notifyReadyChannels()

	p.monitorSandboxStatus(sandboxDeadCh, logger)
	p.monitorConnectionState(conn, logger)

	<-ctx.Done()
	return ctx.Err()
}

func (p *SandboxPlugin) monitorSandboxStatus(sandboxDeadCh <-chan error, logger *zap.Logger) {
	go func() {
		for p.internalCtx.Err() == nil {
			select {
			case err := <-sandboxDeadCh:
				if err != nil && err != p.internalCtx.Err() {
					logger = logger.With(zap.Error(err))
				}

				logger.Warn("sandbox pod is dead, can no longer be used for plugin executions")
				p.sandboxDead.Store(true)
				return
			case <-p.internalCtx.Done():
				return
			}
		}
	}()
}

func (p *SandboxPlugin) monitorConnectionState(conn *grpc.ClientConn, logger *zap.Logger) {
	go func() {
		state := conn.GetState()
		for p.internalCtx.Err() == nil {
			if conn.WaitForStateChange(p.internalCtx, state) {
				prevState := state
				state = conn.GetState()
				sandboxmetrics.AddCounter(p.internalCtx, sandboxmetrics.SandboxConnectionStateTransitions,
					sandboxmetrics.AttrConnectionStateFrom.String(prevState.String()),
					sandboxmetrics.AttrConnectionStateTo.String(state.String()),
				)
				if state == connectivity.TransientFailure {
					logger.Warn("sandbox gRPC connection entered transient failure",
						zap.String("from_state", prevState.String()),
						zap.String("to_state", state.String()),
					)
				} else if prevState == connectivity.TransientFailure && state == connectivity.Ready {
					logger.Info("sandbox gRPC connection recovered to ready",
						zap.String("from_state", prevState.String()),
						zap.String("to_state", state.String()),
					)
				} else {
					logger.Debug("sandbox gRPC connection state changed",
						zap.String("from_state", prevState.String()),
						zap.String("to_state", state.String()),
					)
				}
			}
		}
	}()
}

// connectToSandbox creates a gRPC connection to the sandbox pod.
func (p *SandboxPlugin) connectToSandbox(ctx context.Context, address string) (*grpc.ClientConn, workerv1.SandboxTransportServiceClient, error) {
	maxRecvSize := p.grpcMaxResponseSize
	if maxRecvSize <= 0 {
		maxRecvSize = sandboxGrpcMsgMaxSize
	}
	maxSendSize := p.grpcMaxRequestSize
	if maxSendSize <= 0 {
		maxSendSize = sandboxGrpcRequestMaxSize
	}

	conn, err := grpc.NewClient(
		address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
		grpc.WithConnectParams(grpc.ConnectParams{
			MinConnectTimeout: 5 * time.Second,
		}),
		grpc.WithDefaultCallOptions(
			grpc.MaxCallRecvMsgSize(maxRecvSize),
			grpc.MaxCallSendMsgSize(maxSendSize),
		),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create gRPC connection: %w", err)
	}

	client := workerv1.NewSandboxTransportServiceClient(conn)

	// Block until sandbox responds to health check
	healthCtx, cancel := context.WithTimeout(ctx, sandboxHealthTimeout)
	defer cancel()

	for healthCtx.Err() == nil {
		_, err := client.Health(healthCtx, &workerv1.HealthRequest{})
		if err == nil {
			return conn, client, nil
		}

		p.logger.Debug("sandbox health check failed, retrying after backoff", zap.Error(err), zap.Duration("backoff", sandboxHealthBackoff))
		select {
		case <-healthCtx.Done():
			continue
		case <-time.After(sandboxHealthBackoff):
			continue
		}
	}

	_ = conn.Close()
	return nil, nil, fmt.Errorf("sandbox did not become ready within %s: %w", sandboxHealthTimeout, healthCtx.Err())
}

// Close cleans up any resources - closes connection and deletes sandbox Job.
// Called when the worker is shutting down.
// Blocks until drainCompleteCh is closed before tearing down so dependent services can complete their shutdown.
func (p *SandboxPlugin) Close(ctx context.Context) error {
	p.internalCancel()

	if p.drainCompleteCh != nil {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-p.drainCompleteCh:
			// Drain complete, proceed with teardown
		}
	}

	p.mu.Lock()
	defer p.mu.Unlock()

	p.connMu.Lock()
	if p.conn != nil {
		_ = p.conn.Close()
		p.conn = nil
		p.client = nil
	}
	p.connMu.Unlock()

	if p.sandboxInfo != nil && p.sandboxManager != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		start := time.Now()
		if err := p.sandboxManager.DeleteSandbox(ctx, p.sandboxInfo.Name); err != nil {
			sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxTeardownDuration, time.Since(start).Seconds(),
				sandboxmetrics.AttrResult.String("failed"),
			)
			p.logger.Warn("failed to delete sandbox job",
				zap.String("job", p.sandboxInfo.Name),
				zap.String("pod", p.sandboxInfo.Id),
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
			zap.String("pod", p.sandboxInfo.Id),
		)
		p.sandboxInfo = nil
	}

	return nil
}

// ConnectionState returns the underlying gRPC connection state for health checking
// This method should be deprecated once we remove the health checker
func (p *SandboxPlugin) ConnectionState() connectivity.State {
	p.connMu.RLock()
	defer p.connMu.RUnlock()
	if p.conn == nil {
		return connectivity.TransientFailure
	}
	return p.conn.GetState()
}

func (p *SandboxPlugin) NotifyWhenReady(notifyCh chan<- bool) {
	p.mu.Lock()
	p.sandboxReadyNotifyCh = append(p.sandboxReadyNotifyCh, notifyCh)
	p.mu.Unlock()

	if p.sandboxReady.Load() {
		p.notifyReadyChannels()
	}
}

func (p *SandboxPlugin) notifyReadyChannels() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for _, notifyCh := range p.sandboxReadyNotifyCh {
		go func(notifyCh chan<- bool) {
			select {
			case <-p.internalCtx.Done():
				return
			case notifyCh <- true:
				return
			}
		}(notifyCh)
	}

	p.sandboxReadyNotifyCh = nil
}

func (p *SandboxPlugin) IsAvailable(ctx context.Context) plugin.PluginStatus {
	// Check if the sandbox is alive
	if p.sandboxDead.Load() {
		return plugin.PluginStatus{
			Available:        false,
			DegradationState: plugin.DegradationState_FATAL,
			Error:            fmt.Errorf("sandbox is dead, cannot be used for plugin executions"),
		}
	}

	// Check that we have a valid connection to the sandbox
	p.connMu.RLock()
	defer p.connMu.RUnlock()

	if !p.connectionReady() {
		return plugin.PluginStatus{
			Available:        false,
			DegradationState: plugin.DegradationState_TRANSIENT,
			Error:            fmt.Errorf("sandbox connection not ready, current state: %s", p.connectionState()),
		}
	}

	// Check that the sandbox is responding by calling the health endpoint
	timeoutCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	if _, err := p.client.Health(timeoutCtx, &workerv1.HealthRequest{}); err != nil {
		return plugin.PluginStatus{
			Available:        false,
			DegradationState: plugin.DegradationState_TRANSIENT,
			Error:            fmt.Errorf("sandbox health check failed: %w", err),
		}
	}

	return plugin.PluginStatus{
		Available:        true,
		DegradationState: plugin.DegradationState_NONE,
	}
}

// connectionReady returns true when the gRPC connection can be used for work.
// We accept Idle (pre-first-RPC) and Ready; we reject TransientFailure and Shutdown.
// The second return value is the connection state string for error messages.
func (p *SandboxPlugin) connectionReady() bool {
	if p.conn == nil {
		return false
	}

	s := p.conn.GetState()
	return s == connectivity.Ready || s == connectivity.Idle
}

func (p *SandboxPlugin) connectionState() string {
	if p.conn == nil {
		return "not connected"
	}
	return p.conn.GetState().String()
}

// Execute runs code in the sandbox
func (p *SandboxPlugin) Execute(
	ctx context.Context,
	requestMeta *workerv1.RequestMetadata,
	props *transportv1.Request_Data_Data_Props,
	quotas *transportv1.Request_Data_Data_Quota,
	pinned *transportv1.Request_Data_Pinned,
) (*workerv1.ExecuteResponse, error) {

	pluginAttr := sandboxmetrics.AttrPlugin.String(requestMeta.GetPluginName())
	req := &workerv1.ExecuteRequest{
		Metadata:                   requestMeta,
		Props:                      props,
		Quotas:                     quotas,
		Pinned:                     pinned,
		VariableStoreAddress:       p.variableStoreAddress,
		IntegrationExecutorAddress: p.integrationExecutorAddress,
	}

	codeExecStart := time.Now()
	resp, err := tracer.Observe(
		ctx,
		fmt.Sprintf("sandbox.%s.execute", requestMeta.GetPluginName()),
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.ExecuteResponse, error) {
			return DoWithRetry(ctx, p.logger, sandboxExecuteMaxAttempts, sandboxExecuteBackoff, func() (*workerv1.ExecuteResponse, error) {
				return p.client.Execute(ctx, req)
			}, func(err error) bool {
				st, ok := status.FromError(err)
				if !ok {
					return false
				}
				return transientExecuteCodeSet.Contains(st.Code())
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
				Metadata:                   requestMeta,
				DatasourceConfig:           datasourceConfig,
				ActionConfig:               actionConfig,
				VariableStoreAddress:       p.variableStoreAddress,
				IntegrationExecutorAddress: p.integrationExecutorAddress,
			})
		},
		nil,
	)
	if err != nil {
		grpcErr, err := p.errorMessageFromGrpcError(err)
		if grpcErr.Code() == codes.Internal {
			return nil, &commonErr.InternalError{Err: err}
		} else if infraErrorGrpcCodes.Contains(grpcErr.Code()) {
			return nil, &commonErr.InternalError{}
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
				Metadata:                   requestMeta,
				DatasourceConfig:           datasourceConfig,
				ActionConfig:               actionConfig,
				VariableStoreAddress:       p.variableStoreAddress,
				IntegrationExecutorAddress: p.integrationExecutorAddress,
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
