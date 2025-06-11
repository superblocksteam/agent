package errors

import (
	"context"
	"errors"
	"strings"

	"github.com/superblocksteam/agent/internal/metrics"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	secrets "github.com/superblocksteam/agent/pkg/secrets/errors"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
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

	type toGrpcStatus interface {
		GRPCStatus() *status.Status
	}

	if e, ok := err.(toGrpcStatus); ok {
		metrics.TransportErrorsTotal.WithLabelValues(e.GRPCStatus().Code().String()).Inc()
		return e.GRPCStatus().Err()
	}

	if ve, ok := sberrors.IsValidationError(err); ok {
		metrics.TransportErrorsTotal.WithLabelValues("validation").Inc()

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
		metrics.TransportErrorsTotal.WithLabelValues(codes.Unauthenticated.String()).Inc()
		return status.New(codes.Unauthenticated, err.Error()).Err()
	}

	if sberrors.IsIntegrationOAuthError(err) || strings.Contains(err.Error(), "IntegrationOAuthError") {
		metrics.TransportErrorsTotal.WithLabelValues(codes.InvalidArgument.String()).Inc()
		return status.New(codes.InvalidArgument, err.Error()).Err()
	}

	if errors.Is(err, sberrors.ErrNotFound) || strings.Contains(err.Error(), "NotFoundError") {
		metrics.TransportErrorsTotal.WithLabelValues(codes.NotFound.String()).Inc()
		return status.New(codes.NotFound, err.Error()).Err()
	}

	if errors.Is(err, sberrors.ErrInternal) || strings.Contains(err.Error(), "InternalError") {
		metrics.TransportErrorsTotal.WithLabelValues(codes.Internal.String()).Inc()
		return status.New(codes.Internal, err.Error()).Err()
	}

	if sberrors.IsBadRequestError(err) || strings.Contains(err.Error(), "BadRequestError") {
		metrics.TransportErrorsTotal.WithLabelValues(codes.InvalidArgument.String()).Inc()
		return status.New(codes.InvalidArgument, err.Error()).Err()
	}

	if strings.Contains(err.Error(), "QuotaError") {
		metrics.TransportErrorsTotal.WithLabelValues(codes.ResourceExhausted.String()).Inc()
		return status.New(codes.ResourceExhausted, err.Error()).Err()
	}

	if _, ok := sberrors.IsIntegrationError(err); ok {
		metrics.TransportErrorsTotal.WithLabelValues(codes.InvalidArgument.String()).Inc()
		return status.New(codes.InvalidArgument, err.Error()).Err()
	}

	if secrets.IsProviderError(err) {
		metrics.TransportErrorsTotal.WithLabelValues(codes.FailedPrecondition.String()).Inc()
		return status.New(codes.FailedPrecondition, err.Error()).Err()
	}

	if sberrors.IsHealthCheckError(err) {
		metrics.TransportErrorsTotal.WithLabelValues(codes.Unavailable.String()).Inc()
		return status.New(codes.Unavailable, err.Error()).Err()
	}

	if err, ok := err.(*commonv1.Error); ok {
		if err.Name == "ApiAuthorizationError" {
			metrics.TransportErrorsTotal.WithLabelValues(codes.PermissionDenied.String()).Inc()
			return status.New(codes.PermissionDenied, err.Error()).Err()
		}
	}

	metrics.TransportErrorsTotal.WithLabelValues(codes.Unknown.String()).Inc()
	return status.New(codes.Unknown, err.Error()).Err()
}
