//lint:file-ignore ST1005 The errors defined in this file are all user facing
package oauth

import (
	"errors"
	"fmt"

	pluginscommon "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
)

type OAuth2AuthType string

type OAuth2ErrorType int

const (
	OAuth2ErrorTypeNoJwt OAuth2ErrorType = iota
	OAuth2ErrorTypeExpired
	OAuth2ErrorTypeInvalid
)

const (
	OauthTokenExchange OAuth2AuthType = "oauth-token-exchange"
)

var (
	authTypeDisplayName = map[OAuth2AuthType]string{
		OauthTokenExchange: "On-Behalf-Of Token Exchange",
	}

	ErrNoAuthorizationJwtFound = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("could not find a user JWT\n"),
		fmt.Errorf("Auth method can't be used headlessly, like in Workflows or Scheduled Jobs."),
	)

	ErrNoIdentityProviderJwtFound = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("could not find identity provider token\n"),
		fmt.Errorf("Please log in using a valid OIDC-based SSO provider. To configure or update your orgs SSO, or for assistance troubleshooting, please reach out to support."),
	)

	ErrInvalidSubjectTokenSource = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("invalid subject token source\n"),
		fmt.Errorf("Please check the subject token source provided in the integration and try again."),
	)

	ErrInvalidIdentityProviderJwt = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("invalid identity provider token provided\n"),
		fmt.Errorf("Please log in using a valid OIDC-based SSO provider. To configure or update your orgs SSO, or for assistance troubleshooting, please reach out to support."),
	)

	ErrInvalidStaticToken = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("invalid static token provided\n"),
		fmt.Errorf("Please check the static token provided in the integration and try again."),
	)

	ErrIdentityProviderTokenExpired = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("identity provider token expired\n"),
		fmt.Errorf("Refresh your browser and follow prompts to reauthenticate with SSO."),
	)

	ErrStaticTokenExpired = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("static token expired\n"),
		fmt.Errorf("Please check the static token provided in the integration and try again."),
	)

	ErrTokenUriServerError = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("token exchange failed\n"),
	)

	ErrTokenUriServerBadResponseCode = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("token exchange failed\n"),
	)

	ErrTokenUriServerInvalidResponse = OAuth2Error(
		OauthTokenExchange,
		fmt.Errorf("token exchange failed\n"),
	)

	SubjectTokenErrorMap = map[pluginscommon.OAuth_AuthorizationCodeFlow_SubjectTokenSource]map[OAuth2ErrorType]error{
		pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER: {
			OAuth2ErrorTypeNoJwt:   ErrNoIdentityProviderJwtFound,
			OAuth2ErrorTypeExpired: ErrIdentityProviderTokenExpired,
			OAuth2ErrorTypeInvalid: ErrInvalidIdentityProviderJwt,
		},
		pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_STATIC_TOKEN: {
			OAuth2ErrorTypeNoJwt:   ErrNoAuthorizationJwtFound,
			OAuth2ErrorTypeExpired: ErrStaticTokenExpired,
			OAuth2ErrorTypeInvalid: ErrInvalidStaticToken,
		},
	}
)

type oauth2Error struct {
	AuthType OAuth2AuthType
	Err      error
}

func OAuth2Error(authType OAuth2AuthType, err ...error) error {
	return &oauth2Error{
		AuthType: authType,
		Err:      errors.Join(err...),
	}
}

func (e *oauth2Error) Error() string {
	return fmt.Sprintf("OAuth2 - \"%s\" %s", authTypeDisplayName[e.AuthType], e.Err.Error())
}
