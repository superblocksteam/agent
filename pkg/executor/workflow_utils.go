package executor

import (
	"fmt"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	workflowv1 "github.com/superblocksteam/agent/types/gen/go/plugins/workflow/v1"
	workflowv2 "github.com/superblocksteam/agent/types/gen/go/plugins/workflow/v2"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"

	"github.com/superblocksteam/agent/pkg/jsonutils"
)

func ToV2(p *workflowv1.Plugin, logger *zap.Logger) (*workflowv2.Plugin, error) {
	if p == nil {
		return nil, fmt.Errorf("plugin is nil")
	}

	if p.Workflow == "" {
		return nil, fmt.Errorf("workflow step is empty, check your step configuration")
	}

	v2 := &workflowv2.Plugin{
		Id: p.Workflow,
		Parameters: &commonv1.HttpParameters{
			Query: map[string]*structpb.Value{},
			Body:  map[string]*structpb.Value{},
		},
	}

	for k, v := range p.QueryParams {
		if v != nil {
			// Params are not parsed
			v2.Parameters.Query[k] = structpb.NewStringValue(*v.Value)
		}
	}

	for k, v := range p.Custom {
		if v != nil {
			// Need to go from string value to rich type (eg array, object, etc). Fallback to string if not possible
			if v.Value == nil {
				v.Value = proto.String("")
			}

			pb, err := jsonutils.ToProto(*v.Value)
			if err != nil {
				pb = structpb.NewStringValue(*v.Value)
				logger.Debug("Failed to serialize a custom field while converting to workflow v2", zap.String("key", k), zap.Error(err))
			}

			v2.Parameters.Body[k] = pb
		}
	}

	return v2, nil
}

func ToHttpParameters(triggerParams *apiv1.Trigger_Workflow_Parameters) *commonv1.HttpParameters {
	parameters := &commonv1.HttpParameters{
		Query: map[string]*structpb.Value{},
	}

	if triggerParams == nil {
		return parameters
	}

	if q := triggerParams.GetQuery(); q != nil {
		for k, v := range q {
			if len(v.Values) == 1 {
				parameters.Query[k] = structpb.NewStringValue(v.Values[0])
			} else if len(v.Values) > 1 {
				l := &structpb.ListValue{}
				for _, value := range v.Values {
					l.Values = append(l.Values, structpb.NewStringValue(value))
				}
				parameters.Query[k] = structpb.NewListValue(l)
			}
		}
	}

	if b := triggerParams.GetBody(); b != nil {
		parameters.Body = b
	}

	return parameters
}
