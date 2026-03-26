package auth

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/oauth"
	"github.com/superblocksteam/agent/internal/auth/types"
	flagsmocks "github.com/superblocksteam/agent/internal/flags/mock"
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/constants"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestCheckAuth(t *testing.T) {
	tests := []struct {
		name       string
		authType   string
		authConfig map[string]interface{}
		cookie     string
		userToken  bool
		expected   *types.CheckAuthResponse
	}{
		{
			name:       "basic auth with cookie",
			authType:   "basic",
			authConfig: map[string]interface{}{},
			cookie:     "basic.integration_id-token=cookietoken",
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name:       "oauth implicit with cookie",
			authType:   "oauth-implicit",
			authConfig: map[string]interface{}{},
			cookie:     "oauth-implicit.integration_id-token=cookietoken",
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name:     "oauth password with refresh cookie and no id-token",
			authType: "oauth-pword",
			authConfig: map[string]interface{}{
				"username":     "username",
				"password":     "password",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			userToken: true, // no id-token
			cookie:    "oauth-pword.clientId-refresh=refreshtoken",
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies: []*http.Cookie{
					{
						Name:  "oauth-pword.clientId-refresh",
						Value: "refreshtoken",
					},
				},
			},
		},
		{
			name:     "oauth password when shared should return no access token",
			authType: "oauth-pword",
			cookie:   "oauth-pword.clientId-refresh=refreshtoken",
			authConfig: map[string]interface{}{
				"username":     "username",
				"password":     "password",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
				"tokenScope":   "datasource", // should not return access token
			},
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies: []*http.Cookie{
					{
						Name:  "oauth-pword.clientId-refresh",
						Value: "refreshtoken",
					},
				},
			},
		},
		{
			name:     "oauth password when per user should return access token",
			authType: "oauth-pword",
			cookie:   "oauth-pword.clientId-refresh=refreshtoken",
			authConfig: map[string]interface{}{
				"username":     "username",
				"password":     "password",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
				"tokenScope":   "user", // should return access token in cookie
			},
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies: []*http.Cookie{
					{
						Name:  "oauth-pword.clientId-token",
						Value: "token",
					},
					{
						Name:  "oauth-pword.clientId-refresh",
						Value: "refreshtoken",
					},
				},
			},
		},
		{
			name:     "oauth code without cookie and with server cache",
			authType: "oauth-code",
			authConfig: map[string]interface{}{
				"clientId":               "clientId",
				"clientSecret":           "clientSecret",
				"tokenScope":             "datasource",
				"refreshTokenFromServer": false,
			},
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies: []*http.Cookie{
					{
						Name:  "oauth-code.clientId-id-token",
						Value: "id-token",
					},
				},
			},
		},
		{
			name:     "oauth code without cookie and without server cache should return no access token in cookie",
			authType: "oauth-code",
			authConfig: map[string]interface{}{
				"clientId":               "clientId",
				"clientSecret":           "clientSecret",
				"refreshTokenFromServer": false,
			},
			userToken: true,
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name:     "oauth code without cookie and without server cache should return id token",
			authType: "oauth-code",
			authConfig: map[string]interface{}{
				"clientId":               "clientId",
				"clientSecret":           "clientSecret",
				"refreshTokenFromServer": false,
				"tokenScope":             "datasource",
			},
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies: []*http.Cookie{
					{
						Name:  "oauth-code.clientId-id-token",
						Value: "id-token",
					},
				},
			},
		},
		{
			name:     "firebase with refresh cookie",
			authType: "Firebase",
			authConfig: map[string]interface{}{
				"apiKey": "{projectId: \"projectId\", apiKey: \"apiKey\"}",
			},
			cookie: "Firebase.projectId-refresh=refreshtoken",
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies: []*http.Cookie{
					{
						Name:  "Firebase.projectId-token",
						Value: "token",
					},
					{
						Name:  "Firebase.projectId-refresh",
						Value: "refreshtoken",
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			httpMock := &mocks.HttpClient{}
			fetcherCacher := &mocks.FetcherCacher{}

			serverClient := clients.NewServerClient(&clients.ServerClientOptions{
				URL:    "https://google.com",
				Client: httpMock,
				Headers: map[string]string{
					"x-superblocks-agent-id": "bar",
				},
				SuperblocksAgentKey: "foo",
			})

			clock := clockwork.NewFakeClock()
			oauthClient := &oauth.OAuthClient{
				HttpClient:    httpMock,
				FetcherCacher: fetcherCacher,
				Clock:         clock,
				Logger:        zap.NewNop(),
			}

			oauthCodeTokenFetcher := oauth.NewOAuthCodeTokenFetcher(oauthClient, fetcherCacher, serverClient)

			tm := &tokenManager{
				OAuthClient:           oauthClient,
				OAuthCodeTokenFetcher: oauthCodeTokenFetcher,
				clock:                 clock,
				logger:                zap.NewNop(),
			}
			ctx := ctxWithCookie(tt.cookie)

			httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
				return r.FormValue("grant_type") == "refresh_token" &&
					r.FormValue("client_id") == "clientId" &&
					r.FormValue("client_secret") == "clientSecret" &&
					r.FormValue("refresh_token") == "refreshtoken"
			})).Return(&http.Response{
				StatusCode: 200,
				Body:       io.NopCloser(strings.NewReader(`{"access_token":"token", "refresh_token":"refreshtoken"}`)),
			}, nil)

			// firebase
			httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
				return r.FormValue("grant_type") == "refresh_token" &&
					r.FormValue("refresh_token") == "refreshtoken" &&
					r.URL.Query().Get("key") == "apiKey"
			})).Return(&http.Response{
				StatusCode: 200,
				Body:       io.NopCloser(strings.NewReader(`{"id_token":"token", "refresh_token":"refreshtoken"}`)),
			}, nil)

			if !tt.userToken {
				// mock for tokenScope = "datasource"
				fetcherCacher.On("FetchSharedToken", mock.Anything, mock.Anything, oauth.TokenTypeAccess, "integration_id", "configuration_id").Return("token", nil)
				fetcherCacher.On("FetchSharedToken", mock.Anything, mock.Anything, oauth.TokenTypeId, "integration_id", "configuration_id").Return("id-token", nil)

				// mock for tokenScope = "user"
				fetcherCacher.On("FetchSharedToken", mock.Anything, mock.Anything, oauth.TokenTypeAccess).Return("token", nil)
				fetcherCacher.On("FetchSharedToken", mock.Anything, mock.Anything, oauth.TokenTypeId).Return("id-token", nil)
			} else {
				fetcherCacher.On("FetchUserToken", mock.Anything, "oauth-code", mock.Anything, oauth.TokenTypeAccess).Return("", nil)
				fetcherCacher.On("FetchUserToken", mock.Anything, "oauth-code", mock.Anything, oauth.TokenTypeId).Return("", nil)
				fetcherCacher.On("FetchUserToken", mock.Anything, "oauth-code", mock.Anything, oauth.TokenTypeRefresh).Return("refreshtoken", nil)
				fetcherCacher.On("CacheUserToken", mock.Anything, "oauth-code", mock.Anything, oauth.TokenTypeRefresh, "refreshtoken", mock.Anything, "integration_id", "configuration_id").Return(nil)
				fetcherCacher.On("CacheUserToken", mock.Anything, "oauth-code", mock.Anything, oauth.TokenTypeAccess, "token", mock.Anything, "integration_id", "configuration_id").Return(nil)
			}

			response, err := tm.CheckAuth(ctx, DatasourceConfig(tt.authType, tt.authConfig), "integration_id", "configuration_id", "")

			assert.NoError(t, err)
			assert.Equal(t, tt.expected.Authenticated, response.Authenticated)
			assert.Equal(t, len(tt.expected.Cookies), len(response.Cookies))
			// only check cookie names and values, not expiry
			for i := range response.Cookies {
				assert.Equal(t, tt.expected.Cookies[i].Name, response.Cookies[i].Name)
				assert.Equal(t, tt.expected.Cookies[i].Value, response.Cookies[i].Value)
			}
		})
	}
}

