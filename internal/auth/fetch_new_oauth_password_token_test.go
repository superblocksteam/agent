package auth

import (
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/internal/auth/mocks"
	"github.com/superblocksteam/agent/internal/auth/oauth"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
)

func TestFetchNewOauthPasswordToken(t *testing.T) {
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
		Body:       io.NopCloser(strings.NewReader(`{"access_token":"token", "refresh_token":"refresh_token"}`)),
	}, nil)

	authConfig := &v1.OAuth_PasswordGrantFlow{
		TokenUrl:     "tokenUrl",
		Audience:     "audience",
		Scope:        "scope",
		ClientId:     "clientId",
		ClientSecret: "clientSecret",
		Username:     "username",
		Password:     "password",
	}

	res, err := tm.FetchNewOauthPasswordToken(authConfig)
	assert.NoError(t, err)
	assert.Equal(t, "token", res.AccessToken)
	assert.Equal(t, "refresh_token", res.RefreshToken)
}
