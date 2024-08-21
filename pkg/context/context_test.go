package context

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/internal/metrics"
	"google.golang.org/protobuf/types/known/structpb"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

func TestScoping(t *testing.T) {
	metrics.RegisterMetrics()
	t.Parallel()

	for _, test := range []struct {
		name              string
		rootVariables     map[string]*transportv1.Variable
		childOneVariables map[string]*transportv1.Variable
		childTwoVariables map[string]*transportv1.Variable
	}{
		{
			name: "simple",
			rootVariables: map[string]*transportv1.Variable{
				"ONE": {
					Key: "ONE.REF",
				},
			},
			childOneVariables: map[string]*transportv1.Variable{
				"CHILD.ONE": {
					Key: "CHILD.ONE.REF",
				},
			},
			childTwoVariables: map[string]*transportv1.Variable{
				"CHILD.TWO": {
					Key: "CHILD.TWO.REF",
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			root := New(&Context{})
			root = root.WithVariables(test.rootVariables)

			child1 := root.Sink("").WithVariables(test.childOneVariables)
			child2 := root.Sink("").WithVariables(test.childTwoVariables)

			assert.NotEqual(t, fmt.Sprintf("%p\n", &child1.Variables), fmt.Sprintf("%p\n", &child2.Variables), test.name)
			assert.Equal(t, root.Variables.Size(), len(test.rootVariables), test.name)

			for k := range test.childOneVariables {
				_, ok := child2.Variables.Get(k)
				assert.False(t, ok, test.name)
			}

			for k := range test.childTwoVariables {
				_, ok := child1.Variables.Get(k)
				assert.False(t, ok, test.name)
			}

			for k := range test.rootVariables {
				_, oneOK := child1.Variables.Get(k)
				_, twoOK := child2.Variables.Get(k)

				assert.True(t, oneOK, test.name)
				assert.True(t, twoOK, test.name)
			}
		})
	}
}

func TestSink(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name   string
		before *Context
		after  *Context
		extra  string
	}{
		{
			name: "basic",
			before: &Context{
				Parent: "old_parent",
				Name:   "new_parent",
				Type:   apiv1.BlockType_BLOCK_TYPE_STREAM,
			},
			after: &Context{
				Parent:               "new_parent",
				lineage:              []string{"new_parent"},
				parents:              []string{"ROOT", "new_parent"},
				resolved:             map[string]map[string]*apiv1.Resolved{},
				isDescendantOfStream: true,
				Type:                 apiv1.BlockType_BLOCK_TYPE_STREAM,
				ParentType:           apiv1.BlockType_BLOCK_TYPE_STREAM,
				RequestOptions:       &apiv1.ExecuteRequest_Options{},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			after := New(test.before).Sink(test.extra)
			after.mutex = nil
			after.Variables = nil
			after.Parallels = nil

			assert.Equal(t, test.after, after, test.name)
		})
	}
}

func TestIsDescendantOfStream(t *testing.T) {
	// Simulating a stream block, then exiting out of it into some other block type
	ctx := New(&Context{
		Parent: "old_parent",
		Name:   "new_parent",
		Type:   apiv1.BlockType_BLOCK_TYPE_STREAM,
	})

	assert.True(t, ctx.IsDescendantOfStream())
	child := ctx.Sink("new_child")
	childChild := ctx.Sink("child_of_child")
	assert.True(t, child.IsDescendantOfStream())
	assert.True(t, childChild.IsDescendantOfStream())

	nextCtx := ctx.Advance("next")
	nextCtx.Merge(&Context{
		Parent: "new_parent",
	})
	assert.False(t, nextCtx.IsDescendantOfStream())
}

func TestAdvance(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name   string
		before *Context
		after  *Context
	}{
		{
			name: "basic",
			before: &Context{
				Execution: "ABCD-1234",
				Name:      "new_parent",
			},
			after: &Context{
				Execution:      "ABCD-1234",
				Name:           "basic",
				parents:        []string{"ROOT"},
				blockPath:      []string{"basic"},
				resolved:       map[string]map[string]*apiv1.Resolved{},
				RequestOptions: &apiv1.ExecuteRequest_Options{},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			after := New(test.before).Advance(test.name)
			after.mutex = nil
			after.Variables = nil
			after.Parallels = nil

			assert.Equal(t, test.after, after, test.name)
		})
	}
}

func TestReferencedVariables(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name         string
		variables    map[string]*transportv1.Variable
		actionConfig map[string]any
		expected     map[string]*transportv1.Variable
	}{
		{
			name: "partial",
			variables: map[string]*transportv1.Variable{
				"FFIE": {
					Key: "faraday-future",
				},
				"NKLA": {
					Key: "nicola",
				},
			},
			actionConfig: map[string]any{
				"body": "return FFIE",
			},
			expected: map[string]*transportv1.Variable{"FFIE": {Key: "faraday-future"}},
		},
		{
			name: "all",
			variables: map[string]*transportv1.Variable{
				"FFIE": {
					Key: "faraday-future",
				},
				"NKLA": {
					Key: "nicola",
				},
			},
			actionConfig: map[string]any{
				"body": "return FFIE+NKLA",
			},
			expected: map[string]*transportv1.Variable{
				"FFIE": {
					Key: "faraday-future",
				},
				"NKLA": {
					Key: "nicola",
				}},
		},
		{
			name: "none",
			variables: map[string]*transportv1.Variable{
				"FFIE": {
					Key: "faraday-future",
				},
				"NKLA": {
					Key: "nicola",
				},
			},
			actionConfig: map[string]any{
				"body": "return RIVN",
			},
			expected: map[string]*transportv1.Variable{},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx := New(&Context{})
			ctx = ctx.WithVariables(test.variables)
			actionCfgStruct, _ := structpb.NewStruct(test.actionConfig)
			actionCfgStr := actionCfgStruct.String()
			referenced := ctx.ReferencedVariables(actionCfgStr)

			assert.Equal(t, test.expected, referenced)
		})
	}
}
