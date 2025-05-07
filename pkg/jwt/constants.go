package jwt

import (
	"context"

	"go.uber.org/zap"
)

type ContextKey int32

const (
	ContextKeyScope ContextKey = iota
	ContextKeyRawJwt
	ContextKeyApplicationId
	ContextKeyOrganziationId
	ContextKeyDirectoryHash
	ContextKeyCommitId
	ContextKeyUserEmail
	ContextKeyUserType
	ContextKeyName
)

func WithRawJwt(ctx context.Context, rawJwt string) context.Context {
	return context.WithValue(ctx, ContextKeyRawJwt, rawJwt)
}

func GetRawJwt(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyRawJwt).(string)
	return val, ok
}

func WithTokenScope(ctx context.Context, scope TokenScopes) context.Context {
	return context.WithValue(ctx, ContextKeyScope, scope)
}

func GetTokenScope(ctx context.Context) (TokenScopes, bool) {
	val, ok := ctx.Value(ContextKeyScope).(TokenScopes)
	return val, ok
}

func WithApplicationID(ctx context.Context, appID string) context.Context {
	return context.WithValue(ctx, ContextKeyApplicationId, appID)
}

func GetApplicationID(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyApplicationId).(string)
	return val, ok
}

func WithOrganizationID(ctx context.Context, orgID string) context.Context {
	return context.WithValue(ctx, ContextKeyOrganziationId, orgID)
}

func GetOrganizationID(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyOrganziationId).(string)
	return val, ok
}

func WithDirectoryHash(ctx context.Context, dirHash string) context.Context {
	return context.WithValue(ctx, ContextKeyDirectoryHash, dirHash)
}

func GetDirectoryHash(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyDirectoryHash).(string)
	return val, ok
}

func WithCommitID(ctx context.Context, commitID string) context.Context {
	return context.WithValue(ctx, ContextKeyCommitId, commitID)
}

func GetCommitID(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyCommitId).(string)
	return val, ok
}

func WithUserEmail(ctx context.Context, userEmail string) context.Context {
	return context.WithValue(ctx, ContextKeyUserEmail, userEmail)
}

func GetUserEmail(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyUserEmail).(string)
	return val, ok
}

func WithUserType(ctx context.Context, userType UserType) context.Context {
	return context.WithValue(ctx, ContextKeyUserType, userType)
}

func GetUserType(ctx context.Context) (UserType, bool) {
	val, ok := ctx.Value(ContextKeyUserType).(UserType)
	return val, ok
}

func WithName(ctx context.Context, name string) context.Context {
	return context.WithValue(ctx, ContextKeyName, name)
}

func GetName(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextKeyName).(string)
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
