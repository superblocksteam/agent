package template

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"

	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/utils"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

// RenderProtoValue is a helper function that uses the provided RenderFunc
// to recurse through a *structpb.Value and render every nested string.
func RenderProtoValue(ctx *apictx.Context, x *structpb.Value, plugin func(*plugins.Input) plugins.Plugin, sandbox engine.Sandbox, logger *zap.Logger) (*structpb.Value, error) {
	// We cannot do anything if the proper parameters weren't specified.
	if plugin == nil || sandbox == nil {
		return nil, errors.New("both a plugin and sandbox must be provided")
	}

	return RenderProtoValueWithResolver(ctx, x, plugin, DefaultEngineResolver(sandbox, ctx.Variables), utils.NoOpTokenJoiner, logger)
}

func RenderProtoValueWithResolver(
	ctx *apictx.Context,
	x *structpb.Value,
	plugin func(*plugins.Input) plugins.Plugin,
	resolver func(context.Context, *utils.TokenJoiner, string) engine.Value,
	tokenJoiner *utils.TokenJoiner,
	logger *zap.Logger,
) (*structpb.Value, error) {

	// NOTE(frank): When you're looking at this 6 months from now asking
	// yourself, "Why isn't Frank doing `do := func() {...}`??", you can't
	// recurse on a function defined that way :scream:
	var do func(context.Context, func(context.Context, *utils.TokenJoiner, string) engine.Value, *utils.TokenJoiner, string, *structpb.Value) (*structpb.Value, error)
	{
		do = func(ctx context.Context, resolver func(context.Context, *utils.TokenJoiner, string) engine.Value, tokenJoiner *utils.TokenJoiner, fieldName string, x *structpb.Value) (*structpb.Value, error) {
			// Fail fast if the provided struct is nil
			if x == nil {
				return x, nil
			}

			// We cannot do anything if the proper parameters weren't specified.
			if plugin == nil || resolver == nil {
				return nil, errors.New("both a plugin and resolver must be provided")
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
					newFieldName := key
					if fieldName != "" {
						newFieldName = strings.Join([]string{fieldName, key}, ".")
					}

					rendered, err := do(ctx, resolver, tokenJoiner, newFieldName, value)
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

					rendered, err := do(ctx, resolver, tokenJoiner, fieldName, value)
					if err != nil {
						return nil, err
					}
					renderedNode.Kind.(*structpb.Value_ListValue).ListValue.Values[i] = rendered
				}
			case *structpb.Value_StringValue:
				if v.StringValue == "" {
					return &structpb.Value{Kind: &structpb.Value_StringValue{StringValue: x.Kind.(*structpb.Value_StringValue).StringValue}}, nil
				}

				input := &plugins.Input{
					Meta: &plugins.InputMetadata{FieldName: fieldName},
					Data: v.StringValue,
				}
				resolved, err := New(plugin, resolver, tokenJoiner, logger).Render(ctx, input)
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

		return do(cloned.Context, resolver, tokenJoiner, "", x)
	}, nil)
}

func DefaultEngineResolver(sandbox engine.Sandbox, variables utils.Map[*transportv1.Variable]) func(context.Context, *utils.TokenJoiner, string) engine.Value {
	// NOTE(frank): There's an optimization here where we can init once
	// and share on future calls. However, I was running into some issues.
	return func(ctx context.Context, _ *utils.TokenJoiner, template string) engine.Value {
		e, err := sandbox.Engine(ctx)
		if err != nil {
			return e.Failed(err)
		}

		return e.Resolve(ctx, template, variables)
	}
}
