package transport

import (
	"context"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	authMocks "github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/types"
	"github.com/superblocksteam/agent/internal/fetch"
	fetchMocks "github.com/superblocksteam/agent/internal/fetch/mocks"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	secretsMocks "github.com/superblocksteam/agent/pkg/secrets/mocks"
	"github.com/superblocksteam/agent/pkg/store"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	pluginscommonv1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestExchangeOauthCodeForToken(t *testing.T) {
	metrics.RegisterMetrics()
	testCases := []struct {
		name                    string
		integrationId           string
		configurationId         string
		profileId               string
		profileName             string
		authType                string
		authConfig              *pluginscommonv1.OAuth_AuthorizationCodeFlow
		secretMap               map[string]string
		accessCode              string
		fetchedConfiguration    map[string]interface{}
		authConfigAssertionFunc func(*pluginscommonv1.OAuth_AuthorizationCodeFlow) bool
		fetchIntegrationError   error
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
			name:          "integration exists + bindings",
			integrationId: "integrationId",
			profileId:     "42",
			profileName:   "production",
			fetchedConfiguration: map[string]interface{}{
				"authType": "oauth-code",
				"authConfig": map[string]interface{}{
					"tokenUrl":     "https://google.com",
					"clientSecret": "{{Env.client_secret}}",
				},
			},
			authConfig: &pluginscommonv1.OAuth_AuthorizationCodeFlow{
				TokenUrl:     "https://google.com",
				ClientSecret: "{{Env.client_secret}}",
			},
			accessCode: "accessCode",
			authType:   "oauth-code",
			authConfigAssertionFunc: func(actualAuthConfig *pluginscommonv1.OAuth_AuthorizationCodeFlow) bool {
				return actualAuthConfig.ClientSecret == "aClientSecret"
			},
			secretMap: map[string]string{
				"client_secret": "aClientSecret",
			},
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
			secretManager := &secretsMocks.SecretManager{}

			if tc.fetchIntegrationError != nil {
				fetcher.On("FetchIntegration", mock.Anything, tc.integrationId, mock.Anything).Return(nil, tc.fetchIntegrationError)
			} else {
				fetcher.On("FetchIntegration", mock.Anything, tc.integrationId, mock.MatchedBy(func(p *commonv1.Profile) bool {
					return p.Id == &tc.profileId && p.Name == &tc.profileName
				})).Return(&fetch.Integration{
					Configuration: tc.fetchedConfiguration,
				}, nil)
			}

			fetcher.On("FetchIntegrations", mock.Anything, mock.Anything, mock.Anything).Return(&integrationv1.GetIntegrationsResponse{
				Data: []*integrationv1.Integration{},
			}, nil).Maybe()

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
					if tc.authConfigAssertionFunc != nil && !tc.authConfigAssertionFunc(actualAuthConfig) {
						return false
					}
					return actualAuthConfig.TokenUrl == expectedAuthConfig.TokenUrl
				}),
				tc.accessCode,
				tc.integrationId,
				tc.configurationId,
			).Return(nil)

			if tc.secretMap != nil {
				secretManager.On("GetSecrets").Return(tc.secretMap, nil)
			}

			grpcServer := NewServer(&Config{
				Fetcher:       fetcher,
				TokenManager:  tokenManager,
				SecretManager: secretManager,
				Store:         store.Memory(),
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
	metrics.RegisterMetrics()
	testCases := []struct {
		name                      string
		username                  string
		password                  string
		integrationId             string
		configurationId           string
		profileId                 string
		profileName               string
		authConfig                *pluginscommonv1.OAuth_PasswordGrantFlow
		fetchedConfiguration      map[string]interface{}
		fetchedOAuthPasswordToken *types.Response
		authConfigAssertionFunc   func(*pluginscommonv1.OAuth_PasswordGrantFlow) bool
		secretMap                 map[string]string
	}{
		{
			name:          "happy path scenario",
			integrationId: "integrationId",
			profileId:     "42",
			profileName:   "production",
			username:      "username",
			password:      "password",
			fetchedConfiguration: map[string]interface{}{
				"authConfig": map[string]interface{}{
					"username": "username",
					"password": "password",
				},
			},
			fetchedOAuthPasswordToken: &types.Response{
				AccessToken:  "accessToken",
				RefreshToken: "refreshToken",
				ExpiresIn:    3600,
			},
		},
		{
			name:          "happy path scenario - with bindings",
			integrationId: "integrationId",
			profileId:     "42",
			profileName:   "production",
			username:      "{{ Env.username }}",
			password:      "{{ Env.password }}",
			fetchedConfiguration: map[string]interface{}{
				"authConfig": map[string]interface{}{
					"username":     "clarkkoala", // Username/pw are just here for the assertion to pass. These will be overwritten in the function.
					"password":     "iamakoala",
					"tokenUrl":     "{{ Env.token_url }}",
					"clientId":     "{{ Env.client_id }}",
					"clientSecret": "{{ Env.client_secret }}",
					"scope":        "{{ Env.scope }}",
					"audience":     "{{ Env.audience }}",
				},
			},
			authConfig: &pluginscommonv1.OAuth_PasswordGrantFlow{
				Username:     "clarkkoala",
				Password:     "iamakoala",
				TokenUrl:     "{{ Env.token_url }}",
				ClientId:     "{{ Env.client_id }}",
				ClientSecret: "{{ Env.client_secret }}",
				Scope:        "{{ Env.scope }}",
				Audience:     "{{ Env.audience }}",
			},
			fetchedOAuthPasswordToken: &types.Response{
				AccessToken:  "accessToken",
				RefreshToken: "refreshToken",
				ExpiresIn:    3600,
			},
			secretMap: map[string]string{
				"username":      "clarkkoala",
				"password":      "iamakoala",
				"client_id":     "clark_the_client",
				"token_url":     "https://clark.koala",
				"client_secret": "clarks_secret",
				"scope":         "clarks_scope",
				"audience":      "clarks_audience",
			},
			authConfigAssertionFunc: func(actualAuthConfig *pluginscommonv1.OAuth_PasswordGrantFlow) bool {
				return cmp.Equal(*actualAuthConfig, pluginscommonv1.OAuth_PasswordGrantFlow{
					Username:     "clarkkoala",
					Password:     "iamakoala",
					TokenUrl:     "https://clark.koala",
					ClientId:     "clark_the_client",
					ClientSecret: "clarks_secret",
					Scope:        "clarks_scope",
					Audience:     "clarks_audience",
				}, cmpopts.IgnoreUnexported(pluginscommonv1.OAuth_PasswordGrantFlow{}))
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {

			fetcher := &fetchMocks.Fetcher{}
			tokenManager := &authMocks.TokenManager{}
			secretManager := &secretsMocks.SecretManager{}

			fetcher.On("FetchIntegration", mock.Anything, tc.integrationId, mock.MatchedBy(func(p *commonv1.Profile) bool {
				return p.Id == &tc.profileId && p.Name == &tc.profileName
			})).Return(&fetch.Integration{
				Configuration: tc.fetchedConfiguration,
			}, nil)

			fetcher.On("FetchIntegrations", mock.Anything, mock.Anything, mock.Anything).Return(&integrationv1.GetIntegrationsResponse{
				Data: []*integrationv1.Integration{},
			}, nil).Maybe()

			if tc.secretMap != nil {
				secretManager.On("GetSecrets").Return(tc.secretMap)
			}

			var expectedAuthConfig *pluginscommonv1.OAuth_PasswordGrantFlow = &pluginscommonv1.OAuth_PasswordGrantFlow{}
			if tc.authConfig != nil {
				expectedAuthConfig = tc.authConfig
			} else {
				authConfigStruct, _ := structpb.NewValue(tc.fetchedConfiguration["authConfig"])
				_ = jsonutils.MapToProto(authConfigStruct.GetStructValue().AsMap(), expectedAuthConfig)
			}

			tokenManager.On("FetchNewOauthPasswordToken",
				mock.MatchedBy(func(actualAuthConfig *pluginscommonv1.OAuth_PasswordGrantFlow) bool {
					if tc.authConfigAssertionFunc != nil && !tc.authConfigAssertionFunc(actualAuthConfig) {
						return false
					}
					return actualAuthConfig.Username == expectedAuthConfig.Username && actualAuthConfig.Password == expectedAuthConfig.Password
				}),
			).Return(tc.fetchedOAuthPasswordToken, nil)

			grpcServer := NewServer(&Config{
				Fetcher:       fetcher,
				TokenManager:  tokenManager,
				SecretManager: secretManager,
				Store:         store.Memory(),
			})

			ctx := context.Background()

			response, err := grpcServer.RequestOauthPasswordToken(ctx, &apiv1.RequestOauthPasswordTokenRequest{
				IntegrationId: tc.integrationId,
				Profile: &commonv1.Profile{
					Id:   &tc.profileId,
					Name: &tc.profileName,
				},
				Username: tc.username,
				Password: tc.password,
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
