package signature

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	javascriptv1 "github.com/superblocksteam/agent/types/gen/go/plugins/javascript/v1"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

type triggerType int

const (
	noTrigger triggerType = iota
	applicationTrigger
	jobTrigger
	workflowTrigger
)

type args struct {
	serializer             ResourceSerializer
	apiMap                 map[string]any
	api                    *apiv1.Api
	apiLiteral             *structpb.Struct
	literal                *structpb.Value
	expectedPayload        string
	literalExpectedPayload string
	expectedSig            []byte
}

func validArgs(t *testing.T, trigger triggerType, withSignature bool) *args {
	apiMap := map[string]any{
		"metadata": map[string]any{
			"id":           "00000000-0000-0000-0000-000000000001",
			"organization": "00000000-0000-0000-0000-000000000002",
			"name":         "TestApi",
		},
		"blocks": []any{
			map[string]any{
				"name": "block1",
				"step": map[string]any{
					"integration": "javascript",
					"javascript": map[string]any{
						"body": "console.log('Hello, World!')",
					},
				},
			},
		},
		"extraField": "extraValue",
	}

	api := &apiv1.Api{
		Metadata: &commonv1.Metadata{
			Id:           "00000000-0000-0000-0000-000000000001",
			Organization: "00000000-0000-0000-0000-000000000002",
			Name:         "TestApi",
		},
		Blocks: []*apiv1.Block{
			{
				Name: "block1",
				Config: &apiv1.Block_Step{
					Step: &apiv1.Step{
						Integration: "javascript",
						Config: &apiv1.Step_Javascript{
							Javascript: &javascriptv1.Plugin{
								Body: "console.log('Hello, World!')",
							},
						},
					},
				},
			},
		},
	}

	var expectedPayload string
	switch trigger {
	case noTrigger:
		expectedPayload = `{"blocks":[{"name":"block1","step":{"integration":"javascript","javascript":{"body":"console.log('Hello, World!')"}}}]}`
	case applicationTrigger:
		apiMap["trigger"] = map[string]any{
			"application": map[string]any{
				"id": "app-id",
			},
		}
		api.Trigger = &apiv1.Trigger{
			Config: &apiv1.Trigger_Application_{
				Application: &apiv1.Trigger_Application{
					Id: "app-id",
				},
			},
		}
		expectedPayload = `{"blocks":[{"name":"block1","step":{"integration":"javascript","javascript":{"body":"console.log('Hello, World!')"}}}],"trigger":{"application":{"id":"app-id"}}}`
	case jobTrigger:
		apiMap["trigger"] = map[string]any{
			"job": map[string]any{
				"options": map[string]any{
					"sendEmailOnFailure": true,
					"deployedCommitId":   "deployed-commit-id",
				},
				"frequency":  10,
				"dayOfMonth": 2,
			},
		}
		api.Trigger = &apiv1.Trigger{
			Config: &apiv1.Trigger_Job_{
				Job: &apiv1.Trigger_Job{
					Options: &apiv1.Trigger_Job_Options{
						SendEmailOnFailure: true,
						DeployedCommitId:   utils.Pointer("deployed-commit-id"),
					},
					Frequency:  10,
					DayOfMonth: 2,
				},
			},
		}
		expectedPayload = `{"blocks":[{"name":"block1","step":{"integration":"javascript","javascript":{"body":"console.log('Hello, World!')"}}}],"trigger":{"job":{"dayOfMonth":2,"frequency":10}}}`
	case workflowTrigger:
		apiMap["trigger"] = map[string]any{
			"workflow": map[string]any{
				"options": map[string]any{
					"deployedCommitId": "deployed-commit-id",
				},
				"parameters": map[string]any{
					"query": map[string]any{
						"param1": map[string]any{
							"values": []any{"value1", "value2"},
						},
					},
				},
			},
		}
		api.Trigger = &apiv1.Trigger{
			Config: &apiv1.Trigger_Workflow_{
				Workflow: &apiv1.Trigger_Workflow{
					Options: &apiv1.Trigger_Workflow_Options{
						DeployedCommitId: utils.Pointer("deployed-commit-id"),
					},
					Parameters: &apiv1.Trigger_Workflow_Parameters{
						Query: map[string]*apiv1.Trigger_Workflow_Parameters_QueryParam{
							"param1": {
								Values: []string{"value1", "value2"},
							},
						},
					},
				},
			},
		}
		expectedPayload = `{"blocks":[{"name":"block1","step":{"integration":"javascript","javascript":{"body":"console.log('Hello, World!')"}}}],"trigger":{"workflow":{"parameters":{"query":{"param1":{"values":["value1","value2"]}}}}}}`
	}

	var sig []byte
	if withSignature {
		sig = []byte("api-literal-signature")

		apiMap["signature"] = map[string]any{
			"keyId": "signing-key-id",
			"data":  string(sig),
		}
		api.Signature = &pbutils.Signature{
			KeyId: "signing-key-id",
			Data:  sig,
		}
	}

	apiLiteral, err := structpb.NewStruct(apiMap)
	require.NoError(t, err)

	literalExpectedPayload, err := json.Marshal(apiLiteral)
	require.NoError(t, err)

	return &args{
		serializer:             NewResourceSerializer(),
		apiMap:                 apiMap,
		api:                    api,
		apiLiteral:             apiLiteral,
		literal:                structpb.NewStructValue(apiLiteral),
		expectedPayload:        expectedPayload,
		literalExpectedPayload: string(literalExpectedPayload),
		expectedSig:            sig,
	}
}

