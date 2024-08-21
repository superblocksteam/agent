package mocker

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

func TestMatch(t *testing.T) {
	for _, test := range []struct {
		name    string
		mocks   []*apiv1.Mock
		params  *apiv1.Mock_Params
		matched bool
		err     error
		fn      string
		result  *structpb.Value
		dynamic *structpb.Value
	}{
		{
			name:    "no mocks",
			mocks:   []*apiv1.Mock{},
			matched: false,
		},
		{
			name: "malformed mock",
			mocks: []*apiv1.Mock{
				{
					On: nil,
				},
			},
			matched: true,
			err:     errors.New("mock must define a return"),
		},
		{
			name: "matched but malformed mock",
			mocks: []*apiv1.Mock{
				{
					On: &apiv1.Mock_On{
						Static: &apiv1.Mock_Params{
							StepName: proto.String("name"),
						},
					},
				},
			},
			params: &apiv1.Mock_Params{
				StepName: proto.String("name"),
			},
			err:     errors.New("mock must define a return"),
			matched: true,
		},
		{
			name: "static/static",
			mocks: []*apiv1.Mock{
				{
					On: &apiv1.Mock_On{
						Static: &apiv1.Mock_Params{
							StepName: proto.String("name"),
						},
					},
					Return: &apiv1.Mock_Return{
						Type: &apiv1.Mock_Return_Static{
							Static: structpb.NewStringValue("value"),
						},
					},
				},
			},
			result: structpb.NewStringValue("value"),
			params: &apiv1.Mock_Params{
				StepName: proto.String("name"),
			},
			matched: true,
		},
		{
			name: "static/dynamic",
			mocks: []*apiv1.Mock{
				{
					On: &apiv1.Mock_On{
						Static: &apiv1.Mock_Params{
							StepName: proto.String("name"),
						},
					},
					Return: &apiv1.Mock_Return{
						Type: &apiv1.Mock_Return_Dynamic{
							Dynamic: "koala",
						},
					},
				},
			},
			fn:      "koala",
			dynamic: structpb.NewStringValue("value"),
			result:  structpb.NewStringValue("value"),
			params: &apiv1.Mock_Params{
				StepName: proto.String("name"),
			},
			matched: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			fn, ok := (&registry{
				mocks: test.mocks,
				dynamic: func(_ context.Context, fn string, params *apiv1.Mock_Params) (*structpb.Value, error) {
					assert.Equal(t, test.fn, fn)

					return test.dynamic, nil
				},
			}).match(context.Background(), test.params)

			if !test.matched {
				assert.False(t, ok)
				assert.Nil(t, fn)
				return
			}

			assert.True(t, ok)
			assert.NotNil(t, fn)

			result, err := fn(context.Background())

			if test.err != nil {
				assert.Nil(t, result)
				assert.Error(t, err)
				assert.Equal(t, err, test.err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.result, result)
			}
		})
	}
}

func TestMock(t *testing.T) {
	for _, test := range []struct {
		name       string
		err        error
		result     *structpb.Value
		returnable *apiv1.Mock_Return
		params     *apiv1.Mock_Params
		fn         string
	}{
		{
			name: "malformed mock",
			err:  errors.New("mock must define a return"),
		},
		{
			name: "static",
			returnable: &apiv1.Mock_Return{
				Type: &apiv1.Mock_Return_Static{
					Static: structpb.NewStringValue("value"),
				},
			},
			result: structpb.NewStringValue("value"),
		},
		{
			name: "dynamic",
			returnable: &apiv1.Mock_Return{
				Type: &apiv1.Mock_Return_Dynamic{
					Dynamic: "dynamic",
				},
			},
			params: &apiv1.Mock_Params{
				Inputs: structpb.NewStringValue("value"),
			},
			fn:     "dynamic",
			result: structpb.NewStringValue("value"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			fn, err := (&registry{
				dynamic: func(_ context.Context, fn string, params *apiv1.Mock_Params) (*structpb.Value, error) {
					assert.Equal(t, test.fn, fn)

					return params.Inputs, nil
				},
			}).mock(test.returnable, test.params)(context.Background())

			if test.err != nil {
				assert.Nil(t, fn)
				assert.Error(t, err)
				assert.Equal(t, err, test.err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.result, fn)
			}
		})
	}
}

func TestInvalid(t *testing.T) {
	for _, test := range []struct {
		name    string
		message string
	}{
		{
			name:    "happy path",
			message: "uh oh",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			fn, err := invalid(test.message)(context.Background())

			assert.Nil(t, fn)
			assert.Error(t, err)
			assert.Equal(t, err.Error(), test.message)
		})
	}
}

func TestSubset(t *testing.T) {
	for _, test := range []struct {
		name   string
		x, y   *apiv1.Mock_Params
		result bool
	}{
		{
			name:   "nils",
			x:      nil,
			y:      nil,
			result: true,
		},
		{
			name: "not a subset",
			x: &apiv1.Mock_Params{
				StepName: proto.String("name"),
			},
			y:      nil,
			result: false,
		},
		{
			name: "left side is nil",
			x:    nil,
			y: &apiv1.Mock_Params{
				StepName: proto.String("name"),
			},
			result: true,
		},
		{
			name: "right side is empty",
			x: &apiv1.Mock_Params{
				StepName: proto.String("name"),
			},
			y:      &apiv1.Mock_Params{},
			result: false,
		},
		{
			name: "matched on real data",
			x: &apiv1.Mock_Params{
				StepName: proto.String("name"),
			},
			y: &apiv1.Mock_Params{
				StepName: proto.String("name"),
			},
			result: true,
		},
		{
			name: "left side is bigger",
			x: &apiv1.Mock_Params{
				StepName:        proto.String("name"),
				IntegrationType: proto.String("type"),
			},
			y: &apiv1.Mock_Params{
				StepName: proto.String("name"),
			},
			result: false,
		},
		{
			name: "matched on multiple fields",
			x: &apiv1.Mock_Params{
				StepName:        proto.String("name"),
				IntegrationType: proto.String("type"),
			},
			y: &apiv1.Mock_Params{
				StepName:        proto.String("name"),
				IntegrationType: proto.String("type"),
			},
			result: true,
		},
		{
			name: "inputs are empty",
			x: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs:   &structpb.Value{},
			},
			y: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs:   &structpb.Value{},
			},
			result: true,
		},
		{
			name: "inputs are different",
			x: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs:   structpb.NewBoolValue(true),
			},
			y: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs:   structpb.NewStringValue("value"),
			},
			result: false,
		},
		{
			name: "inputs are different",
			x: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs:   structpb.NewBoolValue(true),
			},
			y: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs:   nil,
			},
			result: false,
		},
		{
			name: "inputs are the same",
			x: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs:   structpb.NewStringValue("value"),
			},
			y: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs:   structpb.NewStringValue("value"),
			},
			result: true,
		},
		{
			name: "complex inputs are the same",
			x: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs: structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"foo": structpb.NewStructValue(&structpb.Struct{
							Fields: map[string]*structpb.Value{
								"foo": structpb.NewStringValue("value"),
							},
						}),
					},
				}),
			},
			y: &apiv1.Mock_Params{
				StepName: proto.String("name"),
				Inputs: structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"foo": structpb.NewStructValue(&structpb.Struct{
							Fields: map[string]*structpb.Value{
								"foo": structpb.NewStringValue("value"),
								"bar": structpb.NewStringValue("value"),
							},
						}),
					},
				}),
			},
			result: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.result, subset(test.x, test.y))
		})
	}
}
