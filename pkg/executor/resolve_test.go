package executor

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	mockflags "github.com/superblocksteam/agent/internal/flags/mock"
	"github.com/superblocksteam/agent/internal/metrics"
	"go.uber.org/zap"

	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	mocker "github.com/superblocksteam/agent/pkg/mocker/mocks"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/store/gc"
	"github.com/superblocksteam/agent/pkg/template/plugins/mustache"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/worker"
	wops "github.com/superblocksteam/agent/pkg/worker/options"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	javascriptv1 "github.com/superblocksteam/agent/types/gen/go/plugins/javascript/v1"
	s3v1 "github.com/superblocksteam/agent/types/gen/go/plugins/s3/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

func init() {
	_ = metrics.SetupForTesting()
}

func TestVariables(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name   string
		blocks []*apiv1.Block
		err    bool
		events []string
		data   map[string]any
	}{
		{
			name: "basic",
			blocks: []*apiv1.Block{
				{
					Name: "VARIABLES",
					Config: &apiv1.Block_Variables{
						Variables: &apiv1.Variables{
							Items: []*apiv1.Variables_Config{
								{
									Key:   "ONE",
									Value: "{{ 'foo' === 'bar' }}",
									Type:  apiv1.Variables_TYPE_SIMPLE,
									Mode:  apiv1.Variables_MODE_READWRITE,
								},
								{
									Key:   "TWO",
									Value: "{{ (() => 5)() }}",
									Type:  apiv1.Variables_TYPE_ADVANCED,
									Mode:  apiv1.Variables_MODE_READWRITE,
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] VARIABLES",
				"[FINISH] VARIABLES",
			},
			data: map[string]any{
				"VARIABLE.T05F": "false",
				"VARIABLE.VFdP": "5",
			},
		},
		{
			name: "reference variable within same block",
			blocks: []*apiv1.Block{
				{
					Name: "VARIABLES",
					Config: &apiv1.Block_Variables{
						Variables: &apiv1.Variables{
							Items: []*apiv1.Variables_Config{
								{
									Key:   "ONE",
									Value: "{{ 'foo' === 'bar' }}",
									Type:  apiv1.Variables_TYPE_SIMPLE,
									Mode:  apiv1.Variables_MODE_READWRITE,
								},
								{
									Key:   "TWO",
									Value: "{{ ONE.value }}",
									Type:  apiv1.Variables_TYPE_SIMPLE,
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] VARIABLES",
				"[FINISH] VARIABLES",
			},
			data: map[string]any{
				"VARIABLE.T05F": "false",
				"VARIABLE.VFdP": "false",
			},
		},
		{
			name: "scope",
			blocks: []*apiv1.Block{
				{
					Name: "FIRST",
					Config: &apiv1.Block_Variables{
						Variables: &apiv1.Variables{
							Items: []*apiv1.Variables_Config{
								{
									Key:   "ONE",
									Value: "{{ 'foo' === 'bar' }}",
									Type:  apiv1.Variables_TYPE_SIMPLE,
									Mode:  apiv1.Variables_MODE_READWRITE,
								},
								{
									Key:   "TWO",
									Value: "{{ (() => 5)() }}",
									Type:  apiv1.Variables_TYPE_ADVANCED,
									Mode:  apiv1.Variables_MODE_READWRITE,
								},
							},
						},
					},
				},
				{
					Name: "SECOND",
					Config: &apiv1.Block_Variables{
						Variables: &apiv1.Variables{
							Items: []*apiv1.Variables_Config{
								{
									Key:   "THREE",
									Value: "{{ ONE.value || (await TWO.get() > 1) }}",
									Type:  apiv1.Variables_TYPE_SIMPLE,
								},
								{
									Key:   "FOUR",
									Value: "{{ `${ONE.value}` }}",
									Type:  apiv1.Variables_TYPE_ADVANCED,
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] FIRST",
				"[FINISH] FIRST",
				"[START] SECOND",
				"[FINISH] SECOND",
			},
			data: map[string]any{
				"VARIABLE.T05F":     "false",
				"VARIABLE.VFdP":     "5",
				"VARIABLE.VEhSRUU=": "true",
				"VARIABLE.Rk9VUg==": `"false"`,
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			wg := &sync.WaitGroup{}
			events, dump := _events()
			memory := store.Mock(func(prefix, value string) (string, error) {
				return fmt.Sprintf("%s.%s", prefix, base64.StdEncoding.EncodeToString([]byte(value))), nil
			})

			wg.Add(1)

			go func() {
				defer wg.Done()

				ctx, cancel := context.WithCancelCause(context.Background())

				createSandboxFunc := func() engine.Sandbox {
					return javascript.Sandbox(ctx, &javascript.Options{
						Logger: zap.NewNop(),
						Store:  memory,
					})
				}

				flags := new(mockflags.Flags)
				flags.On("GetStepDurationV2", mock.Anything, mock.Anything).Return(10000, nil)
				flags.On("GetStepSizeV2", mock.Anything, mock.Anything).Return(10000, nil)

				mocker := new(mocker.Mocker)
				mocker.On("Handle", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, false, nil)

				_, _, err := (&resolver{
					wg:                wg,
					ctx:               ctx,
					cancel:            cancel,
					flags:             flags,
					logger:            zap.NewNop(),
					key:               utils.NewMap[string](),
					variables:         gc.New(&gc.Options{Store: store.Memory()}),
					store:             memory,
					execution:         "ABCD-1234",
					createSandboxFunc: createSandboxFunc,
					manager: &manager{
						mutex:   sync.RWMutex{},
						exiters: map[string](chan *exit){},
					},
					rootStartTime:  time.Now(),
					timeout:        time.Second * 10,
					templatePlugin: mustache.Instance,
					Events:         events,
					Options: &Options{
						Mocker: mocker,
					},
				}).blocks(apictx.New(&apictx.Context{
					Execution: "ABCD-1234",
					Name:      "ROOT",
					Context:   ctx,
				}), test.blocks)

				if test.err {
					assert.Error(t, err, test.name)
				} else {
					assert.NoError(t, err, test.name)
				}
			}()

			wg.Wait()

			assert.Equal(t, test.events, dump(), test.name)

			for k, v := range test.data {
				values, err := memory.Read(context.Background(), k)
				assert.NoError(t, err, test.name)
				assert.NotNil(t, values, test.name)
				assert.Equal(t, 1, len(values), test.name)
				assert.Equal(t, v, values[0])
			}
		})
	}
}

func TestBlocks(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	code := "return 5;"
	step := &apiv1.Block_Step{
		Step: &apiv1.Step{
			Config: &apiv1.Step_Javascript{
				Javascript: &javascriptv1.Plugin{
					Body: code,
				},
			},
		},
	}

	for _, test := range []struct {
		name      string
		blocks    []*apiv1.Block
		err       bool
		events    []string
		executed  []string
		unordered bool
		last      string
		variables map[string]any
		key       func(string, string) (string, error)
	}{
		{
			name: "variables",
			blocks: []*apiv1.Block{
				{
					Name: "VARIABLES_BLOCK_OUTER",
					Config: &apiv1.Block_Variables{
						Variables: &apiv1.Variables{
							Items: []*apiv1.Variables_Config{
								{
									Key:   "ONE",
									Value: "{{ 'foo' === 'bar' }}",
									Type:  apiv1.Variables_TYPE_ADVANCED,
								},
								{
									Key:   "TWO",
									Value: "{{ (() => 5)() }}",
									Type:  apiv1.Variables_TYPE_ADVANCED,
								},
								{
									Key:   "THREE",
									Value: "{{ (() => ({ huntsman: 'suits', turnbullAndAsser: 'shirts' }))() }}",
									Type:  apiv1.Variables_TYPE_ADVANCED,
								},
								{
									Key:   "FOUR",
									Value: "{{ { foo: 5 } }}",
									Type:  apiv1.Variables_TYPE_ADVANCED,
								},
							},
						},
					},
				},
				{
					Name: "COND_BLOCK_WITH_VAR",
					Config: &apiv1.Block_Conditional_{
						Conditional: &apiv1.Block_Conditional{
							If: &apiv1.Block_Conditional_Condition{
								Condition: "{{ !(await ONE.get()) && await TWO.get() === 5 && (await THREE.get()).huntsman === 'suits' && (await FOUR.get()).foo === 5 }}",
								Blocks: []*apiv1.Block{
									{
										Name: "VARIABLES_BLOCK_INNER",
										Config: &apiv1.Block_Variables{
											Variables: &apiv1.Variables{
												Items: []*apiv1.Variables_Config{
													{
														Key:   "FOUR",
														Value: "{{ { foo: (await FOUR.get()).foo + 1 } }}",
														Type:  apiv1.Variables_TYPE_ADVANCED,
													},
													{
														Key:   "FIVE",
														Value: "{{ { frank: 'greco' } }}",
														Type:  apiv1.Variables_TYPE_ADVANCED,
													},
												},
											},
										},
									},
									{
										Name: "INNER_COND_BLOCK_WITH_VAR",
										Config: &apiv1.Block_Conditional_{
											Conditional: &apiv1.Block_Conditional{
												If: &apiv1.Block_Conditional_Condition{
													Condition: "{{ (await FIVE.get()).frank === 'greco' && !(await ONE.get()) && await TWO.get() === 5 && (await THREE.get()).huntsman === 'suits' && (await FOUR.get()).foo === 6 }}",
													Blocks: []*apiv1.Block{
														{
															Name:   "BlockOne",
															Config: step,
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			key: func(prefix, value string) (string, error) {
				return fmt.Sprintf("%s.%s", prefix, base64.StdEncoding.EncodeToString([]byte(value))), nil
			},
			events: []string{
				"[START] VARIABLES_BLOCK_OUTER",
				"[FINISH] VARIABLES_BLOCK_OUTER",
				"[START] COND_BLOCK_WITH_VAR",
				"[START] VARIABLES_BLOCK_INNER",
				"[FINISH] VARIABLES_BLOCK_INNER",
				"[START] INNER_COND_BLOCK_WITH_VAR",
				"[START] BlockOne",
				"[FINISH] BlockOne",
				"[FINISH] INNER_COND_BLOCK_WITH_VAR",
				"[FINISH] COND_BLOCK_WITH_VAR",
			},
			executed: []string{
				"BlockOne",
			},
			variables: map[string]any{
				"VARIABLE.T05F":     "false",
				"VARIABLE.VFdP":     "5",
				"VARIABLE.VEhSRUU=": `{"huntsman":"suits","turnbullAndAsser":"shirts"}`,
				"VARIABLE.Rk9VUg==": `{"foo":6}`,
				"VARIABLE.RklWRQ==": `{"frank":"greco"}`,
			},
			last: "COND_BLOCK_WITH_VAR",
		},
		{
			name: "sync_cancel",
			blocks: []*apiv1.Block{
				{
					Name:   "TestStepERROR",
					Config: step,
				},
				{
					Name:   "TestStep",
					Config: step,
				},
			},
			events: []string{
				"[START] TestStepERROR",
				"[FINISH] TestStepERROR",
			},
			executed: []string{
				"TestStepERROR",
			},
			err: true,
		},
		{
			name: "step_basic",
			blocks: []*apiv1.Block{
				{
					Name:   "TestStep",
					Config: step,
				},
			},
			events: []string{
				"[START] TestStep",
				"[FINISH] TestStep",
			},
			executed: []string{
				"TestStep",
			},
			last: "TestStep",
		},
		{
			name: "break",
			blocks: []*apiv1.Block{
				{
					Name: "Loop",
					Config: &apiv1.Block_Loop_{
						Loop: &apiv1.Block_Loop{
							Variables: &apiv1.Block_Loop_Variables{
								Index: "idx",
							},
							Type:  apiv1.Block_Loop_TYPE_FOR,
							Range: "{{ 5 }}",
							Blocks: []*apiv1.Block{
								{
									Name: "Break",
									Config: &apiv1.Block_Break_{
										Break: &apiv1.Block_Break{
											Condition: "{{ idx.value === 2 }}",
										},
									},
								},
								{
									Name:   "Step",
									Config: step,
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] Loop",
				"[START] Break",
				"[FINISH] Break",
				"[START] Step",
				"[FINISH] Step",
				"[START] Break",
				"[FINISH] Break",
				"[START] Step",
				"[FINISH] Step",
				"[START] Break",
				"[FINISH] Break",
				"[FINISH] Loop",
			},
			executed: []string{
				"Step",
				"Step",
			},
			last: "Loop",
		},
		{
			name: "throw_trycatch",
			blocks: []*apiv1.Block{
				{
					Name: "TestTryCatch",
					Config: &apiv1.Block_TryCatch_{
						TryCatch: &apiv1.Block_TryCatch{
							Variables: &apiv1.Block_TryCatch_Variables{
								Error: "err",
							},
							Try: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name: "BlockTryERROR",
										Config: &apiv1.Block_Throw_{
											Throw: &apiv1.Block_Throw{
												Error: "{{ 'this is the error' }}",
											},
										},
									},
								},
							},
							Catch: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name: "TestConditional",
										Config: &apiv1.Block_Conditional_{
											Conditional: &apiv1.Block_Conditional{
												If: &apiv1.Block_Conditional_Condition{
													Condition: `{{ err.value === "this is the error" }}`,
													Blocks: []*apiv1.Block{
														{
															Name:   "BlockOne",
															Config: step,
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestTryCatch",
				"[START] BlockTryERROR",
				"[FINISH] BlockTryERROR",
				"[START] TestConditional",
				"[START] BlockOne",
				"[FINISH] BlockOne",
				"[FINISH] TestConditional",
				"[FINISH] TestTryCatch",
			},
			executed: []string{
				"BlockOne",
			},
			last: "TestTryCatch",
		},
		{
			name: "conditional_if",
			blocks: []*apiv1.Block{
				{
					Name: "TestConditional",
					Config: &apiv1.Block_Conditional_{
						Conditional: &apiv1.Block_Conditional{
							If: &apiv1.Block_Conditional_Condition{
								Condition: "{{ true }}",
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockOne",
										Config: step,
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestConditional",
				"[START] BlockOne",
				"[FINISH] BlockOne",
				"[FINISH] TestConditional",
			},
			executed: []string{
				"BlockOne",
			},
			last: "TestConditional",
		},
		{
			name: "conditional_no_blocks_in_selected_branch",
			blocks: []*apiv1.Block{
				{
					Name: "TestConditional",
					Config: &apiv1.Block_Conditional_{
						Conditional: &apiv1.Block_Conditional{
							If: &apiv1.Block_Conditional_Condition{
								Condition: "{{ true }}",
								Blocks:    []*apiv1.Block{},
							},
							Else: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockOne",
										Config: step,
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestConditional",
				"[FINISH] TestConditional",
			},
			executed: []string{},
			last:     "TestConditional",
		},
		{
			name: "conditional_else",
			blocks: []*apiv1.Block{
				{
					Name: "TestConditional",
					Config: &apiv1.Block_Conditional_{
						Conditional: &apiv1.Block_Conditional{
							If: &apiv1.Block_Conditional_Condition{
								Condition: "{{ false }}",
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockOne",
										Config: step,
									},
								},
							},
							Else: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockTwo",
										Config: step,
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestConditional",
				"[START] BlockTwo",
				"[FINISH] BlockTwo",
				"[FINISH] TestConditional",
			},
			executed: []string{
				"BlockTwo",
			},
			last: "TestConditional",
		},
		{
			name: "conditional_elseif",
			blocks: []*apiv1.Block{
				{
					Name: "TestConditional",
					Config: &apiv1.Block_Conditional_{
						Conditional: &apiv1.Block_Conditional{
							If: &apiv1.Block_Conditional_Condition{
								Condition: "{{ false }}",
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockOne",
										Config: step,
									},
								},
							},
							ElseIf: []*apiv1.Block_Conditional_Condition{
								{
									Condition: "{{ true }}",
									Blocks: []*apiv1.Block{
										{
											Name:   "BlockTwo",
											Config: step,
										},
										{
											Name:   "BlockThree",
											Config: step,
										},
									},
								},
								{
									Condition: "{{ (() => 1 === 1)() }}",
									Blocks: []*apiv1.Block{
										{
											Name:   "BlockFour",
											Config: step,
										},
										{
											Name:   "BlockFive",
											Config: step,
										},
									},
								},
							},
							Else: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockSix",
										Config: step,
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestConditional",
				"[START] BlockTwo",
				"[FINISH] BlockTwo",
				"[START] BlockThree",
				"[FINISH] BlockThree",
				"[FINISH] TestConditional",
			},
			executed: []string{
				"BlockTwo",
				"BlockThree",
			},
			last: "TestConditional",
		},
		{
			name: "conditional_elseif_truthy_falsy",
			blocks: []*apiv1.Block{
				{
					Name: "TestConditional",
					Config: &apiv1.Block_Conditional_{
						Conditional: &apiv1.Block_Conditional{
							If: &apiv1.Block_Conditional_Condition{
								Condition: "{{ NaN }}",
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockOne",
										Config: step,
									},
								},
							},
							ElseIf: []*apiv1.Block_Conditional_Condition{
								{
									Condition: "{{ 5 }}",
									Blocks: []*apiv1.Block{
										{
											Name:   "BlockTwo",
											Config: step,
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestConditional",
				"[START] BlockTwo",
				"[FINISH] BlockTwo",
				"[FINISH] TestConditional",
			},
			executed: []string{
				"BlockTwo",
			},
			last: "TestConditional",
		},
		{
			name: "loop_twice",
			blocks: []*apiv1.Block{
				{
					Name: "TestLoop",
					Config: &apiv1.Block_Loop_{
						Loop: &apiv1.Block_Loop{
							Type:  apiv1.Block_Loop_TYPE_FOR,
							Range: "{{ (() => 1 + 1)() }}",
							Blocks: []*apiv1.Block{
								{
									Name:   "BlockOne",
									Config: step,
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestLoop",
				"[START] BlockOne",
				"[FINISH] BlockOne",
				"[START] BlockOne",
				"[FINISH] BlockOne",
				"[FINISH] TestLoop",
			},
			executed: []string{
				"BlockOne",
				"BlockOne",
			},
			last: "TestLoop",
		},
		{
			name: "loop_index_variable",
			blocks: []*apiv1.Block{
				{
					Name: "TestLoop",
					Config: &apiv1.Block_Loop_{
						Loop: &apiv1.Block_Loop{
							Variables: &apiv1.Block_Loop_Variables{
								Index: "idx",
								Item:  "item",
							},
							Type:  apiv1.Block_Loop_TYPE_FOREACH,
							Range: "{{ [{foo:1}, {foo:2}, {foo:3}, {foo:4}, {foo:5}] }}",
							Blocks: []*apiv1.Block{
								{
									Name: "TestCond",
									Config: &apiv1.Block_Conditional_{
										Conditional: &apiv1.Block_Conditional{
											If: &apiv1.Block_Conditional_Condition{
												Condition: "{{ idx.value === 4 || item.value.foo === 1 }}",
												Blocks: []*apiv1.Block{
													{
														Name:   "OnlyOnce",
														Config: step,
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestLoop",
				"[START] TestCond",
				"[START] OnlyOnce",
				"[FINISH] OnlyOnce",
				"[FINISH] TestCond",
				"[START] TestCond",
				"[FINISH] TestCond",
				"[START] TestCond",
				"[FINISH] TestCond",
				"[START] TestCond",
				"[FINISH] TestCond",
				"[START] TestCond",
				"[START] OnlyOnce",
				"[FINISH] OnlyOnce",
				"[FINISH] TestCond",
				"[FINISH] TestLoop",
			},
			executed: []string{
				"OnlyOnce",
				"OnlyOnce",
			},
			last: "TestLoop",
		},
		{
			name: "loop_for_each",
			blocks: []*apiv1.Block{
				{
					Name: "TestLoop",
					Config: &apiv1.Block_Loop_{
						Loop: &apiv1.Block_Loop{
							Variables: &apiv1.Block_Loop_Variables{
								Index: "idx",
								Item:  "item",
							},
							Type:  apiv1.Block_Loop_TYPE_FOREACH,
							Range: "{{ 'a,b,c'.split(',') }}",
							Blocks: []*apiv1.Block{
								{
									Name:   "TestStep",
									Config: step,
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestLoop",
				"[START] TestStep",
				"[FINISH] TestStep",
				"[START] TestStep",
				"[FINISH] TestStep",
				"[START] TestStep",
				"[FINISH] TestStep",
				"[FINISH] TestLoop",
			},
			executed: []string{
				"TestStep",
				"TestStep",
				"TestStep",
			},
			last: "TestLoop",
		},
		{
			name: "loop_none",
			blocks: []*apiv1.Block{
				{
					Name: "TestLoop",
					Config: &apiv1.Block_Loop_{
						Loop: &apiv1.Block_Loop{
							Type:  apiv1.Block_Loop_TYPE_FOR,
							Range: "{{ (() => 1 - 1)() }}",
							Blocks: []*apiv1.Block{
								{
									Name:   "BlockOne",
									Config: step,
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestLoop",
				"[FINISH] TestLoop",
			},
			executed: []string{},
			last:     "TestLoop",
		},
		{
			name: "loop_once",
			blocks: []*apiv1.Block{
				{
					Name: "TestLoop",
					Config: &apiv1.Block_Loop_{
						Loop: &apiv1.Block_Loop{
							Type:  apiv1.Block_Loop_TYPE_FOR,
							Range: "{{ (() => 1)() }}",
							Blocks: []*apiv1.Block{
								{
									Name:   "BlockOne",
									Config: step,
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestLoop",
				"[START] BlockOne",
				"[FINISH] BlockOne",
				"[FINISH] TestLoop",
			},
			executed: []string{
				"BlockOne",
			},
			last: "TestLoop",
		},
		{
			name: "while_loop_forever_break",
			blocks: []*apiv1.Block{
				{
					Name: "PromiseMeYouWillExit",
					Config: &apiv1.Block_Loop_{
						Loop: &apiv1.Block_Loop{
							Type:  apiv1.Block_Loop_TYPE_WHILE,
							Range: "{{ (() => !('this' === 'that'))() }}",
							Variables: &apiv1.Block_Loop_Variables{
								Index: "idx",
							},
							Blocks: []*apiv1.Block{
								{
									Name: "ShouldWeExit",
									Config: &apiv1.Block_Break_{
										Break: &apiv1.Block_Break{
											Condition: "{{ idx.value === 2 }}",
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] PromiseMeYouWillExit",
				"[START] ShouldWeExit",
				"[FINISH] ShouldWeExit",
				"[START] ShouldWeExit",
				"[FINISH] ShouldWeExit",
				"[START] ShouldWeExit",
				"[FINISH] ShouldWeExit",
				"[FINISH] PromiseMeYouWillExit",
			},
			executed: []string{},
			last:     "PromiseMeYouWillExit",
		},
		{
			name: "while_loop_forever_break_truthy_falsy",
			blocks: []*apiv1.Block{
				{
					Name: "PromiseMeYouWillExit",
					Config: &apiv1.Block_Loop_{
						Loop: &apiv1.Block_Loop{
							Type:  apiv1.Block_Loop_TYPE_WHILE,
							Range: "{{ '21, can you do something for me?' }}",
							Variables: &apiv1.Block_Loop_Variables{
								Index: "idx",
							},
							Blocks: []*apiv1.Block{
								{
									Name: "ShouldWeExit",
									Config: &apiv1.Block_Break_{
										Break: &apiv1.Block_Break{
											Condition: "{{ idx.value === 2 }}",
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] PromiseMeYouWillExit",
				"[START] ShouldWeExit",
				"[FINISH] ShouldWeExit",
				"[START] ShouldWeExit",
				"[FINISH] ShouldWeExit",
				"[START] ShouldWeExit",
				"[FINISH] ShouldWeExit",
				"[FINISH] PromiseMeYouWillExit",
			},
			executed: []string{},
			last:     "PromiseMeYouWillExit",
		},
		{
			name: "while_loop_condition",
			blocks: []*apiv1.Block{
				{
					Name: "set_one",
					Config: &apiv1.Block_Variables{
						Variables: &apiv1.Variables{
							Items: []*apiv1.Variables_Config{
								{
									Key:   "ONE",
									Value: "{{ true }}",
									Type:  apiv1.Variables_TYPE_SIMPLE,
									Mode:  apiv1.Variables_MODE_READWRITE,
								},
							},
						},
					},
				},
				{
					Name: "LoopMe",
					Config: &apiv1.Block_Loop_{
						Loop: &apiv1.Block_Loop{
							Type:  apiv1.Block_Loop_TYPE_WHILE,
							Range: "{{ ONE.value }}",
							Blocks: []*apiv1.Block{
								{
									Name: "ExecuteStep",
									Config: &apiv1.Block_Step{
										Step: &apiv1.Step{
											Config: &apiv1.Step_S3{
												S3: &s3v1.Plugin{
													Body: "{{ ONE.set(false) }}",
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] set_one",
				"[FINISH] set_one",
				"[START] LoopMe",
				"[START] ExecuteStep",
				"[FINISH] ExecuteStep",
				"[FINISH] LoopMe",
			},
			executed: []string{"ExecuteStep"},
			last:     "LoopMe",
		},
		{
			name: "trycatch_catch",
			blocks: []*apiv1.Block{
				{
					Name: "TestTryCatch",
					Config: &apiv1.Block_TryCatch_{
						TryCatch: &apiv1.Block_TryCatch{
							Variables: &apiv1.Block_TryCatch_Variables{
								Error: "err",
							},
							Try: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockTryERROR",
										Config: step,
									},
								},
							},
							Catch: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name: "TestConditional",
										Config: &apiv1.Block_Conditional_{
											Conditional: &apiv1.Block_Conditional{
												If: &apiv1.Block_Conditional_Condition{
													Condition: `{{ err.value === "BlockTryERROR" }}`,
													Blocks: []*apiv1.Block{
														{
															Name:   "BlockOne",
															Config: step,
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestTryCatch",
				"[START] BlockTryERROR",
				"[FINISH] BlockTryERROR",
				"[START] TestConditional",
				"[START] BlockOne",
				"[FINISH] BlockOne",
				"[FINISH] TestConditional",
				"[FINISH] TestTryCatch",
			},
			executed: []string{
				"BlockTryERROR",
				"BlockOne",
			},
			last: "TestTryCatch",
		},
		{
			name: "trycatch_empty_catch",
			blocks: []*apiv1.Block{
				{
					Name: "TestTryCatch",
					Config: &apiv1.Block_TryCatch_{
						TryCatch: &apiv1.Block_TryCatch{
							Try: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name: "BlockTryERROR",
										Config: &apiv1.Block_Throw_{
											Throw: &apiv1.Block_Throw{
												Error: "{{ 'this is the error' }}",
											},
										},
									},
								},
							},
							Catch: &apiv1.Blocks{
								Blocks: []*apiv1.Block{},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestTryCatch",
				"[START] BlockTryERROR",
				"[FINISH] BlockTryERROR",
				"[FINISH] TestTryCatch",
			},
			executed: []string{},
			last:     "TestTryCatch",
		},
		{
			name: "trycatch_catch_finally",
			blocks: []*apiv1.Block{
				{
					Name: "TestTryCatch",
					Config: &apiv1.Block_TryCatch_{
						TryCatch: &apiv1.Block_TryCatch{
							Try: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockTryERROR",
										Config: step,
									},
								},
							},
							Catch: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockCatch",
										Config: step,
									},
								},
							},
							Finally: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockFinally",
										Config: step,
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestTryCatch",
				"[START] BlockTryERROR",
				"[FINISH] BlockTryERROR",
				"[START] BlockCatch",
				"[FINISH] BlockCatch",
				"[START] BlockFinally",
				"[FINISH] BlockFinally",
				"[FINISH] TestTryCatch",
			},
			executed: []string{
				"BlockTryERROR",
				"BlockCatch",
				"BlockFinally",
			},
			last: "TestTryCatch",
		},
		{
			name: "trycatch_catch_finally_no_error",
			blocks: []*apiv1.Block{
				{
					Name: "TestTryCatch",
					Config: &apiv1.Block_TryCatch_{
						TryCatch: &apiv1.Block_TryCatch{
							Try: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockTry",
										Config: step,
									},
								},
							},
							Catch: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockCatch",
										Config: step,
									},
								},
							},
							Finally: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "BlockFinally",
										Config: step,
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestTryCatch",
				"[START] BlockTry",
				"[FINISH] BlockTry",
				"[START] BlockFinally",
				"[FINISH] BlockFinally",
				"[FINISH] TestTryCatch",
			},
			executed: []string{
				"BlockTry",
				"BlockFinally",
			},
			last: "TestTryCatch",
		},
		{
			name: "parallel_basic",
			blocks: []*apiv1.Block{
				{
					Name: "TestParallel",
					Config: &apiv1.Block_Parallel_{
						Parallel: &apiv1.Block_Parallel{
							Wait: apiv1.Block_Parallel_WAIT_ALL,
							Config: &apiv1.Block_Parallel_Static_{
								Static: &apiv1.Block_Parallel_Static{
									Paths: map[string]*apiv1.Blocks{
										"PathOne": {
											Blocks: []*apiv1.Block{
												{
													Name:   "BlockStep",
													Config: step,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestParallel",
				"[START] BlockStep",
				"[FINISH] BlockStep",
				"[FINISH] TestParallel",
			},
			executed: []string{
				"BlockStep",
			},
			last: "TestParallel",
		},
		{
			name: "parallel_basic_0_paths",
			blocks: []*apiv1.Block{
				{
					Name: "TestParallel",
					Config: &apiv1.Block_Parallel_{
						Parallel: &apiv1.Block_Parallel{
							Wait: apiv1.Block_Parallel_WAIT_ALL,
							Config: &apiv1.Block_Parallel_Static_{
								Static: &apiv1.Block_Parallel_Static{
									Paths: map[string]*apiv1.Blocks{},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestParallel",
				"[FINISH] TestParallel",
			},
			executed: []string{},
			last:     "TestParallel",
		},
		{
			name: "parallel_dynamic",
			blocks: []*apiv1.Block{
				{
					Name: "TestParallel",
					Config: &apiv1.Block_Parallel_{
						Parallel: &apiv1.Block_Parallel{
							Wait: apiv1.Block_Parallel_WAIT_ALL,
							Config: &apiv1.Block_Parallel_Dynamic_{
								Dynamic: &apiv1.Block_Parallel_Dynamic{
									Variables: &apiv1.Block_Parallel_Dynamic_Variables{
										Item: "item",
									},
									Paths: "{{ 'a,b,c'.split(',') }}",
									Blocks: []*apiv1.Block{
										{
											Name:   "BlockStep",
											Config: step,
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestParallel",
				"[START] BlockStep",
				"[FINISH] BlockStep",
				"[START] BlockStep",
				"[FINISH] BlockStep",
				"[START] BlockStep",
				"[FINISH] BlockStep",
				"[FINISH] TestParallel",
			},
			executed: []string{
				"BlockStep",
				"BlockStep",
				"BlockStep",
			},
			unordered: true,
			last:      "TestParallel",
		},
		{
			name: "parallel_dynamic_0_paths",
			blocks: []*apiv1.Block{
				{
					Name: "TestParallel",
					Config: &apiv1.Block_Parallel_{
						Parallel: &apiv1.Block_Parallel{
							Wait: apiv1.Block_Parallel_WAIT_ALL,
							Config: &apiv1.Block_Parallel_Dynamic_{
								Dynamic: &apiv1.Block_Parallel_Dynamic{
									Variables: &apiv1.Block_Parallel_Dynamic_Variables{
										Item: "item",
									},
									Paths: "{{ 0 }}",
									Blocks: []*apiv1.Block{
										{
											Name:   "BlockStep",
											Config: step,
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestParallel",
				"[FINISH] TestParallel",
			},
			executed:  []string{},
			unordered: true,
			last:      "TestParallel",
		},
		{
			name: "parallel_multiple_paths",
			blocks: []*apiv1.Block{
				{
					Name: "TestParallel",
					Config: &apiv1.Block_Parallel_{
						Parallel: &apiv1.Block_Parallel{
							Wait: apiv1.Block_Parallel_WAIT_ALL,
							Config: &apiv1.Block_Parallel_Static_{
								Static: &apiv1.Block_Parallel_Static{
									Paths: map[string]*apiv1.Blocks{
										"PathOne": {
											Blocks: []*apiv1.Block{
												{
													Name:   "BlockStepPathOne",
													Config: step,
												},
											},
										},
										"PathTwo": {
											Blocks: []*apiv1.Block{
												{
													Name:   "BlockStepPathTwo",
													Config: step,
												},
											},
										},
										"PathThree": {
											Blocks: []*apiv1.Block{
												{
													Name:   "BlockStepPathThree",
													Config: step,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestParallel",
				"[START] BlockStepPathOne",
				"[FINISH] BlockStepPathOne",
				"[START] BlockStepPathTwo",
				"[FINISH] BlockStepPathTwo",
				"[START] BlockStepPathThree",
				"[FINISH] BlockStepPathThree",
				"[FINISH] TestParallel",
			},
			executed: []string{
				"BlockStepPathOne",
				"BlockStepPathTwo",
				"BlockStepPathThree",
			},
			unordered: true,
			last:      "TestParallel",
		},
		{
			name: "parallel_one_path_errors_basic",
			blocks: []*apiv1.Block{
				{
					Name: "TestParallel",
					Config: &apiv1.Block_Parallel_{
						Parallel: &apiv1.Block_Parallel{
							Wait: apiv1.Block_Parallel_WAIT_ALL,
							Config: &apiv1.Block_Parallel_Static_{
								Static: &apiv1.Block_Parallel_Static{
									Paths: map[string]*apiv1.Blocks{
										"PathOne": {
											Blocks: []*apiv1.Block{
												{
													Name:   "BlockStepPathOneERROR",
													Config: step,
												},
											},
										},
										"PathTwo": {
											Blocks: []*apiv1.Block{
												{
													Name:   "BlockStepPathTwo",
													Config: step,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] TestParallel",
				"[START] BlockStepPathOneERROR",
				"[FINISH] BlockStepPathOneERROR",
				"[START] BlockStepPathTwo",
				"[FINISH] BlockStepPathTwo",
				"[FINISH] TestParallel",
			},
			executed: []string{
				"BlockStepPathOneERROR",
				"BlockStepPathTwo",
			},
			unordered: true,
			err:       true,
		},
		{
			name: "return_basic_one",
			blocks: []*apiv1.Block{
				{
					Name: "TestReturn",
					Config: &apiv1.Block_Return_{
						Return: &apiv1.Block_Return{
							Data: "{{ true }}",
						},
					},
				},
			},
			events: []string{
				"[START] TestReturn",
				"[FINISH] TestReturn",
			},
			executed: []string{
				"TestReturn",
			},
			last: "TestReturn",
		},
		{
			name: "return_short_circuit",
			blocks: []*apiv1.Block{
				{
					Name:   "TestStepBefore",
					Config: step,
				},
				{
					Name: "TestReturn",
					Config: &apiv1.Block_Return_{
						Return: &apiv1.Block_Return{
							Data: "{{ true }}",
						},
					},
				},
				{
					Name:   "TestStepAfter",
					Config: step,
				},
			},
			events: []string{
				"[START] TestStepBefore",
				"[FINISH] TestStepBefore",
				"[START] TestReturn",
				"[FINISH] TestReturn",
			},
			executed: []string{
				"TestStepBefore",
				"TestReturn",
			},
			last: "TestReturn",
		},
		{
			name: "wait_basic",
			blocks: []*apiv1.Block{
				{
					Name: "TestParallel",
					Config: &apiv1.Block_Parallel_{
						Parallel: &apiv1.Block_Parallel{
							Wait: apiv1.Block_Parallel_WAIT_NONE,
							Config: &apiv1.Block_Parallel_Static_{
								Static: &apiv1.Block_Parallel_Static{
									Paths: map[string]*apiv1.Blocks{
										"PathOne": {
											Blocks: []*apiv1.Block{
												{
													Name:   "BlockStepPathOne",
													Config: step,
												},
											},
										},
									},
								},
							},
						},
					},
				},
				{
					Name:   "TestStepOne",
					Config: step,
				},
				{
					Name: "TestWait",
					Config: &apiv1.Block_Wait_{
						Wait: &apiv1.Block_Wait{
							Condition: "{{ 'TestParallel' }}",
						},
					},
				},
				{
					Name:   "TestStepTwo",
					Config: step,
				},
			},
			events: []string{
				"[START] TestParallel",
				"[START] BlockStepPathOne",
				"[FINISH] BlockStepPathOne",
				"[FINISH] TestParallel",
				"[START] TestStepOne",
				"[FINISH] TestStepOne",
				"[START] TestWait",
				"[FINISH] TestWait",
				"[START] TestStepTwo",
				"[FINISH] TestStepTwo",
			},
			executed: []string{
				"BlockStepPathOne",
				"TestStepOne",
				"TestStepTwo",
			},
			unordered: true,
			last:      "TestStepTwo",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			wg := &sync.WaitGroup{}
			events, dump := _events()
			mockWorker, executed := client()

			var variables store.Store
			{
				if test.key != nil {
					variables = store.Mock(test.key)
				} else {
					variables = store.Memory()
				}
			}

			wg.Add(1)

			go func() {
				defer wg.Done()

				ctx, cancel := context.WithCancelCause(context.Background())

				createSandboxFunc := func() engine.Sandbox {
					return javascript.Sandbox(ctx, &javascript.Options{
						Logger: zap.NewNop(),
						Store:  variables,
					})
				}

				sandbox := createSandboxFunc()
				defer sandbox.Close()

				flags := new(mockflags.Flags)
				flags.On("GetStepDurationV2", mock.Anything, mock.Anything).Return(10000, nil)
				flags.On("GetStepSizeV2", mock.Anything, mock.Anything).Return(10000, nil)
				flags.On("GetGoWorkerEnabled", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(false)

				mocker := new(mocker.Mocker)
				mocker.On("Handle", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, false, nil)

				last, ref, err := (&resolver{
					wg:                wg,
					ctx:               ctx,
					cancel:            cancel,
					flags:             flags,
					logger:            zap.NewNop(),
					worker:            mockWorker,
					key:               utils.NewMap[string](),
					variables:         gc.New(&gc.Options{Store: store.Memory()}),
					parallels:         utils.NewList[chan struct{}](),
					store:             variables,
					execution:         "ABCD-1234",
					rootStartTime:     time.Now(),
					timeout:           time.Second * 10,
					createSandboxFunc: createSandboxFunc,
					manager: &manager{
						mutex:   sync.RWMutex{},
						exiters: map[string](chan *exit){},
					},
					templatePlugin: mustache.Instance,
					Events:         events,
					Options: &Options{
						Mocker: mocker,
					},
				}).blocks(apictx.New(&apictx.Context{
					Execution:           "ABCD-1234",
					Name:                "ROOT",
					Context:             context.Background(),
					MaxStreamSendSize:   math.MaxInt,
					MaxParellelPoolSize: math.MaxInt,
				}), test.blocks)

				if test.err {
					assert.Error(t, err, test.name)
				} else {
					assert.NoError(t, err, test.name)
					assert.Equal(t, test.last, last, test.name)
					if test.last != "" {
						assert.NotEmpty(t, ref, test.name)
					}
				}
			}()

			wg.Wait()

			if test.unordered {
				events := dump()

				// NOTE(frank): The step order might be random but the block start and finish
				// events should be ordered. We can be better by making sure we aren't sync.
				assert.Equal(t, test.events[0], events[0], test.name)
				assert.Equal(t, test.events[len(test.events)-1], events[len(events)-1], test.name)

				assert.ElementsMatch(t, test.events, events, test.name)
				assert.ElementsMatch(t, test.executed, executed(), test.name)
			} else {
				assert.Equal(t, test.events, dump(), test.name)
				assert.Equal(t, test.executed, executed(), test.name)
			}

			for k, v := range test.variables {
				values, err := variables.Read(context.Background(), k)
				assert.NoError(t, err, test.name)
				assert.NotNil(t, values, test.name)
				assert.Equal(t, 1, len(values), test.name)
				assert.Equal(t, v, values[0])
			}
		})
	}
}

func TestAuthorizedBlocks(t *testing.T) {
	t.Parallel()

	blocks := []*apiv1.Block{
		{
			Name: "BlockOne",
			Config: &apiv1.Block_Step{
				Step: &apiv1.Step{
					Config: &apiv1.Step_Javascript{
						Javascript: &javascriptv1.Plugin{
							Body: "console.log('Hello, world!');",
						},
					},
				},
			},
		},
	}

	for _, test := range []struct {
		name          string
		blocks        []*apiv1.Block
		authorization *apiv1.Authorization
		variables     map[string]any
		last          string
		err           error
		events        []string
		executed      []string
		authorized    bool
	}{
		{
			name:   "Authorization type: JS Expression, expression is a boolean true literal, should be authorized",
			blocks: blocks,
			last:   "BlockOne",
			authorization: &apiv1.Authorization{
				Type:       apiv1.AuthorizationType_AUTHORIZATION_TYPE_JS_EXPRESSION,
				Expression: utils.Pointer("true"),
			},
			events: []string{
				"[START] ApiAuthorizationCheck",
				"[FINISH] ApiAuthorizationCheck",
				"[START] BlockOne",
				"[FINISH] BlockOne",
			},
			executed: []string{
				"BlockOne",
			},
			authorized: true,
		},
		{
			name:   "Authorization type: JS Expression, expression is a boolean false literal, should be unauthorized",
			blocks: blocks,
			authorization: &apiv1.Authorization{
				Type:       apiv1.AuthorizationType_AUTHORIZATION_TYPE_JS_EXPRESSION,
				Expression: utils.Pointer("false"),
			},
			err: sberrors.ApiAuthorizationError(errors.New("you don't have permission to execute this API")),
			events: []string{
				"[START] ApiAuthorizationCheck",
				"[FINISH] ApiAuthorizationCheck",
			},
			executed:   []string{},
			authorized: false,
		},
		{
			name:   "Authorization type: JS Expression, expression is a number literal, should be unauthorized and throw an error with a user message",
			blocks: blocks,
			authorization: &apiv1.Authorization{
				Type:       apiv1.AuthorizationType_AUTHORIZATION_TYPE_JS_EXPRESSION,
				Expression: utils.Pointer("42"),
			},
			err: sberrors.ApiAuthorizationError(errors.New("invalid authorization condition. Response must be a boolean")),
			events: []string{
				"[START] ApiAuthorizationCheck",
				"[FINISH] ApiAuthorizationCheck",
			},
			executed:   []string{},
			authorized: false,
		},
		{
			name:   "Authorization type: JS Expression, expression is not provided, should be unauthorized and throw an error with a user message",
			blocks: blocks,
			authorization: &apiv1.Authorization{
				Type: apiv1.AuthorizationType_AUTHORIZATION_TYPE_JS_EXPRESSION,
			},
			err: sberrors.ApiAuthorizationError(errors.New("invalid authorization condition. Response must be a boolean")),
			events: []string{
				"[START] ApiAuthorizationCheck",
				"[FINISH] ApiAuthorizationCheck",
			},
			executed:   []string{},
			authorized: false,
		},
		{
			name:   "Authorization type: JS Expression, expression references a field within an object and values are equal, should be authorized",
			blocks: blocks,
			last:   "BlockOne",
			authorization: &apiv1.Authorization{
				Type:       apiv1.AuthorizationType_AUTHORIZATION_TYPE_JS_EXPRESSION,
				Expression: utils.Pointer("role.name === \"Admin\""),
			},
			variables: map[string]any{
				"role": map[string]any{
					"name": "Admin",
				},
			},
			events: []string{
				"[START] ApiAuthorizationCheck",
				"[FINISH] ApiAuthorizationCheck",
				"[START] BlockOne",
				"[FINISH] BlockOne",
			},
			executed: []string{
				"BlockOne",
			},
			authorized: true,
		},
		{
			name:   "Authorization type: JS Expression, expression references a field within an object and values are not equal, should be unauthorized",
			blocks: blocks,
			err:    sberrors.ApiAuthorizationError(errors.New("you don't have permission to execute this API")),
			authorization: &apiv1.Authorization{
				Type:       apiv1.AuthorizationType_AUTHORIZATION_TYPE_JS_EXPRESSION,
				Expression: utils.Pointer("role.name === \"Admin\""),
			},
			variables: map[string]any{
				"role": map[string]any{
					"name": "Users",
				},
			},
			events: []string{
				"[START] ApiAuthorizationCheck",
				"[FINISH] ApiAuthorizationCheck",
			},
			executed:   []string{},
			authorized: false,
		},
		{
			name:   "Authorization type: app users, should be authorized",
			blocks: blocks,
			last:   "BlockOne",
			authorization: &apiv1.Authorization{
				Type: apiv1.AuthorizationType_AUTHORIZATION_TYPE_APP_USERS,
			},
			events: []string{
				"[START] ApiAuthorizationCheck",
				"[FINISH] ApiAuthorizationCheck",
				"[START] BlockOne",
				"[FINISH] BlockOne",
			},
			executed: []string{
				"BlockOne",
			},
			authorized: true,
		},
		{
			name:          "Authorization is nil, should be authorized",
			blocks:        blocks,
			last:          "BlockOne",
			authorization: nil,
			events: []string{
				"[START] BlockOne",
				"[FINISH] BlockOne",
			},
			executed: []string{
				"BlockOne",
			},
			authorized: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {

			wg := &sync.WaitGroup{}
			events, dump := _events()
			mockWorker, executed := client()

			var memoryStore store.Store
			{
				memoryStore = store.Memory()
				for k, v := range test.variables {
					// marshal the value to json
					jsonValue, err := json.Marshal(v)
					if err != nil {
						t.Fatalf("failed to marshal value for key %s: %s", k, err)
					}
					jsonString := string(jsonValue)
					pair := store.Pair(k, jsonString)
					memoryStore.Write(context.Background(), pair)
				}
			}

			var variablesToGarbageCollect gc.GC
			{
				variablesToGarbageCollect = gc.New(&gc.Options{Store: memoryStore})
			}

			wg.Add(1)

			go func() {
				defer wg.Done()

				ctx, cancel := context.WithCancelCause(context.Background())

				createSandboxFunc := func() engine.Sandbox {
					return javascript.Sandbox(ctx, &javascript.Options{
						Logger: zap.NewNop(),
						Store:  memoryStore,
					})
				}

				sandbox := createSandboxFunc()
				defer sandbox.Close()

				flags := new(mockflags.Flags)
				flags.On("GetStepDurationV2", mock.Anything, mock.Anything).Return(10000, nil)
				flags.On("GetStepSizeV2", mock.Anything, mock.Anything).Return(10000, nil)
				flags.On("GetGoWorkerEnabled", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(false)

				mocker := new(mocker.Mocker)
				mocker.On("Handle", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, false, nil)

				variablesMap := utils.NewMap[*transportv1.Variable]()
				for k := range test.variables {
					variablesMap.Put(k, &transportv1.Variable{
						Key:  k,
						Type: apiv1.Variables_TYPE_NATIVE,
					})
				}

				apiCtx := apictx.New(&apictx.Context{
					Execution:           "ABCD-1234",
					Name:                "ROOT",
					Context:             context.Background(),
					MaxStreamSendSize:   math.MaxInt,
					MaxParellelPoolSize: math.MaxInt,
				})

				apiCtx.Variables = variablesMap

				last, ref, err := (&resolver{
					wg:                wg,
					ctx:               ctx,
					cancel:            cancel,
					flags:             flags,
					logger:            zap.NewNop(),
					worker:            mockWorker,
					key:               utils.NewMap[string](),
					variables:         variablesToGarbageCollect,
					parallels:         utils.NewList[chan struct{}](),
					store:             memoryStore,
					execution:         "ABCD-1234",
					rootStartTime:     time.Now(),
					timeout:           time.Second * 10,
					createSandboxFunc: createSandboxFunc,
					manager: &manager{
						mutex:   sync.RWMutex{},
						exiters: map[string](chan *exit){},
					},
					templatePlugin: mustache.Instance,
					Events:         events,
					Options: &Options{
						Mocker: mocker,
					},
				}).AuthorizedBlocks(apiCtx, test.blocks, test.authorization)

				if test.err != nil {
					assert.EqualError(t, err, test.err.Error())
				} else {
					assert.NoError(t, err, test.name)
					assert.Equal(t, test.last, last, test.name)
					if test.last != "" {
						assert.NotEmpty(t, ref, test.name)
					}
				}
				if test.authorization != nil {
					keys, err := memoryStore.Scan(context.Background(), "AUTHORIZATION")
					assert.NoError(t, err)
					assert.Equal(t, 1, len(keys))
					key := keys[0]
					value, err := memoryStore.Read(context.Background(), key)
					assert.NotNil(t, value)
					assert.NoError(t, err)
					var output apiv1.Output
					err = json.Unmarshal([]byte(value[0].(string)), &output)
					assert.NoError(t, err)
					assert.Equal(t, test.authorized, output.Result.GetStructValue().Fields["authorized"].GetBoolValue())
					allVariablesForGarbageCollection := variablesToGarbageCollect.Contents()
					var foundKey string
					for _, v := range allVariablesForGarbageCollection {
						if v == key {
							foundKey = v
							break
						}
					}
					assert.Equal(t, key, foundKey)
				}
				assert.Equal(t, test.events, dump())
				assert.Equal(t, test.executed, executed())
			}()

			wg.Wait()
		})
	}
}

func TestQuota(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	for _, test := range []struct {
		name          string
		blocks        []*apiv1.Block
		key           func(string, string) (string, error)
		sizeQuota     int
		durationQuota int
	}{
		{
			name: "variables",
			blocks: []*apiv1.Block{
				{
					Name: "BlockTryERROR",
					Config: &apiv1.Block_Step{
						Step: &apiv1.Step{
							Config: &apiv1.Step_Javascript{
								Javascript: &javascriptv1.Plugin{
									Body: "return 5;",
								},
							},
						},
					},
				},
			},
			key: func(prefix, value string) (string, error) {
				return fmt.Sprintf("%s.%s", prefix, base64.StdEncoding.EncodeToString([]byte(value))), nil
			},
			sizeQuota:     100,
			durationQuota: 150,
		},
	} {

		t.Run(test.name, func(t *testing.T) {
			wg := &sync.WaitGroup{}
			events, _ := _events()
			mockWorker := &worker.MockClient{}

			mockWorker.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(func(ctx context.Context, _ string, props *transportv1.Request_Data_Data, _ ...wops.Option) *transportv1.Performance {
				return nil
			}, func(ctx context.Context, _ string, data *transportv1.Request_Data_Data, _ ...wops.Option) string {
				return ""
			}, func(ctx context.Context, _ string, data *transportv1.Request_Data_Data, _ ...wops.Option) error {
				return nil
			})

			var variables store.Store
			{
				if test.key != nil {
					variables = store.Mock(test.key)
				} else {
					variables = store.Memory()
				}
			}

			wg.Add(1)

			ctx, cancel := context.WithCancelCause(context.Background())

			createSandboxFunc := func() engine.Sandbox {
				return javascript.Sandbox(ctx, &javascript.Options{
					Logger: zap.NewNop(),
					Store:  variables,
				})
			}

			flags := new(mockflags.Flags)
			flags.On("GetStepRateV2", mock.Anything, mock.Anything).Return(1000, nil)
			flags.On("GetStepRatePerApiV2", mock.Anything, mock.Anything).Return(1000, nil)
			flags.On("GetStepRatePerUserV2", mock.Anything, mock.Anything).Return(1000, nil)
			flags.On("GetStepDurationV2", mock.Anything, mock.Anything).Return(test.durationQuota, nil)
			flags.On("GetStepSizeV2", mock.Anything, mock.Anything).Return(test.sizeQuota, nil)
			flags.On("GetGoWorkerEnabled", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(false)

			mocker := new(mocker.Mocker)
			mocker.On("Handle", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, false, nil)

			resolver := &resolver{
				orgId:             "ABC",
				wg:                wg,
				ctx:               ctx,
				cancel:            cancel,
				logger:            zap.NewNop(),
				worker:            mockWorker,
				flags:             flags,
				key:               utils.NewMap[string](),
				variables:         gc.New(&gc.Options{Store: store.Memory()}),
				parallels:         utils.NewList[chan struct{}](),
				store:             variables,
				execution:         "ABCD-1234",
				rootStartTime:     time.Now(),
				timeout:           time.Second * 10,
				createSandboxFunc: createSandboxFunc,
				manager: &manager{
					mutex:   sync.RWMutex{},
					exiters: map[string](chan *exit){},
				},
				templatePlugin: mustache.Instance,
				Events:         events,
				Options: &Options{
					Mocker: mocker,
				},
			}
			resolver.blocks(apictx.New(&apictx.Context{
				Execution: "ABCD-1234",
				Name:      "ROOT",
				Context:   context.Background(),
			}), test.blocks)

			calls := mockWorker.Calls
			quota := calls[0].Arguments.Get(2).(*transportv1.Request_Data_Data).Quotas
			assert.Equal(t, quota.Duration, int32(test.durationQuota))
			assert.Equal(t, quota.Size, int32(test.sizeQuota))
		})
	}
}

func TestStream(t *testing.T) {
	code := "return 5;"
	step := &apiv1.Block_Step{
		Step: &apiv1.Step{
			Config: &apiv1.Step_Javascript{
				Javascript: &javascriptv1.Plugin{
					Body: code,
				},
			},
		},
	}

	for _, test := range []struct {
		name     string
		blocks   []*apiv1.Block
		err      bool
		events   []string
		executed []string
		last     string
	}{
		{
			name: "stream_process",
			blocks: []*apiv1.Block{
				{
					Name: "Stream",
					Config: &apiv1.Block_Stream_{
						Stream: &apiv1.Block_Stream{
							Variables: &apiv1.Block_Stream_Variables{
								Item: "item",
							},
							Trigger: &apiv1.Block_Stream_Trigger{
								Name: "Trigger",
								Step: step.Step,
							},
							Process: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name:   "Process",
										Config: step,
									},
								},
							},
						},
					},
				},
			},
			events: []string{
				"[START] Stream",
				"[START] Trigger",
				"[FINISH] Trigger",
				"[START] Process",
				"[FINISH] Process",
				"[FINISH] Stream",
			},
			executed: []string{"Trigger", "Process"},
			last:     "Stream",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			wg := &sync.WaitGroup{}
			events, dump := _events()
			mockWorker, executed := streamClient()

			variables := store.Memory()
			wg.Add(1)

			go func() {
				defer wg.Done()

				ctx, cancel := context.WithCancelCause(context.Background())

				createSandboxFunc := func() engine.Sandbox {
					return javascript.Sandbox(ctx, &javascript.Options{
						Logger: zap.NewNop(),
						Store:  variables,
					})
				}

				flags := new(mockflags.Flags)
				flags.On("GetStepDurationV2", mock.Anything, mock.Anything).Return(10000, nil)
				flags.On("GetStepSizeV2", mock.Anything, mock.Anything).Return(10000, nil)
				flags.On("GetGoWorkerEnabled", mock.AnythingOfType("string"), mock.AnythingOfType("string")).Return(false)

				mocker := new(mocker.Mocker)
				mocker.On("Handle", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, false, nil)

				apiCtx := apictx.New(&apictx.Context{
					Execution:           "ABCD-1234",
					Name:                "ROOT",
					Context:             context.Background(),
					MaxStreamSendSize:   math.MaxInt,
					MaxParellelPoolSize: math.MaxInt,
				})

				last, _, err := (&resolver{
					wg:                wg,
					ctx:               ctx,
					cancel:            cancel,
					flags:             flags,
					logger:            zap.NewNop(),
					worker:            mockWorker,
					key:               utils.NewMap[string](),
					variables:         gc.New(&gc.Options{Store: store.Memory()}),
					parallels:         utils.NewList[chan struct{}](),
					store:             variables,
					execution:         "ABCD-1234",
					rootStartTime:     time.Now(),
					timeout:           time.Second * 10,
					createSandboxFunc: createSandboxFunc,
					manager: &manager{
						mutex:   sync.RWMutex{},
						exiters: map[string](chan *exit){},
					},
					templatePlugin: mustache.Instance,
					Events:         events,
					Options: &Options{
						Mocker: mocker,
					},
				}).blocks(
					apiCtx,
					test.blocks,
				)

				if test.err {
					assert.Error(t, err, test.name)
				} else {
					assert.NoError(t, err, test.name)
					assert.Equal(t, test.last, last, test.name)
				}
			}()

			wg.Wait()

			assert.Equal(t, test.events, dump(), test.name)
			assert.Equal(t, test.executed, executed(), test.name)
		})
	}
}

func client() (worker.Client, func() []string) {
	mutex := sync.RWMutex{}
	visited := []string{}
	mockWorker := &worker.MockClient{}

	mockWorker.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(func(ctx context.Context, _ string, props *transportv1.Request_Data_Data, _ ...wops.Option) *transportv1.Performance {
		return nil
	}, func(ctx context.Context, _ string, data *transportv1.Request_Data_Data, _ ...wops.Option) string {
		return "outputkey"
	}, func(ctx context.Context, _ string, data *transportv1.Request_Data_Data, _ ...wops.Option) error {
		mutex.Lock()
		defer mutex.Unlock()

		visited = append(visited, ctx.Value(ctxKeyBlockName).(string))

		if name := visited[len(visited)-1]; strings.Contains(strings.ToUpper(name), "ERROR") {
			// We have some tests that ensure all parallel paths run if one fails. This sleep
			// tries to work around the edge case where one fails before the other even has a chance to start.
			time.Sleep(10 * time.Millisecond)
			return errors.New(name)
		}

		return nil
	})

	mockWorker.On("Remote", mock.MatchedBy(func(string) bool {
		return true
	}), mock.MatchedBy(func(string) bool {
		return true
	})).Return(func(string) string {
		return "hi!"
	}, func(string) string {
		return "bye!"
	})

	return mockWorker, func() []string {
		mutex.RLock()
		defer mutex.RUnlock()

		return visited
	}
}

func streamClient() (worker.Client, func() []string) {
	mutex := sync.RWMutex{}
	visited := []string{}
	mockWorker := &worker.MockClient{}

	// 5 args, variadic for streaming options
	mockWorker.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(func(ctx context.Context, _ string, props *transportv1.Request_Data_Data, ops ...wops.Option) *transportv1.Performance {
		settings := wops.Apply(ops...)
		if stream := settings.Stream; stream != nil {
			stream <- "5"
			close(stream)
		}
		return nil
	}, func(ctx context.Context, _ string, data *transportv1.Request_Data_Data, _ ...wops.Option) string {
		return "outputkey"
	}, func(ctx context.Context, _ string, data *transportv1.Request_Data_Data, _ ...wops.Option) error {
		mutex.Lock()
		defer mutex.Unlock()

		visited = append(visited, ctx.Value(ctxKeyBlockName).(string))

		if name := visited[len(visited)-1]; strings.Contains(strings.ToUpper(name), "ERROR") {
			// We have some tests that ensure all parallel paths run if one fails. This sleep
			// tries to work around the edge case where one fails before the other even has a chance to start.
			time.Sleep(10 * time.Millisecond)
			return errors.New(name)
		}

		return nil
	})

	return mockWorker, func() []string {
		mutex.RLock()
		defer mutex.RUnlock()
		return visited
	}
}

func _events() (Events, func() []string) {
	mutex := sync.RWMutex{}
	store := []string{}

	var events MockEvents
	{
		events.On("Start", mock.Anything).Return(func(ctx *apictx.Context) *apictx.Context {
			ctx.Context = context.WithValue(ctx.Context, ctxKeyStartTime, time.Now().UnixMilli())
			ctx.Context = context.WithValue(ctx.Context, ctxKeyBlockName, ctx.Name)

			return ctx
		}).Run(func(args mock.Arguments) {
			ctx := args.Get(0).(*apictx.Context)

			mutex.Lock()
			defer mutex.Unlock()

			store = append(store, fmt.Sprintf("[START] %s", ctx.Name))
		})

		events.On("Finish", mock.Anything, mock.Anything, mock.Anything).Return().Run(func(args mock.Arguments) {
			ctx := args.Get(0).(*apictx.Context)

			mutex.Lock()
			defer mutex.Unlock()

			store = append(store, fmt.Sprintf("[FINISH] %s", ctx.Name))
		})

		events.On("Data", mock.Anything, mock.Anything).Return(nil)
	}

	return &events, func() []string {
		mutex.RLock()
		defer mutex.RUnlock()

		return store
	}
}