func verify(t *testing.T, a *args, expectedPayload string, newSignature *pbutils.Signature, expectedSerializeErr, expectedUpdateErr error) {
	verifySerialize(t, a, expectedPayload, expectedSerializeErr)
	verifyUpdateResourceWithSignature(t, a, newSignature, expectedUpdateErr)
}

func verifySerialize(t *testing.T, a *args, expectedPayload string, expectedErr error) {
	payload, sig, err := a.serializer.Serialize(&securityv1.Resource{
		Config: &securityv1.Resource_Api{
			Api: structpb.NewStructValue(a.apiLiteral),
		},
	})
	verifyPayloadAndSignature(t, string(payload), expectedPayload, sig, a.expectedSig, err, expectedErr)

	payload, sig, err = a.serializer.Serialize(&securityv1.Resource{
		Config: &securityv1.Resource_ApiLiteral_{
			ApiLiteral: &securityv1.Resource_ApiLiteral{
				Data: structpb.NewStructValue(a.apiLiteral),
			},
		},
	})
	verifyPayloadAndSignature(t, string(payload), expectedPayload, sig, a.expectedSig, err, expectedErr)

	literal := &securityv1.Resource_Literal{
		Data: a.literal,
	}
	if a.expectedSig != nil {
		literal.Signature = &pbutils.Signature{
			KeyId: "signing-key-id",
			Data:  a.expectedSig,
		}
	}

	payload, sig, err = a.serializer.Serialize(&securityv1.Resource{
		Config: &securityv1.Resource_Literal_{
			Literal: literal,
		},
	})
	verifyPayloadAndSignature(t, string(payload), a.literalExpectedPayload, sig, a.expectedSig, err, expectedErr)
}

func verifyPayloadAndSignature(t *testing.T, actualPayload, expectedPayload string, actualSig, expectedSig []byte, actualErr, expectedErr error) {
	if expectedErr != nil {
		assert.ErrorIs(t, actualErr, expectedErr)
	} else {
		assert.NoError(t, actualErr)
		assert.Equal(t, expectedPayload, actualPayload)
		assert.Equal(t, expectedSig, actualSig)
	}
}

