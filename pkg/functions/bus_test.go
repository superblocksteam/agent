package functions

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

func TestRoundTrip(t *testing.T) {
	for _, test := range []struct {
		name     string
		err      error
		produce  bool
		request  *apiv1.Function_Request
		response *apiv1.Function_Response
	}{
		{
			name: "happy path",
			request: &apiv1.Function_Request{
				Id: "1",
			},
			response: &apiv1.Function_Response{
				Id: "1",
			},
			produce: true,
		},
		{
			name: "timeout",
			request: &apiv1.Function_Request{
				Id: "1",
			},
			err: context.Canceled,
		},
		{
			name:    "validation error",
			request: &apiv1.Function_Request{},
			err: &sberrors.ValidationError{
				Issues: []error{
					errors.New("id: value length must be at least 1 characters [string.min_len]"),
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx, cancel := context.WithCancel(context.Background())

			requests := make(chan *apiv1.Function_Request, 1)
			responses := make(chan *apiv1.Function_Response)

			defer close(requests)
			defer close(responses)

			bus := NewBus(requests, responses)

			if test.produce {
				defer cancel()
				time.AfterFunc(100*time.Millisecond, func() {
					responses <- test.response
				})
			} else {
				cancel()
			}

			response, err := bus.RoundTrip(ctx, test.request)

			if test.err != nil {
				assert.Error(t, err)
				assert.Equal(t, test.err, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.response, response)
				assert.Equal(t, test.request, <-requests)
			}
		})
	}
}
