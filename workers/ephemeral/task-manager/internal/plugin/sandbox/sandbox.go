package sandbox

import (
	"context"
	"errors"
	"fmt"
	"time"

	"workers/ephemeral/task-manager/internal/plugin"

	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/structpb"
)

// SandboxPlugin executes code by forwarding to a gRPC sandbox server
type SandboxPlugin struct {
	client   workerv1.SandboxExecutorTransportServiceClient
	conn     *grpc.ClientConn
	language string
	address  string
	logger   *zap.Logger

	// Variable store address to pass to sandbox
	variableStoreAddress string
}

var _ plugin.Plugin = &SandboxPlugin{}

// NewSandboxPlugin creates a new sandbox plugin
func NewSandboxPlugin(opts *Options) (*SandboxPlugin, error) {
	// Configure keepalive to detect dead connections
	keepaliveParams := keepalive.ClientParameters{
		Time:                10 * time.Second, // Send pings every 10 seconds if no activity
		Timeout:             5 * time.Second,  // Wait 5 seconds for ping ack before considering dead
		PermitWithoutStream: true,             // Send pings even without active streams
	}

	conn, err := grpc.NewClient(
		opts.Address,
		// insecure is used as these containers share a pod and are not exposed outside the pod context
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(keepaliveParams),
		grpc.WithConnectParams(grpc.ConnectParams{
			MinConnectTimeout: 5 * time.Second, // Minimum timeout for connection attempts
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to sandbox server: %w", err)
	}

	return &SandboxPlugin{
		client:               workerv1.NewSandboxExecutorTransportServiceClient(conn),
		conn:                 conn,
		language:             opts.Language,
		address:              opts.Address,
		logger:               opts.Logger,
		variableStoreAddress: opts.VariableStoreAddress,
	}, nil
}

// Execute runs code in the sandbox
func (p *SandboxPlugin) Execute(ctx context.Context, props *transportv1.Request_Data_Data_Props) (*apiv1.Output, error) {
	// Extract code from action configuration
	code := p.getCodeFromProps(props)

	// Build context JSON from variables
	contextJSON, err := p.buildContextJSON(props)
	if err != nil {
		p.logger.Error("failed to build context JSON", zap.Error(err))
		contextJSON = "{}"
	}

	// Build variables JSON
	variablesJSON, err := p.buildVariablesJSON(props)
	if err != nil {
		p.logger.Error("failed to build variables JSON", zap.Error(err))
		variablesJSON = "{}"
	}

	// Get timeout from context deadline (set by plugin executor from quotas)
	// Default to 5 minutes if no deadline is set
	timeoutMs := int32(5 * 60 * 1000) // 5 minutes default
	if deadline, ok := ctx.Deadline(); ok {
		remaining := time.Until(deadline)
		if remaining > 0 {
			timeoutMs = int32(remaining.Milliseconds())
		}
	}

	output := &apiv1.Output{
		Request:   code,
		RequestV2: &apiv1.Output_Request{Summary: code},
	}

	resp, err := tracer.Observe(
		ctx,
		fmt.Sprintf("sandbox.%s.execute", p.language),
		nil,
		func(ctx context.Context, span trace.Span) (*workerv1.ExecuteResponse, error) {
			return p.client.Execute(ctx, &workerv1.ExecuteRequest{
				Script:               code,
				ContextJson:          contextJSON,
				TimeoutMs:            timeoutMs,
				ExecutionId:          props.GetExecutionId(),
				VariableStoreAddress: p.variableStoreAddress,
				VariablesJson:        variablesJSON,
			})
		},
		nil,
	)

	if err != nil {
		return output, err
	}

	// Convert sandbox response to apiv1.Output
	output.Stdout = resp.GetStdout()
	output.Stderr = resp.GetStderr()

	// Parse result as JSON
	if resp.GetResult() != "" && resp.GetResult() != "null" {
		output.Result = &structpb.Value{}
		if err := protojson.Unmarshal([]byte(resp.GetResult()), output.Result); err != nil {
			// If not valid JSON, wrap as string value
			output.Result = structpb.NewStringValue(resp.GetResult())
		}
	}

	// Check for errors in response
	if resp.GetError() != "" {
		return output, errors.New(resp.GetError())
	}

	if resp.GetExitCode() != 0 {
		errMsg := fmt.Sprintf("sandbox exited with code %d", resp.GetExitCode())
		if len(output.Stderr) > 0 {
			errMsg = output.Stderr[len(output.Stderr)-1]
		}
		return output, errors.New(errMsg)
	}

	return output, nil
}

// Stream is not supported for sandbox plugins
func (p *SandboxPlugin) Stream(ctx context.Context, props *transportv1.Request_Data_Data_Props, send func(message any), until func()) error {
	return errors.ErrUnsupported
}

// Metadata is not supported for sandbox plugins
func (p *SandboxPlugin) Metadata(ctx context.Context, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) (*transportv1.Response_Data_Data, error) {
	return nil, errors.ErrUnsupported
}

// Test is not supported for sandbox plugins
func (p *SandboxPlugin) Test(ctx context.Context, datasourceConfig *structpb.Struct) error {
	return errors.ErrUnsupported
}

// PreDelete is not supported for sandbox plugins
func (p *SandboxPlugin) PreDelete(ctx context.Context, datasourceConfig *structpb.Struct) error {
	return errors.ErrUnsupported
}

// Name returns the plugin name (language)
func (p *SandboxPlugin) Name() string {
	return p.language
}

// Close closes the gRPC connection
func (p *SandboxPlugin) Close() error {
	if p.conn != nil {
		return p.conn.Close()
	}
	return nil
}

// getCodeFromProps extracts the code/script from action configuration
func (p *SandboxPlugin) getCodeFromProps(props *transportv1.Request_Data_Data_Props) string {
	actionConfig := props.GetActionConfiguration()
	code, err := utils.GetStructField(actionConfig, "body")
	if err != nil {
		p.logger.Error("failed to extract code from action configuration", zap.Error(err))
		return ""
	}
	return code.GetStringValue()
}

// TODO(perf): Consider using native protobuf serialization instead of JSON to increase performance.
// buildContextJSON builds the context JSON from props.
func (p *SandboxPlugin) buildContextJSON(props *transportv1.Request_Data_Data_Props) (string, error) {
	// Build context from action configuration
	actionConfig := props.GetActionConfiguration()
	if actionConfig == nil {
		return "{}", nil
	}

	jsonBytes, err := protojson.Marshal(actionConfig)
	if err != nil {
		return "{}", err
	}
	return string(jsonBytes), nil
}

// buildVariablesJSON builds the variables JSON for the sandbox
func (p *SandboxPlugin) buildVariablesJSON(props *transportv1.Request_Data_Data_Props) (string, error) {
	variables := props.GetVariables()
	if variables == nil || len(variables) == 0 {
		return "{}", nil
	}

	result := make(map[string]interface{})
	for key, variable := range variables {
		if variable != nil {
			result[key] = map[string]interface{}{
				"key":  variable.GetKey(),
				"type": int32(variable.GetType()),
				"mode": int32(variable.GetMode()),
			}
		}
	}

	jsonBytes, err := protojson.Marshal(structpb.NewStructValue(&structpb.Struct{
		Fields: convertToStructFields(result),
	}))
	if err != nil {
		return "{}", err
	}
	return string(jsonBytes), nil
}

// convertToStructFields converts a map to structpb.Struct fields
func convertToStructFields(m map[string]interface{}) map[string]*structpb.Value {
	fields := make(map[string]*structpb.Value)
	for k, v := range m {
		fields[k] = convertToValue(v)
	}
	return fields
}

// convertToValue converts an interface{} to structpb.Value
func convertToValue(v interface{}) *structpb.Value {
	switch val := v.(type) {
	case string:
		return structpb.NewStringValue(val)
	case int:
		return structpb.NewNumberValue(float64(val))
	case int32:
		return structpb.NewNumberValue(float64(val))
	case int64:
		return structpb.NewNumberValue(float64(val))
	case float64:
		return structpb.NewNumberValue(val)
	case bool:
		return structpb.NewBoolValue(val)
	case nil:
		return structpb.NewNullValue()
	case map[string]interface{}:
		return structpb.NewStructValue(&structpb.Struct{Fields: convertToStructFields(val)})
	case *structpb.Value:
		return val
	default:
		return structpb.NewStringValue(fmt.Sprintf("%v", v))
	}
}
