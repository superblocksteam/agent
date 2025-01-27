package auth

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/oauth"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
)

func TestExchangeOAuthCodeForToken(t *testing.T) {
	tests := []struct {
		name                      string
		authConfig                *v1.OAuth_AuthorizationCodeFlow
		accessCode                string
		integrationId             string
		configurationId           string
		expiresIn                 int
		expectCredentialsInHeader bool
		responseString            string
		expectedErrorMessage      string
	}{
		{
			name: "oauth-code auth type that uses integrationId(legacy)",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:     "https://google.com",
				ClientId:     "clientId",
				ClientSecret: "clientSecret",
				Audience:     "audience",
			},
			accessCode:     "xyz",
			integrationId:  "integrationId",
			expiresIn:      3600,
			responseString: fmt.Sprintf(`{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`, 3600),
		},
		{
			name: "oauth-code auth type that uses authConfig and configurationId",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:     "https://google.com",
				ClientId:     "clientId",
				ClientSecret: "clientSecret",
				Audience:     "audience",
			},
			accessCode:      "xyz",
			configurationId: "configurationId",
			expiresIn:       3600,
			responseString:  fmt.Sprintf(`{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`, 3600),
		},
		{
			name: "oauth-code auth type returns access token with no expires in",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:     "https://slack.com",
				ClientId:     "clientId",
				ClientSecret: "clientSecret",
				Audience:     "audience",
			},
			accessCode:      "xyz",
			configurationId: "configurationId",
			expiresIn:       0,
			responseString:  fmt.Sprintf(`{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`, 0),
		},
		{
			name: "oauth-code auth type sends credentials in a body if clientAuthType is not set(existing integrations before introducing clientAuthType)",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:     "https://slack.com",
				ClientId:     "clientId",
				ClientSecret: "clientSecret",
				Audience:     "audience",
			},
			accessCode:                "xyz",
			configurationId:           "configurationId",
			expiresIn:                 0,
			expectCredentialsInHeader: false,
			responseString:            fmt.Sprintf(`{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`, 0),
		},
		{
			name: "oauth-code auth type sends credentials in a body if clientAuthType is set to POST",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:         "https://slack.com",
				ClientId:         "clientId",
				ClientSecret:     "clientSecret",
				ClientAuthMethod: oauth.CLIENT_AUTH_METHOD_POST,
				Audience:         "audience",
			},
			accessCode:                "xyz",
			configurationId:           "configurationId",
			expiresIn:                 0,
			expectCredentialsInHeader: false,
			responseString:            fmt.Sprintf(`{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`, 0),
		},
		{
			name: "oauth-code auth type sends credentials in a header if clientAuthType is set to BASIC",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:         "https://slack.com",
				ClientId:         "clientId",
				ClientSecret:     "clientSecret",
				ClientAuthMethod: oauth.CLIENT_AUTH_METHOD_BASIC,
				Audience:         "audience",
			},
			accessCode:                "xyz",
			configurationId:           "configurationId",
			expiresIn:                 0,
			expectCredentialsInHeader: true,
			responseString:            fmt.Sprintf(`{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`, 0),
		},
		{
			name: "oauth-code returns error if response cannot be unmarshalled",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:         "https://slack.com",
				ClientId:         "clientId",
				ClientSecret:     "clientSecret",
				ClientAuthMethod: oauth.CLIENT_AUTH_METHOD_BASIC,
				Audience:         "audience",
			},
			accessCode:                "xyz",
			configurationId:           "configurationId",
			expiresIn:                 0,
			expectCredentialsInHeader: true,
			responseString:            `{{{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`,
			expectedErrorMessage:      "invalid character '{' looking for beginning of object key string",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			httpMock := &mocks.HttpClient{}
			fetcherCacher := &mocks.FetcherCacher{}

			clock := clockwork.NewFakeClock()
			oauthClient := &oauth.OAuthClient{
				HttpClient:    httpMock,
				FetcherCacher: fetcherCacher,
				Clock:         clock,
				Logger:        zap.NewNop(),
			}

			tm := &tokenManager{
				OAuthClient: oauthClient,
				clock:       clock,
				logger:      zap.NewExample(),
			}

			ctx := metadata.NewIncomingContext(context.Background(), metadata.New(map[string]string{
				"origin": "https://superblocks.com",
			}))

			httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
				var credentialsAsExpected bool
				if tt.expectCredentialsInHeader {
					credentialsAsExpected = r.Header.Get("Authorization") == "Basic "+base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`%s:%s`, tt.authConfig.ClientId, tt.authConfig.ClientSecret)))
				} else {
					credentialsAsExpected = r.FormValue("client_id") == tt.authConfig.ClientId && r.FormValue("client_secret") == tt.authConfig.ClientSecret
				}
				return r.FormValue("grant_type") == "authorization_code" &&
					r.FormValue("redirect_uri") == "https://superblocks.com/oauth/callback" &&
					r.FormValue("code") == tt.accessCode &&
					credentialsAsExpected &&
					r.FormValue("audience") == tt.authConfig.Audience
			})).Return(&http.Response{
				StatusCode: 200,
				Body:       io.NopCloser(strings.NewReader(tt.responseString)),
			}, nil)

			fetcherCacher.On("CacheUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeAccess, "token", mock.Anything, tt.integrationId, tt.configurationId).Return(nil)
			fetcherCacher.On("CacheUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeRefresh, "refreshtoken", mock.Anything, tt.integrationId, tt.configurationId).Return(nil)

			err := tm.ExchangeOauthCodeForToken(
				ctx,
				AuthTypeOauthCode,
				tt.authConfig,
				tt.accessCode,
				tt.integrationId,
				tt.configurationId,
			)

			if tt.expiresIn == 0 {
				// assert cache access token helper function is called with expires in = 0
				authConfigStruct, err := jsonutils.ToStruct(tt.authConfig)
				assert.Nil(t, err)
				fetcherCacher.MethodCalled("CacheUserToken", ctx, AuthTypeOauthCode, authConfigStruct, oauth.TokenTypeAccess, "token", 0, tt.integrationId, tt.configurationId)
			}

			if tt.expectedErrorMessage != "" {
				assert.EqualError(t, err, tt.expectedErrorMessage)
			} else {
				assert.NoError(t, err)
			}

			// Check for credentials to be passed either in header or body
			if tt.expectCredentialsInHeader {
				httpMock.AssertCalled(t, "Do", mock.MatchedBy(func(r *http.Request) bool {
					return r.Header.Get("Authorization") == "Basic "+base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`%s:%s`, tt.authConfig.ClientId, tt.authConfig.ClientSecret)))
				}))
			} else {
				httpMock.AssertCalled(t, "Do", mock.MatchedBy(func(r *http.Request) bool {
					return r.FormValue("client_id") == tt.authConfig.ClientId && r.FormValue("client_secret") == tt.authConfig.ClientSecret
				}))
			}
		})
	}
}

