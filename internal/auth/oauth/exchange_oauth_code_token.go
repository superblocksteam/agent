package oauth

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/superblocksteam/agent/internal/auth/types"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	"github.com/superblocksteam/agent/pkg/utils"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
)

const (
	DefaultOauthCodeTokenExpirationPeriodSeconds = 3600 * 24 // 1 day
	authTypeOauthCode                            = "oauth-code"
)

const (
	CLIENT_AUTH_METHOD_BASIC = "BASIC"
	CLIENT_AUTH_METHOD_POST  = "POST"
)

// Main side effect: token gets cached on server. We don't need to return the token here
func (c *OAuthClient) ExchangeOauthCodeForToken(
	ctx context.Context,
	authConfig *v1.OAuth_AuthorizationCodeFlow,
	accessCode string,
	integrationId string,
	configurationId string,
) error {
	var origin string
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if origins, ok := md["origin"]; ok && len(origins) > 0 {
			origin = origins[0]
		}
	}

	if origin == "" {
		return fmt.Errorf("origin header is required to exchange oauth code for token")
	}

	c.Logger.Info(
		"start exchange access code for token",
		zap.String("oauth-request-type", "oauth-code"),
		zap.String("origin", origin),
		zap.String("tokenUrl", authConfig.TokenUrl),
		zap.String("MD5(accessCode)", utils.Md5(accessCode)),
		zap.String("clientId", authConfig.ClientId),
		zap.String("MD5(clientSecret)", utils.Md5(authConfig.ClientSecret)),
	)
	res, err := c.exchangeCode(authConfig, accessCode, origin)
	if err != nil {
		return err
	}

	accessToken := res.AccessToken
	idToken := res.IdToken
	nextRefreshToken := res.RefreshToken
	c.Logger.Info(
		"end exchange access code for token",
		zap.String("oauth-request-type", "oauth-code"),
		zap.Bool("has_access_token", accessToken != ""),
		zap.Bool("has_refresh_token", nextRefreshToken != ""),
		zap.Bool("has_id_token", idToken != ""),
		zap.Int("expires_in", res.ExpiresIn),
	)

	refreshExpiresAt := time.Now().Add(time.Duration(DefaultRefreshTokenExpirationPeriodSeconds) * time.Second).Unix()
	var accessExpiresAt int64
	if res.ExpiresIn == 0 {
		c.Logger.Info(`"expires_in" is 0 or not set in the response, not expiring this token`,
			zap.String("oauth-request-type", "oauth-code"),
			zap.String("expires-in-seconds", "0"),
		)
		// Cacher will persist null (never expires) for expires column in user_token table
		accessExpiresAt = 0
	} else {
		accessExpiresAt = time.Now().Add(time.Duration(res.ExpiresIn) * time.Second).Unix()
	}

	tokenScope := authConfig.TokenScope

	authConfigStruct, err := jsonutils.ToStruct(authConfig)
	if err != nil {
		return err
	}

	if nextRefreshToken != "" {
		if tokenScope == "datasource" {
			err = c.FetcherCacher.CacheSharedToken(authTypeOauthCode, authConfigStruct, TokenTypeRefresh, nextRefreshToken, refreshExpiresAt, integrationId, configurationId)
		} else {
			err = c.FetcherCacher.CacheUserToken(ctx, authTypeOauthCode, authConfigStruct, TokenTypeRefresh, nextRefreshToken, refreshExpiresAt, integrationId, configurationId)
		}
		if err != nil {
			c.Logger.Warn("error caching refresh token", zap.String("oauth-request-type", "oauth-code"), zap.Error(err))
		}
	}

	if accessToken != "" {
		if tokenScope == "datasource" {
			err = c.FetcherCacher.CacheSharedToken(authTypeOauthCode, authConfigStruct, TokenTypeAccess, accessToken, accessExpiresAt, integrationId, configurationId)
		} else {
			err = c.FetcherCacher.CacheUserToken(ctx, authTypeOauthCode, authConfigStruct, TokenTypeAccess, accessToken, accessExpiresAt, integrationId, configurationId)
		}
		if err != nil {
			c.Logger.Warn("error caching access token", zap.String("oauth-request-type", "oauth-code"), zap.Error(err))
		}
	}

	if idToken != "" {
		// try to parse the id token to get the expiry time
		parser := jwt.NewParser(jwt.WithoutClaimsValidation())
		claims := jwt.MapClaims{}
		_, _, err = parser.ParseUnverified(idToken, claims)
		if err != nil {
			c.Logger.Error("error parsing id token, going to ignore it", zap.String("oauth-request-type", "oauth-code"), zap.Error(err))
		} else {
			c.Logger.Debug("parsed id token", zap.String("oauth-request-type", "oauth-code"))
			var idTokenExpiresAt int64
			if e, ok := claims["exp"]; ok {
				idTokenExpiresAt = int64(e.(float64))
			}
			if tokenScope == "datasource" {
				err = c.FetcherCacher.CacheSharedToken(authTypeOauthCode, authConfigStruct, TokenTypeId, idToken, idTokenExpiresAt, integrationId, configurationId)
			} else {
				err = c.FetcherCacher.CacheUserToken(ctx, authTypeOauthCode, authConfigStruct, TokenTypeId, idToken, idTokenExpiresAt, integrationId, configurationId)
			}
			if err != nil {
				c.Logger.Warn("error caching id token", zap.String("oauth-request-type", "oauth-code"), zap.Error(err))
			}
		}

	}

	return err
}

func (c *OAuthClient) exchangeCode(authConfig *v1.OAuth_AuthorizationCodeFlow, accessCode string, origin string) (*types.Response, error) {
	tokenUrl := authConfig.TokenUrl
	if tokenUrl == "" {
		return nil, fmt.Errorf("tokenUrl is required to exchange oauth code for token")
	}
	if accessCode == "" {
		return nil, fmt.Errorf("accessCode is required to exchange oauth code for token")
	}
	clientId := authConfig.ClientId
	if clientId == "" {
		return nil, fmt.Errorf("clientId is required to exchange oauth code for token")
	}
	clientSecret := authConfig.ClientSecret
	audience := authConfig.Audience

	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("redirect_uri", fmt.Sprintf("%s/oauth/callback", origin))
	data.Set("code", accessCode)
	if authConfig.ClientAuthMethod != CLIENT_AUTH_METHOD_BASIC {
		data.Set("client_id", clientId)
		data.Set("client_secret", clientSecret)
	}
	if audience != "" {
		// Only add audience if specified
		data.Set("audience", audience)
	}

	req, err := http.NewRequest("POST", tokenUrl, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	if authConfig.ClientAuthMethod == CLIENT_AUTH_METHOD_BASIC {
		clientToken := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", clientId, clientSecret)))
		req.Header.Set("Authorization", fmt.Sprintf("Basic %s", clientToken))
	}

	res, err := c.HttpClient.Do(req)
	if err != nil {
		return nil, err
	}

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	if res.StatusCode >= 300 {
		if res.StatusCode == http.StatusUnauthorized {
			return nil, errors.IntegrationOAuthError(fmt.Errorf("%s", string(resBody)))
		}
		return nil, fmt.Errorf("failed to exchange oauth code for token, status code %d: %s", res.StatusCode, string(resBody))
	}

	r := &types.Response{}
	err = json.Unmarshal(resBody, r)
	if err != nil {
		return nil, err
	}

	if r.Error != "" {
		return nil, fmt.Errorf("failed to exchange oauth code for token, error: %s", r.Error)
	}

	return r, nil
}
