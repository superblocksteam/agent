package executor

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/thejerf/abtime"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/superblocksteam/agent/internal/flags"
	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	"github.com/superblocksteam/agent/pkg/constants"
	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/crypto/signature"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	secretspkg "github.com/superblocksteam/agent/pkg/secrets"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	javascriptv1 "github.com/superblocksteam/agent/types/gen/go/plugins/javascript/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	storev1 "github.com/superblocksteam/agent/types/gen/go/store/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"google.golang.org/protobuf/proto"
)

func TestNewSkipsBlanketSecretInjectionForSignedScopedExecutions(t *testing.T) {
	t.Parallel()

	makeOptions := func(t *testing.T) *Options {
		t.Helper()

		registry, err := signature.Manager(false, nil, "", signature.NewResourceSerializer())
		require.NoError(t, err)

		return &Options{
			Api: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Id:           "api-id",
					Organization: "org-id",
				},
				Blocks: []*apiv1.Block{
					{
						Name: "Step1",
						Config: &apiv1.Block_Step{
							Step: &apiv1.Step{
								Config: &apiv1.Step_Javascript{
									Javascript: &javascriptv1.Plugin{
										Body: "return sb_secrets;",
									},
								},
							},
						},
					},
				},
			},
			DefinitionMetadata: &apiv1.Definition_Metadata{},
			Flags:              flags.NoopFlags(),
			Inputs:             map[string]*structpb.Value{},
			Logger:             zap.NewNop(),
			Secrets:            secretspkg.Manager(),
			Signature:          registry,
			Store:              store.Memory(),
			Stores: &storev1.Stores{
				Secrets: []*secretsv1.Store{
					{
						Metadata: &commonv1.Metadata{
							Name: "mock_store",
						},
						Provider: &secretsv1.Provider{
							Config: &secretsv1.Provider_Mock{
								Mock: &secretsv1.MockStore{
									Data: map[string]string{
										"shhh": "this is a secret",
									},
								},
							},
						},
					},
				},
			},
		}
	}

	for _, test := range []struct {
		name             string
		appEngineVersion string
		sdkIntegration   bool
		expectInjected   bool
	}{
		{
			name:             "legacy signed execution keeps blanket injection",
			appEngineVersion: "1.0",
			expectInjected:   true,
		},
		{
			name:             "scoped signed execution skips blanket injection",
			appEngineVersion: "2.0",
			expectInjected:   false,
		},
		{
			name:             "sdk integration callback skips blanket injection",
			appEngineVersion: "2.0",
			sdkIntegration:   true,
			expectInjected:   false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			ctx := jwt_validator.WithAppEngineVersion(context.Background(), test.appEngineVersion)
			if test.sdkIntegration {
				ctx = constants.WithSDKIntegrationExecution(ctx, []string{"integration-id"})
			}
			options := makeOptions(t)

			_, err := New(ctx, options)
			require.NoError(t, err)

			_, injected := options.Inputs["sb_secrets"]
			assert.Equal(t, test.expectInjected, injected)
		})
	}
}

