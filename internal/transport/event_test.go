package transport

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"google.golang.org/protobuf/types/known/structpb"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

func TestHandler(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name        string
		options     *apiv1.ExecuteRequest_Options
		resp        *apiv1.StreamResponse
		expectedErr error
		expectedEvt *apiv1.Event
	}{
		{
			name: "include api request events",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents:    true,
				IncludeApiEvents: true,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-123",
				Event: &apiv1.Event{
					Event: &apiv1.Event_Request_{
						Request: &apiv1.Event_Request{},
					},
				},
			},
			expectedErr: nil,
			expectedEvt: &apiv1.Event{
				Event: &apiv1.Event_Request_{
					Request: &apiv1.Event_Request{},
				},
			},
		},
		{
			name: "include api response events",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents:    true,
				IncludeApiEvents: true,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-123",
				Event: &apiv1.Event{
					Event: &apiv1.Event_Response_{
						Response: &apiv1.Event_Response{},
					},
				},
			},
			expectedErr: nil,
			expectedEvt: &apiv1.Event{
				Event: &apiv1.Event_Response_{
					Response: &apiv1.Event_Response{},
				},
			},
		},
		{
			name: "exlude api response events",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents: true,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-123",
				Event: &apiv1.Event{
					Event: &apiv1.Event_Response_{
						Response: &apiv1.Event_Response{},
					},
				},
			},
			expectedErr: nil,
		},
		{
			name: "exlude api response events",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents:    false,
				IncludeApiEvents: true,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-123",
				Event: &apiv1.Event{
					Event: &apiv1.Event_Response_{
						Response: &apiv1.Event_Response{},
					},
				},
			},
			expectedErr: nil,
		},
		{
			name: "Include events, no error",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents: true,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-123",
				Event: &apiv1.Event{
					Type: apiv1.BlockType_BLOCK_TYPE_STREAM,
					Event: &apiv1.Event_Data_{
						Data: &apiv1.Event_Data{
							Value: structpb.NewStringValue("hi"),
						},
					},
				},
			},
			expectedErr: nil,
			expectedEvt: &apiv1.Event{
				Type: apiv1.BlockType_BLOCK_TYPE_STREAM,
				Event: &apiv1.Event_Data_{
					Data: &apiv1.Event_Data{
						Value: structpb.NewStringValue("hi"),
					},
				},
			},
		},
		{
			name: "Include events, with error",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents: true,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-456",
				Event: &apiv1.Event{
					Type: apiv1.BlockType_BLOCK_TYPE_STREAM,
					Event: &apiv1.Event_End_{
						End: &apiv1.Event_End{
							Error: &commonv1.Error{
								Name:    "BindingError",
								Message: "Binding type error occurred",
							},
						},
					},
				},
			},
			expectedErr: &commonv1.Error{
				Name:    "BindingError",
				Message: "Binding type error occurred",
			},
			expectedEvt: &apiv1.Event{
				Type: apiv1.BlockType_BLOCK_TYPE_STREAM,
				Event: &apiv1.Event_End_{
					End: &apiv1.Event_End{
						Error: &commonv1.Error{
							Name:    "BindingError",
							Message: "Binding type error occurred",
						},
					},
				},
			},
		},
		{
			name: "No events, no error",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents: false,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-789",
				Event: &apiv1.Event{
					Type: apiv1.BlockType_BLOCK_TYPE_STREAM,
					Event: &apiv1.Event_Data_{
						Data: &apiv1.Event_Data{
							Value: structpb.NewStringValue("hello"),
						},
					},
				},
			},
			expectedErr: nil,
			expectedEvt: &apiv1.Event{
				Type: apiv1.BlockType_BLOCK_TYPE_STREAM,
				Event: &apiv1.Event_Data_{
					Data: &apiv1.Event_Data{
						Value: structpb.NewStringValue("hello"),
					},
				},
			},
		},
		{
			name: "No events, no error",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents: false,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-789",
				Event: &apiv1.Event{
					Type: apiv1.BlockType_BLOCK_TYPE_STREAM,
					Event: &apiv1.Event_Start_{
						Start: &apiv1.Event_Start{},
					},
				},
			},
			expectedErr: nil,
			expectedEvt: nil,
		},
		{
			name: "No events, with error",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents: false,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-101112",
				Event: &apiv1.Event{
					Type: apiv1.BlockType_BLOCK_TYPE_STREAM,
					Event: &apiv1.Event_End_{
						End: &apiv1.Event_End{
							Error: &commonv1.Error{
								Name:    "BindingError",
								Message: "Binding type error occurred",
							},
						},
					},
				},
			},
			expectedErr: &commonv1.Error{
				Name:    "BindingError",
				Message: "Binding type error occurred",
			},
			expectedEvt: nil,
		},
		{
			name: "Leaf event, no error",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents: true,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-131415",
				Event: &apiv1.Event{
					Type: apiv1.BlockType_BLOCK_TYPE_STEP,
					Event: &apiv1.Event_Data_{
						Data: &apiv1.Event_Data{
							Value: structpb.NewStringValue("leaf event"),
						},
					},
				},
			},
			expectedErr: nil,
			expectedEvt: &apiv1.Event{
				Type: apiv1.BlockType_BLOCK_TYPE_STEP,
				Event: &apiv1.Event_Data_{
					Data: &apiv1.Event_Data{
						Value: structpb.NewStringValue("leaf event"),
					},
				},
			},
		},
		{
			name: "Leaf event, with error",
			options: &apiv1.ExecuteRequest_Options{
				IncludeEvents: true,
			},
			resp: &apiv1.StreamResponse{
				Execution: "e-161718",
				Event: &apiv1.Event{
					Type: apiv1.BlockType_BLOCK_TYPE_STEP,
					Event: &apiv1.Event_End_{
						End: &apiv1.Event_End{
							Error: &commonv1.Error{
								Name:    "LeafError",
								Message: "Leaf event error occurred",
							},
						},
					},
				},
			},
			expectedErr: &commonv1.Error{
				Name:    "LeafError",
				Message: "Leaf event error occurred",
			},
			expectedEvt: &apiv1.Event{
				Type: apiv1.BlockType_BLOCK_TYPE_STEP,
				Event: &apiv1.Event_End_{
					End: &apiv1.Event_End{
						Error: &commonv1.Error{
							Name:    "LeafError",
							Message: "Leaf event error occurred",
						},
					},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			var called bool

			err := streamResponseProcessor(test.options, func(resp *apiv1.StreamResponse) error {
				called = true
				assert.Equal(t, test.expectedEvt, resp.Event)
				return nil
			})(test.resp)

			assert.Equal(t, test.expectedEvt != nil, called)
			assert.Equal(t, test.expectedErr, err)

		})
	}
}
