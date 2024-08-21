package correlation

import (
	"context"
	"fmt"
	"strings"

	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware/v2"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/utils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// NOTE(frank): This middleware can likely be removed once we have an API gateway.

func getCorrelationId(ctx context.Context) (string, error) {
	var correlationId string
	var err error

	md, _ := metadata.FromIncomingContext(ctx)
	correlationId = strings.Join(md.Get(constants.HeaderCorrelationId), ", ")

	if correlationId == "" {
		correlationId, err = utils.UUID()
		if err != nil {
			return "", fmt.Errorf("cannot create correlation-id: %w", err)
		}
	}

	return correlationId, nil
}

func UnaryServerInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		correlationId, err := getCorrelationId(ctx)
		if err != nil {
			return nil, err
		}

		err = grpc.SetHeader(ctx, metadata.New(map[string]string{
			constants.HeaderCorrelationId: correlationId,
		}))
		if err != nil {
			return nil, fmt.Errorf(
				"cannot set grpc response header %q: %w",
				constants.HeaderCorrelationId,
				err,
			)
		}

		ctx = constants.WithCorrelationID(ctx, correlationId)
		ctx = constants.WithExecutionID(ctx, correlationId)
		return handler(ctx, req)
	}
}

func StreamServerInterceptor() grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		correlationId, err := getCorrelationId(stream.Context())
		if err != nil {
			return err
		}

		err = stream.SetHeader(metadata.New(map[string]string{
			constants.HeaderCorrelationId: correlationId,
		}))
		if err != nil {
			return fmt.Errorf(
				"cannot set grpc stream response header %q: %w",
				constants.HeaderCorrelationId,
				err,
			)
		}

		ctx := stream.Context()
		ctx = constants.WithCorrelationID(ctx, correlationId)
		ctx = constants.WithExecutionID(ctx, correlationId)

		wrappedStream := grpc_middleware.WrapServerStream(stream)
		wrappedStream.WrappedContext = ctx

		return handler(srv, wrappedStream)
	}
}
