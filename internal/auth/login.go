package auth

import (
	"context"
	"net/http"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/superblocksteam/agent/internal/auth/oauth"
	"github.com/superblocksteam/agent/pkg/observability"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

// Essentially this just sets cookies for the user per auth protocol. Doesn't do any
// validation of the actual credentials. check-auth is responsible for that.
func (t *tokenManager) Login(
	ctx context.Context,
	integration *structpb.Struct,
	req *apiv1.LoginRequest,
) ([]*http.Cookie, bool, error) {
	log := observability.ZapLogger(ctx, t.logger).Named("Login")

	authType := integration.Fields["authType"].GetStringValue()
	authConfig := integration.Fields["authConfig"].GetStructValue()
	log = log.With(zap.String("authType", authType))

	authId, _ := GetAuthId(authType, authConfig, req.IntegrationId)
	cookieName := authId + "-token"
	refreshName := authId + "-refresh"

	cookies := []*http.Cookie{}
	hasAccessToken := false

	switch authType {
	case authTypeBasic:
		if req.GetToken() != "" {
			cookies = append(cookies, &http.Cookie{
				Name:    cookieName,
				Value:   req.GetToken(),
				Expires: time.Now().Add(DefaultAccessTokenExpirationPeriod),
			})
			hasAccessToken = true
		}
	case authTypeOauthPassword, authTypeOauthImplicit:
		if req.GetRefreshToken() != "" {
			cookies = append(cookies, &http.Cookie{
				Name:    refreshName,
				Value:   req.GetRefreshToken(),
				Expires: time.Now().Add(oauth.DefaultRefreshTokenExpirationPeriodSeconds),
			})
		}

		if req.GetToken() != "" {
			var exp time.Time
			if req.GetExpiryTimestamp() != 0 {
				// The expiry time is passed in as unix time in ms.
				exp = time.UnixMilli(req.GetExpiryTimestamp())
			} else {
				exp = time.Now().Add(DefaultAccessTokenExpirationPeriod)
			}

			cookies = append(cookies, &http.Cookie{
				Name:    cookieName,
				Value:   req.GetToken(),
				Expires: exp,
			})

			hasAccessToken = true
		}
	case authTypeFirebase:
		parser := jwt.NewParser(jwt.WithoutClaimsValidation())
		claims := jwt.MapClaims{}
		_, _, err := parser.ParseUnverified(req.GetIdToken(), claims)
		if err != nil {
			log.Error("parser.ParseUnverified error", zap.Error(err))
			return nil, false, err
		}

		var exp int64
		if e, ok := claims["exp"]; ok {
			exp = int64(e.(float64))
		}
		var userId string
		if u, ok := claims["user_id"]; ok {
			userId = u.(string)
		}

		cookies = append(cookies, &http.Cookie{
			Name:    cookieName,
			Value:   req.GetIdToken(),
			Expires: time.Unix(exp, 0),
		})
		cookies = append(cookies, &http.Cookie{
			Name:  refreshName,
			Value: req.GetRefreshToken(),
		})
		cookies = append(cookies, &http.Cookie{
			Name:  authId + "-userId",
			Value: userId,
		})

		hasAccessToken = true
	}

	return cookies, hasAccessToken, nil
}