func TestFinish(t *testing.T) {
	t.Parallel()

	// NOTE(frank): If/When I start doing stuff with this mock time,
	// I will either need to remove the parallel toggle or make it thread safe.
	now := abtime.NewManualAtTime(time.Date(2023, 2, 4, 0, 0, 0, 0, time.UTC)).Now

	value := func(data string) *structpb.Value {
		var tmp structpb.Value

		if err := json.Unmarshal([]byte(data), &tmp); err != nil {
			panic(err)
		}

		return &tmp
	}

	for _, test := range []struct {
		name      string
		event     *Event
		perf      *transportv1.Performance
		ctx       *apictx.Context
		outputs   bool
		err       error
		keySeed   map[string]string
		storeSeed map[string]string
		now       func() time.Time
	}{
		{
			name:    "no context",
			ctx:     nil,
			perf:    nil,
			outputs: false,
			err:     nil,
			event: &Event{
				StreamResponse: &apiv1.StreamResponse{
					Execution: "ABCD-1234",
					Event: &apiv1.Event{
						Name:      "",
						Parent:    nil,
						Timestamp: timestamppb.New(now()),
						Event: &apiv1.Event_End_{
							End: &apiv1.Event_End{
								Status: apiv1.BlockStatus_BLOCK_STATUS_SUCCEEDED,
							},
						},
					},
				},
			},
		},
		{
			name: "no output",
			ctx: apictx.New(&apictx.Context{
				Name:    "name",
				Parent:  "parent",
				Context: context.WithValue(context.Background(), ctxKeyStartTime, int64(1000)),
				Type:    apiv1.BlockType_BLOCK_TYPE_STEP,
			}),
			perf: &transportv1.Performance{
				PluginExecution: &transportv1.Performance_Observable{
					Value: 1000,
				},
			},
			outputs: false,
			err:     nil,
			event: &Event{
				StreamResponse: &apiv1.StreamResponse{
					Execution: "ABCD-1234",
					Event: &apiv1.Event{
						Name:      "name",
						Parent:    proto.String("parent"),
						Type:      apiv1.BlockType_BLOCK_TYPE_STEP,
						Timestamp: timestamppb.New(now()),
						Event: &apiv1.Event_End_{
							End: &apiv1.Event_End{
								Performance: &apiv1.Performance{
									Start:     1000,
									Finish:    1675468800000,
									Total:     1675468799000,
									Execution: 1,
									Overhead:  1675468798999,
								},
								Status: apiv1.BlockStatus_BLOCK_STATUS_SUCCEEDED,
							},
						},
					},
				},
			},
		},
		{
			name: "with output",
			ctx: apictx.New(&apictx.Context{
				Name:    "one",
				Parent:  "parent",
				Type:    apiv1.BlockType_BLOCK_TYPE_STEP,
				Context: context.WithValue(context.Background(), ctxKeyStartTime, int64(1000)),
			}),
			perf: &transportv1.Performance{
				PluginExecution: &transportv1.Performance_Observable{
					Value: 1000,
				},
			},
			keySeed: map[string]string{
				"one": "two",
			},
			storeSeed: map[string]string{
				"two": `{"output": "result", "request": "request", "log": ["[ERROR] error", "not error"]}`,
			},
			outputs: true,
			err:     nil,
			event: &Event{
				StreamResponse: &apiv1.StreamResponse{
					Execution: "ABCD-1234",
					Event: &apiv1.Event{
						Name:      "one",
						Parent:    proto.String("parent"),
						Timestamp: timestamppb.New(now()),
						Type:      apiv1.BlockType_BLOCK_TYPE_STEP,
						Event: &apiv1.Event_End_{
							End: &apiv1.Event_End{
								Performance: &apiv1.Performance{
									Start:     1000,
									Finish:    1675468800000,
									Total:     1675468799000,
									Execution: 1,
									Overhead:  1675468798999,
								},
								Status: apiv1.BlockStatus_BLOCK_STATUS_SUCCEEDED,
								Output: &apiv1.Output{
									Result:  value(`"result"`),
									Request: "request",
									RequestV2: &apiv1.Output_Request{
										Summary: "request",
									},
									Stdout: []string{"not error"},
									Stderr: []string{"error"},
								},
							},
						},
					},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			keyStore := utils.NewMap[string]()
			resultStore := store.Memory()

			for k, v := range test.keySeed {
				keyStore.Put(k, v)
			}

			for k, v := range test.storeSeed {
				assert.NoError(t, resultStore.Write(context.Background(), store.Pair(k, v)))
			}

			e := &execution{
				Options: &Options{
					Logger: zap.NewNop(),
					Options: &apiv1.ExecuteRequest_Options{
						IncludeEventOutputs: test.outputs,
					},
					Key:   keyStore,
					Store: resultStore,
				},
				id:     "ABCD-1234",
				stream: make(chan *Event),
				now:    now,
			}

			go e.Finish(test.ctx, test.perf, test.err)
			assert.Equal(t, test.event, <-e.Event(), test.name)
		})
	}
}

func TestEstimate(t *testing.T) {
	for _, test := range []struct {
		name      string
		blocks    []*apiv1.Block
		estimates map[string]*uint32
		seed      map[string]any
	}{
		{
			name: "basic",
			blocks: []*apiv1.Block{
				{
					Name: "ONE",
					Config: &apiv1.Block_Step{
						Step: &apiv1.Step{},
					},
				},
			},
			seed: map[string]any{
				"ESTIMATE.ABCD-1234.ONE": "5",
			},
			estimates: map[string]*uint32{
				"ONE": utils.Pointer[uint32](5),
			},
		},
		{
			name: "complex",
			blocks: []*apiv1.Block{
				{
					Name: "ONE",
					Config: &apiv1.Block_Step{
						Step: &apiv1.Step{},
					},
				},
				{
					Name: "TWO",
					Config: &apiv1.Block_Conditional_{
						Conditional: &apiv1.Block_Conditional{
							If: &apiv1.Block_Conditional_Condition{
								Blocks: []*apiv1.Block{
									{
										Name: "THREE",
										Config: &apiv1.Block_Step{
											Step: &apiv1.Step{},
										},
									},
								},
							},
							ElseIf: []*apiv1.Block_Conditional_Condition{
								{
									Blocks: []*apiv1.Block{
										{
											Name: "FIVE",
											Config: &apiv1.Block_TryCatch_{
												TryCatch: &apiv1.Block_TryCatch{
													Try: &apiv1.Blocks{
														Blocks: []*apiv1.Block{
															{
																Name: "SIX",
																Config: &apiv1.Block_Step{
																	Step: &apiv1.Step{},
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
							Else: &apiv1.Blocks{
								Blocks: []*apiv1.Block{
									{
										Name: "FOUR",
										Config: &apiv1.Block_Step{
											Step: &apiv1.Step{},
										},
									},
								},
							},
						},
					},
				},
			},
			seed: map[string]any{
				"ESTIMATE.ABCD-1234.ONE": "5",
				"ESTIMATE.ABCD-1234.SIX": "6",
			},
			estimates: map[string]*uint32{
				"ONE":   utils.Pointer[uint32](5),
				"THREE": utils.Pointer[uint32](0),
				"FOUR":  utils.Pointer[uint32](0),
				"SIX":   utils.Pointer[uint32](6),
			},
		},
		{
			name: "missing conditional branches",
			blocks: []*apiv1.Block{
				{
					Name: "ONE",
					Config: &apiv1.Block_Conditional_{
						Conditional: &apiv1.Block_Conditional{
							If: &apiv1.Block_Conditional_Condition{
								Blocks: []*apiv1.Block{
									{
										Name: "TWO",
										Config: &apiv1.Block_Step{
											Step: &apiv1.Step{},
										},
									},
								},
							},
						},
					},
				},
			},
			seed: map[string]any{
				"ESTIMATE.ABCD-1234.TWO": "5",
			},
			estimates: map[string]*uint32{
				"TWO": utils.Pointer[uint32](5),
			},
		},
	} {
		data := store.Memory()

		for k, v := range test.seed {
			assert.NoError(t, data.Write(context.Background(), store.Pair(k, v)), test.name)
		}

		estimates, err := (&execution{
			Options: &Options{
				Api: &apiv1.Api{
					Metadata: &commonv1.Metadata{
						Id: "ABCD-1234",
					},
				},
				Store:  data,
				Logger: zap.NewNop(),
			},
		}).estimate(context.Background(), &apiv1.Api{
			Blocks: test.blocks,
		})

		assert.NoError(t, err, test.name)
		assert.Equal(t, test.estimates, estimates, test.name)
	}
}

func TestBaggage(t *testing.T) {
	for _, test := range []struct {
		name     string
		exec     *execution
		expected map[string]string
	}{
		{
			name: "basic",
			exec: &execution{
				id: "foobar",
				Options: &Options{
					DefinitionMetadata: &apiv1.Definition_Metadata{
						OrganizationPlan: "foo",
						OrganizationName: "bar",
						Profile:          "baz",
						Requester:        "car",
					},
					Api: &apiv1.Api{
						Metadata: &commonv1.Metadata{
							Id:           "ABCD-1234",
							Name:         "apiName",
							Organization: "organizationId",
						},
						Trigger: &apiv1.Trigger{
							Config: &apiv1.Trigger_Application_{
								Application: &apiv1.Trigger_Application{},
							},
						},
					},
				},
			},
			expected: map[string]string{
				"organization-id":   "organizationId",
				"organization-name": "bar",
				"organization-tier": "foo",
				"profile":           "baz",
				"api-id":            "ABCD-1234",
				"correlation-id":    "foobar",
				"resource-name":     "apiName",
				"resource-type":     "api",
			},
		},
		{
			name: "values are url escaped",
			exec: &execution{
				id: "foobar",
				Options: &Options{
					DefinitionMetadata: &apiv1.Definition_Metadata{
						OrganizationPlan: "foo",
						OrganizationName: "My Fantastic Organization super@duper.com",
						Profile:          "baz",
						Requester:        "car",
					},
					Api: &apiv1.Api{
						Metadata: &commonv1.Metadata{
							Id:           "ABCD-1234",
							Name:         "Bruce's Fantastic Workflow",
							Organization: "organizationId",
						},
						Trigger: &apiv1.Trigger{
							Config: &apiv1.Trigger_Application_{
								Application: &apiv1.Trigger_Application{},
							},
						},
					},
				},
			},
			expected: map[string]string{
				"organization-id":   "organizationId",
				"organization-name": "My%20Fantastic%20Organization%20super@duper.com",
				"organization-tier": "foo",
				"profile":           "baz",
				"api-id":            "ABCD-1234",
				"correlation-id":    "foobar",
				"resource-name":     "Bruce's%20Fantastic%20Workflow",
				"resource-type":     "api",
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx := test.exec.contextWithBaggage(constants.WithExecutionID(context.Background(), "foobar"))
			propagatedContext := tracer.Propagate(ctx)

			for k, v := range test.expected {
				assert.True(t, strings.Contains(propagatedContext["baggage"], fmt.Sprintf("%s=%s", k, v)), fmt.Sprintf("expected %s=%s present in baggage", k, v))
			}
		})
	}
}
