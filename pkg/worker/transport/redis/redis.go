package redis

import (
	"context"
	e "errors"
	"fmt"
	"strconv"
	"time"

	redis "github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"

	"github.com/superblocksteam/agent/internal/flags"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/errors"
	metricsPkg "github.com/superblocksteam/agent/pkg/metrics"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/worker"
	"github.com/superblocksteam/agent/pkg/worker/options"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"github.com/superblocksteam/run"
)

var (
	redisAckID      = "0-0"
	redisResponseID = "0-1"
	prefixData      = "DATA"
	prefixResponse  = "RESPONSE"
)

type transport struct {
	options *Options
	flags   flags.Flags
	err     error
	inbox   func() (string, error)

	run.ForwardCompatibility
}

func New(flags flags.Flags, options ...func(*Options) error) worker.Client {
	applied, err := utils.ApplyOptions[Options](append([]func(*Options) error{
		WithHeartbeatInterval(5 * time.Second),
		WithLogger(zap.NewNop()),
	}, options...)...)

	transport := &transport{
		err:     err,
		flags:   flags,
		inbox:   utils.UUID,
		options: applied,
	}

	if applied.buckets == nil {
		transport.err = e.New("the redis worker transport requires a bucket registry")
	}

	return transport
}

func (t *transport) Name() string {
	return "redis worker client"
}

func (t *transport) Run(ctx context.Context) error {
	if t.err != nil {
		return t.err
	}

	<-ctx.Done()
	return nil
}

func (t *transport) Alive() bool {
	if t.options.redis == nil {
		return false
	}

	return t.options.redis.Ping(context.Background()).Err() == nil
}

func (t *transport) Remote(ctx context.Context, pluginName string, organizationPlan string, orgId string) (string, string) {
	var estimate *uint32
	{
		value := ctx.Value(worker.ContextKeyEstimate)
		if value == nil {
			estimate = nil
		} else if ui32, ok := value.(*uint32); ok {
			estimate = ui32
		} else {
			t.options.logger.Error(fmt.Sprintf("estimate context key is polluted with %v", value))
		}
	}

	var event worker.Event
	{
		if value := ctx.Value(worker.ContextKeyEvent); value == nil || value == "" {
			event = worker.EventExecute
		} else if value, ok := value.(worker.Event); ok {
			if value != worker.EventStream {
				event = value
			} else {
				event = worker.EventExecute // NOTE(frank): I need to fix this.
			}
		}
	}

	bucket := t.options.buckets.Assign(pluginName, estimate)
	variant := t.flags.GetStreamVariant(organizationPlan, orgId)

	var stream string
	if variant != "" {
		stream = fmt.Sprintf("agent.main.bucket.%s.%s.plugin.%s.event.%s", bucket, variant, pluginName, event)
	} else {
		stream = fmt.Sprintf("agent.main.bucket.%s.plugin.%s.event.%s", bucket, pluginName, event)
	}

	return bucket, stream
}

func (t *transport) Execute(ctx context.Context, plugin string, data *transportv1.Request_Data_Data, opts ...options.Option) (*transportv1.Performance, string, error) {
	var event worker.Event
	{
		if options.Apply(opts...).Stream != nil {
			event = worker.EventStream
		} else {
			event = worker.EventExecute
		}
	}

	perf, _, key, err := t.handleEvent(worker.WithEvent(ctx, event), plugin, data, opts...)
	return perf, key, err
}

func (t *transport) Metadata(ctx context.Context, plugin string, d, a *structpb.Struct, opts ...options.Option) (*transportv1.Response, error) {
	_, res, _, err := t.handleEvent(worker.WithEvent(ctx, worker.EventMetadata), plugin, &transportv1.Request_Data_Data{
		DConfig: d,
		AConfig: a,
	}, opts...)

	return res, err
}

func (t *transport) TestConnection(ctx context.Context, plugin string, d *structpb.Struct, a *structpb.Struct, opts ...options.Option) (*transportv1.Response, error) {
	_, res, _, err := t.handleEvent(worker.WithEvent(ctx, worker.EventTest), plugin, &transportv1.Request_Data_Data{
		DConfig: d,
		AConfig: a,
	}, opts...)
	return res, err
}

func (t *transport) PreDelete(ctx context.Context, plugin string, d *structpb.Struct, opts ...options.Option) (*transportv1.Response, error) {
	_, res, _, err := t.handleEvent(worker.WithEvent(ctx, worker.EventPreDelete), plugin, &transportv1.Request_Data_Data{
		DConfig: d,
	}, opts...)
	return res, err
}