func verifyUpdateResourceWithSignature(t *testing.T, a *args, newSignature *pbutils.Signature, expectedErr error) {
	res := &securityv1.Resource{
		Config: &securityv1.Resource_Api{
			Api: structpb.NewStructValue(a.apiLiteral),
		},
	}
	verifyUpdatedSignature(t, a, res, newSignature, expectedErr, func(res *securityv1.Resource) *pbutils.Signature {
		sigStruct := res.GetApi().GetStructValue().Fields["signature"].GetStructValue()
		sig, _ := StructpbToSignatureProto(sigStruct)
		return sig
	})

	res = &securityv1.Resource{
		Config: &securityv1.Resource_ApiLiteral_{
			ApiLiteral: &securityv1.Resource_ApiLiteral{
				Data: structpb.NewStructValue(a.apiLiteral),
			},
		},
	}
	verifyUpdatedSignature(t, a, res, newSignature, expectedErr, func(res *securityv1.Resource) *pbutils.Signature {
		sigStruct := res.GetApiLiteral().GetData().GetStructValue().Fields["signature"].GetStructValue()
		sig, _ := StructpbToSignatureProto(sigStruct)
		return sig
	})

	res = &securityv1.Resource{
		Config: &securityv1.Resource_Literal_{
			Literal: &securityv1.Resource_Literal{
				Data: structpb.NewStructValue(a.apiLiteral),
			},
		},
	}
	verifyUpdatedSignature(t, a, res, newSignature, expectedErr, func(res *securityv1.Resource) *pbutils.Signature {
		return res.GetLiteral().GetSignature()
	})
}

func verifyUpdatedSignature(t *testing.T, a *args, res *securityv1.Resource, newSignature *pbutils.Signature, expectedErr error, getSignature func(res *securityv1.Resource) *pbutils.Signature) {
	err := a.serializer.UpdateResourceWithSignature(res, newSignature.KeyId, newSignature.Data)
	if expectedErr != nil {
		assert.ErrorIs(t, err, expectedErr)
	} else {
		actualSig := getSignature(res)
		assert.NoError(t, err)
		utils.AssertProtoEqual(t, newSignature, actualSig)
	}
}

func TestOk(t *testing.T) {
	newSig := &pbutils.Signature{
		KeyId: "new-signing-key-id",
		Data:  []byte("new-payload-signature"),
	}

	for _, trigger := range []triggerType{noTrigger, applicationTrigger, jobTrigger, workflowTrigger} {
		a := validArgs(t, trigger, true)
		verify(t, a, a.expectedPayload, newSig, nil, nil)
	}
}

func TestOkNoSignature(t *testing.T) {
	newSig := &pbutils.Signature{
		KeyId: "new-signing-key-id",
		Data:  []byte("new-payload-signature"),
	}

	for _, trigger := range []triggerType{noTrigger, applicationTrigger, jobTrigger, workflowTrigger} {
		a := validArgs(t, trigger, false)
		verify(t, a, a.expectedPayload, newSig, nil, nil)
	}
}

func TestSerializeOkApiLiteralWithUnknownFields(t *testing.T) {
	a := validArgs(t, applicationTrigger, false)
	a.apiLiteral.Fields["blocks"].GetListValue().Values[0].GetStructValue().Fields["unknownField"] = structpb.NewStringValue("unknownValue")

	expectedPayload := `{"blocks":[{"name":"block1","step":{"integration":"javascript","javascript":{"body":"console.log('Hello, World!')"}},"unknownField":"unknownValue"}],"trigger":{"application":{"id":"app-id"}}}`

	payload, sig, err := a.serializer.Serialize(&securityv1.Resource{
		Config: &securityv1.Resource_ApiLiteral_{
			ApiLiteral: &securityv1.Resource_ApiLiteral{
				Data: structpb.NewStructValue(a.apiLiteral),
			},
		},
	})
	verifyPayloadAndSignature(t, string(payload), expectedPayload, sig, a.expectedSig, err, nil)
}

func TestSerializeUnknownResourceType(t *testing.T) {
	a := validArgs(t, applicationTrigger, true)

	payload, sig, err := a.serializer.Serialize(&securityv1.Resource{Config: nil})
	verifyPayloadAndSignature(t, string(payload), "", sig, nil, err, sberrors.ErrInternal)
}

func TestSerializeInvalidApiLiteral(t *testing.T) {
	a := validArgs(t, applicationTrigger, true)

	invalidApiLiteral := structpb.NewStringValue("not a struct representation of an API")

	payload, sig, err := a.serializer.Serialize(&securityv1.Resource{
		Config: &securityv1.Resource_ApiLiteral_{
			ApiLiteral: &securityv1.Resource_ApiLiteral{
				Data: invalidApiLiteral,
			},
		},
	})
	verifyPayloadAndSignature(t, string(payload), "", sig, nil, err, &sberrors.ValidationError{})
}

