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
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"access_token": "access-token", "token_type": "Bearer", "expires_in": 3600, "scope": "organization"}`,
		},
		{
			name: "success, no-op no access token returned from token exchange",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				Audience:     "https://example.com/userinfo",
				ClientId:     "client-id",
				ClientSecret: "client-secret",
				Scope:        "user",
				TokenUrl:     "https://example.com/token",
			},
			origin:                    "origin",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"refresh_token": "refresh-token", "expires_in": 86400, "scope": "user"}`,
		},
		{
			name:        "no origin in context",
			origin:      "",
			expectedErr: "origin header is required to exchange oauth token",
		},
		{
			name: "error creating request, bad token url",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				TokenUrl: "invalid\n-token-\turl",
			},
			origin:      "origin",
			expectedErr: "error creating token exchange request: parse \"invalid\\n-token-\\turl\": net/url: invalid control character in URL",
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
			origin:             "origin",
			expectedErr:        "error executing token exchange request: upstream disconnect",
			exchangeRequestErr: errors.New("upstream disconnect"),
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
			expectedErr:               "token exchange request failed with status 400: {\"error\": \"invalid_grant\"}",
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
			expectedErr:               "error parsing token exchange response: unexpected end of JSON input",
			exchangeRequestStatusCode: http.StatusOK,
			exchangeResponseBody:      `{"access_token": "access-token", "token...`,
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
						authTypeOauthTokenExchange,
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
						authTypeOauthTokenExchange,
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