// consume subscribes to a Redis Pub/Sub topic and forwards messages to the
// provided channel until the context is canceled. Span events are added to
// the parent span (from ctx) so stream message activity is visible in traces.
func (t *transport) consume(ctx context.Context, topic string, stream chan<- string) error {
	pubsub := t.options.redis.Subscribe(ctx, topic)

	message, err := pubsub.Receive(ctx)
	if err != nil {
		return err
	}

	span := trace.SpanFromContext(ctx)

	switch v := message.(type) {
	case *redis.Subscription:
		span.AddEvent("stream.subscribed", trace.WithAttributes(attribute.String("stream.topic", topic)))
	case *redis.Message:
		span.AddEvent("stream.subscribed", trace.WithAttributes(attribute.String("stream.topic", topic)))
		stream <- v.Payload
		span.AddEvent("stream.message_received")
	}

	msgCh := pubsub.Channel(
		redis.WithChannelSize(cap(stream)),
		redis.WithChannelHealthCheckInterval(5*time.Second), // TODO(frank): we can propogate this to a flag if needed.
		redis.WithChannelSendTimeout(60*time.Second),
	)

	go forward(ctx, msgCh, stream, func() {
		t.options.logger.Debug("unsubscribing from topic", zap.String("topic", topic))

		if err := pubsub.Unsubscribe(ctx, topic); err != nil {
			t.options.logger.Error("could not unsubscribe from topic", zap.String("topic", topic), zap.Error(err))
		}
		if err := pubsub.Close(); err != nil {
			t.options.logger.Error("could not close pubsub after unsubscribe", zap.String("topic", topic), zap.Error(err))
		}
	})

	return nil
}

// forward reads messages from source and writes their payloads to dest until
// ctx is canceled. After cancellation it calls cleanup, drains any remaining
// buffered messages from source, and closes dest.
//
// Draining prevents a race where fast-completing streams lose data events
// because ctx.Done() wins the select over buffered messages.
func forward(ctx context.Context, source <-chan *redis.Message, dest chan<- string, cleanup func()) {
	for {
		select {
		case msg, ok := <-source:
			if !ok {
				if cleanup != nil {
					cleanup()
				}
				close(dest)
				return
			}
			if msg == nil {
				continue
			}

			dest <- msg.Payload
			metrics.AddUpDownCounter(ctx, metrics.StreamBufferItemsTotal, 1)
		case <-ctx.Done():
			if cleanup != nil {
				cleanup()
			}

			// Drain any messages that were buffered in the source
			// channel before we closed the subscription. Without this,
			// fast-completing streams (e.g. mock upstreams) can lose
			// data events that arrived between the worker publishing
			// them and the orchestrator cancelling the subscription.
			for {
				select {
				case msg, ok := <-source:
					if !ok {
						close(dest)
						return
					}
					if msg == nil {
						continue
					}
					dest <- msg.Payload
					metrics.AddUpDownCounter(ctx, metrics.StreamBufferItemsTotal, 1)
				default:
					close(dest)
					return
				}
			}
		}
	}
}

