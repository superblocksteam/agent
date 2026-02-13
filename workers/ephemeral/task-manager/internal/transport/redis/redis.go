package redis

import (
	"context"
	stderr "errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	sandboxmetrics "workers/ephemeral/task-manager/internal/metrics"
	"workers/ephemeral/task-manager/internal/plugin_executor"
	redisstore "workers/ephemeral/task-manager/internal/store/redis"

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
	initialized bool

	redis          *r.Client
	blockDuration  time.Duration
	messageCount   int64
	streamKeys     []string
	xReadArgs      []string
	workerId       string
	consumerGroup  string
	logger         *zap.Logger
	pluginExecutor plugin_executor.PluginExecutor

	// File context provider
	fileContextProvider redisstore.FileContextProvider

	// Agent key for file server authentication
	agentKey string

	alive             *atomic.Bool
	executionPool     *atomic.Int64
	executionPoolSize int64
	workerReturned    chan int64

	mutex *sync.Mutex

	context context.Context
	cancel  context.CancelFunc

	// Ephemeral mode: process only one message and exit
	ephemeral bool

	run.ForwardCompatibility
}

var _ run.Runnable = (*redisTransport)(nil)

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

// NewRedisTransport creates a new Redis transport
func NewRedisTransport(options *Options) *redisTransport {
	ctx, cancel := context.WithCancel(context.Background())
	alive := &atomic.Bool{}
	alive.Store(true)

	executionPool := &atomic.Int64{}
	executionPool.Store(options.ExecutionPool)

	return &redisTransport{
		redis:               options.RedisClient,
		blockDuration:       options.BlockDuration,
		messageCount:        options.MessageCount,
		streamKeys:          options.StreamKeys,
		xReadArgs:           generateXReadArgs(options.StreamKeys),
		workerId:            options.WorkerId,
		consumerGroup:       options.ConsumerGroup,
		logger:              options.Logger,
		pluginExecutor:      options.PluginExecutor,
		fileContextProvider: options.FileContextProvider,
		agentKey:            options.AgentKey,

		mutex: &sync.Mutex{},

		alive:             alive,
		executionPool:     executionPool,
		executionPoolSize: options.ExecutionPool,
		workerReturned:    make(chan int64),

		context: ctx,
		cancel:  cancel,

		ephemeral: options.Ephemeral,
	}
}

func (rt *redisTransport) init() error {
	if rt.initialized {
		return nil
	}

	if rt.ephemeral {
		rt.executionPool.Store(1)
		rt.executionPoolSize = 1

		rt.logger = rt.logger.With(zap.Bool("ephemeral", true))
	}

	if err := rt.initStreams(); err != nil {
		return err
	}

	// Report configured execution pool size
	sandboxmetrics.RecordGauge(context.Background(), sandboxmetrics.SandboxExecutionPoolSize, rt.executionPoolSize)

	rt.initialized = true
	return nil
}

