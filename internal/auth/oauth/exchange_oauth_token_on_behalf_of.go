package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	"github.com/superblocksteam/agent/pkg/utils"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
)

// Executes an OAuth token exchange on behalf of the subject token
// https://datatracker.ietf.org/doc/html/rfc8693
// Side effect is caching the exchanged token
func (c *OAuthClient) ExchangeOAuthTokenOnBehalfOf(
	ctx context.Context,
	authConfig *v1.OAuth_AuthorizationCodeFlow,
	subjectToken string,
	integrationId string,
	configurationId string,
) (string, error) {

	var origin string
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if origins, ok := md["origin"]; ok && len(origins) > 0 {
			origin = origins[0]
		}
	}

	if origin == "" {
		return "", &sberrors.InternalError{Err: fmt.Errorf("origin header is required to exchange oauth token")}
	}

	c.Logger.Info(
		"start exchange oauth token",
		zap.String("oauth-request-type", string(OauthTokenExchange)),
		zap.String("origin", origin),
		zap.String("tokenUrl", authConfig.TokenUrl),
		zap.String("clientId", authConfig.ClientId),
		zap.String("audience", authConfig.Audience),
		zap.String("scope", authConfig.Scope),
		zap.String("MD5(clientSecret)", utils.Md5(authConfig.ClientSecret)),
		zap.String("MD5(subjectToken)", utils.Md5(subjectToken)),
	)

	data := url.Values{}
	data.Set("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange")
	data.Set("subject_token", subjectToken)
	// NOTE: @joeyagreco - if we are given a subject token type from the user, we use that instead of the default "urn:ietf:params:oauth:token-type:access_token"
	data.Set("subject_token_type", "urn:ietf:params:oauth:token-type:access_token")
	if authConfig.SubjectTokenType != "" {
		data.Set("subject_token_type", authConfig.SubjectTokenType)
	}
	// GCP STS requires requested_token_type; other providers may not support it
	if parsedUrl, err := url.Parse(authConfig.TokenUrl); err == nil && parsedUrl.Hostname() == "sts.googleapis.com" {
		data.Set("requested_token_type", "urn:ietf:params:oauth:token-type:access_token")
	}
	if authConfig.Audience != "" {
		data.Set("audience", authConfig.Audience)
	}
	data.Set("scope", authConfig.Scope)
	if authConfig.ClientId != "" {
		data.Set("client_id", authConfig.ClientId)
	}
	if authConfig.ClientSecret != "" {
		data.Set("client_secret", authConfig.ClientSecret)
	}
	userProject := authConfig.BillingProjectNumber
	if userProject == "" {
		userProject = authConfig.ProjectId
	}
	if userProject != "" {
		data.Set("options", fmt.Sprintf(`{"userProject":"%s"}`, userProject))
	}

	req, err := http.NewRequestWithContext(ctx, "POST", authConfig.TokenUrl, strings.NewReader(data.Encode()))
	if err != nil {
		return "", &sberrors.InternalError{Err: fmt.Errorf("error creating token exchange request: %w", err)}
	}

	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("Accept", "application/json")

	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return "", sberrors.IntegrationOAuthError(ErrTokenUriServerError, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", sberrors.IntegrationOAuthError(ErrTokenUriServerInvalidResponse, err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", sberrors.IntegrationOAuthError(ErrTokenUriServerBadResponseCode, fmt.Errorf("Unexpected status code: %d: %s", resp.StatusCode, string(body))) //lint:ignore ST1005 This error message is user facing
	}

	var tokenResponse struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		ExpiresIn   int    `json:"expires_in"`
		Scope       string `json:"scope"`
	}

	if err := json.Unmarshal(body, &tokenResponse); err != nil {
		return "", sberrors.IntegrationOAuthError(ErrTokenUriServerInvalidResponse, err)
	}

	if tokenResponse.AccessToken == "" {
		return "", sberrors.IntegrationOAuthError(ErrTokenUriServerInvalidResponse, fmt.Errorf("No access token returned in Token URI response")) //lint:ignore ST1005 This error message is user facing
	}

	c.Logger.Info(
		"end exchange oauth token",
		zap.String("oauth-request-type", string(OauthTokenExchange)),
		zap.Bool("has_access_token", tokenResponse.AccessToken != ""),
		zap.Int("expires_in", tokenResponse.ExpiresIn),
	)

	accessToken := tokenResponse.AccessToken
	accessExpiresAt := c.Clock.Now().Add(time.Duration(tokenResponse.ExpiresIn) * time.Second).Unix()

	authConfigStruct, err := jsonutils.ToStruct(authConfig)
	if err != nil {
		return "", err
	}
	if authConfig.Scope == "datasource" {
		err = c.FetcherCacher.CacheSharedToken(string(OauthTokenExchange), authConfigStruct, TokenTypeAccess, accessToken, accessExpiresAt, integrationId, configurationId)
	} else {
		err = c.FetcherCacher.CacheUserToken(ctx, string(OauthTokenExchange), authConfigStruct, TokenTypeAccess, accessToken, accessExpiresAt, integrationId, configurationId)
	}
	if err != nil {
		c.Logger.Warn("error caching access token", zap.String("oauth-request-type", string(OauthTokenExchange)), zap.Error(err))
	}

	return accessToken, nil
}
