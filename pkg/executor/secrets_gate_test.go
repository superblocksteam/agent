package executor

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	"github.com/superblocksteam/agent/pkg/constants"
)

func TestShouldSkipDefinitionSecretInjectionKeysOnSignedAppEngineVersion(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name             string
		appEngineVersion string
		aiTriggered      bool
		verifiedJwt      bool
		appScopedJwt     bool
		expectSkip       bool
	}{
		{
			name:       "missing app engine version does not skip",
			expectSkip: false,
		},
		{
			name:             "legacy app engine version does not skip",
			appEngineVersion: "1.0",
			expectSkip:       false,
		},
		{
			name:             "scoped app engine version skips",
			appEngineVersion: "2.0",
			expectSkip:       true,
		},
		{
			name:        "org-scoped jwt request without app engine version does not skip",
			verifiedJwt: true,
			expectSkip:  false,
		},
		{
			name:         "app-scoped jwt request without app engine version skips",
			verifiedJwt:  true,
			appScopedJwt: true,
			expectSkip:   true,
		},
		{
			name:             "legacy app engine version overrides verified jwt skip",
			appEngineVersion: "1.0",
			verifiedJwt:      true,
			expectSkip:       false,
		},
		{
			name:             "unknown non-legacy app engine version skips",
			appEngineVersion: "3.0",
			expectSkip:       true,
		},
		{
			name:        "ai triggered flag alone does not skip",
			aiTriggered: true,
			expectSkip:  false,
		},
		{
			name:             "ai triggered flag does not change a legacy decision",
			appEngineVersion: "1.0",
			aiTriggered:      true,
			expectSkip:       false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			if test.appEngineVersion != "" {
				ctx = jwt_validator.WithAppEngineVersion(ctx, test.appEngineVersion)
			}
			if test.verifiedJwt {
				ctx = constants.WithRequestUsesJwtAuth(ctx, true)
				ctx = jwt_validator.WithOrganizationID(ctx, "org-id")
			}
			if test.appScopedJwt {
				ctx = jwt_validator.WithApplicationID(ctx, "app-id")
			}
			if test.aiTriggered {
				ctx = constants.WithAITriggeredExecution(ctx)
			}

			assert.Equal(t, test.expectSkip, shouldSkipDefinitionSecretInjection(ctx))
		})
	}
}

func TestShouldRenderDatasourceSecretsKeysOnSignedTrustRoots(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name             string
		appEngineVersion string
		sdkIntegration   bool
		aiTriggered      bool
		verifiedJwt      bool
		appScopedJwt     bool
		expectRender     bool
	}{
		{
			name:         "no trust signal does not render",
			expectRender: false,
		},
		{
			name:             "legacy app engine version does not render",
			appEngineVersion: "1.0",
			expectRender:     false,
		},
		{
			name:             "scoped app engine version renders",
			appEngineVersion: "2.0",
			expectRender:     true,
		},
		{
			name:           "signed sdk integration callback renders",
			sdkIntegration: true,
			expectRender:   true,
		},
		{
			name:         "org-scoped jwt request without app engine version does not render",
			verifiedJwt:  true,
			expectRender: false,
		},
		{
			name:         "app-scoped jwt request without app engine version renders",
			verifiedJwt:  true,
			appScopedJwt: true,
			expectRender: true,
		},
		{
			name:             "legacy app engine version overrides verified jwt render",
			appEngineVersion: "1.0",
			verifiedJwt:      true,
			expectRender:     false,
		},
		{
			name:         "ai triggered flag alone does not render",
			aiTriggered:  true,
			expectRender: false,
		},
		{
			name:             "ai triggered flag on a legacy token does not render",
			appEngineVersion: "1.0",
			aiTriggered:      true,
			expectRender:     false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			if test.appEngineVersion != "" {
				ctx = jwt_validator.WithAppEngineVersion(ctx, test.appEngineVersion)
			}
			if test.sdkIntegration {
				ctx = constants.WithSDKIntegrationExecution(ctx, nil)
			}
			if test.verifiedJwt {
				ctx = constants.WithRequestUsesJwtAuth(ctx, true)
				ctx = jwt_validator.WithOrganizationID(ctx, "org-id")
			}
			if test.appScopedJwt {
				ctx = jwt_validator.WithApplicationID(ctx, "app-id")
			}
			if test.aiTriggered {
				ctx = constants.WithAITriggeredExecution(ctx)
			}

			assert.Equal(t, test.expectRender, shouldRenderDatasourceSecrets(ctx))
		})
	}
}
