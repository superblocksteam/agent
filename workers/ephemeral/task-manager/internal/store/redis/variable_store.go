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

	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

// ExecutionFileContext stores file fetching context for an execution
type ExecutionFileContext struct {
	FileServerURL string
	AgentKey      string
}

type FileContextProvider interface {
	GetFileContext(executionID string) *ExecutionFileContext
	SetFileContext(executionID string, ctx *ExecutionFileContext)
	CleanupExecution(executionID string)
}

// VariableStoreGRPC implements the VariableStore gRPC service
type VariableStoreGRPC struct {
	workerv1.UnimplementedSandboxVariableStoreServiceServer
	kvStore store.Store
	logger  *zap.Logger
	server  *grpc.Server
	port    int

	// File context for each execution (file server URL, agent key)
	fileContexts     map[string]*ExecutionFileContext
	fileContextsLock sync.RWMutex

	shutdownLock sync.Mutex
	done         chan error

	run.ForwardCompatibility
}

var _ run.Runnable = &VariableStoreGRPC{}

// NewVariableStoreGRPC creates a new VariableStoreGRPC server
func NewVariableStoreGRPC(kvStore store.Store, logger *zap.Logger, port int) *VariableStoreGRPC {
	return &VariableStoreGRPC{
		kvStore:      kvStore,
		logger:       logger,
		port:         port,
		fileContexts: make(map[string]*ExecutionFileContext),
	}
}

func (s *VariableStoreGRPC) Name() string {
	return "VariableStoreGRPC"
}

func (s *VariableStoreGRPC) Run(ctx context.Context) error {
	s.done = make(chan error)

	go func() {
		if err := s.Start(); err != nil {
			s.logger.Error("VariableStoreGRPC server returned with error", zap.Error(err))
			s.done <- err
		}
	}()
	defer s.Stop()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case err := <-s.done:
		return err
	}
}

func (s *VariableStoreGRPC) Close(ctx context.Context) error {
	s.Stop()
	return nil
}

func (s *VariableStoreGRPC) Alive() bool {
	return s.server != nil
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
	s.shutdownLock.Lock()
	defer s.shutdownLock.Unlock()

	if s.server != nil {
		s.server.GracefulStop()
		s.server = nil
		close(s.done)
	}
}

// GetVariable implements the GetVariable RPC
func (s *VariableStoreGRPC) GetVariable(ctx context.Context, req *workerv1.GetVariableRequest) (*workerv1.GetVariableResponse, error) {
	resp, err := tracer.Observe(
		ctx,
		"VariableStore.GetVariable",
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.GetVariableResponse, error) {
			values, err := s.readFromKvStore(ctx, req.Key)
			if err != nil {
				return nil, err
			}

			return &workerv1.GetVariableResponse{Value: values[0], Found: true}, nil
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
			values, err := s.readFromKvStore(ctx, req.Keys...)
			if err != nil {
				return nil, err
			}

			return &workerv1.GetVariablesResponse{Values: values}, nil
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
			if err := s.writeToKvStore(ctx, &workerv1.KeyValue{Key: req.Key, Value: req.Value}); err != nil {
				return nil, err
			}

			return &workerv1.SetVariableResponse{Success: true}, nil
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
			if err := s.writeToKvStore(ctx, req.Kvs...); err != nil {
				return nil, err
			}

			return &workerv1.SetVariablesResponse{Success: true}, nil
		},
		nil,
	)
	return resp, err
}

func (s *VariableStoreGRPC) readFromKvStore(ctx context.Context, keys ...string) ([]string, error) {
	if len(keys) == 0 {
		return nil, nil
	}

	values, err := s.kvStore.Read(ctx, keys...)
	if err != nil {
		return nil, err
	}

	if len(values) != len(keys) {
		return nil, fmt.Errorf("expected %d values, got %d", len(keys), len(values))
	}

	results := make([]string, len(keys))
	for i, value := range values {
		if value == nil {
			results[i] = "null"
		} else if valStr, ok := value.(string); ok {
			results[i] = valStr
		} else {
			return nil, fmt.Errorf("expected string value, got %T", value)
		}
	}

	return results, nil
}

func (s *VariableStoreGRPC) writeToKvStore(ctx context.Context, kvs ...*workerv1.KeyValue) error {
	pairs := make([]*store.KV, len(kvs))
	for i, kv := range kvs {
		pairs[i] = &store.KV{
			Key:   kv.Key,
			Value: kv.Value,
		}
	}

	return s.kvStore.Write(ctx, pairs...)
}

// GetFileContext returns the file context for an execution
func (s *VariableStoreGRPC) GetFileContext(executionID string) *ExecutionFileContext {
	s.fileContextsLock.RLock()
	defer s.fileContextsLock.RUnlock()

	return s.fileContexts[executionID]
}

// SetFileContext sets the file context for an execution
func (s *VariableStoreGRPC) SetFileContext(executionID string, ctx *ExecutionFileContext) {
	s.fileContextsLock.Lock()
	defer s.fileContextsLock.Unlock()

	s.fileContexts[executionID] = ctx
}

func (s *VariableStoreGRPC) CleanupExecution(executionID string) {
	s.fileContextsLock.Lock()
	defer s.fileContextsLock.Unlock()

	delete(s.fileContexts, executionID)
}

// FetchFile implements the FetchFile RPC - fetches file contents from the orchestrator's file server
func (s *VariableStoreGRPC) FetchFile(ctx context.Context, req *workerv1.FetchFileRequest) (*workerv1.FetchFileResponse, error) {
	resp, err := tracer.Observe(
		ctx,
		"VariableStore.FetchFile",
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.FetchFileResponse, error) {
			// Get file context for this execution
			fileCtx := s.GetFileContext(req.ExecutionId)
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
func (*VariableStoreGRPC) parseV2FileResponse(body []byte) ([]byte, error) {
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