func TestCheckAuth_OauthTokenExchange(t *testing.T) {
	clock := clockwork.NewFakeClock()
	makeJWT := func(t *testing.T, claims jwt.MapClaims) string {
		t.Helper()

		token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte("test-secret"))
		if err != nil {
			t.Fatalf("failed to sign test jwt: %v", err)
		}
		return token
	}
	newContextWithSuperblocksJWT := func(t *testing.T, idpToken string) context.Context {
		t.Helper()

		superblocksJWT := makeJWT(t, jwt.MapClaims{
			idpAccessTokenClaimKey: idpToken,
		})
		return metadata.NewIncomingContext(
			context.Background(),
			metadata.New(map[string]string{
				constants.HeaderSuperblocksJwt: "Bearer " + superblocksJWT,
			}),
		)
	}
	testCases := []struct {
		name             string
		ctx              context.Context
		authConfig       map[string]any
		cachedToken      string
		dataSourceConfig *structpb.Struct
		fetchErr         error
		fetchAuthType    string
		validateFlag     *bool
		expected         *types.CheckAuthResponse
	}{
		{
			name: "cached opaque token",
			authConfig: map[string]any{
				"clientId":           "clientId",
				"clientSecret":       "clientSecret",
				"tokenUrl":           "tokenUrl",
				"authUrl":            "authUrl",
				"audience":           "audience",
				"scope":              "scope",
				"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
				"tokenScope":         "datasource",
			},
			cachedToken: "databricks-access-token",
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name: "normalized oauthTokenExchange auth type accepted",
			authConfig: map[string]any{
				"clientId":           "clientId",
				"clientSecret":       "clientSecret",
				"tokenUrl":           "tokenUrl",
				"authUrl":            "authUrl",
				"audience":           "audience",
				"scope":              "scope",
				"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
				"tokenScope":         "datasource",
			},
			ctx: newContextWithSuperblocksJWT(t, "okta-opaque-access-token"),
			dataSourceConfig: DatasourceConfig("oauthTokenExchange", map[string]any{
				"clientId":           "clientId",
				"clientSecret":       "clientSecret",
				"tokenUrl":           "tokenUrl",
				"authUrl":            "authUrl",
				"audience":           "audience",
				"scope":              "scope",
				"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
				"tokenScope":         "datasource",
			}),
			fetchAuthType: "oauthTokenExchange",
			fetchErr:      errors.New("no cached token"),
			validateFlag:  boolPtr(false),
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name: "authTypeField resolves oauth token exchange",
			authConfig: map[string]any{
				"clientId":           "clientId",
				"clientSecret":       "clientSecret",
				"tokenUrl":           "tokenUrl",
				"authUrl":            "authUrl",
				"audience":           "audience",
				"scope":              "scope",
				"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
				"tokenScope":         "datasource",
			},
			ctx: newContextWithSuperblocksJWT(t, "okta-opaque-access-token"),
			dataSourceConfig: DatasourceConfigWithAuthTypeField(
				"connectionType",
				authTypeOauthTokenExchange,
				map[string]any{
					"clientId":           "clientId",
					"clientSecret":       "clientSecret",
					"tokenUrl":           "tokenUrl",
					"authUrl":            "authUrl",
					"audience":           "audience",
					"scope":              "scope",
					"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
					"tokenScope":         "datasource",
				},
			),
			fetchErr:     errors.New("no cached token"),
			validateFlag: boolPtr(false),
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name: "flag off: opaque IdP token accepted",
			authConfig: map[string]any{
				"clientId":           "clientId",
				"clientSecret":       "clientSecret",
				"tokenUrl":           "tokenUrl",
				"authUrl":            "authUrl",
				"audience":           "audience",
				"scope":              "scope",
				"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
				"tokenScope":         "datasource",
			},
			ctx:          newContextWithSuperblocksJWT(t, "okta-opaque-access-token"),
			fetchErr:     errors.New("no cached token"),
			validateFlag: boolPtr(false),
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name: "flag off: valid JWT IdP token accepted",
			authConfig: map[string]any{
				"clientId":           "clientId",
				"clientSecret":       "clientSecret",
				"tokenUrl":           "tokenUrl",
				"authUrl":            "authUrl",
				"audience":           "audience",
				"scope":              "scope",
				"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
				"tokenScope":         "datasource",
			},
			ctx: newContextWithSuperblocksJWT(t, makeJWT(t, jwt.MapClaims{
				"exp": clock.Now().Add(time.Hour).Unix(),
			})),
			fetchErr:     errors.New("no cached token"),
			validateFlag: boolPtr(false),
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name: "flag on: valid JWT IdP token accepted",
			authConfig: map[string]any{
				"clientId":           "clientId",
				"clientSecret":       "clientSecret",
				"tokenUrl":           "tokenUrl",
				"authUrl":            "authUrl",
				"audience":           "audience",
				"scope":              "scope",
				"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
				"tokenScope":         "datasource",
			},
			ctx: newContextWithSuperblocksJWT(t, makeJWT(t, jwt.MapClaims{
				"exp": clock.Now().Add(time.Hour).Unix(),
			})),
			fetchErr:     errors.New("no cached token"),
			validateFlag: boolPtr(true),
			expected: &types.CheckAuthResponse{
				Authenticated: true,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name: "flag on: expired JWT IdP token rejected",
			authConfig: map[string]any{
				"clientId":           "clientId",
				"clientSecret":       "clientSecret",
				"tokenUrl":           "tokenUrl",
				"authUrl":            "authUrl",
				"audience":           "audience",
				"scope":              "scope",
				"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
				"tokenScope":         "datasource",
			},
			ctx: newContextWithSuperblocksJWT(t, makeJWT(t, jwt.MapClaims{
				"exp": clock.Now().Add(-time.Hour).Unix(),
			})),
			fetchErr:     errors.New("no cached token"),
			validateFlag: boolPtr(true),
			expected: &types.CheckAuthResponse{
				Authenticated: false,
				Cookies:       []*http.Cookie{},
			},
		},
		{
			name: "no identity provider token in context",
			authConfig: map[string]any{
				"clientId":           "clientId",
				"clientSecret":       "clientSecret",
				"tokenUrl":           "tokenUrl",
				"authUrl":            "authUrl",
				"audience":           "audience",
				"scope":              "scope",
				"subjectTokenSource": int32(v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
				"tokenScope":         "datasource",
			},
			fetchErr:     errors.New("invalid token"),
			validateFlag: boolPtr(false),
			expected: &types.CheckAuthResponse{
				Authenticated: false,
				Cookies:       []*http.Cookie{},
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			anyIntegrationId := "any-integration-id"
			anyConfigurationId := "any-configuration-id"
			anyPluginId := "any-plugin-id"

			anyCtx := tc.ctx
			if anyCtx == nil {
				anyCtx = context.Background()
			}
			dataSourceConfig := tc.dataSourceConfig
			if dataSourceConfig == nil {
				dataSourceConfig = DatasourceConfig(authTypeOauthTokenExchange, tc.authConfig)
			}
			fetchAuthType := tc.fetchAuthType
			if fetchAuthType == "" {
				fetchAuthType = authTypeOauthTokenExchange
			}

			mockTokenFetcher := &mocks.OAuthCodeTokenFetcher{}
			mockTokenFetcher.On("Fetch", mock.Anything, fetchAuthType, mock.Anything, anyIntegrationId, anyConfigurationId, anyPluginId).Return(tc.cachedToken, "id-token", tc.fetchErr)

			mockFlags := flagsmocks.NewFlags(t)
			if tc.validateFlag != nil {
				mockFlags.On("GetValidateSubjectTokenDuringOboFlowEnabled", mock.Anything).Return(*tc.validateFlag).Maybe()
			}

			tm := &tokenManager{
				OAuthCodeTokenFetcher: mockTokenFetcher,
				clock:                 clock,
				flags:                 mockFlags,
				logger:                zaptest.NewLogger(t),
			}

			response, err := tm.CheckAuth(anyCtx, dataSourceConfig, anyIntegrationId, anyConfigurationId, anyPluginId)

			assert.Equal(t, tc.expected.Authenticated, response.Authenticated)
			assert.Equal(t, len(tc.expected.Cookies), len(response.Cookies))
			assert.NoError(t, err)
		})
	}
}

func TestCheckAuth_IdpTokenPassthrough(t *testing.T) {
	clock := clockwork.NewFakeClock()

	makeJWT := func(t *testing.T, claims jwt.MapClaims) string {
		t.Helper()
		token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte("test-secret"))
		if err != nil {
			t.Fatalf("failed to sign test jwt: %v", err)
		}
		return token
	}

	makeCtx := func(superblocksJwt string, apiType string) context.Context {
		md := metadata.New(map[string]string{})
		if superblocksJwt != "" {
			md.Set(constants.HeaderSuperblocksJwt, "Bearer "+superblocksJwt)
		}
		ctx := metadata.NewIncomingContext(context.Background(), md)
		return constants.WithApiType(ctx, apiType)
	}

	idpToken := makeJWT(t, jwt.MapClaims{
		"exp": clock.Now().Add(time.Hour).Unix(),
		"sub": "idp-user",
	})
	sbJwtWithIdp := makeJWT(t, jwt.MapClaims{
		"exp":                  clock.Now().Add(5 * time.Minute).Unix(),
		idpAccessTokenClaimKey: idpToken,
	})
	sbJwtWithoutIdp := makeJWT(t, jwt.MapClaims{
		"exp": clock.Now().Add(5 * time.Minute).Unix(),
	})

	testCases := []struct {
		name          string
		ctx           context.Context
		authenticated bool
	}{
		{
			name:          "valid IdP token — authenticated",
			ctx:           makeCtx(sbJwtWithIdp, constants.ApiTypeApi),
			authenticated: true,
		},
		{
			name:          "valid IdP token with ApiTypeUnknown — authenticated",
			ctx:           makeCtx(sbJwtWithIdp, constants.ApiTypeUnknown),
			authenticated: true,
		},
		{
			name:          "missing federated_token claim — not authenticated",
			ctx:           makeCtx(sbJwtWithoutIdp, constants.ApiTypeApi),
			authenticated: false,
		},
		{
			name:          "missing superblocks JWT — not authenticated",
			ctx:           makeCtx("", constants.ApiTypeApi),
			authenticated: false,
		},
		{
			name:          "workflow API type — not authenticated",
			ctx:           makeCtx(sbJwtWithIdp, constants.ApiTypeWorkflow),
			authenticated: false,
		},
		{
			name:          "scheduled job API type — not authenticated",
			ctx:           makeCtx(sbJwtWithIdp, constants.ApiTypeScheduledJob),
			authenticated: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockFlags := flagsmocks.NewFlags(t)
			mockFlags.On("GetValidateSubjectTokenDuringOboFlowEnabled", mock.Anything).Return(false).Maybe()

			tm := &tokenManager{
				clock:  clock,
				flags:  mockFlags,
				logger: zaptest.NewLogger(t),
			}

			ds := DatasourceConfig(authTypeOauthIdpTokenPassthrough, map[string]any{})
			response, err := tm.CheckAuth(tc.ctx, ds, "integration-id", "config-id", "restapiintegration")

			assert.NoError(t, err)
			assert.Equal(t, tc.authenticated, response.Authenticated)
			assert.Empty(t, response.Cookies)
		})
	}
}

func boolPtr(b bool) *bool { return &b }

func DatasourceConfigWithAuthTypeField(authTypeField string, authType string, authConfig map[string]interface{}) *structpb.Struct {
	s, err := structpb.NewStruct(map[string]interface{}{
		"authConfig":    authConfig,
		"authTypeField": authTypeField,
		authTypeField:   authType,
	})
	if err != nil {
		panic(err)
	}
	return s
}
