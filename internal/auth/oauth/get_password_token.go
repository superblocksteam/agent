package oauth

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/superblocksteam/agent/internal/auth/types"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
)

const (
	DefaultRefreshTokenExpirationPeriodSeconds = 90 * 24 * 60 * 60 // 90 days
)

var (
	ErrNoPasswordTokenFound = errors.New("[oauth-pword] no token found")
)

type fetchOauthPasswordRequestExperian struct {
	Username     string `json:"username"`
	Password     string `json:"password"`
	ClientId     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

func (c *OAuthClient) GetPasswordToken(authType string, authConfig *v1.OAuth_PasswordGrantFlow, datasourceId string, configurationId string) (string, error) {
	c.Logger.Info("[oauth-pword] start fetch shared token")
	authConfigStruct, err := jsonutils.ToStruct(authConfig)
	if err != nil {
		return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound, err)
	}
	authConfigCommon := &v1.OAuthCommon{
		ClientId:     authConfig.ClientId,
		ClientSecret: authConfig.ClientSecret,
		TokenUrl:     authConfig.TokenUrl,
		Audience:     authConfig.Audience,
		Scope:        authConfig.Scope,
	}
	refreshToken, err := c.FetcherCacher.FetchSharedToken(authType, authConfigStruct, TokenTypeRefresh, datasourceId, configurationId)
	if err != nil {
		return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound, err)
	}
	c.Logger.Info("[oauth-pword] end fetch shared token", zap.Bool("has_refresh_token", refreshToken != ""))

	var refreshRes *types.Response

	if refreshToken != "" {
		// This should only return an access token
		c.Logger.Info("[oauth-pword] start refresh access token")
		// TODO make sure the following support new pluginAuth
		refreshRes, err = c.RefreshToken(authConfigCommon, refreshToken)
		if err != nil {
			return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound, err)
		}
		c.Logger.Info("[oauth-pword] end refresh access token", zap.Bool("has_access_token", refreshRes.AccessToken != ""))
	}

	if refreshRes == nil || refreshRes.AccessToken == "" {
		// This should have both an access token and maybe a refresh token
		c.Logger.Info("[oauth-pword] start fetch access token")
		refreshRes, err = c.FetchNewOauthPasswordToken(authConfig)

		if err != nil {
			return "", sberrors.IntegrationOAuthError(ErrNoClientCredsTokenFound, err)
		}
	}

	accessToken := refreshRes.AccessToken
	nextRefreshToken := refreshRes.RefreshToken
	c.Logger.Info("[oauth-pword] end fetch access token", zap.Bool("has_access_token", accessToken != ""), zap.Bool("has_refresh_token", nextRefreshToken != ""))

	refreshExpiresAt := time.Now().Add(time.Duration(DefaultRefreshTokenExpirationPeriodSeconds) * time.Second).Unix()
	accessExpiresAt := time.Now().Add(time.Duration(refreshRes.ExpiresIn) * time.Second).Unix()

	if nextRefreshToken != "" {
		// TODO make following support new pluginAuth
		err = c.FetcherCacher.CacheSharedToken(authType, authConfigStruct, TokenTypeRefresh, nextRefreshToken, refreshExpiresAt, datasourceId, configurationId)
		if err != nil {
			c.Logger.Warn("[oauth-pword] error caching refresh token", zap.Error(err))
		}
	}

	if accessToken != "" {
		// TODO make following support new pluginAuth
		err = c.FetcherCacher.CacheSharedToken(authType, authConfigStruct, TokenTypeAccess, accessToken, accessExpiresAt, datasourceId, configurationId)
		if err != nil {
			c.Logger.Warn("[oauth-pword] error caching access token", zap.Error(err))
		}
	}

	return accessToken, nil
}

func (c *OAuthClient) FetchNewOauthPasswordToken(authConfig *v1.OAuth_PasswordGrantFlow) (*types.Response, error) {
	tokenUrl := authConfig.TokenUrl
	audience := authConfig.Audience
	scope := authConfig.Scope
	clientId := authConfig.ClientId
	clientSecret := authConfig.ClientSecret
	username := authConfig.Username
	password := authConfig.Password

	// edge case... experian does it wrong
	isExperian := strings.Contains(tokenUrl, "experian.com")

	var res *http.Response

	if !isExperian {
		data := url.Values{}
		data.Set("grant_type", "password")
		data.Set("username", username)
		data.Set("password", password)
		data.Set("client_id", clientId)
		data.Set("client_secret", clientSecret)
		if audience != "" {
			data.Set("audience", audience)
		}
		if scope != "" {
			data.Set("scope", scope)
		}
		req, err := http.NewRequest("POST", tokenUrl, strings.NewReader(data.Encode()))
		if err != nil {
			return nil, err
		}

		req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
		res, err = c.HttpClient.Do(req)
		if err != nil {
			return nil, err
		}
	} else {
		fetchReq := &fetchOauthPasswordRequestExperian{
			Username:     username,
			Password:     password,
			ClientId:     clientId,
			ClientSecret: clientSecret,
		}

		reqJson, err := json.Marshal(fetchReq)
		if err != nil {
			return nil, err
		}

		req, err := http.NewRequest("POST", tokenUrl, bytes.NewBuffer(reqJson))
		if err != nil {
			return nil, err
		}

		req.Header.Add("Content-Type", "application/json")
		req.Header.Add("Grant_type", "password")
		res, err = c.HttpClient.Do(req)
		if err != nil {
			return nil, err
		}
	}

	if res == nil {
		return nil, fmt.Errorf("failed to fetch new oauth password token, response is nil")
	}

	if res.StatusCode >= 300 {
		resBody, err := io.ReadAll(res.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch new oauth password token, status code %d", res.StatusCode)
		} else {
			return nil, fmt.Errorf("failed to fetch new oauth password token, status code %d: %s", res.StatusCode, string(resBody))

		}
	}

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	r := &types.Response{}
	err = json.Unmarshal(resBody, r)
	if err != nil {
		return nil, err
	}

	return r, nil
}