func TestSerializeUnwrapApiLiteralError(t *testing.T) {
	a := validArgs(t, applicationTrigger, true)

	nonUTF8Str := string([]byte{0xff, 0xfe, 0xfd})
	a.apiLiteral.Fields["trigger"].GetStructValue().Fields[nonUTF8Str] = structpb.NewBoolValue(true)

	payload, sig, err := a.serializer.Serialize(&securityv1.Resource{
		Config: &securityv1.Resource_ApiLiteral_{
			ApiLiteral: &securityv1.Resource_ApiLiteral{
				Data: structpb.NewStructValue(a.apiLiteral),
			},
		},
	})
	verifyPayloadAndSignature(t, string(payload), "", sig, nil, err, sberrors.ErrInternal)
}

func TestSerializeMarshalToJsonError(t *testing.T) {
	a := validArgs(t, noTrigger, false)

	nonUTF8Str := string([]byte{0xff, 0xfe, 0xfd})
	a.literal.GetStructValue().Fields[nonUTF8Str] = structpb.NewBoolValue(true)

	payload, sig, err := a.serializer.Serialize(&securityv1.Resource{
		Config: &securityv1.Resource_Literal_{
			Literal: &securityv1.Resource_Literal{
				Data: structpb.NewStructValue(a.apiLiteral),
			},
		},
	})
	verifyPayloadAndSignature(t, string(payload), "", sig, nil, err, sberrors.ErrInternal)
}

func TestUpdateResourceUnknownResourceType(t *testing.T) {
	a := validArgs(t, applicationTrigger, true)

	unknownResource := &securityv1.Resource{Config: nil}
	anyNewSig := &pbutils.Signature{}

	verifyUpdatedSignature(t, a, unknownResource, anyNewSig, sberrors.ErrInternal, nil)
}

func TestUpdateResourceInvalidApiLiteral(t *testing.T) {
	a := validArgs(t, applicationTrigger, true)

	invalidApiLiteral := structpb.NewStringValue("not a struct representation of an API")
	res := &securityv1.Resource{
		Config: &securityv1.Resource_ApiLiteral_{
			ApiLiteral: &securityv1.Resource_ApiLiteral{
				Data: invalidApiLiteral,
			},
		},
	}
	anyNewSig := &pbutils.Signature{}

	verifyUpdatedSignature(t, a, res, anyNewSig, &sberrors.ValidationError{}, nil)
}

func TestDecodeIfBase64Encoded(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected []byte
		valid    bool
	}{
		{
			name:     "empty string",
			input:    "",
			expected: nil,
			valid:    false,
		},
		{
			name:     "invalid base64 data",
			input:    "not valid base64 ^&*++$#@",
			expected: nil,
			valid:    false,
		},
		{
			name:     "valid base64 data, not base64 encoded",
			input:    "valid+base64+not+encoded+data\n+==",
			expected: nil,
			valid:    false,
		},
		{
			name:     "base64 encoded",
			input:    "YmFzZTY0LWVuY29kZWQ=",
			expected: []byte("base64-encoded"),
			valid:    true,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			actual, isBase64 := decodeIfBase64Encoded(tc.input)

			assert.Equal(t, tc.valid, isBase64)
			assert.Equal(t, tc.expected, actual)
		})
	}
}

func TestConvertBetweenStructpbAndSignatureProto(t *testing.T) {
	testCases := []struct {
		name     string
		sigMap   map[string]any
		sigProto *pbutils.Signature
	}{
		{
			name:     "nil proto",
			sigMap:   nil,
			sigProto: nil,
		},
		{
			name:     "empty proto",
			sigMap:   map[string]any{},
			sigProto: &pbutils.Signature{},
		},
		{
			name: "populated proto, no signature",
			sigMap: map[string]any{
				"keyId": "any-key-id",
			},
			sigProto: &pbutils.Signature{
				KeyId: "any-key-id",
			},
		},
		{
			name: "populated proto with signature",
			sigMap: map[string]any{
				"keyId": "any-key-id",
				"data":  "some-signature-value",
			},
			sigProto: &pbutils.Signature{
				KeyId: "any-key-id",
				Data:  []byte("some-signature-value"),
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			var sigStruct *structpb.Struct
			if tc.sigMap != nil {
				var err error
				sigStruct, err = structpb.NewStruct(tc.sigMap)
				require.NoError(t, err)
			}

			sigProto, err := StructpbToSignatureProto(sigStruct)

			assert.NoError(t, err)
			utils.AssertProtoEqual(t, tc.sigProto, sigProto)

			sig := SignatureProtoToStructpb(tc.sigProto)

			utils.AssertProtoEqual(t, sigStruct, sig)
		})
	}
}

