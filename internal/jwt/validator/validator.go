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
	// NOTE: @joeyagreco - the only claims that we should validate are ALWAYS present are: org_id, org_type, and user_email
	// NOTE: @joeyagreco - everything else is optional

	c, ok := jwtClaims.(*claims)
	if !ok || !parsed.Valid {
		return nil, errors.New("could not parse jwt claims")
	}

	// REQUIRED CLAIMS

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

	// OPTIONAL CLAIMS

	userType := c.UserType
	ctx = context.WithValue(ctx, ContextKeyUserType, userType)

	userId := c.UserId
	ctx = context.WithValue(ctx, ContextKeyUserId, userId)

	userDisplayName := c.UserName
	ctx = context.WithValue(ctx, ContextKeyUserDisplayName, userDisplayName)

	rbacRole := c.RbacRole
	ctx = context.WithValue(ctx, ContextKeyRbacRole, rbacRole)

	rbacGroupObjects := c.RbacGroupObjects
	ctx = context.WithValue(ctx, ContextKeyRbacGroupObjects, rbacGroupObjects)

	metadata := c.Metadata
	ctx = context.WithValue(ctx, ContextKeyMetadata, metadata)

	return ctx, nil
}
