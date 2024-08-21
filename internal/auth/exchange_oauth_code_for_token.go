package auth

import (
	"context"
	"fmt"

	"github.com/superblocksteam/agent/pkg/observability"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
)

// Main side effect: token gets cached on server. We don't need to return the token here
func (t *tokenManager) ExchangeOauthCodeForToken(
	ctx context.Context,
	authType string,
	authConfig *v1.OAuth_AuthorizationCodeFlow,
	accessCode string,
	integrationId string,
	configurationId string,
) error {
	log := observability.ZapLogger(ctx, t.logger).Named("ExchangeOauthCodeForToken")
	log = log.With(zap.String("authType", authType))

	if authType != AuthTypeOauthCode {
		log.Error("unsupported auth type")
		return fmt.Errorf("unsupported auth type: %s", authType)
	}

	return t.OAuthClient.ExchangeOauthCodeForToken(ctx, authConfig, accessCode, integrationId, configurationId)
}
