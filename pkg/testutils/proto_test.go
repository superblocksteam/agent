package testutils

import (
	"testing"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"google.golang.org/protobuf/proto"
)

func Test_ProtoEquals(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name              string
		proto1            proto.Message
		proto2            proto.Message
		expectTestFailure bool
	}{
		{
			name:   "equal",
			proto1: &apiv1.Blocks{},
			proto2: &apiv1.Blocks{},
		},
		{
			name:              "not equal",
			proto1:            &apiv1.Blocks{},
			proto2:            &apiv1.Blocks{Blocks: []*apiv1.Block{{Name: "foo"}}},
			expectTestFailure: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ProtoEquals(newFakeTB(t, test.expectTestFailure), test.proto1, test.proto2)
		})
	}
}
