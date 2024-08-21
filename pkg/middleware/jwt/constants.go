package jwt

import (
	"context"

	"go.uber.org/zap"
)

type ContextKey int32

const (
	ContextKeyOrganziationID ContextKey = iota
	ContextKeyUserEmail
	ContextKeyRbacRole
	ContextKeyRbacGroups
	ContextKeyQuotaTier
	ContextKeyOrganizationType
	ContextKeyUserType
)

type QuotaTier int32

const (
	QuotaTierOne QuotaTier = iota
	QuotaTierTwo
)

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

func WithRbacRole(ctx context.Context, rbacRole string) context.Context {
	return context.WithValue(ctx, ContextKeyRbacRole, rbacRole)
}

func GetRbacRole(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyRbacRole).(string)
	return val, ok
}

func WithRbacGroups(ctx context.Context, rbacGroups []string) context.Context {
	return context.WithValue(ctx, ContextKeyRbacGroups, rbacGroups)
}

func GetRbacGroups(ctx context.Context) ([]string, bool) {
	val, ok := ctx.Value(ContextKeyRbacGroups).([]string)
	return val, ok
}

func WithQuotaTier(ctx context.Context, quotaTier QuotaTier) context.Context {
	return context.WithValue(ctx, ContextKeyQuotaTier, quotaTier)
}

func GetQuotaTier(ctx context.Context) (QuotaTier, bool) {
	val, ok := ctx.Value(ContextKeyQuotaTier).(QuotaTier)
	return val, ok
}
