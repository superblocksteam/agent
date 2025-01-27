package oauth

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/jonboulle/clockwork"
	"github.com/superblocksteam/agent/internal/auth/types"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
)

const (
	authTypeOauthClientCreds = "oauth-client-cred"
)

var (
	ErrNoClientCredsTokenFound = fmt.Errorf("[%s] no token found", authTypeOauthClientCreds)
)

//go:generate mockery --name=HttpClient --output=../mocks --outpkg=mocks
type HttpClient interface {
	Do(req *http.Request) (*http.Response, error)
}

type OAuthClient struct {
	HttpClient
	FetcherCacher
	Clock  clockwork.Clock
	Logger *zap.Logger
}

func NewOAuthClient(fetcherCacher FetcherCacher, clock clockwork.Clock, logger *zap.Logger) *OAuthClient {
	return &OAuthClient{
		HttpClient:    &http.Client{},
		FetcherCacher: fetcherCacher,
		Clock:         clock,
		Logger:        logger.With(zap.String("who", "oauth.client")),
	}
}

func (c *OAuthClient) GetClientCredsToken(authConfig *v1.OAuth_ClientCredentialsFlow) (string, error) {
	tokenUrl := authConfig.TokenUrl
	scope := authConfig.Scope
	audience := authConfig.Audience
	clientId := authConfig.ClientId
	clientSecret := authConfig.ClientSecret

	clientToken := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", clientId, clientSecret)))

	data := url.Values{}
	data.Set("grant_type", "client_credentials")

	if scope != "" {
		data.Set("scope", scope)
	}
	if audience != "" {
		data.Set("audience", audience)
	}

	httpReq, err := http.NewRequest("POST", tokenUrl, strings.NewReader(data.Encode()))
	if err != nil {
		return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound)
	}

	httpReq.Header = http.Header{
		"Content-Type": {"application/x-www-form-urlencoded"},
		// NOTE: might need to support other ways of passing the client token in the future (eg post body)
		"Authorization": {"Basic " + clientToken},
	}

	c.Logger.Info("requesting token", zap.String("token_url", tokenUrl), zap.String("scope", scope), zap.String("audience", audience), zap.String("oauth-request-type", "client_cred"))

	res, err := c.HttpClient.Do(httpReq)
	if err != nil {
		return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound, err)
	}

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound, err)
	}

	if res.StatusCode >= 300 {
		return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound, fmt.Errorf("oauth: unexpected status code: %d: %s", res.StatusCode, string(resBody)))
	}

	resInternal := &types.Response{}
	err = json.Unmarshal(resBody, resInternal)
	if err != nil {
		return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound, err)
	}

	var expiresAt int64
	if resInternal.ExpiresIn > 0 {
		expiresAt = time.Now().Add(time.Duration(resInternal.ExpiresIn) * time.Second).Unix()
	}

	authConfigStruct, err := jsonutils.ToStruct(authConfig)
	if err != nil {
		return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound, err)
	}

	err = c.FetcherCacher.CacheSharedToken(authTypeOauthClientCreds, authConfigStruct, TokenTypeAccess, resInternal.AccessToken, expiresAt, "", "")
	if err != nil {
		c.Logger.Warn("failed to cache token:", zap.Error(err), zap.String("oauth-request-type", "client_cred"))
	}

	c.Logger.Info("got access token", zap.Bool("cached", err == nil), zap.Int64("expires_at", expiresAt), zap.Bool("has_access_token", resInternal.AccessToken != ""), zap.String("oauth-request-type", "client_cred"))

	return resInternal.AccessToken, nil
}
