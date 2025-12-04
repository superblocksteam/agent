package errors

import (
	"context"
	"errors"
	"strings"

	"github.com/superblocksteam/agent/internal/metrics"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	secrets "github.com/superblocksteam/agent/pkg/secrets/errors"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"go.opentelemetry.io/otel/attribute"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/protoadapt"
)

func UnaryServerInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		resp, err := handler(ctx, req)
		return resp, parse(err)
	}
}

func StreamServerInterceptor() grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		return parse(handler(srv, stream))
	}
}

func parse(err error) error {
	if err == nil {
		return nil
	}

	ctx := context.Background()

	type toGrpcStatus interface {
		GRPCStatus() *status.Status
	}

	if e, ok := err.(toGrpcStatus); ok {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", e.GRPCStatus().Code().String()))
		return e.GRPCStatus().Err()
	}

	if ve, ok := sberrors.IsValidationError(err); ok {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", "validation"))

		var details []protoadapt.MessageV1
		{
			for _, issue := range ve.Issues {
				details = append(details, &commonv1.Error{
					Name:    "ValidationError",
					Message: issue.Error(),
				})
			}
		}

		if status, err := status.New(codes.FailedPrecondition, "ValidationError").WithDetails(details...); err != nil {
			return sberrors.ErrInternal
		} else {
			return status.Err()
		}
	}

	// NOTE(frank): We'll need to think of a better way to do this but
	// errors passed to this function may be already wrapped in a
	// commonv1.Error. Hence, we do a string check to simulate an unwrap.

	if sberrors.IsAuthorizationError(err) || strings.Contains(err.Error(), "AuthorizationError") {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.Unauthenticated.String()))
		return status.New(codes.Unauthenticated, err.Error()).Err()
	}

	if sberrors.IsIntegrationOAuthError(err) || strings.Contains(err.Error(), "IntegrationOAuthError") {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.InvalidArgument.String()))
		return status.New(codes.InvalidArgument, err.Error()).Err()
	}

	if errors.Is(err, sberrors.ErrNotFound) || strings.Contains(err.Error(), "NotFoundError") {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.NotFound.String()))
		return status.New(codes.NotFound, err.Error()).Err()
	}

	if errors.Is(err, sberrors.ErrInternal) || strings.Contains(err.Error(), "InternalError") {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.Internal.String()))
		return status.New(codes.Internal, err.Error()).Err()
	}

	if sberrors.IsBadRequestError(err) || strings.Contains(err.Error(), "BadRequestError") {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.InvalidArgument.String()))
		return status.New(codes.InvalidArgument, err.Error()).Err()
	}

	if strings.Contains(err.Error(), "QuotaError") {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.ResourceExhausted.String()))
		return status.New(codes.ResourceExhausted, err.Error()).Err()
	}

	if ie, ok := sberrors.IsIntegrationError(err); ok {
		if ie.Code() == commonv1.Code_CODE_INTEGRATION_QUERY_TIMEOUT {
			metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.DeadlineExceeded.String()))
			return status.New(codes.DeadlineExceeded, err.Error()).Err()
		}
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.InvalidArgument.String()))
		return status.New(codes.InvalidArgument, err.Error()).Err()
	}

	if secrets.IsProviderError(err) {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.FailedPrecondition.String()))
		return status.New(codes.FailedPrecondition, err.Error()).Err()
	}

	if sberrors.IsHealthCheckError(err) {
		metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.Unavailable.String()))
		return status.New(codes.Unavailable, err.Error()).Err()
	}

	if err, ok := err.(*commonv1.Error); ok {
		if err.Name == "ApiAuthorizationError" {
			metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.PermissionDenied.String()))
			return status.New(codes.PermissionDenied, err.Error()).Err()
		}
	}

	metrics.AddCounter(ctx, metrics.TransportErrorsTotal, attribute.String("code", codes.Unknown.String()))
	return status.New(codes.Unknown, err.Error()).Err()
}
