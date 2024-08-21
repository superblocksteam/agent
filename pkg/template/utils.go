package template

import (
	"context"
	"errors"
	"fmt"

	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"

	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/template/plugins"
)

// RenderProtoValue is a helper function that uses the provided RenderFunc
// to recurse through a *structpb.Value and render every nested string.
func RenderProtoValue(ctx *apictx.Context, x *structpb.Value, plugin func(string) plugins.Plugin, sandbox engine.Sandbox, logger *zap.Logger) (*structpb.Value, error) {

	// NOTE(frank): When you're looking at this 6 months from now asking
	// yourself, "Why isn't Frank doing `do := func() {...}`??", you can't
	// recurse on a function defined that way :scream:
	var do func(context.Context, func(context.Context, string) engine.Value, *structpb.Value) (*structpb.Value, error)
	{
		do = func(ctx context.Context, resolver func(context.Context, string) engine.Value, x *structpb.Value) (*structpb.Value, error) {
			// Fail fast if the provided struct is nil
			if x == nil {
				return x, nil
			}

			// We cannot do anything if the proper parameters weren't specified.
			if plugin == nil || sandbox == nil {
				return nil, errors.New("both a plugin and sandbox must be provided")
			}

			if logger == nil {
				logger = zap.NewNop()
			}

			var renderedNode *structpb.Value

			switch v := x.Kind.(type) {
			case *structpb.Value_NullValue:
				renderedNode = &structpb.Value{Kind: &structpb.Value_NullValue{NullValue: x.Kind.(*structpb.Value_NullValue).NullValue}}
			case *structpb.Value_NumberValue:
				renderedNode = &structpb.Value{Kind: &structpb.Value_NumberValue{NumberValue: x.Kind.(*structpb.Value_NumberValue).NumberValue}}
			case *structpb.Value_BoolValue:
				renderedNode = &structpb.Value{Kind: &structpb.Value_BoolValue{BoolValue: x.Kind.(*structpb.Value_BoolValue).BoolValue}}
			case *structpb.Value_StructValue:
				fields := map[string]*structpb.Value{}
				for key, value := range v.StructValue.GetFields() {
					if value == nil {
						continue
					}

					rendered, err := do(ctx, resolver, value)
					if err != nil {
						return nil, err
					}
					fields[key] = rendered
				}
				renderedNode = &structpb.Value{Kind: &structpb.Value_StructValue{StructValue: &structpb.Struct{Fields: fields}}}
			case *structpb.Value_ListValue:
				renderedNode = &structpb.Value{Kind: &structpb.Value_ListValue{ListValue: &structpb.ListValue{Values: make([]*structpb.Value, len(v.ListValue.Values))}}}
				for i, value := range v.ListValue.Values {
					if value == nil {
						continue
					}

					rendered, err := do(ctx, resolver, value)
					if err != nil {
						return nil, err
					}
					renderedNode.Kind.(*structpb.Value_ListValue).ListValue.Values[i] = rendered
				}
			case *structpb.Value_StringValue:
				if v.StringValue == "" {
					return &structpb.Value{Kind: &structpb.Value_StringValue{StringValue: x.Kind.(*structpb.Value_StringValue).StringValue}}, nil
				}

				resolved, err := New(plugin, resolver, logger).Render(ctx, v.StringValue)
				if err != nil {
					return nil, err
				}

				return structpb.NewStringValue(*resolved), nil
			default:
				return nil, fmt.Errorf("unknown type %T", v)
			}

			return renderedNode, nil
		}
	}

	return tracer.Observe(ctx.Context, "resolve", map[string]any{}, func(spanCtx context.Context, span trace.Span) (*structpb.Value, error) {
		var cloned *apictx.Context
		{
			newCtx := *ctx
			newCtx.Context = spanCtx
			cloned = &newCtx
		}

		// NOTE(frank): There's an optimization here where we can init once
		// and share on future calls. However, I was running into some issues.
		resolver := func(ctx context.Context, template string) engine.Value {
			e, err := sandbox.Engine(ctx)
			if err != nil {
				return e.Failed(err)
			}

			return e.Resolve(ctx, template, cloned.Variables)
		}

		return do(cloned.Context, resolver, x)
	}, nil)
}
