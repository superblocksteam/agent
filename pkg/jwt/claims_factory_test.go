package jwt

import (
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
)

func TestNewScopedTokenClaims(t *testing.T) {
	var testCases = []struct {
		name           string
		claimsFactory  ClaimsFactory
		expectedClaims jwt.Claims
	}{
		{
			name:           "BuildScopedTokenClaims",
			claimsFactory:  NewBuildScopedTokenClaims,
			expectedClaims: &BuildScopedClaims{},
		},
		{
			name:           "ViewScopedTokenClaims",
			claimsFactory:  NewViewScopedTokenClaims,
			expectedClaims: &ViewScopedClaims{},
		},
		{
			name:           "EditScopedTokenClaims",
			claimsFactory:  NewEditScopedTokenClaims,
			expectedClaims: &EditScopedClaims{},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			claims := tc.claimsFactory()
			assert.Equal(t, tc.expectedClaims, claims)
		})
	}
}
