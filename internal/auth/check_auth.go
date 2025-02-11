package auth

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/superblocksteam/agent/internal/auth/oauth"
	"github.com/superblocksteam/agent/internal/auth/types"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	"github.com/superblocksteam/agent/pkg/observability"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"github.com/titanous/json5"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	DefaultAccessTokenExpirationPeriod = 5 * time.Minute
)

func (t *tokenManager) CheckAuth(ctx context.Context, integration *structpb.Struct, integrationId string, configurationId string, pluginId string) (*types.CheckAuthResponse, error) {
	log := observability.ZapLogger(ctx, t.logger).Named("CheckAuth")

	requestCookies := GetCookies(ctx)
	responseCookies := []*http.Cookie{}

	authType := integration.Fields["authType"].GetStringValue()
	authConfig := integration.Fields["authConfig"].GetStructValue()
	log = log.With(zap.String("authType", authType))

	authTokenScope := ""
	if integration.Fields["authConfig"].GetStructValue() != nil {
		authTokenScope = integration.Fields["authConfig"].GetStructValue().Fields["tokenScope"].GetStringValue()
	}

	authId, authIdFallback := GetAuthId(authType, authConfig, integrationId)

	cookieName, cookieNameFallback := authId+"-"+oauth.TokenTypeAccess, authIdFallback+"-"+oauth.TokenTypeAccess
	cookieValue, cookieValueFallback := FirstMatchingCookie(requestCookies, cookieName, cookieNameFallback)

	if cookieValue == "" {
		cookieName = cookieNameFallback
		cookieValue = cookieValueFallback
	}

	var authenticated bool

	// access token cookie
	var setCookieName string
	var setCookieValue string
	var exp time.Time
	// refresh token cookie
	var refreshCookieName string
	var refreshCookieValue string
	var refreshExp time.Time
	// id token cookie
	var idTokenCookieName string
	var idTokenCookieValue string
	var idTokenExp time.Time

	switch authType {
	case authTypeBasic, authTypeOauthImplicit:
		authenticated = cookieValue != ""
	case authTypeOauthPassword:
		if cookieValue == "" {
			useFallback := false
			refreshToken, refreshTokenFallback := FirstMatchingCookie(requestCookies, authId+"-"+oauth.TokenTypeRefresh, authIdFallback+"-"+oauth.TokenTypeRefresh)
			if refreshToken == "" {
				refreshToken = refreshTokenFallback
				useFallback = true
			}

			if refreshToken == "" {
				authenticated = false
				break
			}

			authConfigProto := &v1.OAuthCommon{}

			err := jsonutils.MapToProto(authConfig.AsMap(), authConfigProto)
			if err != nil {
				log.Error("jsonutils.MapToProto error", zap.Error(err))
				return nil, err
			}

			tokenRes, err := t.OAuthClient.RefreshToken(authConfigProto, refreshToken)
			if err != nil {
				log.Error("OAuthClient.RefreshToken error", zap.Error(err))
				return nil, err
			}

			if tokenRes.AccessToken != "" && authTokenScope == "user" {
				if useFallback {
					setCookieName = cookieNameFallback
				} else {
					setCookieName = cookieName
				}
				setCookieValue = tokenRes.AccessToken
				if tokenRes.IssuedAt != 0 {
					exp = time.Unix(int64(tokenRes.IssuedAt+tokenRes.ExpiresIn), 0)
				} else {
					exp = time.Unix((time.Now().Unix() + int64(tokenRes.ExpiresIn)), 0)
				}
			}

			if tokenRes.RefreshToken != "" {
				if useFallback {
					refreshCookieName = authIdFallback + "-" + oauth.TokenTypeRefresh
				} else {
					refreshCookieName = authId + "-" + oauth.TokenTypeRefresh
				}
				refreshCookieValue = tokenRes.RefreshToken
			}

			authenticated = tokenRes.AccessToken != ""
		} else {
			authenticated = true
		}
	case AuthTypeOauthCode:
		if cookieValue == "" {
			authConfigProto := &v1.OAuth_AuthorizationCodeFlow{}
			err := jsonutils.MapToProto(authConfig.AsMap(), authConfigProto)
			if err != nil {
				log.Error("jsonutils.MapToProto error", zap.Error(err))
				return nil, err
			}

			token, idToken, err := t.OAuthCodeTokenFetcher.Fetch(ctx, authType, authConfigProto, integrationId, configurationId, pluginId)
			if err != nil {
				log.Error("OAuthCodeTokenFetcher.Fetch error", zap.Error(err))
				return nil, err
			}

			if idToken != "" {
				idTokenCookieName = authId + "-" + oauth.TokenTypeId
				idTokenCookieValue = idToken
				//TODO(alex): We should fetch actual expiration time for id token
				idTokenExp = time.Now().Add(DefaultAccessTokenExpirationPeriod)
			}

			authenticated = token != ""
		} else {
			authenticated = true
		}
	case authTypeOauthTokenExchange:
		authConfigProto := &v1.OAuth_AuthorizationCodeFlow{}
		if err := jsonutils.MapToProto(authConfig.AsMap(), authConfigProto); err != nil {
			log.Error("error converting auth config to proto", zap.Error(err))
			return nil, &sberrors.InternalError{Err: err}
		}

		authenticated = false
		if cachedToken, _, err := t.OAuthCodeTokenFetcher.Fetch(ctx, authType, authConfigProto, integrationId, configurationId, pluginId); err == nil {
			if valid, _ := t.isValidJwt(cachedToken, v1.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_UNSPECIFIED, log); valid {
				authenticated = true
			}
		}
	case authTypeFirebase:
		if cookieValue == "" {
			useFallback := false
			refreshToken, refreshTokenFallback := FirstMatchingCookie(requestCookies, authId+"-refresh", authIdFallback+"-refresh")
			if refreshToken == "" {
				refreshToken = refreshTokenFallback
				useFallback = true
			}

			if refreshToken == "" {
				authenticated = false
				break
			}

			apiKey := authConfig.GetFields()["apiKey"].GetStringValue()
			if apiKey == "" {
				authenticated = false
				break
			}

			parsed := map[string]string{}
			if err := json5.Unmarshal([]byte(apiKey), &parsed); err != nil {
				log.Error("json5.Unmarshal error", zap.Error(err))
				return nil, err
			}

			req := &oauth.RefreshTokenFirebasePayload{
				ApiKey:       parsed["apiKey"],
				RefreshToken: refreshToken,
			}

			tokenRes, err := t.OAuthClient.RefreshTokenFirebase(req)
			if err != nil {
				log.Error("OAuthClient.RefreshTokenFirebase error", zap.Error(err))
				return nil, err
			}

			if tokenRes != nil && tokenRes.IdToken != "" {
				if useFallback {
					setCookieName = cookieNameFallback
				} else {
					setCookieName = cookieName
				}

				setCookieValue = tokenRes.IdToken
				expiresIn, err := strconv.Atoi(tokenRes.ExpiresIn)
				if err != nil {
					log.Error("strconv.Atoi error", zap.Error(err))
					return nil, err
				}

				exp = time.Now().Add(time.Duration(expiresIn) * time.Second)
				authenticated = true
			}

			if tokenRes != nil && tokenRes.RefreshToken != "" {
				if useFallback {
					refreshCookieName = authIdFallback + "-refresh"
				} else {
					refreshCookieName = authId + "-refresh"
				}

				refreshCookieValue = tokenRes.RefreshToken
			}
		} else {
			authenticated = true
		}
	}

	if setCookieName != "" {
		responseCookies = append(responseCookies, &http.Cookie{
			Name:    setCookieName,
			Value:   setCookieValue,
			Expires: exp,
		})
	}
	if refreshCookieName != "" {
		responseCookies = append(responseCookies, &http.Cookie{
			Name:    refreshCookieName,
			Value:   refreshCookieValue,
			Expires: refreshExp,
		})
	}
	if idTokenCookieName != "" {
		responseCookies = append(responseCookies, &http.Cookie{
			Name:    idTokenCookieName,
			Value:   idTokenCookieValue,
			Expires: idTokenExp,
		})
	}

	return &types.CheckAuthResponse{
		Authenticated: authenticated,
		Cookies:       responseCookies,
	}, nil
}
