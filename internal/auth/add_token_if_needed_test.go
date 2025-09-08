package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/oauth"
	flagsmocks "github.com/superblocksteam/agent/internal/flags/mock"
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/constants"
	pluginscommon "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestGetAuthTypeFromDatasourceConfiguration(t *testing.T) {
	tests := []struct {
		name                    string
		datasourceConfiguration *structpb.Struct
		expectedAuthType        string
	}{
		{
			"authType not present, authTypeField not present in datasourceConfiguration",
			&structpb.Struct{},
			"",
		},
		{
			"authType present, authTypeField not present in datasourceConfiguration",
			&structpb.Struct{Fields: map[string]*structpb.Value{
				"authType": structpb.NewStringValue("foo"),
			}},
			"foo",
		},
		{
			"authType not present, authTypeField present in datasourceConfiguration. authTypeField value not present in datasourceConfiguration",
			&structpb.Struct{Fields: map[string]*structpb.Value{
				"authTypeField": structpb.NewStringValue("foo"),
			}},
			"",
		},
		{
			"authType not present, authTypeField present in datasourceConfiguration. authTypeField value present in datasourceConfiguration",
			&structpb.Struct{Fields: map[string]*structpb.Value{
				"authTypeField": structpb.NewStringValue("foo"),
				"foo":           structpb.NewStringValue("bar"),
			}},
			"bar",
		},
		{
			"authType present, authTypeField present in datasourceConfiguration",
			&structpb.Struct{Fields: map[string]*structpb.Value{
				"authType":      structpb.NewStringValue("baz"),
				"authTypeField": structpb.NewStringValue("foo"),
				"foo":           structpb.NewStringValue("bar"),
			}},
			"bar",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := zap.NewNop()
			actualAuthType := getAuthTypeFromDatasourceConfiguration(logger, tt.datasourceConfiguration)
			assert.Equal(t, tt.expectedAuthType, actualAuthType)
		})
	}

}

func TestNormalizeAuthType(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "converts oauthTokenExchange to oauth-token-exchange",
			input:    "oauthTokenExchange",
			expected: "oauth-token-exchange",
		},
		{
			name:     "does not convert anything else",
			input:    "foo",
			expected: "foo",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := normalizeAuthType(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestAddTokenIfNeeded_OauthClientCreds(t *testing.T) {
	tests := []struct {
		name          string
		authType      string
		authConfig    map[string]interface{}
		cookie        string
		expectedToken string
		expectedError string
	}{
		{
			"oauth - client creds, no cookie",
			authTypeOauthClientCreds,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"scope":        "scope",
				"audience":     "audience",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			"",
			"token",
			"",
		},
		{
			"oauth - client creds, cookie provided",
			authTypeOauthClientCreds,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"scope":        "scope",
				"audience":     "audience",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			"oauth-client-cred.clientId-109264468-token=cookietoken",
			"cookietoken",
			"",
		},
		{
			"oauth - client creds, cookie fallback provided",
			authTypeOauthClientCreds,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"audience":     "audience",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			"oauth-client-cred.clientId-null-token=cookietoken",
			"cookietoken",
			"",
		},
		{
			"oauth - client creds, no cookie empty scope",
			authTypeOauthClientCreds,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"scope":        "",
				"audience":     "audience",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			"",
			"token",
			"",
		},
		{
			"oauth - client creds, no cookie with scope",
			authTypeOauthClientCreds,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"scope":        "scope",
				"audience":     "audience",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			"",
			"token",
			"",
		},
		{
			"oauth - client creds, failed to get token",
			authTypeOauthClientCreds,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"scope":        "",
				"audience":     "audience",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			"",
			"token",
			"failed to get token",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			httpMock := &mocks.HttpClient{}
			fetcherCacher := &mocks.FetcherCacher{}

			clock := clockwork.NewFakeClock()
			tm := &tokenManager{
				OAuthClient: &oauth.OAuthClient{
					HttpClient:    httpMock,
					FetcherCacher: fetcherCacher,
					Clock:         clock,
					Logger:        zap.NewNop(),
				},
				clock:  clock,
				logger: zap.NewNop(),
			}

			if tt.cookie == "" {
				scope, ok := tt.authConfig["scope"]
				if tt.expectedError != "" {
					httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
						return r.FormValue("grant_type") == "client_credentials" &&
							r.FormValue("audience") == "audience" &&
							r.FormValue("scope") == "" &&
							r.Header.Get("Authorization") == "Basic Y2xpZW50SWQ6Y2xpZW50U2VjcmV0"
					})).Return(&http.Response{}, errors.New("failed to get token"))
				} else if !ok || scope == "" {
					httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
						return r.FormValue("grant_type") == "client_credentials" &&
							r.FormValue("audience") == "audience" &&
							r.FormValue("scope") == "" &&
							r.Header.Get("Authorization") == "Basic Y2xpZW50SWQ6Y2xpZW50U2VjcmV0"
					})).Return(&http.Response{
						StatusCode: 200,
						Body:       io.NopCloser(strings.NewReader(`{"access_token":"token"}`)),
					}, nil)
				} else {
					httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
						return r.FormValue("grant_type") == "client_credentials" &&
							r.FormValue("audience") == "audience" &&
							r.FormValue("scope") == "scope" &&
							r.Header.Get("Authorization") == "Basic Y2xpZW50SWQ6Y2xpZW50U2VjcmV0"
					})).Return(&http.Response{
						StatusCode: 200,
						Body:       io.NopCloser(strings.NewReader(`{"access_token":"token"}`)),
					}, nil)
				}

				fetcherCacher.On("CacheSharedToken", mock.Anything, mock.Anything, oauth.TokenTypeAccess, "token", mock.Anything, "", "").Return(nil)
			}

			tokenPayload, err := tm.AddTokenIfNeeded(
				ctxWithCookie(tt.cookie),
				DatasourceConfig(tt.authType, tt.authConfig),
				nil,
				nil,
				"",
				"",
				"",
			)
			token := tokenPayload.Token
			bindingName := tokenPayload.BindingName

			if tt.expectedError != "" {
				assert.ErrorContains(t, err, tt.expectedError)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, token, tt.expectedToken)
				assert.Equal(t, bindingName, "oauth")
			}
		})
	}
}

