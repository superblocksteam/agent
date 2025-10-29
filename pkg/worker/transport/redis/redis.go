package redis

import (
	"context"
	e "errors"
	"fmt"
	"strconv"
	"time"

	redis "github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"

	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/errors"
	metricsPkg "github.com/superblocksteam/agent/pkg/metrics"
	"github.com/superblocksteam/agent/pkg/observability"
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
	err     error
	inbox   func() (string, error)

	run.ForwardCompatibility
}

func New(options ...func(*Options) error) worker.Client {
	applied, err := utils.ApplyOptions[Options](append([]func(*Options) error{
		WithHeartbeatInterval(5 * time.Second),
		WithLogger(zap.NewNop()),
	}, options...)...)

	transport := &transport{
		err:     err,
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

func (t *transport) Remote(ctx context.Context, pluginName string) (string, string) {
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

	return bucket, fmt.Sprintf("agent.main.bucket.%s.plugin.%s.event.%s", bucket, pluginName, event)
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

func (t *transport) Metadata(ctx context.Context, plugin string, d, a *structpb.Struct) (*transportv1.Response, error) {
	_, res, _, err := t.handleEvent(worker.WithEvent(ctx, worker.EventMetadata), plugin, &transportv1.Request_Data_Data{
		DConfig: d,
		AConfig: a,
	})

	return res, err
}

func (t *transport) TestConnection(ctx context.Context, plugin string, d *structpb.Struct, a *structpb.Struct) (*transportv1.Response, error) {
	_, res, _, err := t.handleEvent(worker.WithEvent(ctx, worker.EventTest), plugin, &transportv1.Request_Data_Data{
		DConfig: d,
		AConfig: a,
	})
	return res, err
}

func (t *transport) PreDelete(ctx context.Context, plugin string, d *structpb.Struct) (*transportv1.Response, error) {
	_, res, _, err := t.handleEvent(worker.WithEvent(ctx, worker.EventPreDelete), plugin, &transportv1.Request_Data_Data{
		DConfig: d,
	})
	return res, err
}

// consume is a helper function that will subscribe to a topic and
// consume messages from it until the context is canceled.
func (t *transport) consume(ctx context.Context, topic string, stream chan<- string) error {
	pubsub := t.options.redis.Subscribe(ctx, topic)

	message, err := pubsub.Receive(ctx)
	if err != nil {
		return err
	}

	switch v := message.(type) {
	case *redis.Subscription:
		// We want to make sure we are subscribed to the topic before continuing.
		// Waiting for the subscription to be confirmed is the way the documentation
		// suggests we do this. However, since we can also receive messages from this
		// channel, we need to make sure we handle it.
	case *redis.Message:
		stream <- v.Payload
	}

	go func() {

		msgCh := pubsub.Channel(
			redis.WithChannelSize(cap(stream)),
			redis.WithChannelHealthCheckInterval(5*time.Second), // TODO(frank): we can propogate this to a flag if needed.
			redis.WithChannelSendTimeout(60*time.Second),
		)

		for {
			select {
			case msg := <-msgCh:
				if msg == nil {
					continue
				}

				stream <- msg.Payload
				metrics.StreamBufferItemsTotal.WithLabelValues().Add(1)
			case <-ctx.Done():

				t.options.logger.Debug("unsubscribing from topic", zap.String("topic", topic))

				if err := pubsub.Unsubscribe(ctx, topic); err != nil {
					t.options.logger.Error("could not unsubscribe from topic", zap.String("topic", topic), zap.Error(err))
				}
				if err := pubsub.Close(); err != nil {
					t.options.logger.Error("could not close pubsub after unsubscribe", zap.String("topic", topic), zap.Error(err))
				}

				close(stream)
				return
			}

		}
	}()

	return nil
}

// TODO(frank): this method could be cleaned up
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
	bucket, stream := t.Remote(ctx, pluginName)

	logger := t.options.logger.With(
		zap.String("stream", stream),
		zap.String(observability.OBS_TAG_CORRELATION_ID, constants.ExecutionID(ctx)),
		zap.String("bucket", bucket),
	)

	inbox, err := t.inbox()
	if err != nil {
		logger.Error("could not generate inbox uuid", zap.Error(err))
		return nil, nil, "", err
	}

	logger = logger.With(zap.String("inbox", inbox))

	if stream := settings.Stream; stream != nil {
		pubsubCtx, pubsubCancel := context.WithCancel(ctx)
		defer pubsubCancel()

		if err := t.consume(pubsubCtx, inbox, stream); err != nil {
			return nil, nil, "", err
		}
	}

	defer t.purge(ctx, inbox)

	reqStartMicro := time.Now().UnixNano() / 1000

	// The command returns the ID of the added entry. The ID is the one
	// auto-generated if * is passed as ID argument, otherwise the command
	// just returns the same ID specified by the user during insertion.
	messageID, err := SendWorkerMessage(ctx, t.options.redis, stream, inbox, bucket, pluginName, reqData)
	if err != nil {
		if err == redis.Nil {
			logger.Error("stream does not exist", zap.Error(err))
		} else {
			logger.Error("could not send request to worker", zap.Error(err))
		}

		return nil, nil, "", &errors.InternalError{}
	}

	defer t.purge(ctx, stream, messageID)

	if _, err := t.options.redis.XRead(ctx, &redis.XReadArgs{
		Streams: []string{inbox, redisAckID},
		Count:   1,
		Block:   t.options.heartbeatInterval,
	}).Result(); err != nil {
		logger.Error("did not receive ack from worker", zap.Error(err), zap.Duration("timeout", t.options.heartbeatInterval))
		metrics.TrackedErrorsTotal.WithLabelValues(strconv.Itoa(errors.CodeTransportWorkerNoAck)).Inc()
		return nil, nil, "", &errors.InternalError{}
	}

	t.options.logger.Debug("received ack from worker", zap.String("inbox", inbox))

	// A step is allowed to run for as long as the API is allowed to run for.
	// If for some reason the remaining duration is nil, we'll use the old default.
	var timeout time.Duration
	{
		switch worker.EventFromContext(ctx) {
		case worker.EventExecute, worker.EventStream:
			if value := constants.RemainingDuration(ctx); value == nil {
				timeout = t.options.timeout
			} else {
				// NOTE(frank): We want to give time for the system to correctly propogate a potential quota violation.
				//              For example, if we have 5 seconds left, we want the worker to timeout and propogate the
				//              the quota error. Hence, we need to allow for an arbitrary unknown amount of time for the
				//              worker to send the reponse.
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
			// Return a proper timeout error instead of generic internal error
			return nil, nil, "", errors.IntegrationError(
				fmt.Errorf("Timed out after %v", timeout),
				commonv1.Code_CODE_INTEGRATION_QUERY_TIMEOUT,
			)
		} else {
			logger.Error("there was an issue waiting for a worker to send a response", zap.Error(err))
		}

		return nil, nil, "", &errors.InternalError{}
	}

	logger.Debug("received response from worker", zap.String("inbox", inbox))

	perf, resp, key, err := t.process(data, inbox, reqData, opts...)

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

		// NOTE(frank): This needs to be in the caller of worker.Client.
		metricsPkg.Observe(perf,
			reqStartMicro,
			estimate,
			&metrics.StepMetricLabels{
				PluginName:  pluginName,
				Bucket:      bucket,
				PluginEvent: string(worker.EventFromContext(ctx)),
				ApiType:     constants.ApiType(ctx),
			},
		)
	}

	if err != nil {
		logger.Error("failed to process worker response", zap.Error(err))
	}

	return perf, resp, key, err
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
		default:
			err = errors.IntegrationError(e.New(msg.Data.Data.Err.Message), commonv1.Code_CODE_UNSPECIFIED)
		}
	}

	return perf, msg, key, err
}
