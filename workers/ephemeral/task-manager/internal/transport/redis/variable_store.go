package redis

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	r "github.com/redis/go-redis/v9"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

// ExecutionFileContext stores file fetching context for an execution
type ExecutionFileContext struct {
	FileServerURL string
	AgentKey      string
}

// VariableStoreProvider provides access to variable store data
type VariableStoreProvider interface {
	GetVariableStore() map[string]map[string]string
	GetVariableStoreLock() *sync.RWMutex
	GetRedisClient() *r.Client
	// File fetching context
	GetFileContext(executionID string) *ExecutionFileContext
	SetFileContext(executionID string, ctx *ExecutionFileContext)
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
				val, err := redis.Get(ctx, req.Key).Result()
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
			err := redis.Set(ctx, req.Key, req.Value, 24*time.Hour).Err()
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
				val, err := redis.Get(ctx, key).Result()
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
				pipe.Set(ctx, kv.Key, kv.Value, 24*time.Hour)
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

// FetchFile implements the FetchFile RPC - fetches file contents from the orchestrator's file server
func (s *VariableStoreGRPC) FetchFile(ctx context.Context, req *workerv1.FetchFileRequest) (*workerv1.FetchFileResponse, error) {
	resp, err := tracer.Observe(
		ctx,
		"VariableStore.FetchFile",
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.FetchFileResponse, error) {
			// Get file context for this execution
			fileCtx := s.provider.GetFileContext(req.ExecutionId)
			if fileCtx == nil {
				return &workerv1.FetchFileResponse{Error: "no file context for execution"}, nil
			}

			if fileCtx.FileServerURL == "" {
				return &workerv1.FetchFileResponse{Error: "file server URL not configured"}, nil
			}

			// Fetch file from orchestrator's file server
			contents, err := s.fetchFromFileServer(ctx, fileCtx.FileServerURL, fileCtx.AgentKey, req.Path)
			if err != nil {
				s.logger.Error("failed to fetch file from server",
					zap.String("path", req.Path),
					zap.Error(err))
				return &workerv1.FetchFileResponse{Error: err.Error()}, nil
			}

			return &workerv1.FetchFileResponse{Contents: contents}, nil
		},
		nil,
	)
	return resp, err
}

// fetchFromFileServer fetches file contents from the orchestrator's file server
func (s *VariableStoreGRPC) fetchFromFileServer(ctx context.Context, fileServerURL, agentKey, remotePath string) ([]byte, error) {
	// Build request URL
	reqURL := fmt.Sprintf("%s?location=%s", fileServerURL, remotePath)

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Sanitize agent key for header
	sanitizedKey := strings.ReplaceAll(agentKey, "/", "__")
	sanitizedKey = strings.ReplaceAll(sanitizedKey, "+", "--")
	req.Header.Set("x-superblocks-agent-key", sanitizedKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("file server returned status %d", resp.StatusCode)
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Handle v2 file server format (JSON lines with base64 data)
	if strings.Contains(fileServerURL, "v2") {
		return s.parseV2FileResponse(body)
	}

	return body, nil
}

// parseV2FileResponse parses the v2 file server response format (JSON lines with base64 data)
func (s *VariableStoreGRPC) parseV2FileResponse(body []byte) ([]byte, error) {
	lines := strings.Split(string(body), "\n")
	var result []byte

	for _, line := range lines {
		if line == "" {
			continue
		}

		var obj struct {
			Result struct {
				Data string `json:"data"`
			} `json:"result"`
		}

		if err := json.Unmarshal([]byte(line), &obj); err != nil {
			continue
		}

		decoded, err := base64.StdEncoding.DecodeString(obj.Result.Data)
		if err != nil {
			continue
		}

		result = append(result, decoded...)
	}

	return result, nil
}
