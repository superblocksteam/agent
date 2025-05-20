package jwt

import (
	"github.com/golang-jwt/jwt/v5"
)

type ClaimsFactory func() jwt.Claims

func NewAllScopedTokenClaims() jwt.Claims {
	return &AllScopedClaims{}
}

func NewBuildScopedTokenClaims() jwt.Claims {
	return &BuildScopedClaims{}
}

func NewViewScopedTokenClaims() jwt.Claims {
	return &ViewScopedClaims{}
}

func NewEditScopedTokenClaims() jwt.Claims {
	return &EditScopedClaims{}
}
