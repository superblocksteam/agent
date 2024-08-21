package auth

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/oauth"
	"github.com/superblocksteam/agent/pkg/clients"
	pluginscommon "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/structpb"
)

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

			tm := &tokenManager{
				OAuthClient: &oauth.OAuthClient{
					HttpClient:    httpMock,
					FetcherCacher: fetcherCacher,
					Logger:        zap.NewNop(),
				},
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

			tm := &tokenManager{
				OAuthClient: &oauth.OAuthClient{
					HttpClient:    httpMock,
					FetcherCacher: fetcherCacher,
					Logger:        zap.NewNop(),
				},
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			httpMock := &mocks.HttpClient{}
			fetcherCacher := &mocks.FetcherCacher{}
			oauthClient := &oauth.OAuthClient{
				HttpClient:    httpMock,
				FetcherCacher: fetcherCacher,
				Logger:        zap.NewNop(),
			}

			serverClient := clients.NewServerClient(&clients.ServerClientOptions{
				URL:    "https://google.com",
				Client: httpMock,
				Headers: map[string]string{
					"x-superblocks-agent-id": "bar",
				},
				SuperblocksAgentKey: "foo",
			})

			oauthCodeTokenFetcher := oauth.NewOAuthCodeTokenFetcher(oauthClient, fetcherCacher, serverClient)

			tm := &tokenManager{
				OAuthClient:           oauthClient,
				OAuthCodeTokenFetcher: oauthCodeTokenFetcher,
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

			if tt.expectedError != "" {
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

func TestAddTokenIfNeeded_OauthImplicit(t *testing.T) {
	tm := &tokenManager{
		OAuthClient: &oauth.OAuthClient{
			Logger: zap.NewNop(),
		},
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
	tm := &tokenManager{logger: zaptest.NewLogger(t)}

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
			tm := &tokenManager{logger: zap.NewNop()}

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
	tm := &tokenManager{logger: zap.NewNop()}

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
