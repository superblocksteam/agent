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

	"github.com/superblocksteam/agent/pkg/jsonutils"
	"github.com/superblocksteam/agent/pkg/utils"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
)

const (
	authTypeOauthTokenExchange = "oauth-token-exchange"
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
		return "", fmt.Errorf("origin header is required to exchange oauth token")
	}

	c.Logger.Info(
		"start exchange oauth token",
		zap.String("oauth-request-type", "oauth-token-exchange"),
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
	data.Set("subject_token_type", "urn:ietf:params:oauth:token-type:access_token")
	data.Set("audience", authConfig.Audience)
	data.Set("scope", authConfig.Scope)
	data.Set("client_id", authConfig.ClientId)
	data.Set("client_secret", authConfig.ClientSecret)

	req, err := http.NewRequestWithContext(ctx, "POST", authConfig.TokenUrl, strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("error creating token exchange request: %w", err)
	}

	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("Accept", "application/json")

	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("error executing token exchange request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading token exchange response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("token exchange request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResponse struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		ExpiresIn   int    `json:"expires_in"`
		Scope       string `json:"scope"`
	}

	if err := json.Unmarshal(body, &tokenResponse); err != nil {
		return "", fmt.Errorf("error parsing token exchange response: %w", err)
	}

	c.Logger.Info(
		"end exchange oauth token",
		zap.String("oauth-request-type", "oauth-token-exchange"),
		zap.Bool("has_access_token", tokenResponse.AccessToken != ""),
		zap.Int("expires_in", tokenResponse.ExpiresIn),
	)

	accessToken := tokenResponse.AccessToken
	accessExpiresAt := c.Clock.Now().Add(time.Duration(tokenResponse.ExpiresIn) * time.Second).Unix()

	if tokenResponse.AccessToken != "" {
		authConfigStruct, err := jsonutils.ToStruct(authConfig)
		if err != nil {
			return "", err
		}
		if authConfig.Scope == "datasource" {
			err = c.FetcherCacher.CacheSharedToken(authTypeOauthTokenExchange, authConfigStruct, TokenTypeAccess, accessToken, accessExpiresAt, integrationId, configurationId)
		} else {
			err = c.FetcherCacher.CacheUserToken(ctx, authTypeOauthTokenExchange, authConfigStruct, TokenTypeAccess, accessToken, accessExpiresAt, integrationId, configurationId)
		}
		if err != nil {
			c.Logger.Warn("error caching access token", zap.String("oauth-request-type", "oauth-token-exchange"), zap.Error(err))
		}
	}

	return accessToken, nil
}
