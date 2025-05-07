package auth

import (
	"context"

	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware/v2"

	"github.com/superblocksteam/agent/pkg/constants"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func contextWithRequestUsesJwtAuth(ctx context.Context) context.Context {
	requestMetadata, _ := metadata.FromIncomingContext(ctx)

	superblocksJwt := requestMetadata.Get(constants.HeaderSuperblocksJwt)
	if len(superblocksJwt) > 0 {
		return constants.WithRequestUsesJwtAuth(ctx, true)
	}

	return constants.WithRequestUsesJwtAuth(ctx, false)

}

func UnaryServerInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		updatedCtx := contextWithRequestUsesJwtAuth(ctx)
		return handler(updatedCtx, req)
	}
}

func StreamServerInterceptor() grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		wrappedServerStream := grpc_middleware.WrapServerStream(stream)
		wrappedServerStream.WrappedContext = contextWithRequestUsesJwtAuth(stream.Context())
		return handler(srv, wrappedServerStream)
	}
}
