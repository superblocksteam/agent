package validator

import (
	"context"
	"errors"

	"github.com/golang-jwt/jwt/v5"
	authv1 "github.com/superblocksteam/agent/types/gen/go/auth/v1"
)

const (
	jwtClaimOrganizationID   = "org_id"
	jwtClaimOrganizationType = "org_type"
	jwtClaimUserEmail        = "user_email"
	jwtClaimRbacRole         = "rbac_role"
	jwtClaimRbacGroups       = "rbac_groups"
)

type claims struct {
	jwt.RegisteredClaims
	authv1.Claims
}

func NewClaims() jwt.Claims {
	return &claims{}
}

func Validate(ctx context.Context, parsed *jwt.Token, jwtClaims jwt.Claims) (context.Context, error) {
	c, ok := jwtClaims.(*claims)
	if !ok || !parsed.Valid {
		return nil, errors.New("could not parse jwt claims")
	}

	orgID := c.OrgId
	if orgID == "" {
		return nil, errors.New("could not get organization id")
	}
	ctx = WithOrganizationID(ctx, orgID)

	orgType := c.OrgType
	if orgType == "" {
		return nil, errors.New("could not get organization type")
	}
	ctx = WithOrganizationType(ctx, orgType)

	userEmail := c.UserEmail
	if userEmail == "" {
		return nil, errors.New("could not get user email")
	}
	ctx = context.WithValue(ctx, ContextKeyUserEmail, userEmail)

	userType := c.UserType
	if userType == "" {
		return nil, errors.New("could not get user type")
	}
	ctx = context.WithValue(ctx, ContextKeyUserType, userType)

	userId := c.UserId
	if userId == "" {
		return nil, errors.New("could not get user id")
	}
	ctx = context.WithValue(ctx, ContextKeyUserId, userId)

	userDisplayName := c.UserName
	if userDisplayName == "" {
		return nil, errors.New("could not get user display name")
	}
	ctx = context.WithValue(ctx, ContextKeyUserDisplayName, userDisplayName)

	rbacRole := c.RbacRole
	if rbacRole == "" {
		return nil, errors.New("could not get rbac role")
	}
	ctx = context.WithValue(ctx, ContextKeyRbacRole, rbacRole)

	rbacGroupObjects := c.RbacGroupObjects
	if len(rbacGroupObjects) == 0 {
		return nil, errors.New("could not get rbac group objects")
	}
	ctx = context.WithValue(ctx, ContextKeyRbacGroupObjects, rbacGroupObjects)

	// OPTIONAL
	metadata := c.Metadata
	ctx = context.WithValue(ctx, ContextKeyMetadata, metadata)

	return ctx, nil
}
