package redis

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/superblocksteam/agent/pkg/plugin"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

func TestBuckets(t *testing.T) {
	for _, test := range []struct {
		name        string
		data        string
		err         bool
		assignments []struct {
			integration plugin.Plugin
			estimate    *uint32
			label       string
		}
	}{
		{
			name: "basic",
			data: `{"analysis":"ba","error":"be","custom":[{"label":"b1","integrations":["javascript","python"],"bound":100},{"label":"b2","integrations":["javascript","python"],"bound":500},{"label":"b3","integrations":["javascript","python"],"bound":3000},{"label":"b4","integrations":["javascript","python"],"bound":4294967295}]}`,
			assignments: []struct {
				integration plugin.Plugin
				estimate    *uint32
				label       string
			}{
				{
					integration: new(apiv1.Step_Javascript),
					estimate:    utils.Pointer[uint32](200),
					label:       "b2",
				},
				{
					integration: new(apiv1.Step_Postgres),
					estimate:    utils.Pointer[uint32](200),
					label:       "ba",
				},
				{
					integration: new(apiv1.Step_Postgres),
					estimate:    utils.Pointer[uint32](math.MaxUint32),
					label:       "be",
				},
				{
					integration: new(apiv1.Step_Postgres),
					estimate:    nil,
					label:       "ba",
				},
				{
					integration: new(apiv1.Step_Python),
					estimate:    utils.Pointer[uint32](99),
					label:       "b1",
				},
				{
					integration: new(apiv1.Step_Python),
					estimate:    utils.Pointer[uint32](200),
					label:       "b2",
				},
				{
					integration: new(apiv1.Step_Python),
					estimate:    utils.Pointer[uint32](2000),
					label:       "b3",
				},
				{
					integration: new(apiv1.Step_Python),
					estimate:    utils.Pointer[uint32](100000000),
					label:       "b4",
				},
			},
		},
		{
			name: "basic",
			data: "not_valid_json",
			err:  true,
		},
		{
			name: "basic",
			data: `{"custom": [{}]}`,
			err:  true,
		},
	} {
		buckets, err := load([]byte(test.data))

		if test.err {
			assert.Error(t, err, test.name)
			continue
		} else {
			assert.NoError(t, err, test.name)
		}

		for _, assignment := range test.assignments {
			assert.Equal(t, assignment.label, buckets.Assign(assignment.integration.Name(), assignment.estimate))
		}
	}
}
