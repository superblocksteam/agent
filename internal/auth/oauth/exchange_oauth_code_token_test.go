package oauth

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/internal/auth/mocks"

	"github.com/stretchr/testify/assert"

	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"

	"encoding/base64"
	"io"
	"net/http"
	"strings"

	"go.uber.org/zap"
)

func TestExchangeCode(t *testing.T) {
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
			name: "sends client credentials in body if ClientAuthMethod is POST",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				ClientId:         "clientId",
				ClientSecret:     "clientSecret",
				ClientAuthMethod: CLIENT_AUTH_METHOD_POST,
				TokenUrl:         "https://superblocks.com/oauth/token",
				Audience:         "audience",
			},
			accessCode:                "accessCode",
			expectCredentialsInHeader: false,
			expiresIn:                 3600,
			responseString:            fmt.Sprintf(`{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`, 3600),
		},
		{
			name: "sends client credentials in header if ClientAuthMethod is BASIC",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				ClientId:         "clientId",
				ClientSecret:     "clientSecret",
				ClientAuthMethod: CLIENT_AUTH_METHOD_BASIC,
				TokenUrl:         "https://superblocks.com/oauth/token",
				Audience:         "audience",
			},
			accessCode:                "accessCode",
			expectCredentialsInHeader: true,
			expiresIn:                 3600,
			responseString:            fmt.Sprintf(`{"access_token":"token", "expires_in":%v , "refresh_token":"refreshtoken"}`, 3600),
		},
		{
			name: "returns error when TokenUrl is empty",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				ClientId:     "clientId",
				ClientSecret: "clientSecret",
				Audience:     "audience",
			},
			expectedErrorMessage: "tokenUrl is required to exchange oauth code for token",
		},
		{
			name: "returns error when accessCode is empty",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				ClientId:     "clientId",
				ClientSecret: "clientSecret",
				TokenUrl:     "https://superblocks.com/oauth/token",
				Audience:     "audience",
			},
			expectedErrorMessage: "accessCode is required to exchange oauth code for token",
		},
		{
			name: "returns error when clientId is empty",
			authConfig: &v1.OAuth_AuthorizationCodeFlow{
				ClientSecret: "clientSecret",
				TokenUrl:     "https://superblocks.com/oauth/token",
				Audience:     "audience",
			},
			accessCode:           "accessCode",
			expectedErrorMessage: "clientId is required to exchange oauth code for token",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			httpMock := &mocks.HttpClient{}
			fetcherCacher := &mocks.FetcherCacher{}
			oauthClient := &OAuthClient{
				HttpClient:    httpMock,
				FetcherCacher: fetcherCacher,
				Logger:        zap.NewNop(),
			}

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

			response, err := oauthClient.exchangeCode(tt.authConfig, tt.accessCode, "https://superblocks.com")

			if tt.expectedErrorMessage != "" {
				assert.EqualError(t, err, tt.expectedErrorMessage)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expiresIn, response.ExpiresIn)
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
			}
		})
	}
}