// handleEvent dispatches a request to a worker via Redis Streams and waits
// for the response. The entire round-trip is wrapped in a trace span with
// events marking each phase boundary (send, ack, response, process).
func (t *transport) handleEvent(
	ctx context.Context,
	pluginName string,
	reqData *transportv1.Request_Data_Data,
	opts ...options.Option,
) (
	*transportv1.Performance,
	*transportv1.Response,
	string,
	error,
) {
	settings := options.Apply(opts...)
	bucket, stream := t.Remote(ctx, pluginName, settings.OrganizationPlan, settings.OrgId)
	event := string(worker.EventFromContext(ctx))
	executionID := constants.ExecutionID(ctx)

	type handleEventResult struct {
		perf *transportv1.Performance
		resp *transportv1.Response
		key  string
	}

	result, err := tracer.Observe(ctx, "worker.dispatch", map[string]any{
		observability.OBS_TAG_PLUGIN_NAME:    pluginName,
		observability.OBS_TAG_PLUGIN_EVENT:   event,
		observability.OBS_TAG_CORRELATION_ID: executionID,
		"worker.bucket":                      bucket,
		"worker.stream":                      stream,
	}, func(ctx context.Context, span trace.Span) (*handleEventResult, error) {
		logger := t.options.logger.With(
			zap.String("stream", stream),
			zap.String(observability.OBS_TAG_CORRELATION_ID, executionID),
			zap.String("bucket", bucket),
		)

		inbox, err := t.inbox()
		if err != nil {
			logger.Error("could not generate inbox uuid", zap.Error(err))
			return nil, err
		}

		logger = logger.With(zap.String("inbox", inbox))
		span.SetAttributes(attribute.String("worker.inbox", inbox))

		if stream := settings.Stream; stream != nil {
			pubsubCtx, pubsubCancel := context.WithCancel(ctx)
			defer pubsubCancel()

			if err := t.consume(pubsubCtx, inbox, stream); err != nil {
				return nil, err
			}
		}

		defer t.purge(ctx, inbox)

		reqStartMicro := time.Now().UnixNano() / 1000

		messageID, err := SendWorkerMessage(ctx, t.options.redis, stream, inbox, bucket, pluginName, reqData)
		if err != nil {
			if err == redis.Nil {
				logger.Error("stream does not exist", zap.Error(err))
			} else {
				logger.Error("could not send request to worker", zap.Error(err))
			}
			internalErr := &errors.InternalError{}
			observeInfrastructureError(ctx, span, pluginName, event, bucket, "send_request", internalErr)
			return nil, internalErr
		}

		span.AddEvent("message_sent")
		defer t.purge(ctx, stream, messageID)

		if _, err := t.options.redis.XRead(ctx, &redis.XReadArgs{
			Streams: []string{inbox, redisAckID},
			Count:   1,
			Block:   t.options.heartbeatInterval,
		}).Result(); err != nil {
			logger.Warn("did not receive ack from worker", zap.Error(err), zap.Duration("timeout", t.options.heartbeatInterval))
			metrics.AddCounter(ctx, metrics.TrackedErrorsTotal,
				attribute.String("code", strconv.Itoa(errors.CodeTransportWorkerNoAck)),
				attribute.String("plugin_name", pluginName),
				attribute.String("bucket", bucket),
			)
			return nil, &errors.WorkerUnavailableError{
				Err: fmt.Errorf("no worker acknowledged request within %s", t.options.heartbeatInterval),
			}
		}

		span.AddEvent("ack_received")
		t.options.logger.Debug("received ack from worker", zap.String("inbox", inbox))

		var timeout time.Duration
		{
			switch worker.EventFromContext(ctx) {
			case worker.EventExecute, worker.EventStream:
				if value := constants.RemainingDuration(ctx); value == nil {
					timeout = t.options.timeout
				} else {
					timeout = *value + (time.Second * 10)
				}
			case worker.EventMetadata:
				timeout = t.options.metadataTimeout
			default:
				timeout = 30 * time.Second
			}
		}

		data, err := t.options.redis.XRead(ctx, &redis.XReadArgs{
			Streams: []string{inbox, redisResponseID},
			Count:   1,
			Block:   timeout,
		}).Result()

		if err != nil {
			if err == redis.Nil {
				logger.Error("timeout occurred while waiting for a worker to send a response", zap.Error(err), zap.Duration("timeout", timeout))
				return nil, errors.IntegrationError(
					fmt.Errorf("Timed out after %v", timeout),
					commonv1.Code_CODE_INTEGRATION_QUERY_TIMEOUT,
				)
			}
			logger.Error("there was an issue waiting for a worker to send a response", zap.Error(err))
			internalErr := &errors.InternalError{}
			observeInfrastructureError(ctx, span, pluginName, event, bucket, "read_response", internalErr)
			return nil, internalErr
		}

		span.AddEvent("response_received")
		logger.Debug("received response from worker", zap.String("inbox", inbox))

		perf, resp, key, err := t.process(data, inbox, reqData, opts...)

		span.AddEvent("response_processed")

		var estimate int64
		{
			value := ctx.Value(worker.ContextKeyEstimate)
			if value == nil {
				estimate = 0
			} else if ui32, ok := value.(*uint32); ok {
				estimate = int64(*ui32)
			}
		}

		if perf != nil {
			perf.Error = err != nil
			queueRequestStartMicroForMetrics := reqStartMicro

			// Compute dispatch latency (queue wait time). The worker reports
			// QueueRequest.End (when it dequeued the message in microseconds)
			// but not the Start or Value. The orchestrator knows reqStartMicro
			// (when it enqueued), so we can compute the delta here.
			// Guard against clock skew between orchestrator and worker hosts
			// which could produce a negative delta.
			if perf.QueueRequest != nil && perf.QueueRequest.End > 0 {
				if delta := perf.QueueRequest.End - float64(reqStartMicro); delta >= 0 {
					perf.QueueRequest.Start = float64(reqStartMicro)
					if delta > 0 {
						perf.QueueRequest.Value = delta
					}
				} else {
					// If clocks are skewed (worker dequeues "before" enqueue on our clock),
					// avoid surfacing negative queue timings in metrics/attributes.
					queueRequestStartMicroForMetrics = 0
					perf.QueueRequest.Start = 0
					perf.QueueRequest.Value = 0
				}
			}
			metricsPkg.Observe(ctx, perf,
				queueRequestStartMicroForMetrics,
				estimate,
				&metrics.StepMetricLabels{
					PluginName:  pluginName,
					Bucket:      bucket,
					PluginEvent: event,
					ApiType:     constants.ApiType(ctx),
				},
			)

			// Performance timings as attributes for quick inspection.
			// The worker creates child spans for each phase with real timing.
			if perf.PluginExecution != nil {
				span.SetAttributes(attribute.Float64("worker.perf.plugin_execution_us", perf.PluginExecution.Value))
			}
			if perf.QueueRequest != nil {
				span.SetAttributes(attribute.Float64("worker.perf.queue_request_us", perf.QueueRequest.Value))
			}
		}

		if err != nil {
			observeInfrastructureError(ctx, span, pluginName, event, bucket, "process_response", err)
			logger.Error("failed to process worker response", zap.Error(err))
			return &handleEventResult{perf: perf, resp: resp, key: key}, err
		}

		return &handleEventResult{perf: perf, resp: resp, key: key}, nil
	}, nil)

	if result == nil {
		return nil, nil, "", err
	}

	return result.perf, result.resp, result.key, err
}

