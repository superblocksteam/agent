package redis

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"

	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/status"
)

// ExecutionFileContext stores file fetching context for an execution
type ExecutionFileContext struct {
	FileServerURL string
	AgentKey      string
	JwtToken      string
	Profile       *commonv1.Profile
}

type FileContextProvider interface {
	GetFileContext(executionID string) *ExecutionFileContext
	SetFileContext(executionID string, ctx *ExecutionFileContext)
	CleanupExecution(executionID string)
}

// SecurityViolation represents an unauthorized access attempt by a sandbox
type SecurityViolation struct {
	ExecutionID   string
	RequestedKey  string
	AllowedKeys   []string
	ClientIP      string
	ViolationType string // "key_not_allowed" or "ip_not_allowed"
}

// SecurityViolationHandler is called when a sandbox attempts unauthorized access
type SecurityViolationHandler func(violation SecurityViolation)

// ExecutionContextProvider extends FileContextProvider with key allowlisting
type ExecutionContextProvider interface {
	FileContextProvider
	// SetAllowedKeys sets the allowed variable keys for an execution.
	// Only these keys can be requested by the sandbox.
	SetAllowedKeys(executionID string, keys []string)
	// SetSecurityViolationHandler sets the callback for security violations.
	// When a sandbox attempts to access a key it's not allowed to access,
	// this handler is called. The task-manager should use this to terminate immediately.
	SetSecurityViolationHandler(handler SecurityViolationHandler)
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

	// IP filtering - only allow connections from the spawned sandbox
	allowedIP     string
	allowedIPLock sync.RWMutex

	// Key allowlisting - only allow requests for pre-computed keys
	// Maps execution ID to set of allowed keys
	allowedKeys     map[string]map[string]struct{}
	allowedKeysLock sync.RWMutex

	// Security violation handler - called when sandbox attempts unauthorized access
	securityHandler     SecurityViolationHandler
	securityHandlerLock sync.RWMutex

	shutdownLock sync.RWMutex
	done         chan error

	run.ForwardCompatibility
}

var _ run.Runnable = &VariableStoreGRPC{}

