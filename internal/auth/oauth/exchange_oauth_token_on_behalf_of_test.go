package oauth

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/internal/auth/mocks"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap/zaptest"
	"google.golang.org/grpc/metadata"
)

func TestExchangeOAuthTokenOnBehalfOf(t *testing.T) {
	clock := clockwork.NewFakeClock()

	testCases := []struct {
		name                      string
		authConfig                *v1.OAuth_AuthorizationCodeFlow
		accessToken               string
		accessExpiresAt           int64
		origin                    string
		expectedSubjectTokenType  string
		expectedErr               string
		exchangeRequestErr        error
		exchangeRequestStatusCode int
		exchangeResponseBody      string
		cacheErr                  error
	}{
		{
			name: "success, user token",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "user",
				TokenUrl:     "https://example.com/token",
			},
			accessToken:               "access-token",
			accessExpiresAt:           clock.Now().Add(time.Hour).Unix(),
			origin:                    "origin",
			expectedSubjectTokenType:  "urn:ietf:params:oauth:token-type:access_token",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"access_token": "access-token", "token_type": "Bearer", "expires_in": 3600, "scope": "user"}`,
		},
		{
			name: "success, default subject token type used if none given",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "user",
				TokenUrl:     "https://example.com/token",
			},
			accessToken:               "access-token",
			accessExpiresAt:           clock.Now().Add(time.Hour).Unix(),
			origin:                    "origin",
			expectedSubjectTokenType:  "urn:ietf:params:oauth:token-type:access_token",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"access_token": "access-token", "token_type": "Bearer", "expires_in": 3600, "scope": "user"}`,
		},
		{
			name: "success, subject token type used if provided",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:         "https://example.com/userinfo",
				ClientId:         "client-id",
				ClientSecret:     "client-secret",
				Scope:            "user",
				TokenUrl:         "https://example.com/token",
				SubjectTokenType: "custom-subject-token-type",
			},
			accessToken:               "access-token",
			accessExpiresAt:           clock.Now().Add(time.Hour).Unix(),
			origin:                    "origin",
			expectedSubjectTokenType:  "custom-subject-token-type",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"access_token": "access-token", "token_type": "Bearer", "expires_in": 3600, "scope": "user"}`,
		},
		{
			name: "success, shared token",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "datasource",
				TokenUrl:     "https://example.com/token",
			},
			accessToken:               "access-token",
			accessExpiresAt:           clock.Now().Add(time.Hour).Unix(),
			origin:                    "origin",
			expectedSubjectTokenType:  "urn:ietf:params:oauth:token-type:access_token",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"access_token": "access-token", "token_type": "Bearer", "expires_in": 3600, "scope": "organization"}`,
		},
		{
			name:        "no origin in context",
			origin:      "",
			expectedErr: "InternalError: origin header is required to exchange oauth token",
		},
		{
			name: "error creating request, bad token url",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl: "invalid\n-token-\turl",
			},
			origin:      "origin",
			expectedErr: "InternalError: error creating token exchange request: parse \"invalid\\n-token-\\turl\": net/url: invalid control character in URL",
		},
		{
			name: "error executing token exchange request",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "user",
				TokenUrl:     "https://example.com/token",
			},
			origin:                   "origin",
			expectedSubjectTokenType: "urn:ietf:params:oauth:token-type:access_token",
			expectedErr:              "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" token exchange failed\n\nupstream disconnect",
			exchangeRequestErr:       errors.New("upstream disconnect"),
		},
		{
			name: "token exchange request fails",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "user",
				TokenUrl:     "https://example.com/token",
			},
			origin:                    "origin",
			expectedSubjectTokenType:  "urn:ietf:params:oauth:token-type:access_token",
			expectedErr:               "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" token exchange failed\n\nUnexpected status code: 400: {\"error\": \"invalid_grant\"}",
			exchangeRequestStatusCode: http.StatusBadRequest,
			exchangeResponseBody:      `{"error": "invalid_grant"}`,
		},
		{
			name: "invalid json in token exchange response",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "user",
				TokenUrl:     "https://example.com/token",
			},
			origin:                    "origin",
			expectedSubjectTokenType:  "urn:ietf:params:oauth:token-type:access_token",
			expectedErr:               "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" token exchange failed\n\nunexpected end of JSON input",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"access_token": "access-token", "token...`,
		},
		{
			name: "no access token returned in token exchange response",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "user",
				TokenUrl:     "https://example.com/token",
			},
			origin:                    "origin",
			expectedSubjectTokenType:  "urn:ietf:params:oauth:token-type:access_token",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"refresh_token": "refresh-token", "expires_in": 86400, "scope": "user"}`,
			expectedErr:               "IntegrationOAuthError: OAuth2 - \"On-Behalf-Of Token Exchange\" token exchange failed\n\nNo access token returned in Token URI response",
		},
		{
			name: "error caching user access token",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "user",
				TokenUrl:     "https://example.com/token",
			},
			accessToken:               "access-token",
			accessExpiresAt:           clock.Now().Add(time.Hour).Unix(),
			origin:                    "origin",
			expectedSubjectTokenType:  "urn:ietf:params:oauth:token-type:access_token",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"access_token": "access-token", "token_type": "Bearer", "expires_in": 3600, "scope": "user"}`,
			cacheErr:                  errors.New("error caching user access token"),
		},
		{
			name: "error caching shared access token",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "datasource",
				TokenUrl:     "https://example.com/token",
			},
			accessToken:               "access-token",
			accessExpiresAt:           clock.Now().Add(time.Hour).Unix(),
			origin:                    "origin",
			expectedSubjectTokenType:  "urn:ietf:params:oauth:token-type:access_token",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"access_token": "access-token", "token_type": "Bearer", "expires_in": 3600, "scope": "organization"}`,
			cacheErr:                  errors.New("error caching shared access token"),
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			httpMock := &mocks.HttpClient{}
			fetcherCacher := &mocks.FetcherCacher{}
			client := &OAuthClient{
				HttpClient:    httpMock,
				FetcherCacher: fetcherCacher,
				Clock:         clock,
				Logger:        zaptest.NewLogger(t),
			}

			anySubjectToken := "any-subject-token"
			anyIntegrationId := "any-integration-id"
			anyConfigurationId := "any-configuration-id"

			ctx := metadata.NewIncomingContext(context.Background(), metadata.New(map[string]string{"origin": tc.origin}))

			httpMock.On(
				"Do",
				mock.MatchedBy(func(req *http.Request) bool {
					actualSubjectTokenType := req.FormValue("subject_token_type")
					assert.Equal(t, actualSubjectTokenType, tc.expectedSubjectTokenType)
					return req.Method == http.MethodPost &&
						req.URL.String() == tc.authConfig.TokenUrl &&
						req.Header.Get("Content-Type") == "application/x-www-form-urlencoded" &&
						req.Header.Get("Accept") == "application/json"
				}),
			).Return(
				&http.Response{
					StatusCode: tc.exchangeRequestStatusCode,
					Body:       io.NopCloser(bytes.NewBufferString(tc.exchangeResponseBody)),
				}, tc.exchangeRequestErr,
			)

			if tc.accessToken != "" {
				if tc.authConfig.Scope == "datasource" {
					fetcherCacher.On(
						"CacheSharedToken",
						string(OauthTokenExchange),
						mock.Anything,
						TokenTypeAccess,
						tc.accessToken,
						tc.accessExpiresAt,
						anyIntegrationId,
						anyConfigurationId,
					).Return(tc.cacheErr).Once()
				} else {
					fetcherCacher.On(
						"CacheUserToken",
						ctx,
						string(OauthTokenExchange),
						mock.Anything,
						TokenTypeAccess,
						tc.accessToken,
						tc.accessExpiresAt,
						anyIntegrationId,
						anyConfigurationId,
					).Return(tc.cacheErr).Once()
				}
			}

			actualToken, actualErr := client.ExchangeOAuthTokenOnBehalfOf(ctx, tc.authConfig, anySubjectToken, anyIntegrationId, anyConfigurationId)

			if tc.expectedErr != "" {
				assert.EqualError(t, actualErr, tc.expectedErr)
			} else {
				assert.NoError(t, actualErr)
				assert.Equal(t, tc.accessToken, actualToken)
			}
		})
	}
}
