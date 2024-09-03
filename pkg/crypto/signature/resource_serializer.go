package signature

import (
	"encoding/base64"
	"encoding/json"
	"fmt"

	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

//go:generate mockery --name=ResourceSerializer --output . --filename resource_serializer_mock.go --inpackage --outpkg signature --structname MockResourceSerializer
type ResourceSerializer interface {
	Serialize(*securityv1.Resource) ([]byte, []byte, error)
	UpdateResourceWithSignature(*securityv1.Resource, string, []byte) error
}

type resourceSerializer struct{}

func NewResourceSerializer() ResourceSerializer {
	return &resourceSerializer{}
}

func (r *resourceSerializer) Serialize(resource *securityv1.Resource) ([]byte, []byte, error) {
	var payload proto.Message
	var signature []byte
	{
		switch v := resource.Config.(type) {
		case *securityv1.Resource_Api:
			api := &apiv1.Api{
				Blocks:  v.Api.GetBlocks(),
				Trigger: v.Api.GetTrigger(),
			}

			if v.Api.GetTrigger() != nil {
				// NOTE(frank): We do not want to sign any profile settings.
				switch v := v.Api.GetTrigger().Config.(type) {
				case *apiv1.Trigger_Job_:
					v.Job.Options = nil
				case *apiv1.Trigger_Workflow_:
					v.Workflow.Options = nil
				}
			}

			var err error
			payload, err = ApiProtoToStructpb(api)
			if err != nil {
				return nil, nil, fmt.Errorf("%w: converting payload to structpb failed: %w", sberrors.ErrInternal, err)
			}

			signature = v.Api.GetSignature().GetData()
		case *securityv1.Resource_ApiLiteral_:
			err := validateApiLiteral(v.ApiLiteral.GetData())
			if err != nil {
				return nil, nil, err
			}

			payload, signature, err = unwrapApiLiteral(v.ApiLiteral.GetData())
			if err != nil {
				return nil, nil, fmt.Errorf("%w: unwrapping api literal failed: %w", sberrors.ErrInternal, err)
			}
		case *securityv1.Resource_Literal_:
			payload = v.Literal.GetData()
			signature = v.Literal.GetSignature().GetData()
		default:
			return nil, nil, sberrors.ErrInternal
		}
	}

	// NOTE(frank): It is CRITICAL that this logic not change. For example, if you
	// switched it to protojson.Marshal, we'd have a production outage because of
	// the randomness that library introduces into the output which would affect
	// signatures
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, nil, fmt.Errorf("%w: serializing api literal to JSON failed: %w", sberrors.ErrInternal, err)
	}

	// NOTE(carl): The JSON marshalers used to construct API literals do not know which
	// fields in the struct are byte strings, and thus may leave the provided signature
	// as a base64 encoded (byte) string rather than the automatic decoding that happens
	// with strict protos (when a byte field is encountered). We check if the signature
	// here is base64 encoded and if it is, we decode it before returning it to the caller.
	if decodedSig, isBase64Encoded := decodeIfBase64Encoded(string(signature)); isBase64Encoded {
		signature = decodedSig
	}

	return data, signature, nil
}

func (r *resourceSerializer) UpdateResourceWithSignature(resource *securityv1.Resource, signingKeyId string, signature []byte) error {
	sig := &pbutils.Signature{
		KeyId: signingKeyId,
		Data:  signature,
	}

	switch v := resource.Config.(type) {
	case *securityv1.Resource_Api:
		v.Api.Signature = sig
	case *securityv1.Resource_ApiLiteral_:
		api := v.ApiLiteral.GetData()
		if err := validateApiLiteral(api); err != nil {
			return err
		}

		api.GetStructValue().GetFields()["signature"] = structpb.NewStructValue(SignatureProtoToStructpb(sig))
	case *securityv1.Resource_Literal_:
		v.Literal.Signature = sig
	default:
		return fmt.Errorf("%w: unknown resource type: %T", sberrors.ErrInternal, v)
	}

	return nil
}

func validateApiLiteral(literal *structpb.Value) error {
	api := literal.GetStructValue()
	if api == nil {
		return &sberrors.ValidationError{
			Issues: []error{fmt.Errorf("resource literal is not a struct: %T", literal.GetKind())},
		}
	}

	return nil
}

