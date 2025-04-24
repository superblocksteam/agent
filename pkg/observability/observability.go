package observability

import (
	"context"

	"go.opentelemetry.io/otel/attribute"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	"github.com/superblocksteam/agent/pkg/constants"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

const (
	OBS_TAG_REMOTE                 = "remote"
	OBS_TAG_ORG_ID                 = "organization-id"
	OBS_TAG_ORG_NAME               = "organization-name"
	OBS_TAG_ORG_TIER               = "organization-tier"
	OBS_TAG_USER_EMAIL             = "user-email"
	OBS_TAG_USER_TYPE              = "user-type"
	OBS_TAG_BILLING_PLAN           = "billing-plan"
	OBS_TAG_RESOURCE_TYPE          = "resource-type"
	OBS_TAG_RESOURCE_ID            = "resource-id"
	OBS_TAG_RESOURCE_NAME          = "resource-name"
	OBS_TAG_RESOURCE_ACTION        = "resource-action"
	OBS_TAG_EVENT_TYPE             = "event-type"
	OBS_TAG_PAGE_ID                = "page-id"
	OBS_TAG_APPLICATION_ID         = "application-id"
	OBS_TAG_APPLICATION_NAME       = "application-name"
	OBS_TAG_PARENT_ID              = "parent-id"
	OBS_TAG_PARENT_NAME            = "parent-name"
	OBS_TAG_PARENT_TYPE            = "parent-type"
	OBS_TAG_PLUGIN_NAME            = "plugin-name"
	OBS_TAG_PLUGIN_VERSION         = "plugin-version"
	OBS_TAG_PLUGIN_EVENT           = "plugin-event"
	OBS_TAG_INTEGRATION_ID         = "integration-id"
	OBS_TAG_API_ID                 = "api-id"
	OBS_TAG_API_TYPE               = "api-type"
	OBS_TAG_API_NAME               = "api-name"
	OBS_TAG_WIDGET_TYPE            = "widget-type"
	OBS_TAG_PROFILE_ID             = "profile-id"
	OBS_TAG_PROFILE                = "profile"
	OBS_TAG_ENV                    = "environment"
	OBS_TAG_CORRELATION_ID         = "correlation-id"
	OBS_TAG_CONTROLLER_ID          = "orchestrator-id"
	OBS_TAG_WORKER_ID              = "worker-id"
	OBS_TAG_AGENT_ID               = "agent-id"
	OBS_TAG_AGENT_VERSION          = "agent-version"
	OBS_TAG_AGENT_VERSION_EXTERNAL = "agent-version-external"
	OBS_TAG_AGENT_URL              = "agent-url"
	OBS_TAG_ERROR                  = "error"
	OBS_TAG_ERROR_TYPE             = "error-type"
	OBS_TAG_ERROR_PRIORITY         = "error-priority"
	OBS_TAG_VIEW_MODE              = "view-mode"
	OBS_TAG_RESPONSE_SIZE          = "response-size"
	OBS_TAG_DURATION               = "duration"
	OBS_TAG_FETCH_BYTES            = "fetch-bytes"
	OBS_TAG_PUSH_BYTES             = "push-bytes"
	OBS_TAG_REMAINING_TIME         = "remaining-time"
	OBS_TAG_COMPONENT              = "component"
)

func GetUserTypeStringFromPb(userType commonv1.UserType) string {
	switch userType {
	case commonv1.UserType_USER_TYPE_SUPERBLOCKS:
		return "superblocks"
	case commonv1.UserType_USER_TYPE_EXTERNAL:
		return "external"
	default:
		return ""
	}
}

func GetUserTypePbFromString(userType string) commonv1.UserType {
	switch userType {
	case "superblocks":
		return commonv1.UserType_USER_TYPE_SUPERBLOCKS
	case "external":
		return commonv1.UserType_USER_TYPE_EXTERNAL
	default:
		return commonv1.UserType_USER_TYPE_UNSPECIFIED
	}
}

func Enrich(api *apiv1.Api, viewMode *apiv1.ViewMode) (fields []zap.Field) {

	if viewMode != nil {
		fields = append(fields, zap.String(OBS_TAG_VIEW_MODE, viewMode.String()))
	}

	if api != nil {

		// TODO(frank): Much more!!

		if api.GetMetadata() != nil {
			fields = append(fields, zap.String(OBS_TAG_ORG_ID, api.GetMetadata().Organization))
			fields = append(fields, zap.String(OBS_TAG_RESOURCE_NAME, api.GetMetadata().GetName()))
			fields = append(fields, zap.String(OBS_TAG_RESOURCE_ID, api.GetMetadata().GetId()))
		}

		if api.GetTrigger() != nil && api.GetTrigger().GetApplication() != nil {
			fields = append(fields, zap.String(OBS_TAG_APPLICATION_ID, api.GetTrigger().GetApplication().GetId()))
		}

	}

	return
}

func ExtractUserInfo(ctx context.Context, definitionMetadata *apiv1.Definition_Metadata) (string, *commonv1.UserType, bool) {
	userEmail, ok1 := jwt_validator.GetUserEmail(ctx)
	userTypeStr, ok2 := jwt_validator.GetUserType(ctx)
	var userType = commonv1.UserType_USER_TYPE_UNSPECIFIED
	if ok1 && ok2 && userEmail != "" && userTypeStr != "" {
		userType = GetUserTypePbFromString(userTypeStr)
	} else if definitionMetadata != nil {
		userEmail = definitionMetadata.GetRequester()
		userType = definitionMetadata.GetRequesterType()
	}
	// Not checking userType for backward compatibility
	if userEmail != "" {
		return userEmail, &userType, true
	}

	return "", &userType, false
}

func EnrichUserInfo(ctx context.Context, definitionMetadata *apiv1.Definition_Metadata) []zap.Field {
	return FieldsToZap(EnrichUserInfoToMap(ctx, definitionMetadata))
}

func EnrichUserInfoToMap(ctx context.Context, definitionMetadata *apiv1.Definition_Metadata) map[string]any {
	userInfo := make(map[string]any)
	userEmail, userType, ok := ExtractUserInfo(ctx, definitionMetadata)
	if ok {
		userInfo[OBS_TAG_USER_EMAIL] = userEmail
		userInfo[OBS_TAG_USER_TYPE] = GetUserTypeStringFromPb(*userType)
	}

	return userInfo
}

func FieldsToZap(fields map[string]any) []zap.Field {
	zapFields := make([]zap.Field, 0, len(fields))

	for k, v := range fields {
		zapFields = append(zapFields, zap.Any(k, v))
	}

	return zapFields
}

func FieldsToAttributes(fields map[string]any) []attribute.KeyValue {
	attributes := make([]attribute.KeyValue, 0, len(fields))

	for k, v := range fields {
		s, ok := v.(string)
		if !ok {
			continue
		}

		attributes = append(attributes, attribute.String(k, s))
	}

	return attributes
}

// ZapField takes a context and returns a zapcore.Field for the correlation-id.
func ZapField(ctx context.Context) zapcore.Field {
	return zap.String(OBS_TAG_CORRELATION_ID, constants.CorrelationID(ctx))
}

// ZapLogger takes a context and log and returns a logger with correlation-id set to the context's
// correlation-id.
func ZapLogger(ctx context.Context, log *zap.Logger) *zap.Logger {
	if log == nil {
		return log
	}

	return log.With(ZapField(ctx))
}