func TestConvertBetweenApiProtoAndStructpb(t *testing.T) {
	testCases := []struct {
		name     string
		apiProto *apiv1.Api
		apiMap   map[string]any
	}{
		{
			name:     "nil proto",
			apiProto: nil,
			apiMap:   nil,
		},
		{
			name:     "empty proto",
			apiProto: &apiv1.Api{},
			apiMap:   map[string]any{},
		},
		{
			name: "populated proto, no signature",
			apiProto: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Id: "00000000-0000-0000-0000-000000000001",
				},
				Trigger: &apiv1.Trigger{
					Config: &apiv1.Trigger_Application_{
						Application: &apiv1.Trigger_Application{
							Id: "app-id",
						},
					},
				},
				Blocks: []*apiv1.Block{},
			},
			apiMap: map[string]any{
				"metadata": map[string]any{
					"id": "00000000-0000-0000-0000-000000000001",
				},
				"trigger": map[string]any{
					"application": map[string]any{
						"id": "app-id",
					},
				},
			},
		},
		{
			name: "populated proto with signature",
			apiProto: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Id: "00000000-0000-0000-0000-000000000001",
				},
				Trigger: &apiv1.Trigger{
					Config: &apiv1.Trigger_Application_{
						Application: &apiv1.Trigger_Application{
							Id: "app-id",
						},
					},
				},
				Blocks: []*apiv1.Block{},
				Signature: &pbutils.Signature{
					KeyId: "any-key-id",
					Data:  []byte("some-signature-value"),
				},
			},
			apiMap: map[string]any{
				"metadata": map[string]any{
					"id": "00000000-0000-0000-0000-000000000001",
				},
				"trigger": map[string]any{
					"application": map[string]any{
						"id": "app-id",
					},
				},
				"signature": map[string]any{
					"keyId": "any-key-id",
					"data":  "some-signature-value",
				},
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			var apiStruct *structpb.Struct
			if tc.apiMap != nil {
				var err error
				apiStruct, err = structpb.NewStruct(tc.apiMap)
				require.NoError(t, err)
			}

			api, err := ApiProtoToStructpb(tc.apiProto)

			assert.NoError(t, err)
			utils.AssertProtoEqual(t, apiStruct, api)

			apiProto, err := StructpbToApiProto(apiStruct)

			assert.NoError(t, err)
			utils.AssertProtoEqual(t, tc.apiProto, apiProto)
		})
	}

}

func TestFailToConvertStructpbToSignatureProto(t *testing.T) {
	invalidSigStruct, err := structpb.NewStruct(map[string]any{
		"keyId": "any-key-id",
	})
	require.NoError(t, err)

	nonUTF8Str := string([]byte{0xff, 0xfe, 0xfd})
	invalidSigStruct.Fields[nonUTF8Str] = structpb.NewBoolValue(true)

	_, err = StructpbToSignatureProto(invalidSigStruct)

	assert.Error(t, err)
}

func TestFailToConvertStructpbToApiProto(t *testing.T) {
	invalidApiStruct, err := structpb.NewStruct(map[string]any{
		"metadata": map[string]any{
			"id": "00000000-0000-0000-0000-000000000001",
		},
	})
	require.NoError(t, err)

	nonUTF8Str := string([]byte{0xff, 0xfe, 0xfd})
	invalidApiStruct.Fields[nonUTF8Str] = structpb.NewBoolValue(true)

	_, err = StructpbToApiProto(invalidApiStruct)

	assert.Error(t, err)
}
