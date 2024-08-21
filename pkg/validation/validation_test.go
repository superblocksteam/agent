package validation

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

func TestUniqueBlockNames(t *testing.T) {
	for _, test := range []struct {
		name   string
		api    *apiv1.Api
		errors []error
	}{
		{
			name: "basic",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Name: "foo",
					},
					{
						Name: "foo",
					},
					{
						Name: "bar",
					},
					{
						Name: "bar",
					},
					{
						Name: "car",
					},
				},
			},
			errors: []error{
				errors.New("Block name foo is used 2 times. Block names must be unique."),
				errors.New("Block name bar is used 2 times. Block names must be unique."),
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.ElementsMatch(t, test.errors, Validate(test.api))
		})
	}
}