func TestAddTokenIfNeeded_OauthPassword(t *testing.T) {
	tests := []struct {
		name               string
		authType           string
		authConfig         map[string]interface{}
		cookie             string
		cachedRefreshToken string
		expectedToken      string
		pluginAuth         *pluginscommon.Auth
		expectedError      string
	}{
		{
			"oauth password, use fixed creds off",
			authTypeOauthPassword,
			map[string]interface{}{
				"useFixedPasswordCreds": false,
			},
			"",
			"",
			"",
			nil,
			"",
		},
		{
			"oauth password - cookie",
			authTypeOauthPassword,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"audience":     "audience",
				"username":     "username",
				"password":     "password",
				"scope":        "scope",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			"oauth-pword.clientId-token=cookietoken",
			"",
			"cookietoken",
			nil,
			"",
		},
		{
			"oauth password - fetch new oauth token",
			authTypeOauthPassword,
			map[string]interface{}{
				"tokenUrl":              "tokenUrl",
				"audience":              "audience",
				"username":              "username",
				"password":              "password",
				"scope":                 "scope",
				"clientId":              "clientId",
				"clientSecret":          "clientSecret",
				"useFixedPasswordCreds": true,
			},
			"",
			"",
			"token",
			nil,
			"",
		},
		{
			"oauth password - use cached refresh token",
			authTypeOauthPassword,
			map[string]interface{}{
				"tokenUrl":              "tokenUrl",
				"audience":              "audience",
				"username":              "username",
				"password":              "password",
				"scope":                 "scope",
				"clientId":              "clientId",
				"clientSecret":          "clientSecret",
				"useFixedPasswordCreds": true,
			},
			"",
			"cachedRefreshToken",
			"token",
			nil,
			"",
		},
		{
			"oauth password - use proto plugin Auth",
			"",
			map[string]interface{}{},
			"",
			"",
			"token",
			&pluginscommon.Auth{
				Method: &pluginscommon.Auth_PasswordGrantFlow{
					PasswordGrantFlow: &pluginscommon.OAuth_PasswordGrantFlow{
						TokenUrl:     "tokenUrl",
						ClientId:     "clientId",
						ClientSecret: "clientSecret",
						Username:     "username",
						Password:     "password",
					},
				},
			},
			"",
		},
		{
			"oauth password - failed to get token",
			authTypeOauthPassword,
			map[string]interface{}{
				"tokenUrl":              "tokenUrl",
				"audience":              "audience",
				"username":              "username",
				"password":              "password",
				"scope":                 "scope",
				"clientId":              "clientId",
				"clientSecret":          "clientSecret",
				"useFixedPasswordCreds": true,
			},
			"",
			"",
			"token",
			nil,
			"failed to get token",
		},
		{
			"oauth password - use proto plugin Auth failed to get token",
			"",
			map[string]interface{}{},
			"",
			"",
			"token",
			&pluginscommon.Auth{
				Method: &pluginscommon.Auth_PasswordGrantFlow{
					PasswordGrantFlow: &pluginscommon.OAuth_PasswordGrantFlow{
						TokenUrl:     "tokenUrl",
						Audience:     "audience",
						Username:     "username",
						Password:     "password",
						Scope:        "scope",
						ClientId:     "clientId",
						ClientSecret: "clientSecret",
					},
				},
			},
			"failed to get token",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			httpMock := &mocks.HttpClient{}
			fetcherCacher := &mocks.FetcherCacher{}

			clock := clockwork.NewFakeClock()
			tm := &tokenManager{
				OAuthClient: &oauth.OAuthClient{
					HttpClient:    httpMock,
					FetcherCacher: fetcherCacher,
					Clock:         clock,
					Logger:        zap.NewNop(),
				},
				clock:  clock,
				logger: zap.NewNop(),
			}

			fetcherCacher.On("FetchSharedToken", authTypeOauthPassword, mock.Anything, oauth.TokenTypeRefresh, "", "").Return(tt.cachedRefreshToken, nil)
			fetcherCacher.On("FetchSharedToken", authTypePasswordGrantFlow, mock.Anything, oauth.TokenTypeRefresh, "", "").Return(tt.cachedRefreshToken, nil)

			if tt.expectedError != "" {
				httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
					return r.FormValue("grant_type") == "password" &&
						r.FormValue("username") == "username" &&
						r.FormValue("password") == "password" &&
						r.FormValue("client_id") == "clientId" &&
						r.FormValue("client_secret") == "clientSecret" &&
						r.FormValue("audience") == "audience" &&
						r.FormValue("scope") == "scope"
				})).Return(&http.Response{
					StatusCode: 500,
					Body:       io.NopCloser(strings.NewReader("failed to get token")),
				}, errors.New("failed to get token"))
			} else if tt.cachedRefreshToken != "" {
				httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
					return r.FormValue("grant_type") == "refresh_token" &&
						r.FormValue("client_id") == "clientId" &&
						r.FormValue("client_secret") == "clientSecret" &&
						r.FormValue("refresh_token") == tt.cachedRefreshToken
				})).Return(&http.Response{
					StatusCode: 200,
					// mixed int / string for expires_in / issued_at
					Body: io.NopCloser(strings.NewReader(`{"access_token":"token", "expires_in": 3600, "issued_at": "123"}`)),
				}, nil)
			} else if len(tt.authConfig) != 0 {
				httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
					return r.FormValue("grant_type") == "password" &&
						r.FormValue("username") == "username" &&
						r.FormValue("password") == "password" &&
						r.FormValue("client_id") == "clientId" &&
						r.FormValue("client_secret") == "clientSecret" &&
						r.FormValue("audience") == "audience" &&
						r.FormValue("scope") == "scope"
				})).Return(&http.Response{
					StatusCode: 200,
					// mixed int / string for expires_in / issued_at
					Body: io.NopCloser(strings.NewReader(`{"access_token":"token", "refresh_token":"refresh_token", "expires_in": 3600, "issued_at": "123"}`)),
				}, nil)
			} else {
				httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
					return r.FormValue("grant_type") == "password" &&
						r.FormValue("username") == "username" &&
						r.FormValue("password") == "password" &&
						r.FormValue("client_id") == "clientId" &&
						r.FormValue("client_secret") == "clientSecret"
				})).Return(&http.Response{
					StatusCode: 200,
					// mixed int / string for expires_in / issued_at
					Body: io.NopCloser(strings.NewReader(`{"access_token":"token", "refresh_token":"refresh_token", "expires_in": 3600, "issued_at": "123"}`)),
				}, nil)
			}

			fetcherCacher.On("CacheSharedToken", mock.Anything, mock.Anything, oauth.TokenTypeAccess, "token", mock.Anything, "", "").Return(nil)
			fetcherCacher.On("CacheSharedToken", mock.Anything, mock.Anything, oauth.TokenTypeRefresh, "refresh_token", mock.Anything, "", "").Return(nil)

			tokenPayload, err := tm.AddTokenIfNeeded(
				ctxWithCookie(tt.cookie),
				DatasourceConfig(tt.authType, tt.authConfig),
				nil,
				tt.pluginAuth,
				"",
				"",
				"",
			)

			if tt.expectedError != "" {
				assert.ErrorContains(t, err, tt.expectedError)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tokenPayload.Token, tt.expectedToken)
				assert.Equal(t, tokenPayload.BindingName, "oauth")
			}
		})
	}
}