func unwrapApiLiteral(literal *structpb.Value) (proto.Message, []byte, error) {
	literalStruct := literal.GetStructValue()

	var signatureData []byte
	if signature, err := utils.GetStructField(literalStruct, "signature.data"); err == nil && signature != nil {
		signatureData = []byte(signature.GetStringValue())
	}

	api := literalStruct.AsMap()

	payloadData := make(map[string]any)
	if api["blocks"] != nil {
		payloadData["blocks"] = api["blocks"]
	}
	if strippedTrigger := getTriggerWithOptionsStripped(api["trigger"]); strippedTrigger != nil {
		payloadData["trigger"] = strippedTrigger
	}

	payload, err := structpb.NewStruct(payloadData)
	if err != nil {
		return nil, nil, err
	}

	return payload, signatureData, nil
}

func getTriggerWithOptionsStripped(trigger any) map[string]any {
	triggerMap, ok := trigger.(map[string]any)
	if !ok {
		return nil
	}

	strippedTrigger := utils.CopyGoMap(triggerMap)

	if wf, ok := strippedTrigger["workflow"]; ok {
		if wfMap, ok := wf.(map[string]any); ok {
			delete(wfMap, "options")
		}
	}

	if job, ok := strippedTrigger["job"]; ok {
		if jobMap, ok := job.(map[string]any); ok {
			delete(jobMap, "options")
		}
	}

	return strippedTrigger
}

func decodeIfBase64Encoded(s string) ([]byte, bool) {
	if s == "" {
		return nil, false
	}

	d, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		return nil, false
	}

	// Check if it decodes correctly
	if base64.StdEncoding.EncodeToString(d) != s {
		return nil, false
	}

	return d, true
}

func SignatureProtoToStructpb(sig *pbutils.Signature) *structpb.Struct {
	if sig == nil {
		return nil
	}

	sigStruct, _ := utils.ProtoToStructPb(sig)
	sigData := sig.GetData()

	if sigData != nil {
		sigStruct.Fields["data"] = structpb.NewStringValue(string(sigData))
	}

	return sigStruct
}

func StructpbToSignatureProto(data *structpb.Struct) (*pbutils.Signature, error) {
	if data == nil {
		return nil, nil
	}

	data = proto.Clone(data).(*structpb.Struct)
	sigData, err := utils.GetStructField(data, "data")
	if err == nil && sigData != nil {
		encodedSigData := base64.StdEncoding.EncodeToString([]byte(sigData.GetStringValue()))
		data.Fields["data"] = structpb.NewStringValue(encodedSigData)
	}

	sig := &pbutils.Signature{}
	if err := utils.StructPbToProto(data, sig); err != nil {
		return nil, fmt.Errorf("failed to convert %T into %T: %w", data, sig, err)
	}

	return sig, nil
}

func ApiProtoToStructpb(api *apiv1.Api) (*structpb.Struct, error) {
	if api == nil {
		return nil, nil
	}

	apiStruct, _ := utils.ProtoToStructPb(api)
	sig := api.GetSignature().GetData()
	if sig == nil {
		return apiStruct, nil
	}

	sigStruct, err := utils.GetStructField(apiStruct, "signature")
	if err != nil {
		return nil, fmt.Errorf("failed to convert %T into %T: %w", api, apiStruct, err)
	}

	sigStruct.GetStructValue().Fields["data"] = structpb.NewStringValue(string(sig))

	return apiStruct, nil
}

func StructpbToApiProto(data *structpb.Struct) (*apiv1.Api, error) {
	if data == nil {
		return nil, nil
	}

	data = proto.Clone(data).(*structpb.Struct)
	sig, err := utils.GetStructField(data, "signature.data")
	if err == nil && sig != nil {
		encodedSig := base64.StdEncoding.EncodeToString([]byte(sig.GetStringValue()))
		data.Fields["signature"].GetStructValue().Fields["data"] = structpb.NewStringValue(encodedSig)
	}

	api := &apiv1.Api{}
	if err := utils.StructPbToProto(data, api); err != nil {
		return nil, fmt.Errorf("failed to convert %T into %T: %w", data, api, err)
	}

	return api, nil
}
