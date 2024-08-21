package oauth

// TODO: combine this with fetcher_cacher.go
import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/superblocksteam/agent/pkg/clients"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	pluginIdGsheets = "gsheets"
)

var (
	ErrNoTokenFound        = errors.New("[oauth-code] no token found")
	ErrNoRefreshTokenFound = errors.New("[oauth-code] no refresh token found")
)

//go:generate mockery --name OAuthCodeTokenFetcher --output ../mocks --outpkg mocks
type OAuthCodeTokenFetcher interface {
	// Returns both the access and id token
	Fetch(ctx context.Context, authType string, authConfig *v1.OAuth_AuthorizationCodeFlow, datasourceId string, configurationId string, pluginId string) (string, string, error)
}

type CodeTokenFetcher struct {
	*OAuthClient
	fetcherCacher FetcherCacher
	serverClient  clients.ServerClient
}

// TODO: move to types
type RefreshTokenRequest struct {
	AuthType        string                 `json:"authType"`
	AuthConfig      map[string]interface{} `json:"authConfig"`
	DatasourceId    string                 `json:"datasourceId"`
	ConfigurationId string                 `json:"configurationId"`
}

// TODO: move to types
type RefreshTokenResponse struct {
	Data string `json:"data"`
}

func NewOAuthCodeTokenFetcher(
	oauthClient *OAuthClient,
	fc FetcherCacher,
	serverClient clients.ServerClient,
) OAuthCodeTokenFetcher {
	return &CodeTokenFetcher{
		OAuthClient:   oauthClient,
		fetcherCacher: fc,
		serverClient:  serverClient,
	}
}

func (c *CodeTokenFetcher) Fetch(ctx context.Context, authType string, authConfig *v1.OAuth_AuthorizationCodeFlow, datasourceId string, configurationId string, pluginId string) (string, string, error) {
	tokenScope := authConfig.GetTokenScope()
	shouldRefreshOnServer := authConfig.RefreshTokenFromServer

	logger := c.getEnrichedLogger(authConfig, datasourceId, configurationId, authType)

	if shouldRefreshOnServer && pluginId != pluginIdGsheets {
		return "", "", sberrors.IntegrationOAuthError(ErrNoTokenFound, fmt.Errorf("refreshTokenFromServer is only supported for gsheets plugin"))
	}

	var token, idToken string
	var err error

	authConfigStruct, err := jsonutils.ToStruct(authConfig)
	if err != nil {
		return "", "", sberrors.IntegrationOAuthError(ErrNoTokenFound, err)
	}

	if tokenScope == "datasource" {
		logger.Debug("start to fetch shared token")
		token, err = c.FetcherCacher.FetchSharedToken(authType, authConfigStruct, TokenTypeAccess, datasourceId, configurationId)
		if err != nil {
			logger.Warn("failed to fetch shared token", zap.Error(err))
			return "", "", sberrors.IntegrationOAuthError(ErrNoTokenFound, err)
		}
		idToken, err = c.FetcherCacher.FetchSharedToken(authType, authConfigStruct, TokenTypeId, datasourceId, configurationId)
	} else {
		logger.Debug("start to fetch user-specific token")
		token, err = c.FetcherCacher.FetchUserToken(ctx, authType, authConfigStruct, TokenTypeAccess)
		if err != nil {
			logger.Warn("failed to fetch user token", zap.Error(err))
			return "", "", sberrors.IntegrationOAuthError(ErrNoTokenFound, err)
		}
		idToken, err = c.FetcherCacher.FetchUserToken(ctx, authType, authConfigStruct, TokenTypeId)
	}

	if err != nil {
		logger.Warn("failed to fetch id token", zap.Error(err))
		return "", "", sberrors.IntegrationOAuthError(ErrNoTokenFound, err)
	}

	if token != "" {
		logger.Debug("fetched an existing access token")
		return token, idToken, err
	}

	logger.Warn("no access token was fetched")

	if shouldRefreshOnServer && pluginId == pluginIdGsheets {
		// TODO: Support ID Token
		token, err = c.refreshFromServerGsheets(logger, authType, authConfigStruct, datasourceId, configurationId)
	} else if tokenScope != "datasource" {
		token, idToken, err = c.refreshFromSelf(ctx, logger, authType, authConfigStruct, datasourceId, configurationId)
	}

	if err != nil {
		return "", "", sberrors.IntegrationOAuthError(ErrNoTokenFound, err)
	}

	if token == "" {
		return "", "", sberrors.IntegrationOAuthError(ErrNoTokenFound, err)
	}
	// Treat ID token as optional and don't return an error code for that.

	return token, idToken, nil
}

