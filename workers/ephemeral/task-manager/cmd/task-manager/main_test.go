package main

import (
	"testing"

	"github.com/spf13/pflag"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestDeprecatedJwtJwksUrlFlag verifies the auth.jwt.jwks_url flag remains
// registered as a no-op for backward compatibility with existing deployments
// that still pass this flag. Removing the flag registration would cause
// task-manager to reject the flag at startup with "unknown flag" errors.
func TestDeprecatedJwtJwksUrlFlag(t *testing.T) {
	f := pflag.Lookup("auth.jwt.jwks_url")
	require.NotNil(t, f, "auth.jwt.jwks_url flag must remain registered to avoid breaking existing deployments that still pass this flag")
	assert.Equal(t, "", f.DefValue, "auth.jwt.jwks_url flag default should be empty string")
	assert.Contains(t, f.Usage, "Deprecated", "auth.jwt.jwks_url flag usage should indicate it is deprecated")
}