func TestAddTokenIfNeeded_OauthCode(t *testing.T) {
	tests := []struct {
		name            string
		authType        string
		authConfig      map[string]interface{}
		cookie          string
		pluginId        string
		cachedToken     string
		expectedToken   string
		cachedIdToken   string
		expectedIdToken string
		expectedError   string
	}{
		{
			"oauth code - cookie",
			AuthTypeOauthCode,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"audience":     "audience",
				"username":     "username",
				"password":     "password",
				"scope":        "scope",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			"oauth-code.clientId-109264468-token=cookietoken",
			"",
			"",
			"cookietoken",
			"",
			"",
			"",
		},
		{
			"oauth code - cookie fallback",
			AuthTypeOauthCode,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"audience":     "audience",
				"username":     "username",
				"password":     "password",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			"oauth-code.clientId-null-token=cookietoken",
			"",
			"",
			"cookietoken",
			"",
			"",
			"",
		},
		{
			"oauth code - gsheets - not cached",
			AuthTypeOauthCode,
			map[string]interface{}{
				"tokenUrl":               "tokenUrl",
				"audience":               "audience",
				"username":               "username",
				"password":               "password",
				"scope":                  "scope",
				"clientId":               "clientId",
				"clientSecret":           "clientSecret",
				"tokenScope":             "datasource",
				"refreshTokenFromServer": true,
			},
			"",
			"gsheets",
			"",
			"token",
			"",
			"",
			"",
		},
		{
			"oauth code - gsheets - cached",
			AuthTypeOauthCode,
			map[string]interface{}{
				"tokenUrl":               "tokenUrl",
				"audience":               "audience",
				"username":               "username",
				"password":               "password",
				"scope":                  "scope",
				"clientId":               "clientId",
				"clientSecret":           "clientSecret",
				"tokenScope":             "datasource",
				"refreshTokenFromServer": true,
			},
			"",
			"gsheets",
			"token",
			"token",
			"",
			"",
			"",
		},
		{
			"oauth code - per user creds - cached",
			AuthTypeOauthCode,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"audience":     "audience",
				"username":     "username",
				"password":     "password",
				"scope":        "scope",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
				"tokenScope":   "user",
			},
			"",
			"restapiintegration",
			"token",
			"token",
			"id-token",
			"id-token",
			"",
		},
		{
			"oauth code - failed to refresh token",
			AuthTypeOauthCode,
			map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"audience":     "audience",
				"username":     "username",
				"password":     "password",
				"scope":        "scope",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
				"tokenScope":   "user",
			},
			"",
			"restapiintegration",
			"",
			"",
			"",
			"",
			"failed to get token",
		},
		{
			"oauth code - gsheets invalid refresh token",
			AuthTypeOauthCode,
			map[string]interface{}{
				"tokenUrl":               "tokenUrl",
				"audience":               "audience",
				"username":               "username",
				"password":               "password",
				"clientId":               "clientId",
				"clientSecret":           "clientSecret",
				"tokenScope":             "datasource",
				"refreshTokenFromServer": true,
			},
			"",
			"gsheets",
			"",
			"",
			"",
			"",
			"[oauth-code] invalid refresh token",
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

			if tt.pluginId == "gsheets" {
				fetcherCacher.On("FetchSharedToken", AuthTypeOauthCode, mock.Anything, oauth.TokenTypeAccess, "datasourceId", "configurationId").Return(tt.cachedToken, nil)
				fetcherCacher.On("FetchSharedToken", AuthTypeOauthCode, mock.Anything, oauth.TokenTypeId, "datasourceId", "configurationId").Return("", nil) // no id token for gsheet
			} else if tt.cookie == "" && tt.expectedError == "" {
				fetcherCacher.On("FetchUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeAccess).Return(tt.cachedToken, nil)
				fetcherCacher.On("FetchUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeId).Return(tt.cachedIdToken, nil)
			}

			if tt.expectedError != "" && tt.pluginId != "gsheets" {
				fetcherCacher.On("FetchUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeAccess).Return("", nil)
				fetcherCacher.On("FetchUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeId).Return("", nil)
				fetcherCacher.On("FetchUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeRefresh).Return("refresh", nil)
				httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
					return r.FormValue("grant_type") == "refresh_token" &&
						r.FormValue("client_id") == "clientId" &&
						r.FormValue("client_secret") == "clientSecret" &&
						r.FormValue("refresh_token") == "refresh"
				})).Return(&http.Response{
					StatusCode: 404,
					Body:       io.NopCloser(strings.NewReader("failed to get token")),
				}, errors.New("failed to get token"))
			} else if tt.cachedToken == "" && tt.pluginId == "gsheets" {
				if tt.expectedError == "[oauth-code] invalid refresh token" {
					httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
						return r.Method == "POST" &&
							r.URL.String() == "https://google.com/api/v1/oauth2/gsheets/refresh"
					})).Return(&http.Response{
						StatusCode: 400,
						Body:       io.NopCloser(strings.NewReader(`{"error": "invalid_grant", "error_description": "Token has been expired or revoked"}`)),
					}, nil)
				} else {
					httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
						body, err := r.GetBody()
						if err != nil {
							return false
						}
						bs, err := io.ReadAll(body)
						if err != nil {
							return false
						}
						req := &oauth.RefreshTokenRequest{}
						err = json.Unmarshal(bs, req)
						if err != nil {
							return false
						}
						return req.AuthType == AuthTypeOauthCode && req.DatasourceId == "datasourceId"
					})).Return(&http.Response{
						StatusCode: 200,
						Body:       io.NopCloser(strings.NewReader(`{"data":"token"}`)),
					}, nil)
				}
			} else if tt.cachedToken == "" && tt.cookie == "" {
				fetcherCacher.On("FetchUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeRefresh).Return("refresh", nil)

				httpMock.On("Do", mock.MatchedBy(func(r *http.Request) bool {
					return r.FormValue("grant_type") == "refresh_token" &&
						r.FormValue("client_id") == "clientId" &&
						r.FormValue("client_secret") == "clientSecret" &&
						r.FormValue("refresh_token") == "refresh"
				})).Return(&http.Response{
					StatusCode: 200,
					Body:       io.NopCloser(strings.NewReader(`{ "access_token": "token", "refresh_token": "refresh" }`)),
				}, nil)

				fetcherCacher.On("CacheUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeRefresh, "refresh", mock.Anything).Return(nil)
				fetcherCacher.On("CacheUserToken", ctx, AuthTypeOauthCode, mock.Anything, oauth.TokenTypeAccess, "token", mock.Anything).Return(nil)
			}

			tokenPayload, err := tm.AddTokenIfNeeded(
				ctx,
				DatasourceConfig(tt.authType, tt.authConfig),
				nil,
				nil,
				"datasourceId",
				"configurationId",
				tt.pluginId,
			)

			if tt.expectedError != "" {
				assert.ErrorContains(t, err, tt.expectedError)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tokenPayload.Token, tt.expectedToken)
				assert.Equal(t, tokenPayload.IdToken, tt.expectedIdToken)
				assert.Equal(t, tokenPayload.BindingName, "oauth")
			}
		})
	}
}