// observeInfrastructureError emits the infrastructure error metric and enriches
// the current span when the failure is classified as InternalError.
func observeInfrastructureError(
	ctx context.Context,
	span trace.Span,
	pluginName string,
	event string,
	bucket string,
	stage string,
	err error,
) {
	var internalErr *errors.InternalError
	if !e.As(err, &internalErr) {
		return
	}

	metricAttrs := []attribute.KeyValue{
		attribute.String("plugin_name", pluginName),
		attribute.String("plugin_event", event),
		attribute.String("bucket", bucket),
	}
	metrics.AddExecuteInfrastructureError(ctx, metricAttrs...)

	// Keep stable attributes on the span for filtering/indexing; emit stage on the
	// event timeline to avoid duplicating the full attribute payload.
	span.SetAttributes(
		attribute.String("error.type", "InternalError"),
		attribute.String("worker.error.class", "infrastructure"),
	)
	span.AddEvent("worker.infrastructure_error",
		trace.WithAttributes(
			attribute.String("worker.error.stage", stage),
		),
	)
}

func (t *transport) purge(ctx context.Context, keyOrStream string, ids ...string) {
	detached := context.Background()
	logger := t.options.logger.With(
		zap.String("execution", constants.ExecutionID(ctx)),
		zap.Bool("leak", true),
	)

	if keyOrStream == "" {
		return
	}

	go func() {
		if len(ids) == 0 {
			if _, err := t.options.redis.Del(detached, keyOrStream).Result(); err != nil {
				logger.Error("could not delete inbox", zap.String("inbox", keyOrStream), zap.Strings("key", []string{keyOrStream}), zap.Error(err))
			}
		} else {
			if _, err := t.options.redis.XDel(context.Background(), keyOrStream, ids...).Result(); err != nil {
				logger.Error("could not delete message from stream", zap.String("stream", keyOrStream), zap.Strings("key", ids), zap.Error(err))
			}
		}
	}()
}

func (t *transport) process(data []redis.XStream, inbox string, reqData *transportv1.Request_Data_Data, opts ...options.Option) (*transportv1.Performance, *transportv1.Response, string, error) {
	settings := options.Apply(opts...)

	msg, err := UnwrapOneRedisProtoMessageFromStream(data, func() *transportv1.Response {
		return new(transportv1.Response)
	}, inbox, "data")
	if err != nil {
		return nil, nil, "", errors.RedisDataCorruptionError(err)
	}

	if msg.Data == nil {
		return nil, nil, "", errors.RedisDataCorruptionError()
	}

	perf := msg.Data.Pinned

	var key string
	{
		if msg.Pinned != nil {
			msg.Pinned.Message = utils.Escape(msg.Pinned.Message)
			err = errors.IntegrationError(msg.Pinned, msg.Pinned.Code)
		}

		if msg.Data.Data == nil {
			return perf, nil, "", err
		}

		key = msg.Data.Data.Key

		if msg.Data.Data.Err == nil || msg.Data.Data.Err.Message == "" {
			return perf, msg, key, err
		}

		msg.Data.Data.Err.Message = utils.Escape(msg.Data.Data.Err.Message)

		switch msg.Data.Data.Err.Message {
		case "QuotaError":
			err = errors.StepSizeQuotaError(reqData.GetProps().GetStepName(), reqData.GetQuotas().GetSize())
		case "DurationQuotaError":
			if settings.ApiTimeoutErrorPrecedence {
				err = settings.ApiTimeoutError
			} else {
				err = errors.StepDurationQuotaError(reqData.GetProps().GetStepName(), reqData.GetQuotas().GetDuration()/1000)
			}
		case "InternalError":
			err = &errors.InternalError{}
		default:
			err = errors.IntegrationError(e.New(msg.Data.Data.Err.Message), commonv1.Code_CODE_UNSPECIFIED)
		}
	}

	return perf, msg, key, err
}
