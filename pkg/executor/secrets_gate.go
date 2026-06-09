package executor

import (
	"context"

	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	"github.com/superblocksteam/agent/pkg/constants"
)

const legacyAppEngineVersion = "1.0"

// IsVerifiedJwtRequestWithoutLegacyAppEngineVersion reports whether the request
// is integrity-protected by signed context that authorizes confining secrets to
// server-authoritative datasource rendering: a signed app_engine_version claim
// newer than legacy ("1.0"), or an app-scoped Superblocks JWT request that
// carries no app_engine_version claim at all.
//
// This is the trust root for secret-bearing inline executions. Inline
// Definition requests skip request-signature verification, so the only
// integrity-protected discriminators available are the JWT claim and the
// verified org context: both are stamped by the server and verified during
// authentication, and a caller cannot forge them. Authorization decisions about
// secret exposure must key on these signals rather than on caller-supplied
// execute options (for example is_ai_triggered), which are unsigned and
// trivially spoofable.
func IsVerifiedJwtRequestWithoutLegacyAppEngineVersion(ctx context.Context) bool {
	version, _ := jwt_validator.GetAppEngineVersion(ctx)
	if version != "" {
		return version != legacyAppEngineVersion
	}

	requestUsesJwtAuth, err := constants.GetRequestUsesJwtAuth(ctx)
	if err != nil || !requestUsesJwtAuth {
		return false
	}

	_, hasVerifiedJwtOrg := jwt_validator.GetOrganizationID(ctx)
	applicationID, hasVerifiedJwtApplication := jwt_validator.GetApplicationID(ctx)
	return hasVerifiedJwtOrg && hasVerifiedJwtApplication && applicationID != ""
}

func shouldSkipDefinitionSecretInjection(ctx context.Context) bool {
	// Scoped non-legacy app engine versions do not receive blanket inline
	// sb_secrets injection; secrets are confined to datasource rendering
	// instead. The decision keys solely on signed JWT context, never on
	// caller-controlled execute options.
	return IsVerifiedJwtRequestWithoutLegacyAppEngineVersion(ctx)
}

func ShouldSkipDefinitionSecretInjection(ctx context.Context) bool {
	return shouldSkipDefinitionSecretInjection(ctx)
}
