package jwt

import (
	"context"
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

type JwtValidator func(ctx context.Context, parsed *jwt.Token, jwtClaims jwt.Claims) (context.Context, error)

func ValidateScopedClaims(ctx context.Context, parsed *jwt.Token, jwtClaims jwt.Claims) (context.Context, error) {
	c, err := getScopedClaims[*AllScopedClaims](jwtClaims)
	if err != nil {
		return nil, err
	}

	ctxWithClaims := ctx
	if parsed != nil {
		ctxWithClaims = WithRawJwt(ctx, parsed.Raw)
	}

	ctxWithClaims = WithTokenScopes(ctxWithClaims, c.GetScopes())
	for _, scope := range c.GetScopes().ToSlice() {
		switch scope {
		case TokenScopesBuildApplication:
			ctxWithClaims, err = ValidateBuildScopedClaims(ctxWithClaims, parsed, c.AsBuildScopedClaims())
			if err != nil {
				return nil, err
			}
		case TokenScopesViewApplication:
			ctxWithClaims, err = ValidateViewScopedClaims(ctxWithClaims, parsed, c.AsViewScopedClaims())
			if err != nil {
				return nil, err
			}
		case TokenScopesEditApplication:
			ctxWithClaims, err = ValidateEditScopedClaims(ctxWithClaims, parsed, c.AsEditScopedClaims())
			if err != nil {
				return nil, err
			}
		default:
			return nil, fmt.Errorf("unexpected scope: %s", scope)
		}
	}

	return ctxWithClaims, nil
}

func ValidateBuildScopedClaims(ctx context.Context, _ *jwt.Token, jwtClaims jwt.Claims) (context.Context, error) {
	c, err := getScopedClaims[*BuildScopedClaims](jwtClaims)
	if err != nil {
		return nil, err
	}

	appId := c.ApplicationId
	if appId == "" {
		return nil, errors.New("could not get application id")
	}
	ctx = WithApplicationID(ctx, appId)

	orgId := c.OrganizationId
	if orgId == "" {
		return nil, errors.New("could not get organization id")
	}
	ctx = WithOrganizationID(ctx, orgId)

	dirHash := c.DirectoryHash
	if dirHash == "" {
		return nil, errors.New("could not get directory hash")
	}
	ctx = WithDirectoryHash(ctx, dirHash)

	commitId := c.CommitId
	if commitId == "" {
		return nil, errors.New("could not get commit id")
	}
	ctx = WithCommitID(ctx, commitId)

	return ctx, nil
}

func ValidateViewScopedClaims(ctx context.Context, _ *jwt.Token, jwtClaims jwt.Claims) (context.Context, error) {
	c, err := getScopedClaims[*ViewScopedClaims](jwtClaims)
	if err != nil {
		return nil, err
	}

	appId := c.ApplicationId
	if appId == "" {
		return nil, errors.New("could not get application id")
	}
	ctx = WithApplicationID(ctx, appId)

	orgId := c.OrganizationId
	if orgId == "" {
		return nil, errors.New("could not get organization id")
	}
	ctx = WithOrganizationID(ctx, orgId)

	dirHash := c.DirectoryHash
	if dirHash == "" {
		return nil, errors.New("could not get directory hash")
	}
	ctx = WithDirectoryHash(ctx, dirHash)

	commitId := c.CommitId
	if commitId == "" {
		return nil, errors.New("could not get commit id")
	}
	ctx = WithCommitID(ctx, commitId)

	userEmail := c.UserEmail
	if userEmail != "" {
		ctx = WithUserEmail(ctx, userEmail)
	}

	userType := c.UserType
	if userType != "" {
		ctx = WithUserType(ctx, userType)
	}

	name := c.Name
	if name != "" {
		ctx = WithName(ctx, name)
	}

	return ctx, nil
}

func ValidateEditScopedClaims(ctx context.Context, _ *jwt.Token, jwtClaims jwt.Claims) (context.Context, error) {
	c, err := getScopedClaims[*EditScopedClaims](jwtClaims)
	if err != nil {
		return nil, err
	}

	appId := c.ApplicationId
	if appId == "" {
		return nil, errors.New("could not get application id")
	}
	ctx = WithApplicationID(ctx, appId)

	orgId := c.OrganizationId
	if orgId == "" {
		return nil, errors.New("could not get organization id")
	}
	ctx = WithOrganizationID(ctx, orgId)

	userEmail := c.UserEmail
	if userEmail == "" {
		return nil, errors.New("could not get user email")
	}
	ctx = WithUserEmail(ctx, userEmail)

	userType := c.UserType
	if userType == "" {
		return nil, errors.New("could not get user type")
	}
	ctx = WithUserType(ctx, userType)

	name := c.Name
	if name == "" {
		return nil, errors.New("could not get name")
	}
	ctx = WithName(ctx, name)

	return ctx, nil
}

func getScopedClaims[T ScopedTokenClaims](jwtClaims jwt.Claims) (T, error) {
	c, ok := jwtClaims.(T)
	var err error
	validator := jwt.NewValidator()

	if !ok {
		err = errors.New("could not parse jwt claims")
	} else if validErr := validator.Validate(c); validErr != nil {
		err = fmt.Errorf("invalid jwt claims: %w", validErr)
	}

	return c, err
}