// NewVariableStoreGRPC creates a new VariableStoreGRPC server
func NewVariableStoreGRPC(options ...Option) *VariableStoreGRPC {
	opts := ApplyOptions(options...)

	return &VariableStoreGRPC{
		kvStore:      opts.kvStore,
		logger:       opts.logger,
		port:         opts.port,
		server:       opts.server,
		fileContexts: make(map[string]*ExecutionFileContext),
		allowedKeys:  make(map[string]map[string]struct{}),
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

	// Use lock to synchronize with Stop() which may be called concurrently
	s.shutdownLock.RLock()
	if s.server == nil {
		s.logger.Error("cannot start variable store gRPC server: gRPC server is nil")

		s.shutdownLock.RUnlock()
		return errors.New("cannot start variable store gRPC server: gRPC server is nil")
	}

	workerv1.RegisterSandboxVariableStoreServiceServer(s.server, s)
	server := s.server
	s.shutdownLock.RUnlock()

	s.logger.Info("VariableStore gRPC server starting", zap.Int("port", s.port))
	return server.Serve(lis)
}

// Stop stops the gRPC server
func (s *VariableStoreGRPC) Stop() {
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
}

// GetVariable implements the GetVariable RPC
func (s *VariableStoreGRPC) GetVariable(ctx context.Context, req *workerv1.GetVariableRequest) (*workerv1.GetVariableResponse, error) {
	resp, err := tracer.Observe(
		ctx,
		"VariableStore.GetVariable",
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.GetVariableResponse, error) {
			// Validate key against allowlist
			if !s.isKeyAllowed(req.ExecutionId, req.Key) {
				// Get client IP for security logging
				clientIP := "unknown"
				if p, ok := peer.FromContext(ctx); ok {
					clientIP = extractIP(p.Addr.String())
				}

				// Trigger security violation - this will log and call handler
				s.triggerSecurityViolation(req.ExecutionId, req.Key, clientIP)

				return nil, status.Error(codes.PermissionDenied, "key not allowed")
			}

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
			// Validate all keys against allowlist
			for _, key := range req.Keys {
				if !s.isKeyAllowed(req.ExecutionId, key) {
					// Get client IP for security logging
					clientIP := "unknown"
					if p, ok := peer.FromContext(ctx); ok {
						clientIP = extractIP(p.Addr.String())
					}

					// Trigger security violation - this will log and call handler
					s.triggerSecurityViolation(req.ExecutionId, key, clientIP)

					return nil, status.Error(codes.PermissionDenied, "key not allowed: "+key)
				}
			}

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
	delete(s.fileContexts, executionID)
	s.fileContextsLock.Unlock()

	s.allowedKeysLock.Lock()
	delete(s.allowedKeys, executionID)
	s.allowedKeysLock.Unlock()
}

// SetAllowedKeys sets the allowed variable keys for an execution.
// Only these keys can be requested by the sandbox via GetVariable/GetVariables.
func (s *VariableStoreGRPC) SetAllowedKeys(executionID string, keys []string) {
	s.allowedKeysLock.Lock()
	defer s.allowedKeysLock.Unlock()

	keySet := make(map[string]struct{}, len(keys))
	for _, key := range keys {
		keySet[key] = struct{}{}
	}
	s.allowedKeys[executionID] = keySet

	s.logger.Debug("set allowed keys for execution",
		zap.String("execution_id", executionID),
		zap.Int("key_count", len(keys)))
}

// SetSecurityViolationHandler sets the callback for security violations.
// When a sandbox attempts to access a key it's not allowed to access,
// this handler is called. The task-manager should use this to terminate immediately.
func (s *VariableStoreGRPC) SetSecurityViolationHandler(handler SecurityViolationHandler) {
	s.securityHandlerLock.Lock()
	defer s.securityHandlerLock.Unlock()
	s.securityHandler = handler
}

// isKeyAllowed checks if a key is allowed for the given execution.
// Returns true if no allowlist is set (for backward compatibility, not just tests).
//
// Keys in the current execution's context/output namespaces
// (e.g., "{executionID}.context.*" or "{executionID}.output.*") are always
// allowed because they belong to the current execution's context data.
// The explicit allowlist is still enforced for other keys (e.g., "VARIABLE.{uuid}"),
// preventing cross-execution or unintended data access.
func (s *VariableStoreGRPC) isKeyAllowed(executionID, key string) bool {
	// Allow only well-known execution-scoped namespaces to bypass the allowlist.
	// The orchestrator's BindingKeys field is deprecated and often empty, so we
	// allow context/output keys rather than relying on an incomplete allowlist.
	if executionID != "" &&
		(strings.HasPrefix(key, executionID+".context.") ||
			strings.HasPrefix(key, executionID+".output.")) {
		return true
	}

	s.allowedKeysLock.RLock()
	defer s.allowedKeysLock.RUnlock()

	keySet, exists := s.allowedKeys[executionID]
	if !exists {
		// No allowlist set - allow all (backward compatibility)
		return true
	}

	_, allowed := keySet[key]
	return allowed
}

// triggerSecurityViolation logs the violation and calls the security handler
func (s *VariableStoreGRPC) triggerSecurityViolation(executionID, requestedKey, clientIP string) {
	// Get allowed keys for logging
	s.allowedKeysLock.RLock()
	var allowedKeysList []string
	if keySet, exists := s.allowedKeys[executionID]; exists {
		allowedKeysList = make([]string, 0, len(keySet))
		for k := range keySet {
			allowedKeysList = append(allowedKeysList, k)
		}
	}
	s.allowedKeysLock.RUnlock()

	// Log the violation with full details
	s.logger.Error("SECURITY VIOLATION: sandbox attempted to access unauthorized variable",
		zap.String("execution_id", executionID),
		zap.String("requested_key", requestedKey),
		zap.String("client_ip", clientIP),
		zap.Strings("allowed_keys", allowedKeysList),
		zap.String("action", "terminating task-manager"),
	)

	// Call the security handler if set
	s.securityHandlerLock.RLock()
	handler := s.securityHandler
	s.securityHandlerLock.RUnlock()

	if handler != nil {
		handler(SecurityViolation{
			ExecutionID:   executionID,
			RequestedKey:  requestedKey,
			AllowedKeys:   allowedKeysList,
			ClientIP:      clientIP,
			ViolationType: "key_not_allowed",
		})
	}
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

// extractIP extracts the IP address from an address string (IP:port format)
func extractIP(addr string) string {
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		// If it's not in host:port format, assume it's just an IP
		return addr
	}
	return host
}
