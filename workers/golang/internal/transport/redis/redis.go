package redis

import (
	"context"
	stderr "errors"
	"fmt"
	"log/slog"
	"sync"
	"sync/atomic"
	"time"

	"workers/golang/internal/plugin_executor"

	r "github.com/redis/go-redis/v9"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/worker"
	redisutils "github.com/superblocksteam/agent/pkg/worker/transport/redis"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
)

const (
	INBOX_ACK_MESSAGE_ID  = "0-1"
	INBOX_DATA_MESSAGE_ID = "0-2"
)

type redisTransport struct {
	redis          *r.Client
	blockDuration  time.Duration
	messageCount   int64
	streamKeys     []string
	xReadArgs      []string
	workerId       string
	consumerGroup  string
	logger         *zap.Logger
	pluginExecutor plugin_executor.PluginExecutor

	alive             *atomic.Bool
	executionPool     *atomic.Int64
	executionPoolSize int64
	workerReturned    chan int64

	mutex *sync.Mutex

	context context.Context
	cancel  context.CancelFunc
}

var _ run.Runnable = &redisTransport{}

func generateXReadArgs(streamKeys []string) []string {
	xReadArgs := make([]string, len(streamKeys)*2)
	for i := 0; i < len(streamKeys)*2; i++ {
		if i < len(streamKeys) {
			xReadArgs[i] = streamKeys[i]
		} else {
			xReadArgs[i] = ">"
		}
	}
	return xReadArgs
}

func NewRedisTransport(options *Options) *redisTransport {
	ctx, cancel := context.WithCancel(context.Background())
	alive := &atomic.Bool{}
	alive.Store(true)
	executionPool := &atomic.Int64{}
	executionPool.Store(options.ExecutionPool)

	return &redisTransport{
		redis:          options.RedisClient,
		blockDuration:  options.BlockDuration,
		messageCount:   options.MessageCount,
		streamKeys:     options.StreamKeys,
		xReadArgs:      generateXReadArgs(options.StreamKeys),
		workerId:       options.WorkerId,
		consumerGroup:  options.ConsumerGroup,
		logger:         options.Logger,
		pluginExecutor: options.PluginExecutor,

		mutex: &sync.Mutex{},

		alive:             alive,
		executionPool:     executionPool,
		executionPoolSize: options.ExecutionPool,
		workerReturned:    make(chan int64),

		context: ctx,
		cancel:  cancel,
	}
}

func (rt *redisTransport) initStreams() error {
	// This uses the object's context because we want it to abort if the runnable is closed
	for _, stream := range rt.streamKeys {
		rt.logger.Debug("initializing stream", zap.String("stream", stream))
		_, err := rt.redis.XGroupCreateMkStream(rt.context, stream, rt.consumerGroup, "0").Result()
		if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
			rt.logger.Error("error while initializing streams", zap.String("stream", stream), zap.Strings("streams", rt.streamKeys), zap.Error(err))
			return err
		}
	}

	rt.logger.Info("streams initialized", zap.Strings("streams", rt.streamKeys))

	return nil
}

// This prevents the orchestrator from abandoning the api execution if
// the worker does not ack the message
func (rt *redisTransport) ackMessage(inboxId string) error {
	_, err := rt.redis.XAdd(context.Background(), &r.XAddArgs{
		Stream: inboxId,
		ID:     INBOX_ACK_MESSAGE_ID,
		Values: map[string]any{
			"data": "ack",
		},
	}).Result()

	if err != nil {
		rt.logger.Error("error while acking message", zap.String("inboxId", inboxId), zap.Error(err))
	}

	return err
}

func (rt *redisTransport) poll() error {
	for {
		if !rt.alive.Load() {
			return nil
		}

		err := rt.pollOnce()
		if err != nil {
			rt.logger.Error("error while polling messages", zap.Error(err))
		}
	}
}

func (rt *redisTransport) pollOnce() error {

	remaining := rt.executionPool.Load()
	if remaining <= 0 {
		<-rt.workerReturned
		return nil
	}

	// This uses the object's context because we want it to abort if the runnable is closed
	messages, err := rt.redis.XReadGroup(rt.context, &r.XReadGroupArgs{
		Group:    rt.consumerGroup,
		Consumer: rt.workerId,
		Streams:  rt.xReadArgs,
		Count:    min(rt.messageCount, remaining),
		Block:    rt.blockDuration,
	}).Result()

	if err != nil && err != r.Nil {
		return fmt.Errorf("error while polling messages from redis: %w", err)
	}

	for _, stream := range messages {
		for _, mesg := range stream.Messages {
			rt.logger.Debug("message received", zap.String("stream", stream.Stream), zap.String("id", mesg.ID))
			rt.executionPool.Add(-1)
			// This is done to prevent the closure of the loop from capturing the wrong value
			m := mesg

			go func(stream string) {
				rt.handleMessage(&m, stream)
				rt.mutex.Lock()
				pool := rt.executionPool.Add(1)
				rt.workerReturned <- rt.executionPoolSize - pool
				defer rt.mutex.Unlock()
			}(stream.Stream)
		}
	}

	return nil
}

