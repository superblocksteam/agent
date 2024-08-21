package executor

import apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"

type Event struct {
	*apiv1.StreamResponse
	err error
}
