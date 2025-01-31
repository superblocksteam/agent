package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/constants"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	javascriptv1 "github.com/superblocksteam/agent/types/gen/go/plugins/javascript/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestApiType(t *testing.T) {
	for _, test := range []struct {
		name     string
		api      *apiv1.Api
		expected string
	}{
		{
			name:     "nil api returns unknown",
			api:      nil,
			expected: constants.ApiTypeUnknown,
		},
		{
			name:     "api with no trigger returns unknown",
			api:      &apiv1.Api{},
			expected: constants.ApiTypeUnknown,
		},
		{
			name: "api with application trigger returns api",
			api: &apiv1.Api{
				Trigger: &apiv1.Trigger{
					Config: &apiv1.Trigger_Application_{
						Application: &apiv1.Trigger_Application{},
					},
				},
			},
			expected: constants.ApiTypeApi,
		},
		{
			name: "api with scheduled job trigger returns scheduled job",
			api: &apiv1.Api{
				Trigger: &apiv1.Trigger{
					Config: &apiv1.Trigger_Job_{
						Job: &apiv1.Trigger_Job{},
					},
				},
			},
			expected: constants.ApiTypeScheduledJob,
		},
		{
			name: "api with workflow trigger returns workflow",
			api: &apiv1.Api{
				Trigger: &apiv1.Trigger{
					Config: &apiv1.Trigger_Workflow_{
						Workflow: &apiv1.Trigger_Workflow{},
					},
				},
			},
			expected: constants.ApiTypeWorkflow,
		},
		{
			name:     "api with unknown trigger returns unknown",
			api:      &apiv1.Api{Trigger: &apiv1.Trigger{}},
			expected: constants.ApiTypeUnknown,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			actual := ApiType(test.api)
			assert.Equal(t, test.expected, actual)
		})
	}
}

func TestContainsSuperblocksSecrets(t *testing.T) {
	for _, test := range []struct {
		name         string
		api          *apiv1.Api
		integrations map[string]*structpb.Struct
		result       bool
	}{
		{
			name: "happy path",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Config: &apiv1.Block_Step{
							Step: &apiv1.Step{
								Config: &apiv1.Step_Javascript{
									Javascript: &javascriptv1.Plugin{
										Body: "sb_secrets",
									},
								},
							},
						},
					},
				},
			},
			integrations: map[string]*structpb.Struct{},
			result:       true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, err := ContainsSuperblocksSecrets(test.api, test.integrations)
			assert.NoError(t, err)

			assert.Equal(t, test.result, result)
		})
	}
}

func TestSearchAPI(t *testing.T) {
	for _, test := range []struct {
		name         string
		api          *apiv1.Api
		integrations map[string]*structpb.Struct
		what         []string
		result       bool
		err          bool
	}{
		{
			name:   "empty api",
			api:    &apiv1.Api{},
			what:   []string{"foo"},
			result: false,
		},
		{
			name: "in api",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Config: &apiv1.Block_Step{
							Step: &apiv1.Step{
								Config: &apiv1.Step_Javascript{
									Javascript: &javascriptv1.Plugin{
										Body: "secret",
									},
								},
							},
						},
					},
				},
			},
			what:   []string{"secret"},
			result: true,
		},
		{
			name: "not in api",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Config: &apiv1.Block_Step{
							Step: &apiv1.Step{
								Config: &apiv1.Step_Javascript{
									Javascript: &javascriptv1.Plugin{
										Body: "foo",
									},
								},
							},
						},
					},
				},
			},
			what:   []string{"secret"},
			result: false,
		},
		{
			name: "in integrations",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Config: &apiv1.Block_Step{
							Step: &apiv1.Step{
								Config: &apiv1.Step_Javascript{
									Javascript: &javascriptv1.Plugin{
										Body: "foo",
									},
								},
							},
						},
					},
				},
			},
			integrations: map[string]*structpb.Struct{
				"foo": {
					Fields: map[string]*structpb.Value{
						"bar": {
							Kind: &structpb.Value_StringValue{
								StringValue: "secret",
							},
						},
					},
				},
			},
			what:   []string{"secret"},
			result: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, err := SearchAPI(test.api, test.integrations, test.what...)

			if test.err {
				assert.Error(t, err)
				return
			}

			assert.Equal(t, test.result, result)
		})
	}
}

