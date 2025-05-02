package validator

import (
	"context"

	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"

	authv1 "github.com/superblocksteam/agent/types/gen/go/auth/v1"
)

type ContextKey int32

const (
	ContextKeyOrganziationID ContextKey = iota
	ContextKeyUserEmail
	ContextKeyRbacRole
	ContextKeyRbacGroupObjects
	ContextKeyQuotaTier
	ContextKeyOrganizationType
	ContextKeyUserType
	ContextKeyUserId
	ContextKeyUserDisplayName
	ContextKeyMetadata
	ContextKeyUsedJwtAuth
)

type QuotaTier int32

const (
	QuotaTierOne QuotaTier = iota
	QuotaTierTwo
)

func WithUsedJwtAuth(ctx context.Context, used bool) context.Context {
	return context.WithValue(ctx, ContextKeyUsedJwtAuth, used)
}

func GetUsedJwtAuth(ctx context.Context) bool {
	// NOTE: @joeyagreco - interesting problem here.. we only set this after we have decided we should use JWT auth
	// NOTE: @joeyagreco - so being unable to retrieve it just means 'no' (`false`)
	// NOTE: @joeyagreco - if at some point we run into issues setting this field in the context, we would never know downstream, we would just think we aren't using JWT auth
	// NOTE: @joeyagreco - we may want to add some pre-func to the JWT middleware that would allow us to update the context before the decider is called...
	val, _ := ctx.Value(ContextKeyUsedJwtAuth).(bool)
	return val
}

func WithOrganizationType(ctx context.Context, plan string) context.Context {
	return context.WithValue(ctx, ContextKeyOrganizationType, plan)
}

func GetOrganizationType(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyOrganizationType).(string)
	return val, ok
}

func WithOrganizationID(ctx context.Context, orgID string) context.Context {
	return context.WithValue(ctx, ContextKeyOrganziationID, orgID)
}

func GetOrganizationID(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyOrganziationID).(string)
	return val, ok
}

func EnrichedLogger(ctx context.Context, logger *zap.Logger) *zap.Logger {
	l := logger

	if orgID, ok := GetOrganizationID(ctx); ok {
		l = l.With(zap.String("organization_id", orgID))
	}

	if userEmail, ok := GetUserEmail(ctx); ok {
		l = l.With(zap.String("user_email", userEmail))
	}

	return l
}

func WithUserEmail(ctx context.Context, userEmail string) context.Context {
	return context.WithValue(ctx, ContextKeyUserEmail, userEmail)
}

func GetUserEmail(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyUserEmail).(string)
	return val, ok
}

func GetUserType(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyUserType).(string)
	return val, ok
}

func GetUserId(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyUserId).(string)
	return val, ok
}

func GetUserDisplayName(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyUserDisplayName).(string)
	return val, ok
}

func GetMetadata(ctx context.Context) (*structpb.Struct, bool) {
	val, ok := ctx.Value(ContextKeyMetadata).(*structpb.Struct)
	return val, ok
}

func WithRbacRole(ctx context.Context, rbacRole string) context.Context {
	return context.WithValue(ctx, ContextKeyRbacRole, rbacRole)
}

func GetRbacRole(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyRbacRole).(string)
	return val, ok
}

func GetRbacGroupObjects(ctx context.Context) ([]*authv1.Claims_RbacGroupObject, bool) {
	val, ok := ctx.Value(ContextKeyRbacGroupObjects).([]*authv1.Claims_RbacGroupObject)
	return val, ok
}

func WithQuotaTier(ctx context.Context, quotaTier QuotaTier) context.Context {
	return context.WithValue(ctx, ContextKeyQuotaTier, quotaTier)
}

func GetQuotaTier(ctx context.Context) (QuotaTier, bool) {
	val, ok := ctx.Value(ContextKeyQuotaTier).(QuotaTier)
	return val, ok
}
