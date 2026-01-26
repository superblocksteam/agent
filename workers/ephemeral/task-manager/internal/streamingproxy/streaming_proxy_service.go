package streamingproxy

import (
	"context"
	"errors"
	"fmt"
	"net"
	"sync"
	"time"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/emptypb"

	"github.com/redis/go-redis/v9"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"github.com/superblocksteam/run"
)

type StreamingProxyService struct {
	server      *grpc.Server
	redisClient *redis.Client
	port        int

	logger       *zap.Logger
	shutdownLock sync.RWMutex
	done         chan error

	run.ForwardCompatibility
}

var _ run.Runnable = (*StreamingProxyService)(nil)

func NewStreamingProxyService(options ...Option) *StreamingProxyService {
	opts := ApplyOptions(options...)

	return &StreamingProxyService{
		server:      opts.server,
		redisClient: opts.redisClient,
		port:        opts.port,
		logger:      opts.logger,
		done:        make(chan error),
	}
}

func (s *StreamingProxyService) Name() string {
	return "StreamingProxyService"
}

func (s *StreamingProxyService) Start() error {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", s.port))
	if err != nil {
		return fmt.Errorf("failed to listen on port %d: %w", s.port, err)
	}

	s.shutdownLock.RLock()
	if s.server == nil {
		s.logger.Error("cannot start streaming proxy service: gRPC server is nil")

		s.shutdownLock.RUnlock()
		return errors.New("cannot start streaming proxy service: gRPC server is nil")
	}

	workerv1.RegisterSandboxStreamingProxyServiceServer(s.server, s)
	server := s.server
	s.shutdownLock.RUnlock()

	s.logger.Info("StreamingProxyService gRPC server starting", zap.Int("port", s.port))
	return server.Serve(lis)
}

func (s *StreamingProxyService) Run(ctx context.Context) error {
	go func() {
		s.done <- s.Start()
	}()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case err := <-s.done:
		return err
	}
}

func (s *StreamingProxyService) Close(ctx context.Context) error {
	s.shutdownLock.Lock()
	defer s.shutdownLock.Unlock()

	if s.server != nil {
		s.server.GracefulStop()
		s.server = nil
		if s.done != nil {
			close(s.done)
			s.done = nil
		}
	}

	return nil
}

func (s *StreamingProxyService) Alive() bool {
	return s.server != nil
}

func (s *StreamingProxyService) Send(ctx context.Context, req *workerv1.SendRequest) (*emptypb.Empty, error) {
	jsonData, err := protojson.Marshal(req.GetData())
	if err != nil {
		s.logger.Error("failed to marshal stream event data into JSON", zap.String("topic", req.GetTopic()), zap.Error(err))
		return &emptypb.Empty{}, nil
	}

	result := s.redisClient.Publish(ctx, req.GetTopic(), jsonData)
	if err := result.Err(); err != nil {
		s.logger.Error("could not send stream event from worker", zap.String("topic", req.GetTopic()), zap.Error(err))
	} else if result.Val() == 0 {
		s.logger.Error("successfully sent stream event was not received due to no subscribers", zap.String("topic", req.GetTopic()))
	}

	return &emptypb.Empty{}, nil
}

func (s *StreamingProxyService) Until(ctx context.Context, req *workerv1.UntilRequest) (*emptypb.Empty, error) {
	if req.GetTopic() == "" {
		s.logger.Warn("received 'until' request with no topic, returning immediately")
		return &emptypb.Empty{}, nil
	}

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	hasSubscribers := s.topicHasSubscribers(ctx, req.GetTopic())
	for hasSubscribers {
		select {
		case <-ctx.Done():
			return &emptypb.Empty{}, ctx.Err()
		case <-ticker.C:
			hasSubscribers = s.topicHasSubscribers(ctx, req.GetTopic())
		}
	}

	return &emptypb.Empty{}, nil
}

func (s *StreamingProxyService) topicHasSubscribers(ctx context.Context, topic string) bool {
	subscribers, err := s.redisClient.PubSubNumSub(ctx, topic).Result()
	if err != nil {
		s.logger.Error("failed to get number of subscribers for topic", zap.String("topic", topic), zap.Error(err))
		return false
	}

	return subscribers[topic] > 0
}
