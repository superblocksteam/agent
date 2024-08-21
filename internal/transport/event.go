package transport

import (
	"github.com/superblocksteam/agent/pkg/executor"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

func streamResponseProcessor(options *apiv1.ExecuteRequest_Options, fn func(*apiv1.StreamResponse) error) func(*apiv1.StreamResponse) error {
	return func(resp *apiv1.StreamResponse) (err error) {
		err = executor.ExtractErrorFromEvent(resp.GetEvent())
		send := func() {
			if fn == nil {
				return
			}

			if e := fn(resp); e != nil {
				err = e
			}
		}

		switch resp.Event.Event.(type) {
		case *apiv1.Event_Request_, *apiv1.Event_Response_:
			if options.GetIncludeEvents() && options.GetIncludeApiEvents() {
				send()
			}
		case *apiv1.Event_Data_:
			send()
		default:
			if options.GetIncludeEvents() {
				send()
			}
		}

		return
	}
}
