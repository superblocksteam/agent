package functions

import (
	"context"

	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

type bus struct {
	requests  chan<- *apiv1.Function_Request
	responses <-chan *apiv1.Function_Response
	router    utils.Map[chan<- *apiv1.Function_Response]
}

//go:generate mockery --name=Bus --output ./mocks --filename bus.go --outpkg functions --structname Bus
type Bus interface {
	RoundTrip(context.Context, *apiv1.Function_Request) (*apiv1.Function_Response, error)
}

func NewBus(requests chan<- *apiv1.Function_Request, responses <-chan *apiv1.Function_Response) Bus {
	bus := &bus{
		requests:  requests,
		responses: responses,
		router:    utils.NewMap[chan<- *apiv1.Function_Response](),
	}

	go func() {
		for response := range bus.responses {
			go bus.receive(response)
		}
	}()

	return bus
}

func (b *bus) RoundTrip(ctx context.Context, request *apiv1.Function_Request) (*apiv1.Function_Response, error) {
	if err := utils.ProtoValidate(request); err != nil {
		return nil, err
	}

	response := make(chan *apiv1.Function_Response)
	defer close(response)

	b.router.Put(request.Id, response)
	defer b.router.Del(request.Id)

	b.requests <- request

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-response:
		if err := utils.ProtoValidate(res); err != nil {
			return nil, err
		}

		return res, nil
	}
}

func (b *bus) receive(response *apiv1.Function_Response) {
	if ch, ok := b.router.Get(response.Id); ok {
		ch <- response
	}
}
