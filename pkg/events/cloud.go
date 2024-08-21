package events

import (
	"context"
	"crypto/tls"
	"log/slog"
	"slices"
	"sync"
	"time"

	"github.com/superblocksteam/run"

	eventv2 "github.com/superblocksteam/agent/types/gen/go/event/v2"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/emptypb"
)

const (
	EventTypeResign = "com.superblocks.signature.resign"
)

// Consumer represents a transport for a specific cloud event type.
type Consumer struct {
	Channel chan protoreflect.ProtoMessage
	Zero    func() protoreflect.ProtoMessage
	Wait    *sync.WaitGroup
}

type listener struct {
	*Options

	logger  *zap.Logger
	client  eventv2.EventsServiceClient
	conn    *grpc.ClientConn
	headers map[string]string
	run     bool
	url     string
	done    chan struct{}
	jitter  time.Duration

	run.ForwardCompatibility
}

type Options struct {
	Consumers        map[string]*Consumer
	KeepaliveTime    time.Duration
	KeepaliveTimeout time.Duration
	Insecure         bool
	Logger           *zap.Logger
}

func NewListener(
	url string,
	headers map[string]string,
	ops *Options,
) run.Runnable {
	var logger *zap.Logger
	{
		if ops.Logger != nil {
			logger = ops.Logger.With(zap.String("who", "cloudevents"))
		} else {
			logger = zap.NewNop()
		}
	}

	return &listener{
		logger:  logger,
		headers: headers,
		Options: ops,
		url:     url,
		run:     true,
		done:    make(chan struct{}),
		jitter:  500 * time.Millisecond,
	}
}

func (l *listener) Name() string { return "cloudevents queue" }

func (l *listener) Fields() []slog.Attr { return []slog.Attr{slog.String("address", l.url)} }

func (l *listener) Run(context.Context) error {
	ctx := metadata.NewOutgoingContext(context.Background(), metadata.New(l.headers))

	var creds credentials.TransportCredentials
	{
		if l.Insecure {
			creds = insecure.NewCredentials()
		} else {
			creds = credentials.NewTLS(&tls.Config{})
		}
	}

	dialOptions := []grpc.DialOption{
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:                l.KeepaliveTime,
			Timeout:             l.KeepaliveTimeout,
			PermitWithoutStream: true,
		}),
		grpc.WithTransportCredentials(creds),
	}

	for l.run {
		if l.conn == nil || slices.Contains([]connectivity.State{connectivity.Shutdown, connectivity.TransientFailure}, l.conn.GetState()) {
			conn, err := grpc.DialContext(ctx, l.url, dialOptions...)
			if err != nil {
				time.Sleep(l.jitter)
			}

			l.conn = conn
			l.client = eventv2.NewEventsServiceClient(conn)
		}

		// Does not check auth; Recv() will.
		// We handle that by failing the runnable if the error is not redialable.
		stream, err := l.client.Receive(ctx, new(emptypb.Empty))
		if err != nil {
			time.Sleep(l.jitter)
			l.logger.Warn("could not receive from gRPC client", zap.Error(err))
			continue
		}

		for {
			event, err := stream.Recv()
			if grpcStatus, _ := status.FromError(err); grpcStatus != nil {
				var leveled func(string, ...zap.Field)
				{
					switch grpcStatus.Code() {
					case codes.Unavailable:
						// TODO(frank): Figure out how to correctly propogate the keepalive.
						leveled = l.logger.Debug
					case codes.Unauthenticated:
						leveled = l.logger.Error
					default:
						leveled = l.logger.Warn
					}
				}

				leveled("could not receive from gRPC stream", zap.Error(err), zap.String("grpc_code", grpcStatus.Code().String()), zap.String("grpc_message", grpcStatus.Message()))
				time.Sleep(l.jitter)

				break
			}

			l.logger.Debug("received event", zap.String("type", event.Type), zap.String("id", event.Id))

			consumer, ok := l.Consumers[event.Type]
			if !ok {
				l.logger.Warn("no channel for event type; dropping event", zap.String("type", event.Type))
				continue
			}

			var data protoreflect.ProtoMessage
			{
				data = consumer.Zero()

				cloudevent, err := FromProto(event)
				if err != nil {
					l.logger.Warn("failed to convert cloudevent to proto", zap.Error(err))
					continue
				}

				unmarshaler := protojson.UnmarshalOptions{DiscardUnknown: true}
				if err := unmarshaler.Unmarshal(cloudevent.Data(), data); err != nil {
					l.logger.Warn("failed to unmarshal event data", zap.Error(err))
					continue
				}
			}

			l.logger.Debug("sending event to channel", zap.String("type", event.Type))

			consumer.Wait.Add(1)
			consumer.Channel <- data
		}
	}

	l.done <- struct{}{}
	return nil
}

func (l *listener) Alive() bool { return true }

func (l *listener) Close(context.Context) error {
	// This ensures that we stop making progress in Run().
	l.run = false

	// This will help break out of the in progress work being done in Run().
	if l.conn != nil {
		if err := l.conn.Close(); err != nil {
			l.logger.Warn("failed to close redisrouter connection", zap.Error(err))
		}
	}

	<-l.done
	close(l.done)

	for _, consumer := range l.Consumers {
		consumer.Wait.Wait()
		close(consumer.Channel)
	}

	l.logger.Info("gracefuly closed cloudevents runnable")

	return nil
}
