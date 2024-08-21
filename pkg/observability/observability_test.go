package observability

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	grpc_jwt "github.com/superblocksteam/agent/pkg/middleware/jwt"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"go.uber.org/zap"
)

func TestEnrichUserInfo(t *testing.T) {
	// Define test cases with actual implementations
	testCases := []struct {
		name           string
		ctx            context.Context
		definition     *apiv1.Definition_Metadata
		expectedFields []zap.Field
	}{
		{
			name:       "Valid context with superblocks user type",
			ctx:        context.WithValue(context.WithValue(context.Background(), grpc_jwt.ContextKeyUserEmail, "test@sb.com"), grpc_jwt.ContextKeyUserType, "superblocks"),
			definition: &apiv1.Definition_Metadata{},
			expectedFields: []zap.Field{
				zap.String(OBS_TAG_USER_EMAIL, "test@sb.com"),
				zap.String(OBS_TAG_USER_TYPE, "superblocks"),
			},
		},
		{
			name:       "Valid context with external user type",
			ctx:        context.WithValue(context.WithValue(context.Background(), grpc_jwt.ContextKeyUserEmail, "test@sb.com"), grpc_jwt.ContextKeyUserType, "external"),
			definition: &apiv1.Definition_Metadata{},
			expectedFields: []zap.Field{
				zap.String(OBS_TAG_USER_EMAIL, "test@sb.com"),
				zap.String(OBS_TAG_USER_TYPE, "external"),
			},
		},
		{
			name:       "Valid context with unspecified user type",
			ctx:        context.WithValue(context.WithValue(context.Background(), grpc_jwt.ContextKeyUserEmail, "test@sb.com"), grpc_jwt.ContextKeyUserType, "unspecified"),
			definition: &apiv1.Definition_Metadata{},
			expectedFields: []zap.Field{
				zap.String(OBS_TAG_USER_EMAIL, "test@sb.com"),
				zap.String(OBS_TAG_USER_TYPE, ""),
			},
		},
		{
			name: "No context and metadata with superblocks user type",
			ctx:  context.Background(),
			definition: &apiv1.Definition_Metadata{
				Requester:     "test@sb.com",
				RequesterType: commonv1.UserType_USER_TYPE_SUPERBLOCKS.Enum(),
			},
			expectedFields: []zap.Field{
				zap.String(OBS_TAG_USER_EMAIL, "test@sb.com"),
				zap.String(OBS_TAG_USER_TYPE, "superblocks"),
			},
		},
		{
			name: "No context and metadata with external user type",
			ctx:  context.Background(),
			definition: &apiv1.Definition_Metadata{
				Requester:     "test@sb.com",
				RequesterType: commonv1.UserType_USER_TYPE_EXTERNAL.Enum(),
			},
			expectedFields: []zap.Field{
				zap.String(OBS_TAG_USER_EMAIL, "test@sb.com"),
				zap.String(OBS_TAG_USER_TYPE, "external"),
			},
		},
		{
			name: "No context and metadata with invalid user type",
			ctx:  context.Background(),
			definition: &apiv1.Definition_Metadata{
				Requester:     "test@sb.com",
				RequesterType: commonv1.UserType_USER_TYPE_UNSPECIFIED.Enum(),
			},
			expectedFields: []zap.Field{
				zap.String(OBS_TAG_USER_EMAIL, "test@sb.com"),
				zap.String(OBS_TAG_USER_TYPE, ""),
			},
		},
		{
			name:           "Invalid context or metadata (no extraction)",
			ctx:            context.Background(),
			definition:     &apiv1.Definition_Metadata{},
			expectedFields: []zap.Field{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			fields := EnrichUserInfo(tc.ctx, tc.definition)

			// Assert expected output
			assert.Len(t, fields, len(tc.expectedFields))
			assert.ElementsMatch(t, tc.expectedFields, fields)
		})
	}
}

func TestEnrich(t *testing.T) {
	testCases := []struct {
		name           string
		api            *apiv1.Api
		viewMode       *apiv1.ViewMode
		expectedFields []zap.Field
	}{
		{
			name:           "nothing given",
			expectedFields: []zap.Field{},
		},
		{
			name:     "view mode",
			viewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED.Enum(),
			expectedFields: []zap.Field{
				zap.String(OBS_TAG_VIEW_MODE, "VIEW_MODE_DEPLOYED"),
			},
		},
		{
			name: "api metadata",
			api:  &apiv1.Api{Metadata: &commonv1.Metadata{Organization: "org", Name: "name", Id: "id"}},
			expectedFields: []zap.Field{
				zap.String(OBS_TAG_ORG_ID, "org"),
				zap.String(OBS_TAG_RESOURCE_NAME, "name"),
				zap.String(OBS_TAG_RESOURCE_ID, "id"),
			},
		},
		{
			name: "trigger",
			api: &apiv1.Api{
				Trigger: &apiv1.Trigger{
					Config: &apiv1.Trigger_Application_{
						Application: &apiv1.Trigger_Application{
							Id: "id",
						},
					},
				},
			},
			expectedFields: []zap.Field{
				zap.String(OBS_TAG_APPLICATION_ID, "id"),
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			fields := Enrich(tc.api, tc.viewMode)
			assert.Equal(t, len(tc.expectedFields), len(fields), "length of fields differs")
			assert.ElementsMatch(t, tc.expectedFields, fields)
		})
	}
}
