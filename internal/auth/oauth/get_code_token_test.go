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
