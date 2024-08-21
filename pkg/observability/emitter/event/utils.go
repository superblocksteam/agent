package event

import (
	"encoding/json"
	"log"

	"github.com/golang/protobuf/jsonpb"
	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/plugin"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	eventv1 "github.com/superblocksteam/agent/types/gen/go/event/v1"
	"go.uber.org/zap"
)

const ExecuteEventType = "com.superblocks.execution"

func LogBlockStart(logger *zap.Logger, ctx *apictx.Context, block *apiv1.Block, orgId string, isDeployed bool) {
	logBlockEvent(logger, ctx, block, orgId, isDeployed, eventv1.Status_STATUS_STARTED, nil)
}

func LogBlockEnd(logger *zap.Logger, ctx *apictx.Context, block *apiv1.Block, orgId string, isDeployed bool, result apiv1.BlockStatus) {
	logBlockEvent(logger, ctx, block, orgId, isDeployed, eventv1.Status_STATUS_ENDED, &result)
}

func LogApiStart(logger *zap.Logger, executionId string, api *apiv1.Api, orgId string, isDeployed bool) {
	logApiEvent(logger, executionId, api, orgId, isDeployed, eventv1.Status_STATUS_STARTED)
}

func LogApiEnd(logger *zap.Logger, executionId string, api *apiv1.Api, orgId string, isDeployed bool) {
	logApiEvent(logger, executionId, api, orgId, isDeployed, eventv1.Status_STATUS_ENDED)
}

func logBlockEvent(logger *zap.Logger, ctx *apictx.Context, block *apiv1.Block, orgId string, isDeployed bool, status eventv1.Status, result *apiv1.BlockStatus) {
	m := &jsonpb.Marshaler{}
	blockType := block.Type()
	integrationId := block.GetStep().GetIntegration()
	pluginName := ""

	if plugin, ok := block.GetStep().GetConfig().(plugin.Plugin); ok {
		pluginName = plugin.Name()
	}

	var deployMode eventv1.Mode
	if isDeployed {
		deployMode = eventv1.Mode_MODE_DEPLOYED
	} else {
		deployMode = eventv1.Mode_MODE_EDITOR
	}

	var parentType eventv1.Type
	if ctx.ParentType == apiv1.BlockType_BLOCK_TYPE_UNSPECIFIED {
		parentType = eventv1.Type_TYPE_EXECUTION_API
	} else {
		parentType = eventv1.Type_TYPE_EXECUTION_BLOCK
	}

	executionEvent := &eventv1.ExecutionEvent{
		ExecutionId:          ctx.Execution,
		ResourceId:           "",
		ResourceName:         block.Name,
		ResourceType:         eventv1.Type_TYPE_EXECUTION_BLOCK,
		ResourceSubtype:      &blockType,
		Result:               result,
		Status:               status,
		IntegrationId:        &integrationId,
		IntegrationType:      &pluginName,
		Mode:                 deployMode,
		OrganizationId:       orgId,
		UserId:               nil,
		Trigger:              0,
		ParentId:             nil,
		ParentName:           &ctx.Parent,
		ParentType:           &parentType,
		IsDescendantOfStream: ctx.IsDescendantOfStream(),
	}

	jsonStr, err := m.MarshalToString(executionEvent)
	if err != nil {
		logger.Warn("Failed to marshal execution event to json string", zap.Error(err), zap.String("payload", executionEvent.String()))
	}

	data := map[string]interface{}{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		log.Fatalf("Error unmarshaling execution event JSON: %v", err)
	}

	logger.Info(
		jsonStr,
		zap.Bool("_event", true),
		zap.String("id", executionEvent.ExecutionId),
		zap.String("type", ExecuteEventType),
		zap.Any("data", data),
	)
}

func logApiEvent(logger *zap.Logger, executionId string, api *apiv1.Api, orgId string, isDeployed bool, status eventv1.Status) {
	m := &jsonpb.Marshaler{}

	var deployMode eventv1.Mode
	if isDeployed {
		deployMode = eventv1.Mode_MODE_DEPLOYED
	} else {
		deployMode = eventv1.Mode_MODE_EDITOR
	}

	executionEvent := &eventv1.ExecutionEvent{
		ExecutionId:     executionId,
		ResourceId:      api.Metadata.Id,
		ResourceName:    api.Metadata.Name,
		ResourceType:    eventv1.Type_TYPE_EXECUTION_API,
		ResourceSubtype: nil,
		Result:          nil,
		Status:          status,
		IntegrationId:   nil,
		IntegrationType: nil,
		Mode:            deployMode,
		OrganizationId:  orgId,
		UserId:          nil,
		Trigger:         0,
		ParentId:        nil,
		ParentName:      nil,
		ParentType:      nil,
	}

	jsonStr, err := m.MarshalToString(executionEvent)

	if err != nil {
		logger.Warn("Failed to marshal execution event to json string", zap.Error(err), zap.String("payload", executionEvent.String()))
	}

	data := map[string]interface{}{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		log.Fatalf("Error unmarshaling execution event JSON: %v", err)
	}

	logger.Info(
		jsonStr,
		zap.Bool("_event", true),
		zap.String("id", executionEvent.ExecutionId),
		zap.String("type", ExecuteEventType),
		zap.Any("data", data),
	)
}
