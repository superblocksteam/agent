package plugin_executor

import (
	"context"
	"errors"
	"fmt"
	"time"

	"workers/golang/internal/plugin"

	"github.com/superblocksteam/agent/pkg/constants"
	commonErr "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/metrics"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.opentelemetry.io/otel/baggage"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
)

type PluginExecutor interface {
	RegisterPlugin(name string, plugin plugin.Plugin) error
	ListPlugins() []string
	Execute(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, quotas *transportv1.Request_Data_Data_Quota, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	Stream(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance, send func(message any), until func()) error
	Metadata(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	Test(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
	PreDelete(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error)
}

type pluginExecutor struct {
	plugins    map[string]plugin.Plugin
	kvstore    store.Store
	kvstoreTtl time.Duration
	logger     *zap.Logger
}

func NewPluginExecutor(options *Options) PluginExecutor {
	return &pluginExecutor{
		plugins:    make(map[string]plugin.Plugin),
		kvstore:    options.KVStore,
		kvstoreTtl: time.Hour * 24, // NOTE: (joey) can pass this in as an option in the future
		logger:     options.Logger,
	}
}

func (p *pluginExecutor) RegisterPlugin(name string, plugin plugin.Plugin) error {
	p.plugins[name] = plugin
	return nil
}

func (p *pluginExecutor) ListPlugins() []string {
	plugins := make([]string, 0)
	for pluginName := range p.plugins {
		plugins = append(plugins, pluginName)
	}

	return plugins
}

func (p *pluginExecutor) Execute(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, quotas *transportv1.Request_Data_Data_Quota, parentPerf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	logger := p.logger.With(
		zap.String(observability.OBS_TAG_CORRELATION_ID, constants.ExecutionID(ctx)),
	)

	// NOTE: (joey) special context used to enforce quota timeouts for our plugin execution
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
	defer metrics.MergeIntoParentPerf(parentPerf, perf)

	uuid, err := utils.UUID()
	if err != nil {
		return resp, err
	}
	resp.Key = props.GetExecutionId() + ".output." + uuid

	plug, ok := p.plugins[pluginName]
	if !ok {
		return resp, err
	}

	output, err := tracer.Observe(
		ctx,
		fmt.Sprintf("execute.plugin.%s", pluginName),
		nil,
		func(_ context.Context, _ trace.Span) (*workerv1.ExecuteResponse, error) {
			perf.PluginExecution.Start = float64(time.Now().UnixMicro())
			res, err := plug.Execute(timedCtx, nil, props, nil, nil)
			perf.PluginExecution.End = float64(time.Now().UnixMicro())
			return res, err
		},
		nil,
	)

	// If the plugin returns a nil result for the output (e.g. in the case of an execution error) set
	// the output to a default/empty value
	if output == nil {
		output = &workerv1.ExecuteResponse{}
	}

	if err != nil {
		if _, isQuotaErr := commonErr.IsQuotaError(err); isQuotaErr || err == context.DeadlineExceeded {
			output.StructuredLog = nil
			if output.GetOutput().GetLog() != nil {
				output.Output.Log = nil
			}
			err = errors.New("DurationQuotaError")
		}

		resp.Err = commonErr.ToCommonV1(err)
	}

	p.logExecutionOutput(ctx, output, err, logger)

	var kvPair *store.KV
	if kvPair, err = p.buildKvPair(resp.Key, output, quotas, logger); err == nil {
		err = p.pushToKVStore(ctx, kvPair, perf)
	}

	if err != nil {
		if err, isQuotaErr := commonErr.IsQuotaError(err); isQuotaErr {
			resp.Err = commonErr.ToCommonV1(err)
			if output.GetOutput().GetOutput() != nil {
				output.Output.Output = nil
			}

			if kvPair, err = p.buildKvPair(resp.Key, output, nil, logger); err == nil {
				err = p.pushToKVStore(ctx, kvPair, perf)
			}

			if err != nil {
				logger.Error("could not write output to store", zap.Error(err))
				return resp, err
			}
		} else {
			// not quota error, just return error
			logger.Error("unexpected error: failed to write output to store", zap.Error(err))
			return resp, err
		}
	}
	return resp, nil
}

func (p *pluginExecutor) Stream(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance, send func(message any), until func()) error {
	plug, ok := p.plugins[pluginName]
	if !ok {
		return &commonErr.InternalError{}
	}

	err := plug.Stream(ctx, nil, props, nil, nil, send, until)
	if err != nil {
		return err
	}

	return nil
}

func (p *pluginExecutor) Metadata(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	plugin, ok := p.plugins[pluginName]
	if !ok {
		return nil, &commonErr.InternalError{}
	}

	pluginRes, err := plugin.Metadata(ctx, nil, props.GetDatasourceConfiguration(), props.GetActionConfiguration())

	if err != nil {
		return nil, err
	}

	return pluginRes, nil
}

func (p *pluginExecutor) Test(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	plugin, ok := p.plugins[pluginName]
	if !ok {
		return nil, &commonErr.InternalError{}
	}

	err := plugin.Test(ctx, nil, props.GetDatasourceConfiguration(), props.GetActionConfiguration())
	if err != nil {
		return nil, err
	}

	return &transportv1.Response_Data_Data{}, nil
}

func (p *pluginExecutor) PreDelete(ctx context.Context, pluginName string, props *transportv1.Request_Data_Data_Props, perf *transportv1.Performance) (*transportv1.Response_Data_Data, error) {
	plugin, ok := p.plugins[pluginName]
	if !ok {
		return nil, &commonErr.InternalError{}
	}

	plugin.PreDelete(ctx, nil, props.GetDatasourceConfiguration())
	return nil, nil
}

func (p *pluginExecutor) buildKvPair(key string, message *workerv1.ExecuteResponse, quotas *transportv1.Request_Data_Data_Quota, logger *zap.Logger) (*store.KV, error) {
	jsonData, err := protojson.Marshal(message.GetOutput())
	if err != nil {
		logger.Error("failed to JSON serialize proto message", zap.Error(err))
		return nil, fmt.Errorf("failed to JSON serialize proto message: %w", err)
	}

	return &store.KV{
		Key:     key,
		Value:   string(jsonData),
		MaxSize: int64(quotas.GetSize()),
		TTL:     p.kvstoreTtl,
	}, nil
}

func (p *pluginExecutor) pushToKVStore(ctx context.Context, kv *store.KV, perf *transportv1.Performance) error {
	_, err := tracer.Observe[any](
		ctx,
		"store.write",
		nil,
		func(ctx context.Context, _ trace.Span) (any, error) {
			perf.KvStorePush.Start = float64(time.Now().UnixMicro())
			err := p.kvstore.Write(ctx, kv)
			perf.KvStorePush.End = float64(time.Now().UnixMicro())
			return nil, err
		},
		nil,
	)
	return err
}

func (p *pluginExecutor) logExecutionOutput(ctx context.Context, output *workerv1.ExecuteResponse, err error, logger *zap.Logger) {
	l := logger.With(
		append(
			[]zap.Field{
				zap.String(observability.OBS_TAG_COMPONENT, "worker.go"),
				zap.String(observability.OBS_TAG_REMOTE, "true"),
			},
			getObservabilityFieldsFromCtx(ctx)...,
		)...,
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

func getObservabilityFieldsFromCtx(ctx context.Context) []zap.Field {
	bag := baggage.FromContext(ctx)

	fields := make([]zap.Field, bag.Len())
	for i, member := range bag.Members() {
		fields[i] = zap.String(member.Key(), member.Value())
	}

	return fields
}
