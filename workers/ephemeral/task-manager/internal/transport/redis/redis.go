package redis

import (
	"context"
	stderr "errors"
	"fmt"
	"log/slog"
	"sync"
	"sync/atomic"
	"time"

	"workers/ephemeral/task-manager/internal/plugin_executor"
	redisstore "workers/ephemeral/task-manager/internal/store/redis"

	r "github.com/redis/go-redis/v9"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/worker"
	redisutils "github.com/superblocksteam/agent/pkg/worker/transport/redis"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
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

// ErrEphemeralTimeout is returned when an ephemeral job times out waiting for completion.
var ErrEphemeralTimeout = stderr.New("ephemeral execution timed out")

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

	// Ephemeral mode: process one job and exit
	ephemeral        bool
	ephemeralTimeout time.Duration // Timeout for ephemeral job execution
	ephemeralDone    chan error    // Signals ephemeral job completion with result
	ephemeralOnce    sync.Once     // Ensures only the first completion signal is sent
	lastInbox        string        // Inbox of last message (for timeout response in ephemeral mode)
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

		ephemeral:        options.Ephemeral,
		ephemeralTimeout: options.EphemeralTimeout,
		ephemeralDone:    make(chan error, 1),
	}
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
//
// Both modes share pollOnce() for the core Redis read and message handling logic.
// The key differences are:
//   - Ephemeral mode: Reads 1 message, handles synchronously, then waits for
//     completion with optional timeout before exiting.
//   - Continuous mode: Reads multiple messages (up to execution pool limit),
//     handles concurrently via goroutines, loops forever.
func (rt *redisTransport) poll() error {
	// TODO(brandon): Remove this once we have a proper timeout implementation for more than language plugins.
	// if rt.ephemeral {
	// 	rt.logger.Info("running in ephemeral mode, waiting for single job",
	// 		zap.Duration("timeout", rt.ephemeralTimeout))
	// }

	for {
		if !rt.alive.Load() {
			return nil
		}

		handled, err := rt.pollOnce()
		if err != nil {
			if rt.ephemeral {
				return err
			}
			rt.logger.Error("error while polling messages", zap.Error(err))
			continue
		}

		// In ephemeral mode, wait for job completion after handling a message
		if rt.ephemeral && handled {
			return rt.waitForCompletion()
		}
	}
}

// pollOnce reads messages from Redis and dispatches them for handling.
// Returns (true, nil) if at least one message was handled.
//
// Behavior differs by mode:
//   - Ephemeral: Reads 1 message, handles synchronously, saves inbox for timeout response
//   - Continuous: Reads up to execution pool limit, spawns goroutines for each message
func (rt *redisTransport) pollOnce() (bool, error) {
	// Ephemeral mode always reads 1 message; continuous mode respects execution pool
	count := int64(1)
	if !rt.ephemeral {
		remaining := rt.executionPool.Load()
		if remaining <= 0 {
			<-rt.workerReturned
			return false, nil
		}
		count = min(rt.messageCount, remaining)
	}

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

			if rt.ephemeral {
				// Ephemeral: handle synchronously, save inbox for potential timeout response
				rt.logger.Info("ephemeral mode: received job", zap.String("id", mesg.ID))
				rt.saveMessageInbox(&m)
				rt.handleMessage(&m, stream.Stream)
				return true, nil
			}

			// Continuous: handle concurrently with execution pool management
			rt.logger.Debug("message received", zap.String("stream", stream.Stream), zap.String("id", mesg.ID))
			rt.executionPool.Add(-1)

			go func(streamKey string) {
				rt.handleMessage(&m, streamKey)
				rt.mutex.Lock()
				pool := rt.executionPool.Add(1)
				rt.workerReturned <- rt.executionPoolSize - pool
				defer rt.mutex.Unlock()
			}(stream.Stream)
		}
	}

	return handled, nil
}

// saveMessageInbox extracts the inbox from a message for potential timeout response.
func (rt *redisTransport) saveMessageInbox(msg *r.XMessage) {
	requests, err := redisutils.UnwrapRedisProtoMessages(
		[]r.XMessage{*msg},
		func() *transportv1.Request { return &transportv1.Request{} },
		"data",
	)
	if err == nil && len(requests) == 1 {
		rt.mutex.Lock()
		rt.lastInbox = requests[0].GetInbox()
		rt.mutex.Unlock()
	}
}

// waitForCompletion waits for the ephemeral job to complete with optional timeout.
// Returns nil to exit cleanly (exit 0) in all cases except indefinite wait with error.
func (rt *redisTransport) waitForCompletion() error {
	// TODO(brandon): Remove this once we have a proper timeout implementation for more than language plugins.
	// if rt.ephemeralTimeout > 0 {
	// 	select {
	// 	case err := <-rt.ephemeralDone:
	// 		if err != nil {
	// 			rt.logger.Error("ephemeral execution failed", zap.Error(err))
	// 			return err
	// 		}
	// 		rt.logger.Info("ephemeral mode: job completed successfully")
	// 		return nil
	// 	case <-time.After(rt.ephemeralTimeout):
	// 		rt.logger.Error("ephemeral execution timed out",
	// 			zap.Duration("timeout", rt.ephemeralTimeout))

	// 		rt.mutex.Lock()
	// 		inbox := rt.lastInbox
	// 		rt.mutex.Unlock()
	// 		if inbox != "" {
	// 			rt.sendTimeoutResponse(inbox, rt.ephemeralTimeout)
	// 		}
	// 		return ErrEphemeralTimeout
	// 	}
	// }

	// No timeout: wait indefinitely
	err := <-rt.ephemeralDone
	if err != nil {
		rt.logger.Error("ephemeral execution failed", zap.Error(err))
		return err
	}
	rt.logger.Info("ephemeral mode: job completed successfully")
	return nil
}