type args struct {
	authType                  string
	authConfig                map[string]any
	apiType                   string
	configurationId           string
	cookies                   []string
	datasourceId              string
	identityProviderToken     string
	staticToken               string
	pluginId                  string
	cachedToken               string
	expectedToken             string
	expectedError             string
	tokenExchangeStatusCode   int
	clock                     clockwork.FakeClock
	mockHttpClient            *mocks.HttpClient
	mockFetcherCacher         *mocks.FetcherCacher
	mockOAuthCodeTokenFetcher *mocks.OAuthCodeTokenFetcher
}

func validArgs(t *testing.T) *args {
	t.Helper()

	httpMock := &mocks.HttpClient{}
	fetcherCacher := &mocks.FetcherCacher{}

	clock := clockwork.NewFakeClock()
	idpClaims := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		jwt.MapClaims{
			"exp": clock.Now().Add(5 * time.Minute).Unix(),
			"sub": "idp",
		},
	)
	idpJwt, _ := idpClaims.SignedString([]byte("test-secret"))

	staticClaims := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		jwt.MapClaims{
			"exp": clock.Now().Add(5 * time.Minute).Unix(),
			"sub": "static",
		},
	)
	staticJwt, _ := staticClaims.SignedString([]byte("test-secret"))

	return &args{
		authType: authTypeOauthTokenExchange,
		authConfig: map[string]any{
			"audience":           "audience",
			"clientId":           "clientId",
			"clientSecret":       "clientSecret",
			"scope":              "user",
			"subjectTokenSource": int32(pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER),
			"tokenUrl":           "https://test-token-url.com",
		},
		apiType:                   constants.ApiTypeApi,
		configurationId:           "configurationId",
		cookies:                   []string{},
		datasourceId:              "integrationId",
		identityProviderToken:     idpJwt,
		staticToken:               staticJwt,
		pluginId:                  "restapiintegration",
		cachedToken:               "",
		expectedToken:             "token",
		expectedError:             "",
		tokenExchangeStatusCode:   http.StatusOK,
		clock:                     clock,
		mockHttpClient:            httpMock,
		mockFetcherCacher:         fetcherCacher,
		mockOAuthCodeTokenFetcher: mocks.NewOAuthCodeTokenFetcher(t),
	}
}

func verify(t *testing.T, args *args, enableValidation ...bool) {
	validation := false
	if len(enableValidation) > 0 {
		validation = enableValidation[0]
	}
	t.Helper()

	datasourceConfig, err := structpb.NewStruct(
		map[string]any{
			"authType":   args.authType,
			"authConfig": args.authConfig,
		},
	)
	if err != nil {
		t.Fatalf("failed to create datasource config struct: %v", err)
	}

	oauthClient := &oauth.OAuthClient{
		HttpClient:    args.mockHttpClient,
		FetcherCacher: args.mockFetcherCacher,
		Clock:         args.clock,
		Logger:        zap.NewNop(),
	}

	mockFlags := flagsmocks.NewFlags(t)
	mockFlags.On("GetValidateSubjectTokenDuringOboFlowEnabled", mock.Anything).Return(validation).Maybe()

	tm := &tokenManager{
		OAuthClient:           oauthClient,
		OAuthCodeTokenFetcher: args.mockOAuthCodeTokenFetcher,
		clock:                 args.clock,
		logger:                zap.NewNop(),
		flags:                 mockFlags,
	}

	claims := jwt.MapClaims{
		"exp": time.Now().Add(5 * time.Minute).Unix(),
	}
	if args.identityProviderToken != "" {
		claims[idpAccessTokenClaimKey] = args.identityProviderToken
	}

	authJwt, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("failed to create auth jwt: %v", err)
	}

	ctxMetadata := map[string]string{
		constants.HeaderSuperblocksJwt: fmt.Sprintf("Bearer %s", authJwt),
		"origin":                       "test",
	}
	if len(args.cookies) > 0 {
		ctxMetadata["cookie"] = strings.Join(args.cookies, ";")
	}

	ctx := metadata.NewIncomingContext(context.Background(), metadata.New(ctxMetadata))
	ctx = constants.WithApiType(ctx, args.apiType)

	// Set expectations for the cached token fetch, this accounts for initial cache lookup and lookup after token exchange
	var fetchCacheErr error
	if args.cachedToken == "" {
		fetchCacheErr = fmt.Errorf("fetch error: not found")
	}
	args.mockOAuthCodeTokenFetcher.On("Fetch", ctx, args.authType, mock.Anything, args.datasourceId, args.configurationId, args.pluginId).Return(args.cachedToken, "", fetchCacheErr).Once()

	// Set expectations for the token exchange and caching of response
	// Success/failure will be configured by the tokenExchangeStatusCode value
	args.mockHttpClient.On("Do", mock.Anything).Return(&http.Response{
		StatusCode: args.tokenExchangeStatusCode,
		Body:       io.NopCloser(strings.NewReader(fmt.Sprintf(`{ "access_token": "%s", "token_type": "access", "expires_in": 3600, "scope": "user" }`, args.expectedToken))),
	}, nil).Maybe()
	args.mockFetcherCacher.On("CacheUserToken", ctx, args.authType, mock.Anything, oauth.TokenTypeAccess, args.expectedToken, mock.Anything, args.datasourceId, args.configurationId).Return(nil).Maybe()

	tokenPayload, err := tm.AddTokenIfNeeded(
		ctx,
		datasourceConfig,
		nil,
		nil,
		args.datasourceId,
		args.configurationId,
		args.pluginId,
	)

	if args.expectedError != "" {
		assert.EqualError(t, err, args.expectedError)
	} else {
		assert.NoError(t, err)
		assert.Equal(t, args.expectedToken, tokenPayload.Token)
		assert.Equal(t, "oauth", tokenPayload.BindingName)
		assert.Equal(t, args.expectedToken, datasourceConfig.GetFields()["authConfig"].GetStructValue().GetFields()["authToken"].GetStringValue())
	}
}

func TestAddTokenIfNeeded_OauthTokenExchange(t *testing.T) {
	validArgs := validArgs(t)
	verify(t, validArgs)
}

