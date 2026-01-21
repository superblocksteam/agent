package plugin_executor

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

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
)

// PluginExecutor manages plugin execution
// This interface mirrors workers/golang/internal/plugin_executor.PluginExecutor
type PluginExecutor interface {
	RegisterPlugin(name string, plugin plugin.Plugin) error
	ListPlugins() []string
	Execute(
		ctx context.Context,
		pluginName string,
		reqData *transportv1.Request_Data_Data,
		reqMeta *transportv1.Request_Data_Pinned,
		perf *transportv1.Performance,
	) (*transportv1.Response_Data_Data, error)
	Stream(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data, perf *transportv1.Performance, send func(message any), until func()) error
	Metadata(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	Test(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	PreDelete(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
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
	meta *transportv1.Request_Data_Pinned,
	parentPerf *transportv1.Performance,
) (*transportv1.Response_Data_Data, error) {

	logger := p.logger.With(
		zap.String(observability.OBS_TAG_CORRELATION_ID, constants.ExecutionID(ctx)),
	)

	plug, err := p.getPlugin(pluginName)
	if err != nil {
		logger.Error("unknown/unsupported plugin", zap.String("plugin", pluginName), zap.Error(err))
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
	resp := &transportv1.Response_Data_Data{}
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
			res, err := plug.Execute(timedCtx, requestMeta, reqData.GetProps(), reqData.GetQuotas(), meta)
			perf.PluginExecution.End = float64(time.Now().UnixMicro())
			return res, err
		},
		nil,
	)

	// If the plugin returns a nil result for the output, set to default/empty value
	if output == nil {
		output = &workerv1.ExecuteResponse{}
	}
	if err == nil && output.GetError() != nil {
		err = output.GetError()
	}

	if err != nil {
		if _, isQuotaErr := commonErr.IsQuotaError(err); isQuotaErr || err == context.DeadlineExceeded {
			output.StructuredLog = nil
			output.Output.Log = nil
			err = errors.New("DurationQuotaError")
		}

		resp.Err = commonErr.ToCommonV1(err)
		if resp.Err.Message == "DurationQuotaError" || resp.Err.Message == "QuotaError" {
			resp.Err.Name = "QuotaError"
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
			logger.Error("unexpected error: failed to write output to store", zap.Error(kvErr))
			return resp, kvErr
		}
	}

	return resp, nil
}

// Stream runs streaming execution using the appropriate plugin
func (p *pluginExecutor) Stream(ctx context.Context, pluginName string, reqData *transportv1.Request_Data_Data, perf *transportv1.Performance, send func(message any), until func()) error {
	plug, err := p.getPlugin(pluginName)
	if err != nil {
		return &commonErr.InternalError{Err: err}
	}

	requestMeta := &workerv1.RequestMetadata{PluginName: pluginName}
	return plug.Stream(ctx, requestMeta, reqData.GetProps(), nil, nil, send, until)
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
		zap.String(observability.OBS_TAG_COMPONENT, "worker.ephemeral"),
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

	return outputMap
}
