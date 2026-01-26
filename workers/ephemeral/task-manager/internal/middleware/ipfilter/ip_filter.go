package ipfilter

import (
	"context"
	"net"

	"github.com/superblocksteam/agent/pkg/utils"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/status"
)

type AllowedIpProvider interface {
	GetAllowedIps() *utils.Set[string]
}

// ipFilterInterceptor returns a gRPC unary interceptor that filters by allowed IP.
func IpFilterInterceptor(ipProvider AllowedIpProvider, logger *zap.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		allowedIps := ipProvider.GetAllowedIps()

		// If no IP filter set, allow all
		if allowedIps.IsEmpty() {
			return handler(ctx, req)
		}

		// Extract peer IP from context
		p, ok := peer.FromContext(ctx)
		if !ok {
			logger.Warn("failed to get peer from context")
			return nil, status.Error(codes.PermissionDenied, "unable to determine client IP")
		}

		clientIp := extractIp(p.Addr.String())
		if !allowedIps.Contains(clientIp) {
			logger.Warn("rejected connection from unauthorized IP",
				zap.String("client_ip", clientIp),
				zap.Strings("allowed_ips", allowedIps.ToSlice()))
			return nil, status.Error(codes.PermissionDenied, "unauthorized client IP")
		}

		return handler(ctx, req)
	}
}

// extractIp extracts the IP address from an address string (IP:port format)
func extractIp(addr string) string {
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		// If it's not in host:port format, assume it's just an IP
		return addr
	}
	return host
}