func TestAddTokenIfNeeded_OauthTokenExchange_SupportedSubjectTokenSource(t *testing.T) {
	args := validArgs(t)
	args.apiType = constants.ApiTypeApi
	verify(t, args)

	args = validArgs(t)
	args.apiType = constants.ApiTypeUnknown
	verify(t, args)
}

func TestAddTokenIfNeeded_OauthTokenExchange_StaticToken(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.authConfig["subjectTokenSource"] = int32(pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_STATIC_TOKEN)
	validArgs.authConfig["subjectTokenSourceStaticToken"] = validArgs.staticToken
	verify(t, validArgs)
}

func TestAddTokenIfNeeded_OauthTokenExchange_FetchCachedToken(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.cachedToken = "cachedToken"
	validArgs.expectedToken = "cachedToken"

	verify(t, validArgs)
}

func TestAddTokenIfNeeded_OauthTokenExchange_UnsupportedSubjectTokenSource(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.authConfig["subjectTokenSource"] = int32(pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_UNSPECIFIED)
	validArgs.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" invalid subject token source\n\nPlease check the subject token source provided in the integration and try again."

	verify(t, validArgs)
}

func TestAddTokenIfNeeded_OauthTokenExchange_UnsupportedApiType(t *testing.T) {
	args := validArgs(t)
	args.apiType = constants.ApiTypeScheduledJob
	args.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" could not find a user JWT\n\nAuth method can't be used headlessly, like in Workflows or Scheduled Jobs."

	verify(t, args)

	args = validArgs(t)
	args.apiType = constants.ApiTypeWorkflow
	args.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" could not find a user JWT\n\nAuth method can't be used headlessly, like in Workflows or Scheduled Jobs."

	verify(t, args)
}

func TestAddTokenIfNeeded_OauthTokenExchange_MissingIdpAccessToken(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.identityProviderToken = ""
	validArgs.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" could not find identity provider token\n\nPlease log in using a valid OIDC-based SSO provider. To configure or update your orgs SSO, or for assistance troubleshooting, please reach out to support."

	verify(t, validArgs)
}

func TestAddTokenIfNeeded_OauthTokenExchange_EmptyStaticToken_TokenValidationEnabled(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.authConfig["subjectTokenSource"] = int32(pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_STATIC_TOKEN)
	validArgs.authConfig["subjectTokenSourceStaticToken"] = ""
	validArgs.staticToken = ""
	validArgs.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" invalid static token provided\n\nPlease check the static token provided in the integration and try again."

	verify(t, validArgs, true)
}

func TestAddTokenIfNeeded_OauthTokenExchange_EmptyStaticToken_TokenValidationDisabled(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.authConfig["subjectTokenSource"] = int32(pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_STATIC_TOKEN)
	validArgs.authConfig["subjectTokenSourceStaticToken"] = ""
	validArgs.staticToken = ""

	verify(t, validArgs, false)
}

func TestAddTokenIfNeeded_OauthTokenExchange_ExpiredIdentityProviderToken(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.authConfig["subjectTokenSource"] = int32(pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER)
	// The identity provider token from validArgs() is valid for 5 minutes, advance the clock by 1 hour to make it expired
	validArgs.clock.Advance(time.Hour)
	validArgs.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" identity provider token expired\n\nRefresh your browser and follow prompts to reauthenticate with SSO."

	verify(t, validArgs, true)
}

func TestAddTokenIfNeeded_OauthTokenExchange_ExpiredStaticToken(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.authConfig["subjectTokenSource"] = int32(pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_STATIC_TOKEN)
	validArgs.authConfig["subjectTokenSourceStaticToken"] = validArgs.staticToken
	// The identity provider token from validArgs() is valid for 5 minutes, advance the clock by 1 hour to make it expired
	validArgs.clock.Advance(time.Hour)
	validArgs.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" static token expired\n\nPlease check the static token provided in the integration and try again."

	verify(t, validArgs, true)
}

func TestAddTokenIfNeeded_OauthTokenExchange_IdentityProviderTokenNotJwt(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.authConfig["subjectTokenSource"] = int32(pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER)
	validArgs.identityProviderToken = "not-a-jwt"
	validArgs.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" invalid identity provider token provided\n\nPlease log in using a valid OIDC-based SSO provider. To configure or update your orgs SSO, or for assistance troubleshooting, please reach out to support."

	verify(t, validArgs, true)
}

func TestAddTokenIfNeeded_OauthTokenExchange_StaticTokenNotJwt(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.authConfig["subjectTokenSource"] = int32(pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_STATIC_TOKEN)
	validArgs.authConfig["subjectTokenSourceStaticToken"] = "not-a-jwt"
	validArgs.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" invalid static token provided\n\nPlease check the static token provided in the integration and try again."

	verify(t, validArgs, true)
}

