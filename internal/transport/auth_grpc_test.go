package transport

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	authMocks "github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/types"
	"github.com/superblocksteam/agent/internal/fetch"
	fetchMocks "github.com/superblocksteam/agent/internal/fetch/mocks"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	pluginscommonv1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestExchangeOauthCodeForToken(t *testing.T) {
	testCases := []struct {
		name                  string
		integrationId         string
		configurationId       string
		profileId             string
		profileName           string
		authType              string
		authConfig            *pluginscommonv1.OAuth_AuthorizationCodeFlow
		accessCode            string
		fetchedConfiguration  map[string]interface{}
		fetchIntegrationError error
	}{
		{
			name:          "integration exists",
			integrationId: "integrationId",
			profileId:     "42",
			profileName:   "production",
			fetchedConfiguration: map[string]interface{}{
				"authType": "oauth-code",
				"authConfig": map[string]interface{}{
					"tokenUrl": "https://google.com",
				},
			},
			accessCode: "accessCode",
			authType:   "oauth-code",
		},
		{
			name:        "integration doesn't exist",
			profileId:   "42",
			profileName: "production",
			accessCode:  "accessCode",
			authType:    "oauth-code",
			authConfig: &pluginscommonv1.OAuth_AuthorizationCodeFlow{
				TokenUrl: "https://google.com",
			},
			fetchIntegrationError: errors.ErrNotFound,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {

			fetcher := &fetchMocks.Fetcher{}
			tokenManager := &authMocks.TokenManager{}

			if tc.fetchIntegrationError != nil {
				fetcher.On("FetchIntegration", mock.Anything, tc.integrationId, mock.Anything).Return(nil, tc.fetchIntegrationError)
			} else {
				fetcher.On("FetchIntegration", mock.Anything, tc.integrationId, mock.MatchedBy(func(p *commonv1.Profile) bool {
					return p.Id == &tc.profileId && p.Name == &tc.profileName
				})).Return(&fetch.Integration{
					Configuration: tc.fetchedConfiguration,
				}, nil)
			}

			var expectedAuthConfig *pluginscommonv1.OAuth_AuthorizationCodeFlow = &pluginscommonv1.OAuth_AuthorizationCodeFlow{}
			if tc.authConfig != nil {
				expectedAuthConfig = tc.authConfig
			} else {
				authConfigStruct, _ := structpb.NewValue(tc.fetchedConfiguration["authConfig"])
				_ = jsonutils.MapToProto(authConfigStruct.GetStructValue().AsMap(), expectedAuthConfig)
			}

			tokenManager.On("ExchangeOauthCodeForToken",
				mock.Anything,
				tc.authType,
				mock.MatchedBy(func(actualAuthConfig *pluginscommonv1.OAuth_AuthorizationCodeFlow) bool {
					return actualAuthConfig.TokenUrl == expectedAuthConfig.TokenUrl
				}),
				tc.accessCode,
				tc.integrationId,
				tc.configurationId,
			).Return(nil)

			grpcServer := NewServer(&Config{
				Fetcher:      fetcher,
				TokenManager: tokenManager,
			})

			ctx := context.Background()

			response, err := grpcServer.ExchangeOauthCodeForToken(ctx, &apiv1.ExchangeOauthCodeForTokenRequest{
				IntegrationId: tc.integrationId,
				Profile: &commonv1.Profile{
					Id:   &tc.profileId,
					Name: &tc.profileName,
				},
				AuthType:   tc.authType,
				AuthConfig: tc.authConfig,
				AccessCode: tc.accessCode,
			})
			assert.Empty(t, response)
			assert.NoError(t, err)
		})
	}
}

func TestRequestOauthPasswordToken(t *testing.T) {

	testCases := []struct {
		name                      string
		integrationId             string
		configurationId           string
		profileId                 string
		profileName               string
		authConfig                *pluginscommonv1.OAuth_PasswordGrantFlow
		fetchedConfiguration      map[string]interface{}
		fetchedOAuthPasswordToken *types.Response
	}{
		{
			name:          "happy path scenario",
			integrationId: "integrationId",
			profileId:     "42",
			profileName:   "production",
			fetchedConfiguration: map[string]interface{}{
				"authConfig": map[string]interface{}{
					"Username": "username",
					"Password": "password",
				},
			},
			fetchedOAuthPasswordToken: &types.Response{
				AccessToken:  "accessToken",
				RefreshToken: "refreshToken",
				ExpiresIn:    3600,
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {

			fetcher := &fetchMocks.Fetcher{}
			tokenManager := &authMocks.TokenManager{}

			fetcher.On("FetchIntegration", mock.Anything, tc.integrationId, mock.MatchedBy(func(p *commonv1.Profile) bool {
				return p.Id == &tc.profileId && p.Name == &tc.profileName
			})).Return(&fetch.Integration{
				Configuration: tc.fetchedConfiguration,
			}, nil)

			var expectedAuthConfig *pluginscommonv1.OAuth_PasswordGrantFlow = &pluginscommonv1.OAuth_PasswordGrantFlow{}
			if tc.authConfig != nil {
				expectedAuthConfig = tc.authConfig
			} else {
				authConfigStruct, _ := structpb.NewValue(tc.fetchedConfiguration["authConfig"])
				_ = jsonutils.MapToProto(authConfigStruct.GetStructValue().AsMap(), expectedAuthConfig)
			}

			tokenManager.On("FetchNewOauthPasswordToken",
				mock.MatchedBy(func(actualAuthConfig *pluginscommonv1.OAuth_PasswordGrantFlow) bool {
					return actualAuthConfig.Username == expectedAuthConfig.Username && actualAuthConfig.Password == expectedAuthConfig.Password
				}),
			).Return(tc.fetchedOAuthPasswordToken, nil)

			grpcServer := NewServer(&Config{
				Fetcher:      fetcher,
				TokenManager: tokenManager,
			})

			ctx := context.Background()

			response, err := grpcServer.RequestOauthPasswordToken(ctx, &apiv1.RequestOauthPasswordTokenRequest{
				IntegrationId: tc.integrationId,
				Profile: &commonv1.Profile{
					Id:   &tc.profileId,
					Name: &tc.profileName,
				},
			})
			assert.NotEmpty(t, response)
			assert.NoError(t, err)

			nowMs := time.Now().UnixMilli()
			assert.InDelta(t, response.ExpiryTimestamp, nowMs, float64(tc.fetchedOAuthPasswordToken.ExpiresIn)*1000)
			assert.Equal(t, response.AccessToken, tc.fetchedOAuthPasswordToken.AccessToken)
			assert.Equal(t, response.RefreshToken, tc.fetchedOAuthPasswordToken.RefreshToken)
		})
	}
}
