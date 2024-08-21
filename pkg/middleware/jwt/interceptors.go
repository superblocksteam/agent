package jwt

import (
	"context"
	"errors"
	"strings"

	jwt "github.com/golang-jwt/jwt/v4"
	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	sb_errors "github.com/superblocksteam/agent/pkg/errors"
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
	jwt.StandardClaims
	authv1.Claims
}

func UnaryServerInterceptor(options ...Option) grpc.UnaryServerInterceptor {
	opts := newOptions(options...)

	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		ctx, err := validate(ctx, opts)
		if err != nil {
			opts.logger.Error("could not validate jwt", zap.Error(err))
			return nil, sb_errors.ErrAuthorization
		}

		return handler(ctx, req)
	}
}

func StreamServerInterceptor(options ...Option) grpc.StreamServerInterceptor {
	opts := newOptions(options...)

	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		ctx, err := validate(stream.Context(), opts)
		if err != nil {
			opts.logger.Error("could not validate jwt", zap.Error(err))
			return sb_errors.ErrAuthorization
		}

		wrappedStream := grpc_middleware.WrapServerStream(stream)
		wrappedStream.WrappedContext = ctx

		return handler(srv, wrappedStream)
	}
}

func validate(ctx context.Context, opts *options) (context.Context, error) {
	var token string
	{
		metadata, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, errors.New("could not get metadata from context")
		}

		tokens := metadata.Get(opts.key)
		if len(tokens) == 0 {
			return nil, errors.New("could not get authorization token")
		}

		parts := strings.SplitAfter(tokens[0], "Bearer ")
		if len(parts) != 2 {
			return nil, errors.New("authorization token malformed")
		}

		token = parts[1]
	}

	parsed, err := jwt.ParseWithClaims(token, new(claims), func(token *jwt.Token) (any, error) {
		switch token.Method.(type) {
		case *jwt.SigningMethodHMAC:
			return opts.hmacSigningKey, nil
		case *jwt.SigningMethodRSA:
			return opts.rsaSigningKey, nil
		case *jwt.SigningMethodECDSA:
			return opts.ecdsaSigningKey, nil
		default:
			return nil, errors.New("unexpected signing method")
		}
	})

	if err != nil {
		return nil, err
	}

	c, ok := parsed.Claims.(*claims)
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

	rbacRole := c.RbacRole
	if rbacRole == "" {
		return nil, errors.New("could not get rbac role")
	}
	ctx = context.WithValue(ctx, ContextKeyRbacRole, rbacRole)

	rbacGroups := c.RbacGroups
	if len(rbacGroups) == 0 {
		return nil, errors.New("could not get rbac groups")
	}
	ctx = context.WithValue(ctx, ContextKeyRbacGroups, rbacGroups)

	// We would hook up other claims here.

	return ctx, nil
}
