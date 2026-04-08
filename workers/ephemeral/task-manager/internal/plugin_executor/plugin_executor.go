package plugin_executor

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	sandboxmetrics "workers/ephemeral/task-manager/internal/metrics"
	"workers/ephemeral/task-manager/internal/plugin"

	"github.com/superblocksteam/agent/pkg/constants"
	commonErr "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	commonV1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var (
	infraErrorGrpcCodes = utils.NewSet[codes.Code](
		codes.Aborted,
		codes.Internal,
		codes.ResourceExhausted,
		codes.Unavailable,
		codes.Unknown,
	)
)

const (
	durationQuotaErrorKind = "language_step_duration_exceeded"
)

// PluginExecutor manages plugin execution
type PluginExecutor interface {
	RegisterPlugin(name string, plugin plugin.Plugin) error
	ListPlugins() []string
	PluginsReady(ctx context.Context) <-chan bool
	ArePluginsAvailable(ctx context.Context) plugin.PluginStatus

	Execute(
		ctx context.Context,
		pluginName string,
		reqData *transportv1.Request_Data_Data,
		pinned *transportv1.Request_Data_Pinned,
		perf *transportv1.Performance,
	) (*transportv1.Response_Data_Data, error)
	Stream(
		ctx context.Context,
		pluginName string,
		topic string,
		reqData *transportv1.Request_Data_Data,
		pinned *transportv1.Request_Data_Pinned,
		perf *transportv1.Performance,
	) (*transportv1.Response_Data_Data, error)
	Metadata(ctx context.Context, pluginName string, reqData *transportv1.Request_Data_Data, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	Test(ctx context.Context, pluginName string, reqData *transportv1.Request_Data_Data, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	PreDelete(ctx context.Context, pluginName string, reqData *transportv1.Request_Data_Data, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
}

type pluginExecutor struct {
	plugins map[string]plugin.Plugin
	logger  *zap.Logger
	store   store.Store // KV store for output
}

// NewPluginExecutor creates a new plugin executor.
func NewPluginExecutor(options *Options) PluginExecutor {
	if options.Store == nil {
		panic("plugin_executor: Store is required")
	}
	return &pluginExecutor{
		plugins: make(map[string]plugin.Plugin),
		logger:  options.Logger,
		store:   options.Store,
	}
}

// RegisterPlugin registers a plugin with the executor
func (p *pluginExecutor) RegisterPlugin(name string, plug plugin.Plugin) error {
	p.plugins[name] = plug
	return nil
}

// ListPlugins returns the list of registered plugin names
func (p *pluginExecutor) ListPlugins() []string {
	plugins := make([]string, 0, len(p.plugins))
	for name := range p.plugins {
		plugins = append(plugins, name)
	}
	return plugins
}

func (p *pluginExecutor) PluginsReady(ctx context.Context) <-chan bool {
	readyCh := make(chan bool, 1)
	go func() {
		pluginsNotReady := utils.NewSet[plugin.Plugin]()
		for _, plug := range p.plugins {
			pluginsNotReady.Add(plug)
		}

		numPluginsNotReady := pluginsNotReady.Size()
		pluginsReadyCh := make(chan bool, numPluginsNotReady)
		for _, plug := range pluginsNotReady.ToSlice() {
			plug.NotifyWhenReady(pluginsReadyCh)
		}

		for numPluginsNotReady > 0 {
			select {
			case <-ctx.Done():
				close(readyCh)
				return
			case ready := <-pluginsReadyCh:
				if ready {
					numPluginsNotReady--
				}
			}
		}

		readyCh <- true
		close(readyCh)
	}()

	return readyCh
}

func (p *pluginExecutor) ArePluginsAvailable(ctx context.Context) plugin.PluginStatus {
	status := plugin.PluginStatus{
		Available:        true,
		DegradationState: plugin.DegradationState_NONE,
	}

	uniquePlugins := utils.NewSet[plugin.Plugin]()
	for _, plug := range p.plugins {
		uniquePlugins.Add(plug)
	}

	for _, plug := range uniquePlugins.ToSlice() {
		plugStatus := plug.IsAvailable(ctx)
		if !plugStatus.Available {
			status.Available = false
			status.Error = errors.Join(status.Error, plugStatus.Error)
			if plugStatus.DegradationState > status.DegradationState {
				status.DegradationState = plugStatus.DegradationState
			}
		}
	}

	return status
}

func (p *pluginExecutor) getPlugin(pluginName string) (plugin.Plugin, error) {
	if p == nil {
		return nil, fmt.Errorf("unknown plugin: %s", pluginName)
	}

	plug, ok := p.plugins[pluginName]
	if !ok {
		return nil, fmt.Errorf("unknown plugin: %s", pluginName)
	}

	return plug, nil
}

// Execute runs code using the appropriate plugin
func (p *pluginExecutor) Execute(
	ctx context.Context,
	pluginName string,
	reqData *transportv1.Request_Data_Data,
	pinned *transportv1.Request_Data_Pinned,
	parentPerf *transportv1.Performance,
) (resp *transportv1.Response_Data_Data, retErr error) {
	executionStart := time.Now()
	defer func() {
		result := "succeeded"
		if retErr != nil || (resp != nil && resp.Err != nil) {
			result = "failed"
		}
		sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxExecutionDuration,
			time.Since(executionStart).Seconds(),
			sandboxmetrics.AttrPlugin.String(pluginName),
			sandboxmetrics.AttrResult.String(result),
		)
	}()

	logger := p.logger.With(
		zap.String(observability.OBS_TAG_CORRELATION_ID, constants.ExecutionID(ctx)),
		zap.String(observability.OBS_TAG_PLUGIN_NAME, pluginName),
	)

	plug, err := p.getPlugin(pluginName)
	if err != nil {
		logger.Error("unknown/unsupported plugin", zap.Error(err))
		return nil, &commonErr.InternalError{Err: err}
	}

	// Apply quota timeout if specified
	timedCtx := ctx
	if reqData.GetQuotas().GetDuration() > 0 {
		var cancel context.CancelFunc
		timedCtx, cancel = context.WithTimeout(ctx, time.Millisecond*time.Duration(reqData.GetQuotas().GetDuration()))
		defer cancel()
	}

	requestMeta := &workerv1.RequestMetadata{PluginName: pluginName}
	resp = &transportv1.Response_Data_Data{}
	perf := &transportv1.Performance{
		PluginExecution: &transportv1.Performance_Observable{},
		KvStorePush:     &transportv1.Performance_Observable{},
	}

	// Merge perf into parent if provided
	if parentPerf != nil {
		defer func() {
			if perf.PluginExecution != nil {
				parentPerf.PluginExecution = perf.PluginExecution
			}
			if perf.KvStorePush != nil {
				parentPerf.KvStorePush = perf.KvStorePush
			}
			parentPerf.BootstrapSdkImport = perf.BootstrapSdkImport
			parentPerf.BootstrapBridgeSetup = perf.BootstrapBridgeSetup
			parentPerf.BootstrapRequireRoot = perf.BootstrapRequireRoot
			parentPerf.BootstrapCodeExecution = perf.BootstrapCodeExecution
		}()
	}

	// Generate output key
	uuid, err := utils.UUID()
	if err != nil {
		logger.Error("failed to generate UUID for output key", zap.Error(err))
		return resp, err
	}
	resp.Key = reqData.GetProps().GetExecutionId() + ".output." + uuid

	output, err := tracer.Observe(
		ctx,
		fmt.Sprintf("execute.plugin.%s", pluginName),
		nil,
		func(_ context.Context, _ trace.Span) (*workerv1.ExecuteResponse, error) {
			perf.PluginExecution.Start = float64(time.Now().UnixMicro())
			res, err := plug.Execute(timedCtx, requestMeta, reqData.GetProps(), reqData.GetQuotas(), pinned)
			perf.PluginExecution.End = float64(time.Now().UnixMicro())
			return res, err
		},
		nil,
	)

	// If the plugin returns a nil result for the output, set to default/empty value
	if output == nil {
		output = &workerv1.ExecuteResponse{}
	}

	// Propagate bootstrap timing from the sandbox ExecuteResponse into the
	// transport Performance so it flows back to the orchestrator.
	if sp := output.GetPerformance(); sp != nil {
		perf.BootstrapSdkImport = sp.GetBootstrapSdkImport()
		perf.BootstrapBridgeSetup = sp.GetBootstrapBridgeSetup()
		perf.BootstrapRequireRoot = sp.GetBootstrapRequireRoot()
		perf.BootstrapCodeExecution = sp.GetBootstrapCodeExecution()
	}
	if err == nil && output.GetError() != nil {
		err = output.GetError()
	}

	pluginReturnedSizeQuotaError := false
	if err != nil {
		if p.isDurationQuotaError(timedCtx, err) {
			output.StructuredLog = nil
			if output.Output != nil {
				output.Output.Log = nil
			}
			err = errors.New("DurationQuotaError")
		}
		if p.isSizeQuotaError(err) {
			pluginReturnedSizeQuotaError = true
			if output.Output != nil {
				// Match KV-store quota behavior: drop oversized output and persist only error/log metadata.
				output.Output.Output = nil
			}
		}

		if p.isInternalError(err) {
			logger.Error("plugin execution failed with internal error", zap.Error(err))
			err = errors.New("InternalError")
		}

		resp.Err = commonErr.ToCommonV1(err)
		if _, isQuotaErr := commonErr.IsQuotaError(err); isQuotaErr || resp.Err.Message == "DurationQuotaError" || resp.Err.Message == "QuotaError" {
			resp.Err.Name = "QuotaError"
		} else if resp.Err.Message == "InternalError" {
			resp.Err.Name = "InternalError"
		} else {
			resp.Err.Name = "IntegrationError"
		}
	}

	p.logExecutionOutput(ctx, output, err, logger)

	// Store output in KV store
	kvPair, kvErr := p.buildKvPair(resp.Key, output, reqData.GetQuotas(), logger, resp.Err)
	if kvErr != nil {
		logger.Error("failed to build KV pair", zap.Error(kvErr))
		return resp, kvErr
	}

	if kvErr = p.pushToKVStore(ctx, kvPair, perf); kvErr != nil {
		if quotaErr, isQuotaErr := commonErr.IsQuotaError(kvErr); isQuotaErr {
			resp.Err = commonErr.ToCommonV1(quotaErr)
			if resp.Err != nil {
				resp.Err.Name = "QuotaError"
			}
			output.Output.Output = nil

			// Try again without the result, include QuotaError in output
			kvPair, kvErr = p.buildKvPair(resp.Key, output, nil, logger, resp.Err)
			if kvErr == nil {
				kvErr = p.pushToKVStore(ctx, kvPair, perf)
			}

			if kvErr != nil {
				logger.Error("could not write output to store", zap.Error(kvErr))
				return resp, kvErr
			}
		} else {
			if pluginReturnedSizeQuotaError {
				logger.Error("could not write output to store", zap.Error(kvErr))
			} else {
				logger.Error("unexpected error: failed to write output to store", zap.Error(kvErr))
			}
			return resp, kvErr
		}
	}

	return resp, nil
}

// Stream runs streaming execution using the appropriate plugin
func (p *pluginExecutor) Stream(
	ctx context.Context,
	pluginName string,
	topic string,
	reqData *transportv1.Request_Data_Data,
	pinned *transportv1.Request_Data_Pinned,
	parentPerf *transportv1.Performance,
) (*transportv1.Response_Data_Data, error) {

	plug, err := p.getPlugin(pluginName)
	if err != nil {
		return nil, &commonErr.InternalError{Err: err}
	}

	requestMeta := &workerv1.RequestMetadata{PluginName: pluginName}
	perf := &transportv1.Performance{
		PluginExecution: &transportv1.Performance_Observable{},
	}

	// Merge perf into parent if provided
	if parentPerf != nil {
		defer func() {
			if perf.PluginExecution != nil {
				parentPerf.PluginExecution = perf.PluginExecution
			}
		}()
	}

	_, err = tracer.Observe(
		ctx,
		fmt.Sprintf("stream.plugin.%s", pluginName),
		nil,
		func(_ context.Context, _ trace.Span) (any, error) {
			perf.PluginExecution.Start = float64(time.Now().UnixMicro())
			err := plug.Stream(ctx, topic, requestMeta, reqData.GetProps(), reqData.GetQuotas(), pinned)
			perf.PluginExecution.End = float64(time.Now().UnixMicro())
			return nil, err
		},
		nil,
	)

	return nil, err
}

// Metadata retrieves metadata from the plugin
func (p *pluginExecutor) Metadata(ctx context.Context, pluginName string, reqData *transportv1.Request_Data_Data, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	plug, err := p.getPlugin(pluginName)
	if err != nil {
		return nil, &commonErr.InternalError{Err: err}
	}

	requestMeta := &workerv1.RequestMetadata{PluginName: pluginName}
	resp, err := plug.Metadata(ctx, requestMeta, reqData.GetDConfig(), reqData.GetAConfig())
	if err != nil {
		return nil, err
	}

	return resp, nil
}

// Test runs a connection test using the plugin
func (p *pluginExecutor) Test(ctx context.Context, pluginName string, reqData *transportv1.Request_Data_Data, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	plug, err := p.getPlugin(pluginName)
	if err != nil {
		return nil, &commonErr.InternalError{Err: err}
	}

	requestMeta := &workerv1.RequestMetadata{PluginName: pluginName}
	err = plug.Test(ctx, requestMeta, reqData.GetDConfig(), reqData.GetAConfig())
	if err != nil {
		return nil, err
	}

	return &transportv1.Response_Data_Data{}, nil
}

// PreDelete runs pre-delete logic using the plugin
func (p *pluginExecutor) PreDelete(ctx context.Context, pluginName string, reqData *transportv1.Request_Data_Data, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	plug, err := p.getPlugin(pluginName)
	if err != nil {
		return nil, &commonErr.InternalError{Err: err}
	}

	requestMeta := &workerv1.RequestMetadata{PluginName: pluginName}
	err = plug.PreDelete(ctx, requestMeta, reqData.GetDConfig())

	return nil, err
}

func (p *pluginExecutor) isDurationQuotaError(timedCtx context.Context, err error) bool {
	if err == nil {
		return false
	}

	if quotaErr, isQuotaErr := commonErr.IsQuotaError(err); isQuotaErr {
		if typedQuotaErr, ok := quotaErr.(*commonErr.QuotaError); ok && typedQuotaErr.Kind == durationQuotaErrorKind {
			return true
		}
		return false
	}

	if timedCtx.Err() == context.DeadlineExceeded {
		if grpcStatus, ok := status.FromError(err); ok {
			return grpcStatus.Code() == codes.DeadlineExceeded
		}

		return err == context.DeadlineExceeded
	}

	return false
}

func (*pluginExecutor) isSizeQuotaError(err error) bool {
	quotaErr, isQuotaErr := commonErr.IsQuotaError(err)
	if !isQuotaErr {
		return false
	}

	typedQuotaErr, ok := quotaErr.(*commonErr.QuotaError)
	if !ok {
		return false
	}

	return strings.HasSuffix(typedQuotaErr.Kind, "_size_exceeded")
}

func (*pluginExecutor) isInternalError(err error) bool {
	if err == nil {
		return false
	}
	st, ok := status.FromError(err)
	return ok && infraErrorGrpcCodes.Contains(st.Code())
}

func (p *pluginExecutor) buildKvPair(
	key string,
	message *workerv1.ExecuteResponse,
	quotas *transportv1.Request_Data_Data_Quota,
	logger *zap.Logger,
	executionErr *commonV1.Error,
) (*store.KV, error) {

	outputMap := p.executeResponseToOutputMap(message, executionErr)
	jsonData, err := json.Marshal(outputMap)
	if err != nil {
		logger.Error("failed to marshal output map", zap.Error(err))
		return nil, fmt.Errorf("failed to marshal output with error: %w", err)
	}

	var maxSize int64
	if quotas != nil {
		maxSize = int64(quotas.GetSize())
	}

	return &store.KV{
		Key:     key,
		Value:   string(jsonData),
		MaxSize: maxSize,
	}, nil
}

func (p *pluginExecutor) pushToKVStore(ctx context.Context, kv *store.KV, perf *transportv1.Performance) error {
	_, err := tracer.Observe(
		ctx,
		"store.write",
		nil,
		func(ctx context.Context, _ trace.Span) (any, error) {
			perf.KvStorePush.Start = float64(time.Now().UnixMicro())
			err := p.store.Write(ctx, kv)
			perf.KvStorePush.End = float64(time.Now().UnixMicro())
			return nil, err
		},
		nil,
	)
	return err
}

func (*pluginExecutor) logExecutionOutput(ctx context.Context, output *workerv1.ExecuteResponse, err error, logger *zap.Logger) {
	l := logger.With(
		zap.String(observability.OBS_TAG_COMPONENT, "worker.sandbox"),
		zap.String(observability.OBS_TAG_REMOTE, "true"),
	)

	for _, log := range output.GetStructuredLog() {
		switch log.GetLevel() {
		case workerv1.StructuredLog_LEVEL_INFO:
			l.Info(log.GetMessage())
		case workerv1.StructuredLog_LEVEL_WARN:
			l.Warn(log.GetMessage())
		case workerv1.StructuredLog_LEVEL_ERROR:
			l.Error(log.GetMessage())
		}
	}

	if err != nil {
		l.Error(err.Error())
	}
}

func (*pluginExecutor) executeResponseToOutputMap(response *workerv1.ExecuteResponse, executionErr *commonV1.Error) map[string]any {
	outputMap := map[string]any{
		"output":        response.GetOutput().GetOutput().AsInterface(),
		"log":           response.GetOutput().GetLog(),
		"request":       response.GetOutput().GetRequest(),
		"children":      response.GetChildren(),
		"executionTime": response.GetExecutionTime().AsDuration().Milliseconds(),
	}

	var prioritizedError *commonV1.Error
	if executionErr != nil {
		prioritizedError = executionErr
	} else if response.GetError() != nil {
		prioritizedError = response.GetError()
	}

	if prioritizedError != nil {
		outputMap["error"] = prioritizedError.GetMessage()
		outputMap["integrationErrorCode"] = prioritizedError.GetCode()
	}

	if response.GetAuthError() {
		outputMap["authError"] = true
	}

	if response.GetStartTime() != nil {
		outputMap["startTimeUtc"] = response.GetStartTime().AsTime().UnixMilli()
	}

	if response.GetOutput().GetPlaceHoldersInfo() != nil {
		outputMap["placeholdersInfo"] = response.GetOutput().GetPlaceHoldersInfo().AsInterface()
	}

	if diags := response.GetDiagnostics(); len(diags) > 0 {
		diagSlice := make([]map[string]any, 0, len(diags))
		for _, d := range diags {
			diagMap := map[string]any{
				"integrationId":      d.GetIntegrationId(),
				"pluginId":           d.GetPluginId(),
				"input":              d.GetInputTruncated(),
				"output":             d.GetOutputTruncated(),
				"startMs":            d.GetStartMs(),
				"endMs":              d.GetEndMs(),
				"durationMs":         d.GetDurationMs(),
				"error":              d.GetError(),
				"sequence":           d.GetSequence(),
				"inputWasTruncated":  d.GetInputWasTruncated(),
				"outputWasTruncated": d.GetOutputWasTruncated(),
			}
			if m := d.GetMetadata(); m != nil {
				diagMap["metadata"] = map[string]any{
					"label":       m.GetLabel(),
					"description": m.GetDescription(),
				}
			}
			diagSlice = append(diagSlice, diagMap)
		}
		outputMap["diagnostics"] = diagSlice
	}

	return outputMap
}
