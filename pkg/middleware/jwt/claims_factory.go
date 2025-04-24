package jwt

import (
	jwt "github.com/golang-jwt/jwt/v4"
)

type ClaimsFactory func() jwt.Claims

func defaultClaimsFactory() jwt.Claims {
	return jwt.RegisteredClaims{}
}
