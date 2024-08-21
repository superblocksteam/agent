package v1

import (
	"testing"

	"github.com/stretchr/testify/assert"
	structpb "google.golang.org/protobuf/types/known/structpb"
)

func TestMerge(t *testing.T) {
	for _, test := range []struct {
		name   string
		before *HttpParameters
		other  *HttpParameters
		after  *HttpParameters
	}{
		{
			name: "basic",
			before: &HttpParameters{
				Query: map[string]*structpb.Value{
					"QueryOne": structpb.NewStringValue("QueryOneValue"),
				},
				Body: map[string]*structpb.Value{
					"BodyOne": structpb.NewStringValue("BodyOneValue"),
					"BodyTwo": structpb.NewStringValue("BodyTwoValue"),
				},
			},
			other: &HttpParameters{
				Query: map[string]*structpb.Value{
					"QueryOne": structpb.NewStringValue("QueryOneValue"),
				},
				Body: map[string]*structpb.Value{
					"BodyOne":   structpb.NewStringValue("BodyOneValueUpdated"),
					"BodyThree": structpb.NewStringValue("BodyThreeValue"),
				},
			},
			after: &HttpParameters{
				Query: map[string]*structpb.Value{
					"QueryOne": structpb.NewStringValue("QueryOneValue"),
				},
				Body: map[string]*structpb.Value{
					"BodyOne":   structpb.NewStringValue("BodyOneValueUpdated"),
					"BodyTwo":   structpb.NewStringValue("BodyTwoValue"),
					"BodyThree": structpb.NewStringValue("BodyThreeValue"),
				},
			},
		},
	} {
		test.before.Merge(test.other)
		assert.Equal(t, test.after, test.before)
	}
}