func (rt *redisTransport) handleMessage(message *r.XMessage, stream string) {
	rt.redis.XAck(context.Background(), stream, rt.consumerGroup, message.ID)

	requests, err := redisutils.UnwrapRedisProtoMessages([]r.XMessage{*message}, func() *transportv1.Request { return &transportv1.Request{} }, "data")

	if err != nil || len(requests) != 1 {
		rt.logger.Error("error while unwrapping messages", zap.Error(err))
		return
	}

	request := requests[0]
	requestMeta := request.GetData().GetPinned()

	pluginName := request.GetData().GetPinned().GetName()
	pluginProps := request.GetData().GetData().GetProps()
	ctxWithTrace := otel.GetTextMapPropagator().Extract(context.Background(), propagation.MapCarrier(requestMeta.GetCarrier()))
	ctxWithBaggage := propagation.Baggage{}.Extract(ctxWithTrace, propagation.MapCarrier(requestMeta.GetCarrier()))

	ctx := constants.WithExecutionID(ctxWithBaggage, request.GetData().GetData().GetProps().GetExecutionId())
	logger := rt.logger.With(
		zap.String(observability.OBS_TAG_CORRELATION_ID, constants.ExecutionID(ctx)),
	)

	logger.Info("received plugin event",
		zap.String(observability.OBS_TAG_PLUGIN_EVENT, requestMeta.GetEvent()),
		zap.String(observability.OBS_TAG_PLUGIN_NAME, pluginName),
		zap.String("id", message.ID),
		zap.String("inbox", request.GetInbox()),
	)

	perf := &transportv1.Performance{
		QueueRequest:  &transportv1.Performance_Observable{},
		QueueResponse: &transportv1.Performance_Observable{},
	}
	perf.QueueRequest.End = float64(time.Now().UnixMicro())

	if pluginProps.GetVersion() != "v3" {
		if err := rt.ackMessage(request.GetInbox()); err != nil {
			logger.Error("could not send ack to inbox", zap.Error(err))
			return
		}
	}

	handle := func(req *transportv1.Request) *transportv1.Response {
		var result *transportv1.Response_Data_Data
		{
			switch requestMeta.GetEvent() {
			case string(worker.EventExecute):
				result, err = rt.pluginExecutor.Execute(ctx, pluginName, pluginProps, request.GetData().GetData().GetQuotas(), perf)
			case string(worker.EventStream):
				err = stderr.New("streaming not supported yet")
			case string(worker.EventMetadata):
				result, err = rt.pluginExecutor.Metadata(ctxWithBaggage, pluginName, pluginProps, perf)
			case string(worker.EventTest):
				result, err = rt.pluginExecutor.Test(ctxWithBaggage, pluginName, pluginProps, perf)
			case string(worker.EventPreDelete):
				result, err = rt.pluginExecutor.PreDelete(ctxWithBaggage, pluginName, pluginProps, perf)
			default:
				err = stderr.New("unknown event type")
			}
		}

		resp := &transportv1.Response{
			Data: &transportv1.Response_Data{
				Pinned: perf,
				Data:   result,
			},
		}

		if err != nil {
			resp.Pinned = errors.ToCommonV1(err)
		}

		resp.Data.Pinned.QueueResponse.Start = float64(time.Now().UnixMicro())

		return resp
	}

	if pluginProps.GetVersion() != "v3" {
		err = rt.sendResult(handle(request), request.GetInbox())
	} else {
		publish := func(ctx context.Context, msg string) error {
			return rt.redis.Publish(ctx, request.GetInbox(), msg).Err()
		}

		err = redisutils.Handle(ctx, publish, publish, request, 5*time.Second, handle)
	}

	if err != nil {
		logger.Error("could not send response to inbox", zap.Error(err))
	} else {
		logger.Debug("result sent")
	}
}

func (rt *redisTransport) sendResult(result *transportv1.Response, stream string) error {
	jsonEncoded, err := protojson.Marshal(result)
	if err != nil {
		return err
	}

	_, err = rt.redis.XAdd(context.Background(), &r.XAddArgs{
		Stream: stream,
		ID:     INBOX_DATA_MESSAGE_ID,
		Values: map[string]any{
			"data": string(jsonEncoded),
		},
		NoMkStream: true,
	}).Result()

	return err
}

func (rt *redisTransport) Run(ctx context.Context) error {
	err := rt.initStreams()
	if err != nil {
		return err
	}

	rt.poll()
	return nil
}

func (rt *redisTransport) Close(ctx context.Context) error {
	defer close(rt.workerReturned)
	rt.logger.Info("closing redis transport", zap.Error(ctx.Err()))
	rt.alive.Store(false)
	rt.cancel()
	if rt.executionPool.Load() == rt.executionPoolSize {
		return nil
	}
	for {
		busyWorkersRemaining := <-rt.workerReturned
		rt.logger.Debug("worker returned", zap.Int64("remaining", busyWorkersRemaining))
		if busyWorkersRemaining == 0 {
			return nil
		}
	}
}

func (rt *redisTransport) Fields() []slog.Attr {
	return []slog.Attr{}
}

func (rt *redisTransport) Name() string {
	return "redisTransport"
}

func (rt *redisTransport) Alive() bool {
	return rt.alive.Load()
}
