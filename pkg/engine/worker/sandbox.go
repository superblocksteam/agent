// Package worker provides an engine.Sandbox implementation that delegates
// JavaScript expression evaluation to a JS worker (via Redis) instead of
// using a local V8 isolate.
package worker

import (
	"context"
	"encoding/json"
	"fmt"

	pkgengine "github.com/superblocksteam/agent/pkg/engine"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	pkgworker "github.com/superblocksteam/agent/pkg/worker"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

// Ensure interfaces are satisfied at compile time.
var (
	_ pkgengine.Sandbox = (*sandbox)(nil)
	_ pkgengine.Engine  = (*engine)(nil)
	_ pkgengine.Value   = (*value)(nil)
)

// Options holds the dependencies needed to execute JavaScript via the worker.
type Options struct {
	Worker        pkgworker.Client
	Store         store.Store
	ExecutionID   string
	FileServerURL string
	// CtxFunc returns a context with an appropriate deadline for worker calls.
	CtxFunc func(context.Context) context.Context
}

// Sandbox returns a new worker-backed engine.Sandbox.
func Sandbox(options *Options) pkgengine.Sandbox {
	return &sandbox{options: options}
}

type sandbox struct {
	options *Options
}

func (s *sandbox) Engine(_ context.Context) (pkgengine.Engine, error) {
	return &engine{sandbox: s}, nil
}

func (s *sandbox) Close() {
	// No resources to release — the worker connection is managed externally.
}

// engine implements pkgengine.Engine. Resolve() captures the expression and
// variables but defers execution to value.Result() / value.JSON(), so that
// ResultOptions like AsBoolean are known at execution time and can be applied
// in JavaScript (e.g., wrapping with !!()).
type engine struct {
	sandbox *sandbox
}

func (e *engine) Resolve(ctx context.Context, code string, variables utils.Map[*transportv1.Variable], _ ...pkgengine.ResolveOption) pkgengine.Value {
	// Unwrap mustache template delimiters if present (e.g., "{{ x > 5 }}" -> "x > 5").
	unwrapped := utils.IdempotentUnwrap(code)
	if unwrapped == "" {
		// Match local V8 behavior: empty bindings like "{{ }}" resolve to null.
		unwrapped = "null"
	}

	// Convert utils.Map to plain map for the proto field.
	var varsMap map[string]*transportv1.Variable
	if variables != nil {
		varsMap = variables.ToGoMap()
	}

	// Return a lazy value that will execute when Result() or JSON() is called.
	return &value{
		engine:     e,
		ctx:        ctx,
		expression: unwrapped,
		variables:  varsMap,
	}
}

func (e *engine) Failed(err error) pkgengine.Value {
	return &value{err: err}
}

func (e *engine) Close() {
	// No resources to release.
}

// execute sends a JavaScript expression to the worker for evaluation and
// returns the raw *structpb.Value result. The asBoolean flag controls whether
// the expression is wrapped in !!() for JavaScript-native truthiness coercion.
func (e *engine) execute(ctx context.Context, expression string, variables map[string]*transportv1.Variable, asBoolean bool) (*structpb.Value, error) {
	opts := e.sandbox.options

	// Build the JavaScript code. When the caller needs a boolean, wrap with
	// !!() so truthiness coercion happens in JavaScript, matching the V8
	// engine's value.Boolean() behavior exactly.
	var jsCode string
	if asBoolean {
		jsCode = fmt.Sprintf("return !!(%s)", expression)
	} else {
		jsCode = fmt.Sprintf("return %s", expression)
	}

	actionConfig, err := structpb.NewStruct(map[string]interface{}{
		"body": jsCode,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create action configuration: %w", err)
	}

	props := &transportv1.Request_Data_Data_Props{
		ActionConfiguration: actionConfig,
		ExecutionId:         opts.ExecutionID,
		StepName:            "__binding_eval",
		Variables:           variables,
		FileServerUrl:       opts.FileServerURL,
		Render:              false,
		Version:             "v2",
	}

	// Apply deadline if configured.
	workerCtx := ctx
	if opts.CtxFunc != nil {
		workerCtx = opts.CtxFunc(ctx)
	}

	_, key, err := opts.Worker.Execute(
		workerCtx,
		"javascriptwasm",
		&transportv1.Request_Data_Data{
			Props: props,
		},
	)
	if err != nil {
		return nil, sberrors.BindingError(fmt.Errorf("binding evaluation failed: %w", err))
	}

	// Fetch the result from the KV store.
	values, err := opts.Store.Read(ctx, key)
	if err != nil {
		return nil, fmt.Errorf("failed to read result from store: %w", err)
	}

	if len(values) == 0 || values[0] == nil {
		return nil, nil
	}

	var raw string
	switch value := values[0].(type) {
	case string:
		raw = value
	case []byte:
		raw = string(value)
	default:
		return nil, fmt.Errorf("failed to parse output payload: unexpected type %T", values[0])
	}

	result, err := parseOutputResult(raw)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// parseOutputResult reads the worker output JSON and extracts only the evaluated result.
// We intentionally ignore all other metadata fields (e.g. startTimeUtc, executionTime)
// because bindings evaluation only needs the "output" value.
func parseOutputResult(raw string) (*structpb.Value, error) {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(raw), &payload); err != nil {
		return nil, fmt.Errorf("failed to unmarshal output: %w", err)
	}

	result, ok := payload["output"]
	if !ok {
		result, ok = payload["result"]
		if !ok {
			return nil, fmt.Errorf("failed to parse output payload: missing output field")
		}
	}

	typed, err := structpb.NewValue(result)
	if err != nil {
		return nil, fmt.Errorf("failed to convert output value: %w", err)
	}

	return typed, nil
}

// value implements pkgengine.Value using lazy evaluation. The expression is
// captured by Resolve() and only sent to the worker when Result() or JSON()
// is called. This allows ResultOptions (like AsBoolean) to influence the
// JavaScript code that is executed (e.g., wrapping with !!()).
type value struct {
	engine     *engine
	ctx        context.Context
	expression string
	variables  map[string]*transportv1.Variable
	err        error
}

func (v *value) Result(options ...pkgengine.ResultOption) (any, error) {
	if v.err != nil {
		return nil, v.err
	}

	applied := pkgengine.Apply(options...)

	// Execute the expression, wrapping in !!() if a boolean is needed.
	result, err := v.engine.execute(v.ctx, v.expression, v.variables, applied.AsBoolean)
	if err != nil {
		return nil, err
	}

	if result == nil {
		return nil, nil
	}

	// Convert the structpb.Value to the Go type callers expect.
	// This mirrors the V8 value.resultLocked() in pkg/engine/javascript/value.go.
	switch k := result.Kind.(type) {
	case *structpb.Value_BoolValue:
		return k.BoolValue, nil
	case *structpb.Value_StringValue:
		return k.StringValue, nil
	case *structpb.Value_NumberValue:
		// Match V8 behavior: if it fits in int32, return int32.
		n := k.NumberValue
		if n == float64(int32(n)) {
			return int32(n), nil
		}
		return n, nil
	case *structpb.Value_NullValue:
		return nil, nil
	case *structpb.Value_ListValue:
		items := make([]string, len(k.ListValue.Values))
		for i, item := range k.ListValue.Values {
			if s, ok := item.Kind.(*structpb.Value_StringValue); ok && !applied.JSONEncodeArrayItems {
				items[i] = s.StringValue
			} else if isNull(item) {
				items[i] = ""
			} else {
				b, err := json.Marshal(item.AsInterface())
				if err != nil {
					return nil, sberrors.BindingError(fmt.Errorf("failed to encode array item: %w", err))
				}
				items[i] = string(b)
			}
		}
		return items, nil
	default:
		return nil, fmt.Errorf("unsupported type")
	}
}

func (v *value) JSON() (string, error) {
	if v.err != nil {
		return "", v.err
	}

	result, err := v.engine.execute(v.ctx, v.expression, v.variables, false)
	if err != nil {
		return "", err
	}

	if result == nil {
		return "null", nil
	}

	b, err := json.Marshal(result.AsInterface())
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func (v *value) Err() error {
	return v.err
}

func (v *value) Console() *pkgengine.Console {
	// The worker manages its own console output; we don't capture it here.
	return nil
}

func isNull(v *structpb.Value) bool {
	_, ok := v.Kind.(*structpb.Value_NullValue)
	return ok
}