func (rt *redisTransport) initStreams() error {
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

// ackMessage sends an ack to the inbox to prevent the orchestrator from abandoning the execution
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

// poll is the main polling loop.
func (rt *redisTransport) poll() error {
	if !rt.initialized {
		return stderr.New("transport not initialized")
	}

	for rt.context.Err() == nil {
		handled, err := rt.pollOnce()
		if err != nil {
			rt.logger.Error("error while polling messages", zap.Error(err))
			if rt.ephemeral {
				return err
			}
		}

		// If the execution pool is exhausted, wait
		if rt.executionPool.Load() <= 0 {
			select {
			case <-rt.context.Done():
				return rt.context.Err()
			case <-rt.workerReturned:
			}
		}

		// In ephemeral mode, return once the execution is complete
		if rt.ephemeral && handled {
			return nil
		}
	}

	return rt.context.Err()
}

// pollOnce reads messages from Redis and dispatches them for handling.
// Returns (true, nil) if at least one message was handled.
func (rt *redisTransport) pollOnce() (bool, error) {
	remaining := rt.executionPool.Load()
	if remaining <= 0 {
		select {
		case <-rt.context.Done():
			return false, rt.context.Err()
		case <-rt.workerReturned:
			return false, nil
		}
	}
	count := min(rt.messageCount, remaining)

	messages, err := rt.redis.XReadGroup(rt.context, &r.XReadGroupArgs{
		Group:    rt.consumerGroup,
		Consumer: rt.workerId,
		Streams:  rt.xReadArgs,
		Count:    count,
		Block:    rt.blockDuration,
	}).Result()

	if err == r.Nil || len(messages) == 0 {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("error reading messages from redis: %w", err)
	}

	handled := false
	for _, stream := range messages {
		for _, mesg := range stream.Messages {
			handled = true
			m := mesg

			// handle messages concurrently with execution pool management
			rt.logger.Debug("message received", zap.String("stream", stream.Stream), zap.String("id", mesg.ID))
			rt.executionPool.Add(-1)
			sandboxmetrics.AddUpDownCounter(context.Background(), sandboxmetrics.SandboxExecutionPoolInUse, 1)

			go func(streamKey string) {
				rt.handleMessage(&m, streamKey)

				rt.mutex.Lock()
				defer rt.mutex.Unlock()

				sandboxmetrics.AddUpDownCounter(context.Background(), sandboxmetrics.SandboxExecutionPoolInUse, -1)
				pool := rt.executionPool.Add(1)
				rt.workerReturned <- rt.executionPoolSize - pool
			}(stream.Stream)
		}
	}

	return handled, nil
}

func (rt *redisTransport) handleMessage(message *r.XMessage, stream string) {
	rt.redis.XAck(context.Background(), stream, rt.consumerGroup, message.ID)

	requests, err := redisutils.UnwrapRedisProtoMessages([]r.XMessage{*message}, func() *transportv1.Request { return &transportv1.Request{} }, "data")
	if err != nil || len(requests) != 1 {
		rt.logger.Error("error unwrapping messages", zap.Error(err))
		return
	}

	request := requests[0]
	requestMeta := request.GetData().GetPinned()

	pluginName := request.GetData().GetPinned().GetName()
	requestData := request.GetData().GetData()
	pluginProps := requestData.GetProps()
	ctxWithTrace := otel.GetTextMapPropagator().Extract(context.Background(), propagation.MapCarrier(requestMeta.GetObservability().GetBaggage()))
	ctxWithBaggage := propagation.Baggage{}.Extract(ctxWithTrace, propagation.MapCarrier(requestMeta.GetObservability().GetBaggage()))

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

	// Set file context for this execution (for FetchFile RPC)
	executionID := pluginProps.GetExecutionId()
	rt.fileContextProvider.SetFileContext(
		executionID,
		&redisstore.ExecutionFileContext{
			FileServerURL: pluginProps.GetFileServerUrl(),
			AgentKey:      rt.agentKey,
			JwtToken:      pluginProps.GetJwtToken(),
			Profile:       pluginProps.GetProfile(),
		},
	)
	defer rt.fileContextProvider.CleanupExecution(executionID)

	// Clear sensitive fields from Props before they are forwarded to the sandbox.
	// The JWT and profile are now stored server-side in ExecutionFileContext and
	// looked up by execution ID — the sandbox must never receive them directly.
	if pluginProps != nil {
		pluginProps.JwtToken = ""
		pluginProps.Profile = nil
	}

	// Set allowed keys for this execution (key allowlisting for security)
	if provider, ok := rt.fileContextProvider.(redisstore.ExecutionContextProvider); ok {
		allowedKeys := ComputeAllowedKeys(executionID, pluginProps)
		provider.SetAllowedKeys(executionID, allowedKeys)
	}

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
		var execErr error

		switch requestMeta.GetEvent() {
		case string(worker.EventExecute):
			result, execErr = rt.pluginExecutor.Execute(ctx, pluginName, requestData, requestMeta, perf)
		case string(worker.EventStream):
			result, execErr = rt.pluginExecutor.Stream(ctx, pluginName, request.GetTopic(), requestData, requestMeta, perf)
		case string(worker.EventMetadata):
			result, execErr = rt.pluginExecutor.Metadata(ctxWithBaggage, pluginName, requestData, perf)
		case string(worker.EventTest):
			result, execErr = rt.pluginExecutor.Test(ctxWithBaggage, pluginName, requestData, perf)
		case string(worker.EventPreDelete):
			result, execErr = rt.pluginExecutor.PreDelete(ctxWithBaggage, pluginName, requestData, perf)
		default:
			execErr = stderr.New("unknown event type")
		}

		resp := &transportv1.Response{
			Data: &transportv1.Response_Data{
				Pinned: perf,
				Data:   result,
			},
		}

		if execErr != nil {
			resp.Pinned = errors.ToCommonV1(execErr)
		}

		resp.Data.Pinned.QueueResponse.Start = float64(time.Now().UnixMicro())

		return resp
	}

	var sendErr error
	if pluginProps.GetVersion() != "v3" {
		sendErr = rt.sendResult(handle(request), request.GetInbox())
	} else {
		publish := func(ctx context.Context, msg string) error {
			return rt.redis.Publish(ctx, request.GetInbox(), msg).Err()
		}

		sendErr = redisutils.Handle(ctx, publish, publish, request, 5*time.Second, handle)
	}

	if sendErr != nil {
		logger.Error("could not send response to inbox", zap.Error(sendErr))
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

// Run implements run.Runnable
func (rt *redisTransport) Run(ctx context.Context) error {
	if err := rt.init(); err != nil {
		return err
	}

	return rt.poll()
}

// Close implements run.Runnable
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

// Name implements run.Runnable
func (rt *redisTransport) Name() string {
	return "redisTransport"
}

// Alive implements run.Runnable
func (rt *redisTransport) Alive() bool {
	return rt.alive.Load()
}