func TestExchangeOAuthCodeForSharedToken(t *testing.T) {
	tests := []struct {
		name            string
		authConfig      *v1.OAuth_AuthorizationCodeFlow
		accessCode      string
		integrationId   string
		configurationId string
		expiresIn       int
	}{
		{
			name: "oauth-code auth type that uses integrationId(legacy)",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:     "https://google.com",
				ClientId:     "clientId",
				ClientSecret: "clientSecret",
				Audience:     "audience",
				TokenScope:   "datasource",
			},
			accessCode:    "xyz",
			integrationId: "integrationId",
			expiresIn:     3600,
		},
		{
			name: "oauth-code auth type that uses authConfig and configurationId",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:     "https://google.com",
				ClientId:     "clientId",
				ClientSecret: "clientSecret",
				Audience:     "audience",
				TokenScope:   "datasource",
			},
			accessCode:      "xyz",
			configurationId: "configurationId",
			expiresIn:       3600,
		},
		{
			name: "oauth-code auth type returns access token with no expires in",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl:     "https://slack.com",
				ClientId:     "clientId",
				ClientSecret: "clientSecret",
				Audience:     "audience",
				TokenScope:   "datasource",
			},
			accessCode:      "xyz",
			configurationId: "configurationId",
			expiresIn:       0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			httpMock := &mocks.HttpClient{}
			fetcherCacher := &mocks.FetcherCacher{}

			clock := clockwork.NewFakeClock()
			oauthClient := &oauth.OAuthClient{
				HttpClient:    httpMock,
				FetcherCacher: fetcherCacher,
				Clock:         clock,
				Logger:        zap.NewNop(),
			}

			tm := &tokenManager{
				OAuthClient: oauthClient,
				clock:       clock,
				logger:      zap.NewExample(),
			}

			ctx := metadata.NewIncomingContext(context.Background(), metadata.New(map[string]string{
				"origin": "https://superblocks.com",
			}))

			httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
				return r.FormValue("grant_type") == "authorization_code" &&
					r.FormValue("redirect_uri") == "https://superblocks.com/oauth/callback" &&
					r.FormValue("code") == tt.accessCode &&
					r.FormValue("client_id") == "clientId" &&
					r.FormValue("client_secret") == "clientSecret" &&
					r.FormValue("audience") == "audience"
			})).Return(&http.Response{
				StatusCode: 200,
				Body:       io.NopCloser(strings.NewReader(fmt.Sprintf(`{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`, tt.expiresIn))),
			}, nil)

			fetcherCacher.On("CacheSharedToken", AuthTypeOauthCode, mock.Anything, oauth.TokenTypeAccess, "token", mock.Anything, tt.integrationId, tt.configurationId).Return(nil)
			fetcherCacher.On("CacheSharedToken", AuthTypeOauthCode, mock.Anything, oauth.TokenTypeRefresh, "refreshtoken", mock.Anything, tt.integrationId, tt.configurationId).Return(nil)

			err := tm.ExchangeOauthCodeForToken(
				ctx,
				AuthTypeOauthCode,
				tt.authConfig,
				tt.accessCode,
				tt.integrationId,
				tt.configurationId,
			)

			if tt.expiresIn == 0 {
				// assert cache access token helper function is called with expires in = 0
				authConfigStruct, err := jsonutils.ToStruct(tt.authConfig)
				assert.Nil(t, err)
				fetcherCacher.MethodCalled("CacheSharedToken", AuthTypeOauthCode, authConfigStruct, oauth.TokenTypeAccess, "token", 0, tt.integrationId, tt.configurationId)
			}

			assert.NoError(t, err)
		})
	}
}
