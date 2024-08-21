package cancellation

import (
	"context"

	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/observability"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

func UnaryServerInterceptor(logger *zap.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		resp, err := handler(ctx, req)
		check(ctx, logger)
		return resp, err
	}
}

func StreamServerInterceptor(logger *zap.Logger) grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		err := handler(srv, stream)
		check(stream.Context(), logger)
		return err
	}
}

func check(ctx context.Context, logger *zap.Logger) {
	if ctx.Err() == context.Canceled {
		logger.Info("this request has been cancled by the client", zap.String(observability.OBS_TAG_CORRELATION_ID, constants.ExecutionID(ctx)))
	}
}
