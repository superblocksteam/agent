package mocker

import (
	"context"
	"errors"
	"reflect"

	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

type roundtrip func(context.Context) (*structpb.Value, error)

type matcher interface {
	match(context.Context, *apiv1.Mock_Params) (func(context.Context) (*structpb.Value, error), bool)
}

type registry struct {
	dynamic func(context.Context, string, *apiv1.Mock_Params) (*structpb.Value, error)
	mocks   []*apiv1.Mock
}

func index(
	dynamic func(context.Context, string, *apiv1.Mock_Params) (*structpb.Value, error),
	mocks ...*apiv1.Mock,
) matcher {
	return &registry{
		dynamic: dynamic,
		mocks:   mocks,
	}
}

func (r *registry) match(ctx context.Context, params *apiv1.Mock_Params) (func(context.Context) (*structpb.Value, error), bool) {
	// Ask the registry if a mock (either dymamic or static) exists for the given inputs.
	for _, m := range r.mocks {
		mock := r.mock(m.Return, params)

		// If no matcher is defined, we assume that it has been matched.
		if m.On == nil {
			return mock, true
		}

		if !subset(m.On.Static, params) {
			continue
		}

		// Either static was not defined or it did not match.

		if m.On.Dynamic == nil || *m.On.Dynamic == "" {
			// There is no dynamic match defined so the match was successful.
			return mock, true
		}

		should, err := r.dynamic(ctx, *m.On.Dynamic, params)
		if err != nil {
			continue
		}

		if _, ok := should.Kind.(*structpb.Value_BoolValue); !ok || !should.GetBoolValue() {
			continue
		}

		return mock, true
	}

	return nil, false
}

// mock dynamically returns a function that will return the mock response.
func (r *registry) mock(returnable *apiv1.Mock_Return, params *apiv1.Mock_Params) func(context.Context) (*structpb.Value, error) {
	if returnable == nil || returnable.Type == nil {
		return invalid("mock must define a return")
	}

	switch v := returnable.Type.(type) {
	case *apiv1.Mock_Return_Static:
		return func(context.Context) (*structpb.Value, error) {
			return v.Static, nil
		}
	case *apiv1.Mock_Return_Dynamic:
		return func(ctx context.Context) (*structpb.Value, error) {
			return r.dynamic(ctx, v.Dynamic, params)
		}
	default:
		return invalid("invalid return type")
	}
}

func invalid(why string) func(context.Context) (*structpb.Value, error) {
	return func(context.Context) (*structpb.Value, error) {
		return nil, errors.New(why)
	}
}

func subset(x, y *apiv1.Mock_Params) bool {
	if x == nil {
		return true
	}

	if y == nil {
		return x == nil
	}

	if x.IntegrationType != nil && (y.IntegrationType == nil || *x.IntegrationType != *y.IntegrationType) {
		return false
	}

	if x.StepName != nil && (y.StepName == nil || *x.StepName != *y.StepName) {
		return false
	}

	// The left side is nil but the right side is not.
	if x.Inputs == nil || x.Inputs.Kind == nil {
		return true
	}

	// The left side is not nil but the right side is.
	if y.Inputs == nil || y.Inputs.Kind == nil {
		return false
	}

	// If they are both struct, we're going to delegate. Else, we're going to compare the values.
	if reflect.TypeOf(x.Inputs.Kind) != reflect.TypeOf(y.Inputs.Kind) {
		return false
	}

	switch x.Inputs.Kind.(type) {
	case *structpb.Value_StructValue: // The right side is guaranteed to be a StructValue too.
		left := x.Inputs.Kind.(*structpb.Value_StructValue).StructValue
		right := y.Inputs.Kind.(*structpb.Value_StructValue).StructValue

		if left == nil {
			return true
		}

		if right == nil {
			return false
		}

		// TODO(frank): There's still a case where StructValue is nil; handle.
		return utils.IsSubset(
			left.AsMap(),
			right.AsMap(),
		)
	default:
		return proto.Equal(x.Inputs, y.Inputs)
	}
}
