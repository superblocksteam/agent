package telemetry

import "strings"

// droppedHTTPRoutes are unconditionally dropped before any contract matching.
// Mirrors TS DROPPED_HTTP_ROUTES.
var droppedHTTPRoutes = map[string]struct{}{
	"/health":           {},
	"/health/liveness":  {},
	"/health/readiness": {},
	"/liveness":         {},
	"/readiness":        {},
	"/metrics":          {},
	"/api/v1/metrics":   {},
}

// traceContract defines which span names are allowed for export.
type traceContract struct {
	patterns []spanPattern
}

type spanPattern struct {
	// prefix is the literal prefix to match. For exact matches this is the
	// full name. For wildcard patterns like "plugin.*" it is "plugin.".
	// For "HTTP GET *" it is "HTTP GET".
	prefix string
	// wildcard indicates the pattern ends with "*" and prefix matching is used.
	wildcard bool
}

// cloudTraceContract allows all spans (equivalent to TS { name: "*" }).
var cloudTraceContract = traceContract{
	patterns: []spanPattern{{prefix: "", wildcard: true}},
}

// cloudPremTraceContract mirrors TS TIER_2_TRACE_CONTRACT.
var cloudPremTraceContract = traceContract{
	patterns: []spanPattern{
		// HTTP spans
		{prefix: "HTTP GET", wildcard: true},
		{prefix: "HTTP POST", wildcard: true},
		{prefix: "HTTP PUT", wildcard: true},
		{prefix: "HTTP DELETE", wildcard: true},
		{prefix: "HTTP PATCH", wildcard: true},

		// Express instrumentation
		{prefix: "request handler", wildcard: true},

		// WebSocket
		{prefix: "WS SERVER", wildcard: true},
		{prefix: "WS CLIENT", wildcard: true},
		{prefix: "WS HANDLER", wildcard: true},

		// Application execution
		{prefix: "api.execute", wildcard: false},
		{prefix: "api.step", wildcard: false},
		{prefix: "api.block.", wildcard: true},

		// Plugin execution
		{prefix: "plugin.", wildcard: true},

		// Database
		{prefix: "db.", wildcard: true},

		// GenAI
		{prefix: "llm.request", wildcard: false},
		{prefix: "llm.tool_call", wildcard: false},
		{prefix: "ai.streamText", wildcard: false},
		{prefix: "ai.streamText.step", wildcard: false},

		// Clark AI agent
		{prefix: "clark.session", wildcard: false},
		{prefix: "clark.debug_loop", wildcard: false},

		// Infrastructure
		{prefix: "grpc.", wildcard: true},
		{prefix: "kafka.", wildcard: true},
		{prefix: "redis.", wildcard: true},

		// Outbound HTTP
		{prefix: "fetch", wildcard: false},

		// Scheduled jobs
		{prefix: "schedule.", wildcard: true},
	},
}

// onPremTraceContract allows all spans. Defined separately from cloudTraceContract
// so on-prem filtering can be tuned independently in the future.
var onPremTraceContract = traceContract{
	patterns: []spanPattern{{prefix: "", wildcard: true}},
}

func getTraceContract(dt DeploymentType) traceContract {
	switch dt {
	case DeploymentTypeCloudPrem:
		return cloudPremTraceContract
	case DeploymentTypeOnPrem:
		return onPremTraceContract
	default:
		return cloudTraceContract
	}
}

// matches returns true if spanName is allowed by the contract.
func (c *traceContract) matches(spanName string) bool {
	// Try the raw name first, then the HTTP-normalized form.
	if c.matchesRaw(spanName) {
		return true
	}
	if normalized, ok := normalizeHTTPSpanName(spanName); ok {
		return c.matchesRaw(normalized)
	}
	return false
}

func (c *traceContract) matchesRaw(name string) bool {
	for _, p := range c.patterns {
		if p.wildcard {
			if p.prefix == "" {
				return true // wildcard-all
			}
			// "HTTP GET" matches "HTTP GET" (exact) and "HTTP GET /foo" (prefix + space or more)
			if strings.HasPrefix(name, p.prefix) {
				return true
			}
		} else {
			if name == p.prefix {
				return true
			}
		}
	}
	return false
}

// normalizeHTTPSpanName converts "GET /foo" to "HTTP GET /foo".
// OTel HTTP instrumentation emits "METHOD /path" but contracts use "HTTP METHOD *".
func normalizeHTTPSpanName(name string) (string, bool) {
	methods := []string{"GET ", "POST ", "PUT ", "DELETE ", "PATCH ", "HEAD ", "OPTIONS "}
	for _, m := range methods {
		if strings.HasPrefix(name, m) {
			return "HTTP " + name, true
		}
	}
	// Also handle bare method names like "GET" without a path.
	bareMethods := []string{"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}
	for _, m := range bareMethods {
		if name == m {
			return "HTTP " + name, true
		}
	}
	return "", false
}
