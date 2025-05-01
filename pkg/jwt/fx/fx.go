package jwtFx

import (
	"github.com/superblocksteam/agent/pkg/jwt"
	"go.uber.org/fx"
)

var Module = fx.Module("jwt",
	fx.Provide(
		Provide,
	),
)

func Provide(lc fx.Lifecycle) (jwt.ClaimsFactory, []jwt.JwtValidator) {
	return jwt.NewBuildScopedTokenClaims, []jwt.JwtValidator{jwt.ValidateScopedClaims}
}