func (c *CodeTokenFetcher) refreshFromServerGsheets(logger *zap.Logger, authType string, authConfig *structpb.Struct, datasourceId string, configurationId string) (string, error) {
	l := logger.With(zap.String("oauth-request-type", "oauth_code"))
	l.Debug("start refresh token from server")
	req := &RefreshTokenRequest{
		AuthType:        authType,
		AuthConfig:      authConfig.AsMap(),
		DatasourceId:    datasourceId,
		ConfigurationId: configurationId,
	}

	res, err := c.serverClient.PostGSheetsTokenRefresh(context.Background(), nil, nil, nil, req)
	if err != nil {
		return "", err
	}

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}

	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to refresh token from server, status code: %d: %s", res.StatusCode, string(resBody))
	}

	tokenRes := &RefreshTokenResponse{}
	if err := json.Unmarshal(resBody, tokenRes); err != nil {
		return "", err
	}

	l.Debug("end refresh token from server", zap.Bool("has_token", tokenRes.Data != ""))
	return tokenRes.Data, nil
}

func (c *CodeTokenFetcher) refreshFromSelf(ctx context.Context, logger *zap.Logger, authType string, authConfig *structpb.Struct, datasourceId string, configurationId string) (string, string, error) {
	l := logger.With(zap.String("oauth-request-type", "oauth_code"))
	l.Debug("start fetch user refresh token")
	refreshToken, err := c.FetcherCacher.FetchUserToken(ctx, authType, authConfig, TokenTypeRefresh)
	if err != nil {
		return "", "", sberrors.IntegrationOAuthError(ErrNoRefreshTokenFound, err)
	}
	l.Debug("end fetch user refresh token", zap.Bool("has_refresh_token", refreshToken != ""))

	if refreshToken == "" {
		return "", "", ErrNoRefreshTokenFound
	}

	l.Debug("start refresh access token")
	authConfigCommon := &v1.OAuthCommon{}
	err = jsonutils.MapToProto(authConfig.AsMap(), authConfigCommon)
	if err != nil {
		return "", "", sberrors.IntegrationOAuthError(ErrNoRefreshTokenFound, err)
	}
	refreshRes, err := c.OAuthClient.RefreshToken(authConfigCommon, refreshToken)
	if err != nil {
		return "", "", sberrors.IntegrationOAuthError(ErrNoRefreshTokenFound, err)
	}

	accessToken := refreshRes.AccessToken
	idToken := refreshRes.IdToken
	nextRefreshToken := refreshRes.RefreshToken

	l.Debug("end refresh access token", zap.Bool("has_id_token", idToken != ""), zap.Bool("has_access_token", accessToken != ""), zap.Bool("has_refresh_token", nextRefreshToken != ""))

	refreshExpiresAt := time.Now().Add(time.Duration(DefaultRefreshTokenExpirationPeriodSeconds) * time.Second).Unix()
	accessExpiresAt := time.Now().Add(time.Duration(refreshRes.ExpiresIn) * time.Second).Unix()

	if nextRefreshToken != "" {
		err = c.FetcherCacher.CacheUserToken(ctx, authType, authConfig, TokenTypeRefresh, nextRefreshToken, refreshExpiresAt, datasourceId, configurationId)
		if err != nil {
			l.Warn("error caching refresh token", zap.Error(err))
		}
	}

	if accessToken != "" {
		err = c.FetcherCacher.CacheUserToken(ctx, authType, authConfig, TokenTypeAccess, accessToken, accessExpiresAt, datasourceId, configurationId)
		if err != nil {
			l.Warn("error caching access token", zap.Error(err))
		}
	}

	if idToken != "" {
		// try to parse the id token to get the expiry time
		parser := jwt.NewParser(jwt.WithoutClaimsValidation())
		claims := jwt.MapClaims{}
		_, _, err = parser.ParseUnverified(idToken, claims)
		if err != nil {
			l.Warn("error parsing id token, going to ignore it", zap.Error(err))
		} else {
			l.Debug("parsed id token")
			var idTokenExpiresAt int64
			if e, ok := claims["exp"]; ok {
				idTokenExpiresAt = int64(e.(float64))
			}
			err = c.FetcherCacher.CacheUserToken(ctx, authType, authConfig, TokenTypeId, idToken, idTokenExpiresAt, datasourceId, configurationId)
			if err != nil {
				l.Warn("error caching id token", zap.Error(err))
			}
		}
	}

	return accessToken, idToken, nil
}

func (c *CodeTokenFetcher) getEnrichedLogger(authConfig *v1.OAuth_AuthorizationCodeFlow, datasourceId string, configurationId string, authType string) *zap.Logger {
	return c.Logger.With(
		zap.String("client-id", authConfig.GetClientId()),
		zap.String("auth-url", authConfig.GetAuthUrl()),
		zap.String("token-url", authConfig.GetTokenUrl()),
		zap.String("audience", authConfig.GetAudience()),
		zap.String("client-auth-method", authConfig.GetClientAuthMethod()),
		zap.String("scope", authConfig.GetScope()),
		zap.String("auth-type", authType),
		zap.String("datasource-id", datasourceId),
		zap.String("configuration-id", configurationId),
	)
}
