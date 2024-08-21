package mocker

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	bus "github.com/superblocksteam/agent/pkg/functions/mocks"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestDynamic(t *testing.T) {
	for _, test := range []struct {
		name         string
		err          error
		params       *apiv1.Mock_Params
		mockResponse *apiv1.Function_Response
		mockErr      error
		expected     *structpb.Value
	}{
		{
			name: "missing required parameters",
			err:  errors.New("missing required parameters"),
		},
		{
			name: "function response is malformed",
			err:  errors.New("function response is malformed"),
			params: &apiv1.Mock_Params{
				IntegrationType: proto.String("javascript"),
				StepName:        proto.String("step"),
			},
		},
		{
			name: "happy path",
			params: &apiv1.Mock_Params{
				IntegrationType: proto.String("javascript"),
				StepName:        proto.String("step"),
			},
			mockResponse: &apiv1.Function_Response{
				Value: structpb.NewStringValue("response"),
			},
			expected: structpb.NewStringValue("response"),
		},
		{
			name: "function response has error",
			params: &apiv1.Mock_Params{
				IntegrationType: proto.String("javascript"),
				StepName:        proto.String("step"),
			},
			mockResponse: &apiv1.Function_Response{
				Error: &commonv1.Error{
					Message: "un oh",
				},
			},
			err: &commonv1.Error{
				Message: "un oh",
			},
		},
		{
			name: "function response has error",
			params: &apiv1.Mock_Params{
				IntegrationType: proto.String("javascript"),
				StepName:        proto.String("step"),
			},
			mockErr: errors.New("un oh"),
			err:     errors.New("un oh"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			bus := &bus.Bus{}
			bus.On("RoundTrip", mock.Anything, mock.Anything, mock.Anything).Return(test.mockResponse, test.mockErr)

			result, err := (&mocker{
				Bus: bus,
			}).dynamic(context.Background(), "todo", test.params)

			if test.err != nil {
				assert.Error(t, err)
				assert.Equal(t, test.err, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.expected, result)
			}
		})
	}
}
