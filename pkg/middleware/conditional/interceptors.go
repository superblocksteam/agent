package conditional

import (
	"context"

	"google.golang.org/grpc"
)

func UnaryServerInterceptor(interceptor grpc.UnaryServerInterceptor, condition func(context.Context, any, *grpc.UnaryServerInfo) bool) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if condition(ctx, req, info) {
			return interceptor(ctx, req, info, handler)
		}

		return handler(ctx, req)
	}
}

func StreamServerInterceptor(interceptor grpc.StreamServerInterceptor, condition func(any, grpc.ServerStream, *grpc.StreamServerInfo) bool) grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		if condition(srv, stream, info) {
			return interceptor(srv, stream, info, handler)
		}

		return handler(srv, stream)
	}
}
