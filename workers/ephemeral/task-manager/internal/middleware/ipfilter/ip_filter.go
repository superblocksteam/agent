package ipfilter

import (
	"context"
	"net"
	"net/http"

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

// IpFilterResult represents the result of IP validation.
type IpFilterResult int

const (
	IpFilterAllowed IpFilterResult = iota
	IpFilterDenied
	IpFilterNoConfig
)

// validateIp checks if the given client IP is in the allowed set.
// Returns IpFilterNoConfig if allowlist is empty, IpFilterAllowed if IP is permitted,
// or IpFilterDenied if IP is not in the allowlist (and logs a warning).
func validateIp(allowedIps *utils.Set[string], clientIp string, logger *zap.Logger) IpFilterResult {
	if allowedIps.IsEmpty() {
		return IpFilterNoConfig
	}

	if !allowedIps.Contains(clientIp) {
		logger.Warn(
			"rejected connection from unauthorized IP",
			zap.String("client_ip", clientIp),
			zap.Strings("allowed_ips", allowedIps.ToSlice()),
		)
		return IpFilterDenied
	}

	return IpFilterAllowed
}

// IpFilterInterceptor returns a gRPC unary interceptor that filters by allowed IP.
// Uses fail-closed behavior: if no IPs are configured, all requests are denied
// with Unavailable to indicate the service is not yet ready.
// When disabled is true, the interceptor passes all requests through without filtering.
func IpFilterInterceptor(ipProvider AllowedIpProvider, logger *zap.Logger, disabled bool) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		if disabled {
			return handler(ctx, req)
		}

		allowedIps := ipProvider.GetAllowedIps()

		// Extract peer IP from context
		p, ok := peer.FromContext(ctx)
		if !ok {
			logger.Warn("failed to get peer from context")
			return nil, status.Error(codes.PermissionDenied, "unable to determine client IP")
		}

		clientIp := extractIp(p.Addr.String())

		switch validateIp(allowedIps, clientIp, logger) {
		case IpFilterAllowed:
			return handler(ctx, req)
		case IpFilterNoConfig:
			// Fail-closed: deny all when no IPs configured (service not yet ready)
			logger.Warn("rejected connection: no allowed IPs configured yet",
				zap.String("client_ip", clientIp))
			return nil, status.Error(codes.Unavailable, "ip filter not yet configured")
		case IpFilterDenied:
			return nil, status.Error(codes.PermissionDenied, "unauthorized client IP")
		default:
			return nil, status.Error(codes.Internal, "unexpected ip filter result")
		}
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

// IpFilterHttpMiddleware returns an HTTP middleware that filters by allowed IP.
// Uses fail-closed behavior: if no IPs are configured, all requests are denied
// with 503 Service Unavailable to indicate the service is not yet ready.
// This matches the gRPC interceptor behavior for consistency.
// When disabled is true, the middleware passes all requests through without filtering.
func IpFilterHttpMiddleware(ipProvider AllowedIpProvider, logger *zap.Logger, disabled bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if disabled {
				next.ServeHTTP(w, r)
				return
			}

			allowedIps := ipProvider.GetAllowedIps()
			clientIp := extractIp(r.RemoteAddr)

			switch validateIp(allowedIps, clientIp, logger) {
			case IpFilterAllowed:
				next.ServeHTTP(w, r)
			case IpFilterNoConfig:
				// Fail-closed: deny all when no IPs configured (service not yet ready)
				logger.Warn("rejected connection: no allowed IPs configured yet",
					zap.String("client_ip", clientIp))
				http.Error(w, "ip filter not yet configured", http.StatusServiceUnavailable)
			case IpFilterDenied:
				http.Error(w, "unauthorized client IP", http.StatusForbidden)
			default:
				http.Error(w, "internal error", http.StatusInternalServerError)
			}
		})
	}
}
