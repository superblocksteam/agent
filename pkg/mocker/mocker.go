package mocker

import (
	"context"
	"errors"

	"github.com/superblocksteam/agent/pkg/functions"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

type mocker struct {
	matcher
	functions.Bus
}

//go:generate mockery --name=Mocker --output ./mocks --filename mocker.go --outpkg mocks --structname Mocker
type Mocker interface {
	Handle(context.Context, string, string, *structpb.Struct) (*structpb.Value, bool, error)
}

func New(mocks []*apiv1.Mock, bus functions.Bus) Mocker {
	m := &mocker{
		Bus: bus,
	}

	m.matcher = index(m.dynamic, mocks...)

	return m
}

func (m *mocker) Handle(ctx context.Context, name, integration string, inputs *structpb.Struct) (*structpb.Value, bool, error) {
	// Ask the matcher if a mock (either dymamic or static) exists for the given inputs.
	mock, ok := m.match(ctx, &apiv1.Mock_Params{
		StepName:        proto.String(name),
		IntegrationType: proto.String(integration),
		Inputs:          structpb.NewStructValue(inputs),
	})
	if !ok {
		// No mock found, return false
		return nil, false, nil
	}

	// We have a mock, execute it. This is agnostic to whether the mock is static or dynamic.
	response, err := mock(ctx)
	if err != nil {
		// We had trouble executing the mock, return the error.
		return nil, false, err
	}

	return response, true, nil
}

// dynamic encapsulates the execution of a dynamic mock.
func (m *mocker) dynamic(ctx context.Context, fn string, params *apiv1.Mock_Params) (*structpb.Value, error) {
	if m.Bus == nil {
		return nil, errors.New("function execution is not supported")
	}

	if params == nil || params.IntegrationType == nil || params.StepName == nil {
		return nil, errors.New("missing required parameters")
	}

	uuid, err := utils.UUID()
	if err != nil {
		return nil, err
	}

	response, err := m.RoundTrip(ctx, &apiv1.Function_Request{
		Id:   uuid,
		Name: fn,
		Parameters: []*structpb.Value{
			{
				Kind: &structpb.Value_StructValue{
					StructValue: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"integration":   structpb.NewStringValue(*params.IntegrationType),
							"name":          structpb.NewStringValue(*params.StepName),
							"configuration": params.Inputs,
						},
					},
				},
			},
		},
	})

	if err != nil {
		return nil, err
	}

	if response == nil {
		return nil, errors.New("function response is malformed")
	}

	if err := response.Error; err != nil {
		return nil, err
	}

	return response.Value, nil
}