// sendTimeoutResponse sends a 504 Gateway Timeout error response to the inbox.
func (rt *redisTransport) sendTimeoutResponse(inbox string, timeout time.Duration) {
	timeoutErr := errors.IntegrationError(
		fmt.Errorf("Timed out after %v", timeout),
		commonv1.Code_CODE_INTEGRATION_QUERY_TIMEOUT,
	)

	resp := &transportv1.Response{
		Pinned: errors.ToCommonV1(timeoutErr),
		Data: &transportv1.Response_Data{
			Pinned: &transportv1.Performance{
				QueueResponse: &transportv1.Performance_Observable{
					Start: float64(time.Now().UnixMicro()),
				},
			},
			Data: &transportv1.Response_Data_Data{},
		},
	}

	if err := rt.sendResult(resp, inbox); err != nil {
		rt.logger.Error("failed to send timeout response", zap.Error(err), zap.String("inbox", inbox))
	} else {
		rt.logger.Info("sent 504 timeout response", zap.String("inbox", inbox), zap.Duration("timeout", timeout))
	}
}

func (rt *redisTransport) handleMessage(message *r.XMessage, stream string) {
	rt.redis.XAck(context.Background(), stream, rt.consumerGroup, message.ID)

	requests, err := redisutils.UnwrapRedisProtoMessages([]r.XMessage{*message}, func() *transportv1.Request { return &transportv1.Request{} }, "data")
	if err != nil || len(requests) != 1 {
		rt.logger.Error("error while unwrapping messages", zap.Error(err))
		rt.signalEphemeralDone(fmt.Errorf("error unwrapping message: %w", err))
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

	// Set file context for this execution (for FetchFile RPC)
	executionID := pluginProps.GetExecutionId()
	rt.fileContextProvider.SetFileContext(
		executionID,
		&redisstore.ExecutionFileContext{
			FileServerURL: pluginProps.GetFileServerUrl(),
			AgentKey:      rt.agentKey,
		},
	)
	defer rt.fileContextProvider.CleanupExecution(executionID)

	perf := &transportv1.Performance{
		QueueRequest:  &transportv1.Performance_Observable{},
		QueueResponse: &transportv1.Performance_Observable{},
	}
	perf.QueueRequest.End = float64(time.Now().UnixMicro())

	if pluginProps.GetVersion() != "v3" {
		if err := rt.ackMessage(request.GetInbox()); err != nil {
			logger.Error("could not send ack to inbox", zap.Error(err))
			rt.signalEphemeralDone(err)
			return
		}
	}

	handle := func(req *transportv1.Request) *transportv1.Response {
		var result *transportv1.Response_Data_Data
		var execErr error

		switch requestMeta.GetEvent() {
		case string(worker.EventExecute):
			result, execErr = rt.pluginExecutor.Execute(ctx, pluginName, pluginProps, request.GetData().GetData().GetQuotas(), perf)
		case string(worker.EventStream):
			execErr = stderr.New("streaming not supported yet")
		case string(worker.EventMetadata):
			result, execErr = rt.pluginExecutor.Metadata(ctxWithBaggage, pluginName, pluginProps, perf)
		case string(worker.EventTest):
			result, execErr = rt.pluginExecutor.Test(ctxWithBaggage, pluginName, pluginProps, perf)
		case string(worker.EventPreDelete):
			result, execErr = rt.pluginExecutor.PreDelete(ctxWithBaggage, pluginName, pluginProps, perf)
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
		rt.signalEphemeralDone(sendErr)
	} else {
		logger.Debug("result sent")
		rt.signalEphemeralDone(nil)
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

// signalEphemeralDone sends a completion signal in ephemeral mode.
// Uses sync.Once to ensure only the first completion signal is sent,
// preventing lost error signals from race conditions.
func (rt *redisTransport) signalEphemeralDone(err error) {
	if rt.ephemeral {
		rt.ephemeralOnce.Do(func() {
			rt.ephemeralDone <- err
		})
	}
}

// GetRedisClient returns the Redis client (for gRPC server)
func (rt *redisTransport) GetRedisClient() *r.Client {
	return rt.redis
}

// Run implements run.Runnable
func (rt *redisTransport) Run(ctx context.Context) error {
	if err := rt.initStreams(); err != nil {
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

// Fields implements run.Runnable
func (rt *redisTransport) Fields() []slog.Attr {
	return []slog.Attr{}
}

// Name implements run.Runnable
func (rt *redisTransport) Name() string {
	return "redisTransport"
}

// Alive implements run.Runnable
func (rt *redisTransport) Alive() bool {
	return rt.alive.Load()
}