func TestForEachBlockInAPI(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name          string
		api           *apiv1.Api
		expectedCount int
	}{
		{
			name:          "empty API",
			api:           &apiv1.Api{},
			expectedCount: 0,
		},
		{
			name: "no nested blocks",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{}, {}, {},
				},
			},
			expectedCount: 3,
		},
		{
			name: "nested blocks",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Config: &apiv1.Block_Parallel_{
							Parallel: &apiv1.Block_Parallel{
								Config: &apiv1.Block_Parallel_Static_{
									Static: &apiv1.Block_Parallel_Static{
										Paths: map[string]*apiv1.Blocks{
											"foo": {
												Blocks: []*apiv1.Block{
													{}, {},
												},
											},
										},
									},
								},
							},
						},
					},
					{
						Config: &apiv1.Block_Conditional_{
							Conditional: &apiv1.Block_Conditional{
								If: &apiv1.Block_Conditional_Condition{
									Blocks: []*apiv1.Block{
										{},
									},
								},
								ElseIf: []*apiv1.Block_Conditional_Condition{
									{
										Blocks: []*apiv1.Block{
											{},
										},
									},
								},
								Else: &apiv1.Blocks{
									Blocks: []*apiv1.Block{
										{}, {},
									},
								},
							},
						},
					},
				},
			},
			expectedCount: 8,
		},
		{
			name: "loop blocks",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Config: &apiv1.Block_Loop_{
							Loop: &apiv1.Block_Loop{
								Blocks: []*apiv1.Block{
									{}, {},
								},
							},
						},
					},
				},
			},
			expectedCount: 3,
		},
		{
			name: "stream blocks",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Config: &apiv1.Block_Stream_{
							Stream: &apiv1.Block_Stream{
								Trigger: &apiv1.Block_Stream_Trigger{
									Step: &apiv1.Step{},
								},
								Process: &apiv1.Blocks{
									Blocks: []*apiv1.Block{
										{}, {},
									},
								},
							},
						},
					},
				},
			},
			expectedCount: 4,
		},
		{
			name: "try-catch-finally blocks",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Config: &apiv1.Block_TryCatch_{
							TryCatch: &apiv1.Block_TryCatch{
								Try: &apiv1.Blocks{
									Blocks: []*apiv1.Block{
										{},
									},
								},
								Catch: &apiv1.Blocks{
									Blocks: []*apiv1.Block{
										{}, {},
									},
								},
								Finally: &apiv1.Blocks{
									Blocks: []*apiv1.Block{
										{},
									},
								},
							},
						},
					},
				},
			},
			expectedCount: 5,
		},
		{
			name: "combination of various nested blocks",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{},
					{
						Config: &apiv1.Block_Loop_{
							Loop: &apiv1.Block_Loop{
								Blocks: []*apiv1.Block{
									{},
									{
										Config: &apiv1.Block_Conditional_{
											Conditional: &apiv1.Block_Conditional{
												If: &apiv1.Block_Conditional_Condition{
													Blocks: []*apiv1.Block{
														{},
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
			expectedCount: 5,
		},
		{
			name: "dynamic parallel blocks",
			api: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Config: &apiv1.Block_Parallel_{
							Parallel: &apiv1.Block_Parallel{
								Config: &apiv1.Block_Parallel_Dynamic_{
									Dynamic: &apiv1.Block_Parallel_Dynamic{
										Blocks: []*apiv1.Block{
											{},
											{},
										},
									},
								},
							},
						},
					},
				},
			},
			expectedCount: 3,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			count := 0

			ForEachBlockInAPI(test.api, func(block *apiv1.Block) {
				count++
			})

			if count != test.expectedCount {
				t.Errorf("Expected count to be %d, but got %d", test.expectedCount, count)
			}
		})
	}
}
