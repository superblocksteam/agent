package oauth

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	authmocks "github.com/superblocksteam/agent/internal/auth/mocks"
	clientmocks "github.com/superblocksteam/agent/pkg/clients/mocks"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap/zaptest"
)

func Test(t *testing.T) {
	t.Run("invalid refresh token", func(t *testing.T) {
		fetcherCacher := &authmocks.FetcherCacher{}
		fetcherCacher.On("FetchSharedToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return("", nil)

		serverClient := &clientmocks.ServerClient{}
		serverClient.On("PostGSheetsTokenRefresh", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(
			&http.Response{
				StatusCode: http.StatusBadRequest,
				Body:       io.NopCloser(strings.NewReader(`{"access_token": "access-token", "error": "invalid_grant"}`)),
			},
			nil,
		)

		oauthClient := &OAuthClient{
			Logger:        zaptest.NewLogger(t),
			FetcherCacher: fetcherCacher,
		}

		codeTokenFetcher := NewOAuthCodeTokenFetcher(
			oauthClient,
			fetcherCacher,
			serverClient,
		)
		authConfig := &v1.OAuth_AuthorizationCodeFlow{
			RefreshTokenFromServer: true,
			TokenScope:             "datasource",
		}
		_, _, err := codeTokenFetcher.Fetch(context.Background(), "oauth-code", authConfig, "", "", pluginIdGsheets)
		assert.ErrorContains(t, err, "invalid refresh")
		assert.ErrorIs(t, err, ErrInvalidRefreshToken)
	})
}

// TestFetchNeedsAuthorizationClassification locks which Fetch failures mean
// "the user must (re)authorize" (IsAuthorizationRequired == true) versus
// system/config failures that must stay plain errors.
func TestFetchNeedsAuthorizationClassification(t *testing.T) {
	errBoom := assert.AnError

	for _, tt := range []struct {
		name            string
		authConfig      *v1.OAuth_AuthorizationCodeFlow
		pluginId        string
		setupFetcher    func(fc *authmocks.FetcherCacher)
		setupHttp       func(hc *authmocks.HttpClient)
		setupServer     func(sc *clientmocks.ServerClient)
		needsAuth       bool
		wantErrIs       error
		wantErrContains string
	}{
		{
			name:            "refreshTokenFromServer on non-gsheets plugin is a config error",
			authConfig:      &v1.OAuth_AuthorizationCodeFlow{RefreshTokenFromServer: true},
			pluginId:        "not-gsheets",
			setupFetcher:    func(fc *authmocks.FetcherCacher) {},
			needsAuth:       false,
			wantErrContains: "refreshTokenFromServer is only supported for gsheets plugin",
		},
		{
			name:       "shared token fetch failure is a system error",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{TokenScope: "datasource"},
			setupFetcher: func(fc *authmocks.FetcherCacher) {
				fc.On("FetchSharedToken", mock.Anything, mock.Anything, TokenTypeAccess, mock.Anything, mock.Anything).Return("", errBoom)
			},
			needsAuth: false,
			wantErrIs: errBoom,
		},
		{
			name:       "id token fetch failure is a system error",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{},
			setupFetcher: func(fc *authmocks.FetcherCacher) {
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeAccess).Return("", nil)
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeId).Return("", errBoom)
			},
			needsAuth: false,
			wantErrIs: errBoom,
		},
		{
			name:       "refresh token row fetch failure is a system error",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{},
			setupFetcher: func(fc *authmocks.FetcherCacher) {
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeAccess).Return("", nil)
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeId).Return("", nil)
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeRefresh).Return("", errBoom)
			},
			needsAuth: false,
			wantErrIs: errBoom,
		},
		{
			name:       "missing refresh token needs authorization",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{},
			setupFetcher: func(fc *authmocks.FetcherCacher) {
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeAccess).Return("", nil)
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeId).Return("", nil)
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeRefresh).Return("", nil)
			},
			needsAuth: true,
			wantErrIs: ErrNoRefreshTokenFound,
		},
		{
			name:       "provider invalid_grant needs authorization",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{ClientId: "clientId", ClientSecret: "clientSecret"},
			setupFetcher: func(fc *authmocks.FetcherCacher) {
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeAccess).Return("", nil)
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeId).Return("", nil)
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeRefresh).Return("revoked", nil)
			},
			setupHttp: func(hc *authmocks.HttpClient) {
				hc.On("Do", mock.Anything).Return(&http.Response{
					StatusCode: http.StatusBadRequest,
					Body:       io.NopCloser(strings.NewReader(`{"error":"invalid_grant"}`)),
				}, nil)
			},
			needsAuth: true,
			wantErrIs: ErrInvalidRefreshToken,
		},
		{
			name:       "provider refresh outage is a system error",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{ClientId: "clientId", ClientSecret: "clientSecret"},
			setupFetcher: func(fc *authmocks.FetcherCacher) {
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeAccess).Return("", nil)
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeId).Return("", nil)
				fc.On("FetchUserToken", mock.Anything, mock.Anything, mock.Anything, TokenTypeRefresh).Return("goodtoken", nil)
			},
			setupHttp: func(hc *authmocks.HttpClient) {
				hc.On("Do", mock.Anything).Return(&http.Response{
					StatusCode: http.StatusBadGateway,
					Body:       io.NopCloser(strings.NewReader(`upstream unavailable`)),
				}, nil)
			},
			needsAuth:       false,
			wantErrContains: "failed to refresh oauth token",
		},
		{
			name:       "gsheets server-refresh invalid_grant needs authorization",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{RefreshTokenFromServer: true, TokenScope: "datasource"},
			pluginId:   pluginIdGsheets,
			setupFetcher: func(fc *authmocks.FetcherCacher) {
				fc.On("FetchSharedToken", mock.Anything, mock.Anything, TokenTypeAccess, mock.Anything, mock.Anything).Return("", nil)
				fc.On("FetchSharedToken", mock.Anything, mock.Anything, TokenTypeId, mock.Anything, mock.Anything).Return("", nil)
			},
			setupServer: func(sc *clientmocks.ServerClient) {
				sc.On("PostGSheetsTokenRefresh", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
					StatusCode: http.StatusBadRequest,
					Body:       io.NopCloser(strings.NewReader(`{"error": "invalid_grant"}`)),
				}, nil)
			},
			// refreshFromServerGsheets returns the BARE sentinel; Fetch must wrap
			// it exactly once and errors.Is must still match — the transport
			// Delete handler (internal/transport/grpc.go) depends on
			// errors.Is(err, ErrInvalidRefreshToken) for this gsheets path.
			needsAuth: true,
			wantErrIs: ErrInvalidRefreshToken,
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			fetcherCacher := &authmocks.FetcherCacher{}
			tt.setupFetcher(fetcherCacher)

			httpMock := &authmocks.HttpClient{}
			if tt.setupHttp != nil {
				tt.setupHttp(httpMock)
			}

			oauthClient := &OAuthClient{
				Logger:        zaptest.NewLogger(t),
				FetcherCacher: fetcherCacher,
				HttpClient:    httpMock,
			}
			serverClient := &clientmocks.ServerClient{}
			if tt.setupServer != nil {
				tt.setupServer(serverClient)
			}
			fetcher := NewOAuthCodeTokenFetcher(oauthClient, fetcherCacher, serverClient)

			_, _, err := fetcher.Fetch(context.Background(), "oauth-code", tt.authConfig, "datasource_id", "configuration_id", tt.pluginId)

			assert.Error(t, err)
			assert.Equal(t, tt.needsAuth, IsAuthorizationRequired(err), "IsAuthorizationRequired mismatch for %v", err)
			if tt.wantErrIs != nil {
				assert.ErrorIs(t, err, tt.wantErrIs)
			}
			if tt.wantErrContains != "" {
				assert.ErrorContains(t, err, tt.wantErrContains)
			}
			// The oauth error wrapper must appear exactly once.
			assert.Equal(t, 1, strings.Count(err.Error(), "IntegrationOAuthError:"), "double-wrapped error: %v", err)
		})
	}
}
