package constants

import (
	"context"
	"strings"
	"time"

	grpc_jwt "github.com/superblocksteam/agent/pkg/middleware/jwt"
	"google.golang.org/grpc/metadata"
)

type ContextKey int

const (
	// ContextKeyRequestID is the context key for the request ID.
	ContextKeyExecutionID ContextKey = iota
	ContextKeyApiStartTime
	ContextKeyOrganizationID
	ContextKeyRemainingDuration
	ContentKeyApiType
	ContextKeyCorrelationId
	ContextKeyAgentId
	ContextKeyAgentVersion
	// TODO(frank): Add other context keys here.

	HeaderCorrelationId  = "x-superblocks-correlation-id"
	HeaderOrganizationId = "x-superblocks-organization-id"
)

func WithAgentId(ctx context.Context, agentId string) context.Context {
	return context.WithValue(ctx, ContextKeyAgentId, agentId)
}

func AgentId(ctx context.Context) string {
	if id, ok := ctx.Value(ContextKeyAgentId).(string); ok {
		return id
	}

	return ""
}

func WithAgentVersion(ctx context.Context, agentVersion string) context.Context {
	return context.WithValue(ctx, ContextKeyAgentVersion, agentVersion)
}

func AgentVersion(ctx context.Context) string {
	if version, ok := ctx.Value(ContextKeyAgentVersion).(string); ok {
		return version
	}

	return ""
}

func WithApiStartTime(ctx context.Context, startTime int64) context.Context {
	return context.WithValue(ctx, ContextKeyApiStartTime, startTime)
}

func ApiStartTime(ctx context.Context) int64 {
	if startTime, ok := ctx.Value(ContextKeyApiStartTime).(int64); ok {
		return startTime
	}

	return time.Time{}.UnixMilli()
}

// NOTE(frank): This was added because we record a metric in the individual implementations
// of worker.Client. Ideally, the metric is recorded in the worker.Client itself.
func WithApiType(ctx context.Context, apiType string) context.Context {
	return context.WithValue(ctx, ContentKeyApiType, apiType)
}

func ApiType(ctx context.Context) string {
	if apiType, ok := ctx.Value(ContentKeyApiType).(string); ok {
		return apiType
	}

	return ""
}

func WithExecutionID(ctx context.Context, executionID string) context.Context {
	return context.WithValue(ctx, ContextKeyExecutionID, executionID)
}

func ExecutionID(ctx context.Context) string {
	id, ok := ctx.Value(ContextKeyExecutionID).(string)
	if !ok {
		return ""
	}

	return id
}

func WithCorrelationID(ctx context.Context, correlationId string) context.Context {
	return context.WithValue(ctx, ContextKeyCorrelationId, correlationId)
}

func CorrelationID(ctx context.Context) string {
	id, ok := ctx.Value(ContextKeyCorrelationId).(string)
	if !ok {
		return ""
	}

	return id
}

func WithOrganizationID(ctx context.Context, organizationID string) context.Context {
	return context.WithValue(ctx, ContextKeyOrganizationID, organizationID)
}

func OrganizationID(ctx context.Context) string {
	if id, ok := grpc_jwt.GetOrganizationID(ctx); ok {
		return id
	}

	id, ok := ctx.Value(ContextKeyOrganizationID).(string)
	if !ok {
		return ""
	}

	return id
}

func WithRemainingDuration(ctx context.Context, duration time.Duration) context.Context {
	return context.WithValue(ctx, ContextKeyRemainingDuration, &duration)
}

func RemainingDuration(ctx context.Context) *time.Duration {
	if duration, ok := ctx.Value(ContextKeyRemainingDuration).(*time.Duration); ok {
		return duration
	}

	return nil
}

func CallerIpAddress(ctx context.Context) string {
	var ipAddress string
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if ipAddrs, ok := md["x-forwarded-for"]; ok && len(ipAddrs) > 0 {
			ipAddress = strings.Split(ipAddrs[0], ",")[0]
		}
	}
	return ipAddress
}
