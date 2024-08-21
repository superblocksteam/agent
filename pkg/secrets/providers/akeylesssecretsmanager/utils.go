package akeylesssecretsmanager

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/akeylesslabs/akeyless-go/v4"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
)

// this ensures that no matter how the user gives us the prefix,
// the code has it in a normalized way that it can confidently do logic on
// EXAMPLES:
// foo/bar   -> /foo/bar/
// /foo/bar  -> /foo/bar/
// foo/bar/  -> /foo/bar/
// /foo/bar/ -> /foo/bar/
func normalizePrefix(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return s
	}
	// ensure we have a leading slash
	if !strings.HasPrefix(s, "/") {
		s = "/" + s
	}

	// ensure we have a trailing slash
	if !strings.HasSuffix(s, "/") {
		s = s + "/"
	}

	return s
}

// normalize a secret name coming from superblocks to akeyless
func normalizeSecretNameToAkeyless(s string) string {
	if s == "" {
		return s
	}

	if strings.Count(s, "/") == 0 {
		return "/" + s
	}

	return s
}

// normalize a secret name coming from akeyless to superblocks
func normalizeSecretNameFromAkeyless(s string) string {
	if s == "" {
		return s
	}

	if strings.Count(s, "/") == 1 && s[0] == '/' {
		return s[1:]
	}

	return s
}

func getAkeylessAuthFromConfig(config *secretsv1.AkeylessSecretsManager) (*akeyless.Auth, error) {

	authBody := akeyless.NewAuthWithDefaults()

	// determine auth type
	switch config.GetAuth().GetConfig().(type) {

	case *commonv1.AkeylessAuth_ApiKey_:
		apiKeyConfig, ok := config.GetAuth().GetConfig().(*commonv1.AkeylessAuth_ApiKey_)
		if !ok {
			return nil, errors.New("expected to find api key config")
		}

		authBody.AccessId = akeyless.PtrString(apiKeyConfig.ApiKey.GetAccessId())
		authBody.AccessKey = akeyless.PtrString(apiKeyConfig.ApiKey.GetAccessKey())

	case *commonv1.AkeylessAuth_Email_:
		emailConfig, ok := config.GetAuth().GetConfig().(*commonv1.AkeylessAuth_Email_)
		if !ok {
			return nil, errors.New("expected to find email config")
		}

		authBody.AdminEmail = akeyless.PtrString(emailConfig.Email.GetEmail())
		authBody.AdminPassword = akeyless.PtrString(emailConfig.Email.GetPassword())

	default:
		return nil, errors.New("got unsupported auth type")
	}
	return authBody, nil
}

func do[T any](ctx context.Context, p *provider, fn func(context.Context, string) (T, *http.Response, error), zero T) (T, *http.Response, error) {
	// do with current token
	p.mutex.Lock()
	token := p.currentToken
	p.mutex.Unlock()
	x, y, e := fn(ctx, token)

	// success
	if e == nil {
		return x, y, nil
	}

	// our criteria to retry is if the http response has a 401 status code
	// akeyless does not provide any concrete type or field to validate this
	// the only things that always appear the token has expired is
	// 1. 401 status code
	// 2. an error message denoting this
	// the status code is the only part that we can confidently say cannot change in a non-breaking way,
	// so we'll use that for now

	if y.StatusCode == http.StatusUnauthorized {
		// failed do
		// attempt to refresh token
		e = p.refreshToken(ctx)
		if e != nil {
			// failed refresh
			p.logError("authentication failed", e)
			return zero, nil, e
		}

		p.mutex.Lock()
		token := p.currentToken
		p.mutex.Unlock()

		// do again with refreshed token
		x, y, e = fn(ctx, token)
		if e == nil {
			return x, y, nil
		}
	}

	return zero, nil, e

}
