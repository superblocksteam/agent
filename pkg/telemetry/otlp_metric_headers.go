package telemetry

import (
	"log/slog"
	"net"
	"net/url"
	"strings"
	"sync"

	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
)

var headerDropWarnings sync.Map

// OTLPMetricHeaderOptions returns OTLP metric exporter options for headers when
// the endpoint transport is considered safe for auth-bearing headers.
func OTLPMetricHeaderOptions(endpointURL string, headers map[string]string) []otlpmetrichttp.Option {
	if len(headers) == 0 {
		return nil
	}

	allowed, denyReason := shouldAttachOTLPAuthHeaders(endpointURL)
	if !allowed {
		logHeaderDropOnce(endpointURL, denyReason)
		return nil
	}

	return []otlpmetrichttp.Option{otlpmetrichttp.WithHeaders(headers)}
}

func shouldAttachOTLPAuthHeaders(endpointURL string) (bool, string) {
	u, err := url.Parse(endpointURL)
	if err != nil {
		return false, "malformed_url"
	}

	host := strings.ToLower(u.Hostname())
	switch strings.ToLower(u.Scheme) {
	case "https":
		if isLoopbackHost(host) || isSuperblocksHost(host) {
			return true, ""
		}
		return false, "https_host_not_allowlisted"
	case "http":
		if isLoopbackHost(host) {
			return true, ""
		}
		return false, "http_non_loopback"
	default:
		return false, "unsupported_scheme"
	}
}

func isLoopbackHost(host string) bool {
	if host == "" {
		return false
	}
	if host == "localhost" {
		return true
	}

	if ip := net.ParseIP(host); ip != nil {
		return ip.IsLoopback()
	}

	return false
}

func isSuperblocksHost(host string) bool {
	if host == "" {
		return false
	}

	return host == "superblocks.com" || strings.HasSuffix(host, ".superblocks.com")
}

func logHeaderDropOnce(endpointURL, reason string) {
	safeEndpoint := sanitizeEndpointForLog(endpointURL)
	key := reason + "|" + safeEndpoint
	if _, loaded := headerDropWarnings.LoadOrStore(key, struct{}{}); loaded {
		return
	}

	slog.Warn("dropping OTLP auth headers for unsafe endpoint",
		"endpoint", safeEndpoint,
		"reason", reason,
	)
}

func sanitizeEndpointForLog(endpointURL string) string {
	u, err := url.Parse(endpointURL)
	if err != nil {
		return "malformed_endpoint"
	}

	scheme := strings.ToLower(u.Scheme)
	if scheme == "" {
		scheme = "unknown"
	}

	host := strings.ToLower(u.Hostname())
	if host == "" {
		return scheme + "://<missing-host>"
	}

	if port := u.Port(); port != "" {
		return scheme + "://" + net.JoinHostPort(host, port)
	}

	// Bracket IPv6 host strings for consistent URL-like formatting.
	if strings.Contains(host, ":") {
		host = "[" + host + "]"
	}

	return scheme + "://" + host
}
