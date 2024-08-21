package utils

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"google.golang.org/protobuf/reflect/protoreflect"
)

func TestProtoValidate(t *testing.T) {
	for _, test := range []struct {
		name string
		msg  protoreflect.ProtoMessage
		err  error
	}{
		{
			name: "happy path",
			msg:  &commonv1.Metadata{},
			err: &sberrors.ValidationError{
				Issues: []error{
					errors.New("name: value length must be at least 1 characters [string.min_len]"),
					errors.New("organization: value is empty, which is not a valid UUID [string.uuid_empty]"),
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.err, ProtoValidate(test.msg))
		})
	}
}
