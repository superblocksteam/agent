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
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

// PluginExecutor manages plugin execution
// This interface mirrors workers/golang/internal/plugin_executor.PluginExecutor
type PluginExecutor interface {
	RegisterPlugin(name string, plugin plugin.Plugin) error
	ListPlugins() []string
	Execute(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, quotas *transportv1.Request_Data_Data_Quota, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	Stream(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance, send func(message any), until func()) error
	Metadata(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	Test(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	PreDelete(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	Close()
}

type pluginExecutor struct {
	plugins  map[string]plugin.Plugin
	logger   *zap.Logger
	language string      // The language this executor handles (e.g., "python", "javascript")
	store    store.Store // KV store for output
}

// NewPluginExecutor creates a new plugin executor.
// Language is required - each ephemeral worker handles exactly one language.
func NewPluginExecutor(options *Options) PluginExecutor {
	if options.Language == "" {
		panic("plugin_executor: Language is required")
	}
	if options.Store == nil {
		panic("plugin_executor: Store is required")
	}
	return &pluginExecutor{
		plugins:  make(map[string]plugin.Plugin),
		logger:   options.Logger,
		language: options.Language,
		store:    options.Store,
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

// Execute runs code using the appropriate plugin
func (p *pluginExecutor) Execute(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, quotas *transportv1.Request_Data_Data_Quota, parentPerf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	logger := p.logger.With(
		zap.String(observability.OBS_TAG_CORRELATION_ID, constants.ExecutionID(ctx)),
	)

	// Verify request matches this worker's language
	if pluginName != p.language {
		err := fmt.Errorf("this worker only handles %s, got %s", p.language, pluginName)
		logger.Error("language mismatch", zap.Error(err))
		return nil, err
	}

	// Apply quota timeout if specified
	timedCtx := ctx
	if quotas != nil && quotas.GetDuration() > 0 {
		var cancel context.CancelFunc
		timedCtx, cancel = context.WithTimeout(ctx, time.Millisecond*time.Duration(quotas.Duration))
		defer cancel()
	}

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
	resp.Key = props.GetExecutionId() + ".output." + uuid

	plug, ok := p.plugins[pluginName]
	if !ok {
		err := fmt.Errorf("unknown plugin: %s", pluginName)
		logger.Error("plugin not found", zap.Error(err))
		return resp, err
	}

	output, err := tracer.Observe(
		ctx,
		fmt.Sprintf("execute.plugin.%s", pluginName),
		nil,
		func(_ context.Context, _ trace.Span) (*apiv1.Output, error) {
			perf.PluginExecution.Start = float64(time.Now().UnixMicro())
			res, err := plug.Execute(timedCtx, props)
			perf.PluginExecution.End = float64(time.Now().UnixMicro())
			return res, err
		},
		nil,
	)

	// If the plugin returns a nil result for the output, set to default/empty value
	if output == nil {
		output = &apiv1.Output{}
	}

	if err != nil {
		if _, isQuotaErr := commonErr.IsQuotaError(err); isQuotaErr || err == context.DeadlineExceeded {
			output.Stdout = nil
			output.Stderr = nil
			err = errors.New("DurationQuotaError")
		}
		resp.Err = commonErr.ToCommonV1(err)
		// Set error name like Python worker does
		if resp.Err != nil {
			if resp.Err.Message == "DurationQuotaError" || resp.Err.Message == "QuotaError" {
				resp.Err.Name = "QuotaError"
			} else {
				resp.Err.Name = "IntegrationError"
			}
		}
	}

	p.logExecutionOutput(ctx, output, err, logger)

	// Determine error message to store in output (matching Python worker behavior)
	var errMsgForOutput string
	if err != nil {
		errMsgForOutput = err.Error()
	}

	// Store output in KV store
	kvPair, kvErr := p.buildKvPair(resp.Key, output.ToOld(), quotas, logger, errMsgForOutput)
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
			output.Result = nil

			// Try again without the result, include QuotaError in output
			kvPair, kvErr = p.buildKvPair(resp.Key, output.ToOld(), nil, logger, "QuotaError")
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
func (p *pluginExecutor) Stream(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance, send func(message any), until func()) error {
	plug, ok := p.plugins[pluginName]
	if !ok {
		return &commonErr.InternalError{}
	}

	return plug.Stream(ctx, props, send, until)
}

// Metadata retrieves metadata from the plugin
func (p *pluginExecutor) Metadata(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	plug, ok := p.plugins[pluginName]
	if !ok {
		return nil, &commonErr.InternalError{}
	}

	return plug.Metadata(ctx, props.GetDatasourceConfiguration(), props.GetActionConfiguration())
}

// Test runs a connection test using the plugin
func (p *pluginExecutor) Test(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	plug, ok := p.plugins[pluginName]
	if !ok {
		return nil, &commonErr.InternalError{}
	}

	err := plug.Test(ctx, props.GetDatasourceConfiguration())
	if err != nil {
		return nil, err
	}

	return &transportv1.Response_Data_Data{}, nil
}

// PreDelete runs pre-delete logic using the plugin
func (p *pluginExecutor) PreDelete(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	plug, ok := p.plugins[pluginName]
	if !ok {
		return nil, &commonErr.InternalError{}
	}

	plug.PreDelete(ctx, props.GetDatasourceConfiguration())
	return nil, nil
}

// Close closes all registered plugins
func (p *pluginExecutor) Close() {
	for _, plug := range p.plugins {
		plug.Close()
	}
}

func (p *pluginExecutor) buildKvPair(key string, message proto.Message, quotas *transportv1.Request_Data_Data_Quota, logger *zap.Logger, errMsg string) (*store.KV, error) {
	// First marshal the protobuf message
	jsonData, err := protojson.Marshal(message)
	if err != nil {
		logger.Error("failed to JSON serialize proto message", zap.Error(err))
		return nil, fmt.Errorf("failed to JSON serialize proto message: %w", err)
	}

	// If there's an error, we need to add the error field to the output
	if errMsg != "" {
		var outputMap map[string]any
		if unmarshalErr := json.Unmarshal(jsonData, &outputMap); unmarshalErr != nil {
			logger.Error("failed to unmarshal output for error injection", zap.Error(unmarshalErr))
		} else {
			outputMap["error"] = errMsg
			jsonData, err = json.Marshal(outputMap)
			if err != nil {
				logger.Error("failed to marshal output with error", zap.Error(err))
				return nil, fmt.Errorf("failed to marshal output with error: %w", err)
			}
		}
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

func (p *pluginExecutor) logExecutionOutput(ctx context.Context, output *apiv1.Output, err error, logger *zap.Logger) {
	l := logger.With(
		zap.String(observability.OBS_TAG_COMPONENT, "worker.ephemeral"),
		zap.String(observability.OBS_TAG_REMOTE, "true"),
	)

	for _, log := range output.GetStdout() {
		l.Info(log)
	}
	for _, log := range output.GetStderr() {
		l.Error(log)
	}

	if err != nil {
		l.Error(err.Error())
	}
}