func TestAddTokenIfNeeded_OauthTokenExchange_OnBehalfOfExchangeFails(t *testing.T) {
	validArgs := validArgs(t)
	validArgs.tokenExchangeStatusCode = http.StatusBadRequest
	validArgs.expectedError = "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" token exchange failed\n\nUnexpected status code: 400: { \"access_token\": \"token\", \"token_type\": \"access\", \"expires_in\": 3600, \"scope\": \"user\" }"

	verify(t, validArgs)
}

func TestAddTokenIfNeeded_OauthImplicit(t *testing.T) {
	clock := clockwork.NewFakeClock()
	tm := &tokenManager{
		OAuthClient: &oauth.OAuthClient{
			Clock:  clock,
			Logger: zap.NewNop(),
		},
		clock:  clock,
		logger: zap.NewNop(),
	}

	ctx := ctxWithCookie("oauth-implicit.clientId-109264468-token=cookietoken")

	tokenPayload, err := tm.AddTokenIfNeeded(
		ctx,
		DatasourceConfig(authTypeOauthImplicit, map[string]interface{}{
			"clientId": "clientId",
			"scope":    "scope",
		}),
		nil,
		nil,
		"",
		"",
		"",
	)

	assert.NoError(t, err)
	assert.Equal(t, tokenPayload.Token, "cookietoken")
	assert.Equal(t, tokenPayload.BindingName, "oauth")

	ctx = ctxWithCookie("oauth-implicit.clientId-null-token=cookietoken")
	tokenPayload, err = tm.AddTokenIfNeeded(
		ctx,
		DatasourceConfig(authTypeOauthImplicit, map[string]interface{}{
			"clientId": "clientId",
		}),
		nil,
		nil,
		"",
		"",
		"",
	)
	token := tokenPayload.Token
	bindingName := tokenPayload.BindingName
	assert.NoError(t, err)
	assert.Equal(t, token, "cookietoken")
	assert.Equal(t, bindingName, "oauth")
}

func TestAddTokenIfNeeded_authConfigNil(t *testing.T) {
	tm := &tokenManager{
		clock:  clockwork.NewFakeClock(),
		logger: zaptest.NewLogger(t),
	}

	dsConfig := DatasourceConfig(authTypeBearer, nil)
	dsConfigRedacted := DatasourceConfig(authTypeBearer, nil)

	// no idea how this happens, but it happened in prod here:
	// https://app.clickup.com/t/8650101/EG-18570
	dsConfig.Fields["authConfig"] = nil

	_, err := tm.AddTokenIfNeeded(
		context.Background(),
		dsConfig,
		dsConfigRedacted,
		nil,
		"datasourceId",
		"configurationId",
		"",
	)
	require.NoError(t, err)
}

func TestAddTokenIfNeeded_Tokens(t *testing.T) {
	tests := []struct {
		name                    string
		authType                string
		authConfig              map[string]interface{}
		cookie                  string
		expectedGenericAuthType string
		expectedHeaders         []interface{}
		expectedParams          []interface{}
		expectedHeadersRedacted []interface{}
		expectedParamsRedacted  []interface{}
	}{
		{
			name:     "basic - share creds",
			authType: authTypeBasic,
			authConfig: map[string]interface{}{
				"shareBasicAuthCreds": true,
				"username":            "user's \"name\"",
				"password":            "user's `literal` \"password\"",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Basic {{ btoa(`${\"user's \\\"name\\\"\"}:${\"user's `literal` \\\"password\\\"\"}`) }}",
				},
			},
			expectedParams: []interface{}{},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Basic <redacted>",
				},
			},
			expectedParamsRedacted: []interface{}{},
		},
		{
			name:     "basic - share creds, templated credentials",
			authType: authTypeBasic,
			authConfig: map[string]interface{}{
				"shareBasicAuthCreds": true,
				"username":            "{{ Env.shared_auth_username }}",
				"password":            "{{ 2 + 2 }}",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Basic {{ btoa(`${ Env.shared_auth_username }:${ 2 + 2 }`) }}",
				},
			},
			expectedParams: []interface{}{},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Basic <redacted>",
				},
			},
			expectedParamsRedacted: []interface{}{},
		},
		{
			name:     "basic - cookie",
			authType: authTypeBasic,
			authConfig: map[string]interface{}{
				"shareBasicAuthCreds": false,
			},
			cookie: "basic.datasourceId-token=cookietoken==",
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Basic cookietoken==",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Basic <redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "basic - url encoded token",
			authType: authTypeBasic,
			authConfig: map[string]interface{}{
				"shareBasicAuthCreds": false,
			},
			cookie: "basic.datasourceId-token=cookietoken%3D%3D",
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Basic cookietoken==",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Basic <redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "bearer",
			authType: authTypeBearer,
			authConfig: map[string]interface{}{
				"bearerToken": "bearerToken",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Bearer bearerToken",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Bearer <redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "token prefixed - unset prefix",
			authType: authTypeTokenPrefixed,
			authConfig: map[string]interface{}{
				"token": "tokenValue",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Bearer tokenValue",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Bearer <redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "token prefixed - custom prefix",
			authType: authTypeTokenPrefixed,
			authConfig: map[string]interface{}{
				"token":  "tokenValue",
				"prefix": "Token token=",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Token token=tokenValue",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Token token=<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "token prefixed - empty prefix",
			authType: authTypeTokenPrefixed,
			authConfig: map[string]interface{}{
				"token":  "tokenValue",
				"prefix": "",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Bearer tokenValue",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Bearer <redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "token prefixed - unset prefix, token starts with default prefix",
			authType: authTypeTokenPrefixed,
			authConfig: map[string]interface{}{
				"token": "Bearer tokenValue",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Bearer tokenValue",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "token prefixed - deduplicated exact",
			authType: authTypeTokenPrefixed,
			authConfig: map[string]interface{}{
				"token":  "SomePrefix tokenValue",
				"prefix": "SomePrefix ",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "SomePrefix tokenValue",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "token prefixed - deduplicated substring",
			authType: authTypeTokenPrefixed,
			authConfig: map[string]interface{}{
				"token":  "Bearer tokenValue",
				"prefix": "Bear",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "Bearer tokenValue",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "token prefixed - full match",
			authType: authTypeTokenPrefixed,
			authConfig: map[string]interface{}{
				"token":  "SomeValue",
				"prefix": "SomeValue",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "SomeValue",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "Authorization",
					"value": "<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "token prefixed - unset token",
			authType: authTypeTokenPrefixed,
			authConfig: map[string]interface{}{
				"prefix": "Token token=",
			},
			expectedHeaders:         []interface{}{},
			expectedHeadersRedacted: []interface{}{},
			expectedParams:          []interface{}{},
		},
		{
			name:     "token prefixed - empty token",
			authType: authTypeTokenPrefixed,
			authConfig: map[string]interface{}{
				"token":  "",
				"prefix": "Token token=",
			},
			expectedHeaders:         []interface{}{},
			expectedHeadersRedacted: []interface{}{},
			expectedParams:          []interface{}{},
		},
		{
			name:     "api key form single header",
			authType: authTypeApiKeyForm,
			authConfig: map[string]interface{}{
				"method": "header",
				// This awkward cast is needed because Go doesn't automatically
				// case []T to []interface{} since it doesn't happen in O(1)
				// time.
				"apiKeys": map[string]interface{}{
					"first-token": interface{}(map[string]interface{}{
						"header": "My-Token-Value",
						"token":  "123123token123123",
					}),
				},
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "My-Token-Value",
					"value": "123123token123123",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "My-Token-Value",
					"value": "<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "api key form two headers",
			authType: authTypeApiKeyForm,
			authConfig: map[string]interface{}{
				"method": "header",
				// This awkward cast is needed because Go doesn't automatically
				// case []T to []interface{} since it doesn't happen in O(1)
				// time.
				"apiKeys": map[string]interface{}{
					"first-token": interface{}(map[string]interface{}{
						"header": "My-Token-Value",
						"token":  "123123token123123",
					}),
					"second-token": interface{}(map[string]interface{}{
						"header": "My-Token-Value-2",
						"token":  "second-token",
					}),
				},
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "My-Token-Value",
					"value": "123123token123123",
				},
				map[string]interface{}{
					"key":   "My-Token-Value-2",
					"value": "second-token",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "My-Token-Value",
					"value": "<redacted>",
				},
				map[string]interface{}{
					"key":   "My-Token-Value-2",
					"value": "<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "api key form - unset token",
			authType: authTypeApiKeyForm,
			authConfig: map[string]interface{}{
				"method": "header",
				// This awkward cast is needed because Go doesn't automatically
				// case []T to []interface{} since it doesn't happen in O(1)
				// time.
				"apiKeys": map[string]interface{}{
					"first-token": interface{}(map[string]interface{}{
						"header": "My-Token-Value",
						"token":  "",
					}),
				},
			},
			expectedHeaders: []interface{}{},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "My-Token-Value",
					"value": "<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "api key - header",
			authType: authTypeApiKey,
			authConfig: map[string]interface{}{
				"method": "header",
				"value":  "token",
				"key":    "api-key-id",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "api-key-id",
					"value": "token",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "api-key-id",
					"value": "<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "api key - header - missing method",
			authType: authTypeApiKey,
			authConfig: map[string]interface{}{
				"value": "token",
				"key":   "api-key-id",
			},
			expectedHeaders: []interface{}{
				map[string]interface{}{
					"key":   "api-key-id",
					"value": "token",
				},
			},
			expectedHeadersRedacted: []interface{}{
				map[string]interface{}{
					"key":   "api-key-id",
					"value": "<redacted>",
				},
			},
			expectedParams: []interface{}{},
		},
		{
			name:     "api key - param",
			authType: authTypeApiKey,
			authConfig: map[string]interface{}{
				"method": "query-param",
				"value":  "token",
				"key":    "api-key-id",
			},
			expectedHeaders: []interface{}{},
			expectedParams: []interface{}{
				map[string]interface{}{
					"key":   "api-key-id",
					"value": "token",
				},
			},
			expectedParamsRedacted: []interface{}{
				map[string]interface{}{
					"key":   "api-key-id",
					"value": "<redacted>",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tm := &tokenManager{
				clock:  clockwork.NewFakeClock(),
				logger: zap.NewNop(),
			}

			dsConfig := DatasourceConfig(tt.authType, tt.authConfig)
			dsConfigRedacted := DatasourceConfig(tt.authType, tt.authConfig)

			tokenPayload, err := tm.AddTokenIfNeeded(
				ctxWithCookie(tt.cookie),
				dsConfig,
				dsConfigRedacted,
				nil,
				"datasourceId",
				"configurationId",
				"",
			)
			bindingName := tokenPayload.BindingName

			assert.ElementsMatch(t, tt.expectedHeaders, dsConfig.GetFields()["headers"].GetListValue().AsSlice())
			assert.ElementsMatch(t, tt.expectedParams, dsConfig.GetFields()["params"].GetListValue().AsSlice())
			if tt.expectedHeadersRedacted != nil {
				assert.ElementsMatch(t, tt.expectedHeadersRedacted, dsConfigRedacted.GetFields()["headers"].GetListValue().AsSlice())
			}
			if tt.expectedParamsRedacted != nil {
				assert.ElementsMatch(t, tt.expectedParamsRedacted, dsConfigRedacted.GetFields()["params"].GetListValue().AsSlice())
			}

			assert.NoError(t, err)
			assert.Equal(t, bindingName, tt.expectedGenericAuthType)
		})
	}
}

func TestAddTokenIfNeeded_Firebase(t *testing.T) {
	tm := &tokenManager{
		clock:  clockwork.NewFakeClock(),
		logger: zap.NewNop(),
	}

	// json5, not valid json
	authConfig := map[string]interface{}{
		"apiKey": "{projectId: \"projectId\"}",
	}

	dsConfig := DatasourceConfig(authTypeFirebase, authConfig)

	cookieCtx := ctxWithCookie("Firebase.projectId-token=token; Firebase.projectId-userId=123")

	tokenPayload, err := tm.AddTokenIfNeeded(cookieCtx, dsConfig, nil, nil, "", "", "")

	assert.NoError(t, err)
	assert.Equal(t, tokenPayload.BindingName, "firebase")
	assert.Equal(t, "token", tokenPayload.Token)
	assert.Equal(t, "", tokenPayload.IdToken)
	assert.Equal(t, "123", tokenPayload.UserId)
}

func TestCanBeNil(t *testing.T) {
	var tm *tokenManager
	_, err := tm.AddTokenIfNeeded(context.Background(), nil, nil, nil, "", "", "")
	assert.NoError(t, err)
}

func ctxWithCookie(cookie string) context.Context {
	return metadata.NewIncomingContext(context.Background(), metadata.New(map[string]string{
		"Cookie": cookie,
	}))
}

func DatasourceConfig(authType string, authConfig map[string]interface{}) *structpb.Struct {
	s, err := structpb.NewStruct(map[string]interface{}{
		"authType":   authType,
		"authConfig": authConfig,
	})
	if err != nil {
		panic(err)
	}
	return s
}

func TestDecodeJwt(t *testing.T) {
	tm := &tokenManager{
		clock:  clockwork.NewFakeClock(),
		logger: zaptest.NewLogger(t),
	}

	tests := []struct {
		name        string
		token       string
		wantErr     bool
		wantClaims  map[string]interface{}
		errContains string
	}{
		{
			name:        "empty token",
			token:       "",
			wantErr:     true,
			errContains: "empty token",
		},
		{
			name:        "invalid token",
			token:       "invalid.token",
			wantErr:     true,
			errContains: "failed to parse JWT",
		},
		{
			name:  "valid token",
			token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJmb29Ac3VwZXJibG9ja3MuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.acxuPTE4HrmSFMY9v73QY5qgQWrXsRrbWdLo5Ss7fgU",
			wantClaims: map[string]interface{}{
				"sub":   "1234567890",
				"name":  "John Doe",
				"email": "foo@superblocks.com",
				"iat":   float64(1516239022),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := tm.decodeJwt(tt.token)

			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errContains)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, tt.wantClaims, claims.AsMap())
		})
	}
}

func TestGetIdentityProviderAccessToken(t *testing.T) {
	tm := &tokenManager{
		clock:  clockwork.NewFakeClock(),
		logger: zaptest.NewLogger(t),
	}

	testCases := []struct {
		name                string
		authHeaderClaims    jwt.MapClaims
		isAuthHeaderNotAJwt bool
		expectedToken       string
		expectedErr         string
	}{
		{
			name:        "no auth header",
			expectedErr: "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" could not find a user JWT\n\nAuth method can't be used headlessly, like in Workflows or Scheduled Jobs.",
		},
		{
			name:                "invalid auth header",
			isAuthHeaderNotAJwt: true,
			expectedErr:         "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" could not find identity provider token\n\nPlease log in using a valid OIDC-based SSO provider. To configure or update your orgs SSO, or for assistance troubleshooting, please reach out to support.",
		},
		{
			name: "no identity provider access token",
			authHeaderClaims: map[string]any{
				"exp": "1234567890",
			},
			expectedErr: "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" could not find identity provider token\n\nPlease log in using a valid OIDC-based SSO provider. To configure or update your orgs SSO, or for assistance troubleshooting, please reach out to support.",
		},
		{
			name: "gets identity provider access token",
			authHeaderClaims: map[string]any{
				idpAccessTokenClaimKey: "idp-access-token",
				"exp":                  "1234567890",
			},
			expectedToken: "idp-access-token",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			var authHeader string
			if tc.isAuthHeaderNotAJwt {
				authHeader = "Bearer not-a-jwt"
			} else if len(tc.authHeaderClaims) > 0 {
				authHeaderJwt, err := jwt.NewWithClaims(jwt.SigningMethodHS256, tc.authHeaderClaims).SignedString([]byte("test-secret"))
				require.NoError(t, err)

				authHeader = fmt.Sprintf("Bearer %s", authHeaderJwt)
			}
			ctx := metadata.NewIncomingContext(
				context.Background(),
				metadata.New(
					map[string]string{
						constants.HeaderSuperblocksJwt: authHeader,
					},
				),
			)

			actualToken, err := tm.getIdentityProviderAccessToken(ctx)

			if tc.expectedErr != "" {
				assert.EqualError(t, err, tc.expectedErr)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expectedToken, actualToken)
			}
		})
	}
}

func TestIsValidJwt(t *testing.T) {
	tm := &tokenManager{
		clock:  clockwork.NewFakeClock(),
		logger: zaptest.NewLogger(t),
	}
	startTime := tm.clock.Now().Unix()
	oneHourFromNow := startTime + 3600
	oneHourAgo := startTime - 3600

	testCases := []struct {
		name               string
		claims             jwt.MapClaims
		isNotAJwt          bool
		subjectTokenSource pluginscommon.OAuth_AuthorizationCodeFlow_SubjectTokenSource
		expectedValid      bool
		expectedErr        string
	}{
		{
			name: "valid token",
			claims: map[string]any{
				"exp": oneHourFromNow,
			},
			expectedValid: true,
		},
		{
			name: "valid token with no exp",
			claims: map[string]any{
				idpAccessTokenClaimKey: "idp-access-token",
			},
			expectedValid: true,
		},
		{
			name:          "valid token with no claims",
			claims:        map[string]any{},
			expectedValid: true,
		},
		{
			name: "expired token",
			claims: map[string]any{
				"exp": oneHourAgo,
			},
			expectedValid: false,
			expectedErr:   "IntegrationOAuthError",
		},
		{
			name:        "not a jwt",
			isNotAJwt:   true,
			expectedErr: "IntegrationOAuthError",
		},
		{
			name: "expired token with subject token source",
			claims: map[string]any{
				"exp": oneHourAgo,
			},
			subjectTokenSource: pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER,
			expectedValid:      false,
			expectedErr:        "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" identity provider token expired\n\nRefresh your browser and follow prompts to reauthenticate with SSO.",
		},
		{
			name:               "not a jwt with subject token source",
			isNotAJwt:          true,
			subjectTokenSource: pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_STATIC_TOKEN,
			expectedErr:        "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" invalid static token provided\n\nPlease check the static token provided in the integration and try again.",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			var token string
			if tc.isNotAJwt {
				token = "not-a-jwt"
			} else if tc.claims != nil {
				var err error
				token, err = jwt.NewWithClaims(jwt.SigningMethodHS256, tc.claims).SignedString([]byte("test-secret"))
				require.NoError(t, err)
			}

			actualValid, err := tm.isValidJwt(token, tc.subjectTokenSource, nil)

			assert.Equal(t, tc.expectedValid, actualValid)
			if tc.expectedErr == "" {
				assert.NoError(t, err)
			} else {
				assert.EqualError(t, err, tc.expectedErr)
			}
		})
	}
}

func TestGetClaimsFromJwt(t *testing.T) {
	testCases := []struct {
		name           string
		token          string
		expectedClaims jwt.MapClaims
		expectedErr    string
	}{
		{
			name:        "empty token",
			token:       "",
			expectedErr: "empty token",
		},
		{
			name:        "invalid token",
			token:       "invalid.token",
			expectedErr: "failed to parse JWT: token is malformed: token contains an invalid number of segments",
		},
		{
			name:  "valid token",
			token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJmb29Ac3VwZXJibG9ja3MuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.acxuPTE4HrmSFMY9v73QY5qgQWrXsRrbWdLo5Ss7fgU",
			expectedClaims: map[string]interface{}{
				"sub":   "1234567890",
				"name":  "John Doe",
				"email": "foo@superblocks.com",
				"iat":   float64(1516239022),
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actualClaims, err := getClaimsFromJwt(tc.token)

			if tc.expectedErr != "" {
				assert.EqualError(t, err, tc.expectedErr)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expectedClaims, actualClaims)
			}
		})
	}
}

func TestGetCachedOauthToken(t *testing.T) {
	t.Helper()
	testCases := []struct {
		name               string
		ctx                context.Context
		expectedToken      string
		withCachedToken    string
		withCachedTokenErr error
	}{
		{
			name:            "does not return a cached token if no cached token exists",
			ctx:             context.Background(),
			withCachedToken: "",
			expectedToken:   "",
		},
		{
			name:            "returns a cached token if a cached token exists",
			ctx:             context.Background(),
			withCachedToken: "foo",
			expectedToken:   "foo",
		},
		{
			name:               "does not return a cached token if the fetch call returns an error",
			ctx:                context.Background(),
			withCachedTokenErr: errors.New("foo"),
			expectedToken:      "",
		},
		{
			name:            "does not return an existing cached token if event type is test",
			ctx:             constants.WithEventType(metadata.NewIncomingContext(context.Background(), nil), constants.EventTypeTest),
			withCachedToken: "foo",
			expectedToken:   "",
		},
		{
			name:            "does not return an non-existing cached token if event type is test",
			ctx:             constants.WithEventType(metadata.NewIncomingContext(context.Background(), nil), constants.EventTypeTest),
			withCachedToken: "",
			expectedToken:   "",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			args := validArgs(t)

			tm := &tokenManager{
				OAuthClient: &oauth.OAuthClient{
					HttpClient:    args.mockHttpClient,
					FetcherCacher: args.mockFetcherCacher,
					Clock:         args.clock,
					Logger:        zap.NewNop(),
				},

				OAuthCodeTokenFetcher: args.mockOAuthCodeTokenFetcher,
				clock:                 args.clock,
				logger:                zap.NewNop(),
			}

			args.mockOAuthCodeTokenFetcher.On("Fetch", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(tc.withCachedToken, "", tc.withCachedTokenErr).Maybe()

			tokenPayload := tm.getCachedOauthToken(tc.ctx,
				"",
				nil,
				"",
				"",
				"",
				zap.NewNop(),
			)

			assert.Equal(t, tc.expectedToken, tokenPayload)
		})
	}
}
