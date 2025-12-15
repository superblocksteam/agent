package redis

import (
	"context"
	"fmt"
	"net"
	"sync"
	"time"

	r "github.com/redis/go-redis/v9"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

// VariableStoreProvider provides access to variable store data
type VariableStoreProvider interface {
	GetVariableStore() map[string]map[string]string
	GetVariableStoreLock() *sync.RWMutex
	GetRedisClient() *r.Client
}

// VariableStoreGRPC implements the VariableStore gRPC service
type VariableStoreGRPC struct {
	workerv1.UnimplementedSandboxVariableStoreServiceServer
	provider VariableStoreProvider
	logger   *zap.Logger
	server   *grpc.Server
	port     int
}

// NewVariableStoreGRPC creates a new VariableStoreGRPC server
func NewVariableStoreGRPC(provider VariableStoreProvider, logger *zap.Logger, port int) *VariableStoreGRPC {
	return &VariableStoreGRPC{
		provider: provider,
		logger:   logger,
		port:     port,
	}
}

// redisKey creates a namespaced Redis key to prevent collisions between executions.
// Format matches workers/python and workers/javascript: {executionId}.variable.{key}
func redisKey(executionId, key string) string {
	return fmt.Sprintf("%s.variable.%s", executionId, key)
}

// Start starts the gRPC server
func (s *VariableStoreGRPC) Start() error {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", s.port))
	if err != nil {
		return fmt.Errorf("failed to listen on port %d: %w", s.port, err)
	}

	s.server = grpc.NewServer()
	workerv1.RegisterSandboxVariableStoreServiceServer(s.server, s)

	s.logger.Info("VariableStore gRPC server starting", zap.Int("port", s.port))
	return s.server.Serve(lis)
}

// Stop stops the gRPC server
func (s *VariableStoreGRPC) Stop() {
	if s.server != nil {
		s.server.GracefulStop()
	}
}

// GetVariable implements the GetVariable RPC
func (s *VariableStoreGRPC) GetVariable(ctx context.Context, req *workerv1.GetVariableRequest) (*workerv1.GetVariableResponse, error) {
	resp, err := tracer.Observe(
		ctx,
		"VariableStore.GetVariable",
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.GetVariableResponse, error) {
			store := s.provider.GetVariableStore()
			lock := s.provider.GetVariableStoreLock()
			redis := s.provider.GetRedisClient()

			lock.RLock()
			defer lock.RUnlock()

			execVars, ok := store[req.ExecutionId]
			if !ok {
				return &workerv1.GetVariableResponse{Found: false}, nil
			}

			value, ok := execVars[req.Key]
			if !ok {
				// Try Redis if not in memory
				val, err := redis.Get(ctx, redisKey(req.ExecutionId, req.Key)).Result()
				if err == r.Nil {
					return &workerv1.GetVariableResponse{Found: false}, nil
				} else if err != nil {
					return nil, err
				}
				return &workerv1.GetVariableResponse{Value: val, Found: true}, nil
			}

			return &workerv1.GetVariableResponse{Value: value, Found: true}, nil
		},
		nil,
	)
	return resp, err
}

// SetVariable implements the SetVariable RPC
func (s *VariableStoreGRPC) SetVariable(ctx context.Context, req *workerv1.SetVariableRequest) (*workerv1.SetVariableResponse, error) {
	resp, err := tracer.Observe(
		ctx,
		"VariableStore.SetVariable",
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.SetVariableResponse, error) {
			store := s.provider.GetVariableStore()
			lock := s.provider.GetVariableStoreLock()
			redis := s.provider.GetRedisClient()

			lock.Lock()
			defer lock.Unlock()

			if _, ok := store[req.ExecutionId]; !ok {
				store[req.ExecutionId] = make(map[string]string)
			}
			store[req.ExecutionId][req.Key] = req.Value

			// Also write to Redis for persistence
			err := redis.Set(ctx, redisKey(req.ExecutionId, req.Key), req.Value, 24*time.Hour).Err()
			if err != nil {
				s.logger.Warn("failed to write variable to Redis", zap.Error(err))
			}

			return &workerv1.SetVariableResponse{Success: true}, nil
		},
		nil,
	)
	return resp, err
}

// GetVariables implements the GetVariables RPC
func (s *VariableStoreGRPC) GetVariables(ctx context.Context, req *workerv1.GetVariablesRequest) (*workerv1.GetVariablesResponse, error) {
	resp, err := tracer.Observe(
		ctx,
		"VariableStore.GetVariables",
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.GetVariablesResponse, error) {
			store := s.provider.GetVariableStore()
			lock := s.provider.GetVariableStoreLock()
			redis := s.provider.GetRedisClient()

			lock.RLock()
			defer lock.RUnlock()

			values := make([]string, len(req.Keys))
			execVars := store[req.ExecutionId]

			for i, key := range req.Keys {
				if execVars != nil {
					if val, ok := execVars[key]; ok {
						values[i] = val
						continue
					}
				}
				// Try Redis
				val, err := redis.Get(ctx, redisKey(req.ExecutionId, key)).Result()
				if err == nil {
					values[i] = val
				}
			}

			return &workerv1.GetVariablesResponse{Values: values}, nil
		},
		nil,
	)
	return resp, err
}

// SetVariables implements the SetVariables RPC
func (s *VariableStoreGRPC) SetVariables(ctx context.Context, req *workerv1.SetVariablesRequest) (*workerv1.SetVariablesResponse, error) {
	resp, err := tracer.Observe(
		ctx,
		"VariableStore.SetVariables",
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.SetVariablesResponse, error) {
			store := s.provider.GetVariableStore()
			lock := s.provider.GetVariableStoreLock()
			redis := s.provider.GetRedisClient()

			lock.Lock()
			defer lock.Unlock()

			if _, ok := store[req.ExecutionId]; !ok {
				store[req.ExecutionId] = make(map[string]string)
			}

			pipe := redis.Pipeline()
			for _, kv := range req.Kvs {
				store[req.ExecutionId][kv.Key] = kv.Value
				// Use namespaced key to prevent collisions between executions
				pipe.Set(ctx, redisKey(req.ExecutionId, kv.Key), kv.Value, 24*time.Hour)
			}
			_, err := pipe.Exec(ctx)
			if err != nil {
				s.logger.Warn("failed to write variables to Redis", zap.Error(err))
			}

			return &workerv1.SetVariablesResponse{Success: true}, nil
		},
		nil,
	)
	return resp, err
}
