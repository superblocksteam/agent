package trace

import (
	"context"
	"slices"

	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware/v2"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func attributes(ctx context.Context, meta interceptors.CallMeta) map[string]any {
	attributes := map[string]any{
		string(semconv.RPCSystemKey):  semconv.RPCSystemGRPC,
		string(semconv.RPCMethodKey):  meta.Method,
		string(semconv.RPCServiceKey): meta.Service,
	}

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return attributes
	}

	for k, v := range md {
		if slices.Contains([]string{
			"authorization",
			"x-superblocks-authorization",
			"x-superblocks-agent-key",
			"x-superblocks-api-key",
			"cookie",
		}, k) {
			v = []string{"<REDACTED>"}
		}

		attributes["http.request.header."+k] = v
	}

	return attributes
}

func UnaryServerInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		meta := interceptors.NewServerCallMeta(info.FullMethod, &grpc.StreamServerInfo{
			FullMethod: info.FullMethod,
		}, req)

		return tracer.Observe(ctx, meta.Service+"/"+meta.Method, attributes(ctx, meta), func(ctx context.Context, span trace.Span) (any, error) {
			return handler(ctx, req)
		}, nil)
	}
}

func StreamServerInterceptor() grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		meta := interceptors.NewServerCallMeta(info.FullMethod, info, srv)

		_, err := tracer.Observe(stream.Context(), meta.Service+"/"+meta.Method, attributes(stream.Context(), meta), func(ctx context.Context, span trace.Span) (any, error) {
			wrapped := grpc_middleware.WrapServerStream(stream)
			wrapped.WrappedContext = ctx

			return nil, handler(srv, wrapped)
		}, nil)

		return err
	}
}
