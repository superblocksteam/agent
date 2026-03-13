package telemetry

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTraceContractMatching(t *testing.T) {
	for _, test := range []struct {
		name      string
		contract  traceContract
		spanName  string
		wantMatch bool
	}{
		// Cloud wildcard -- everything matches
		{name: "cloud wildcard matches anything", contract: cloudTraceContract, spanName: "random.span", wantMatch: true},
		{name: "cloud wildcard matches empty", contract: cloudTraceContract, spanName: "", wantMatch: true},

		// Cloud-prem exact matches
		{name: "exact match api.execute", contract: cloudPremTraceContract, spanName: "api.execute", wantMatch: true},
		{name: "exact match api.step", contract: cloudPremTraceContract, spanName: "api.step", wantMatch: true},
		{name: "exact match fetch", contract: cloudPremTraceContract, spanName: "fetch", wantMatch: true},
		{name: "exact match llm.request", contract: cloudPremTraceContract, spanName: "llm.request", wantMatch: true},
		{name: "exact match clark.session", contract: cloudPremTraceContract, spanName: "clark.session", wantMatch: true},

		// Cloud-prem dot-prefix wildcards
		{name: "plugin wildcard", contract: cloudPremTraceContract, spanName: "plugin.postgres", wantMatch: true},
		{name: "plugin wildcard nested", contract: cloudPremTraceContract, spanName: "plugin.rest.execute", wantMatch: true},
		{name: "grpc wildcard", contract: cloudPremTraceContract, spanName: "grpc.server.request", wantMatch: true},
		{name: "kafka wildcard", contract: cloudPremTraceContract, spanName: "kafka.produce", wantMatch: true},
		{name: "redis wildcard", contract: cloudPremTraceContract, spanName: "redis.get", wantMatch: true},
		{name: "db wildcard", contract: cloudPremTraceContract, spanName: "db.query", wantMatch: true},
		{name: "schedule wildcard", contract: cloudPremTraceContract, spanName: "schedule.run", wantMatch: true},
		{name: "api.block wildcard", contract: cloudPremTraceContract, spanName: "api.block.parallel", wantMatch: true},

		// Cloud-prem HTTP wildcards (already prefixed)
		{name: "HTTP GET with path", contract: cloudPremTraceContract, spanName: "HTTP GET /api/v1/foo", wantMatch: true},
		{name: "HTTP POST with path", contract: cloudPremTraceContract, spanName: "HTTP POST /api/v1/bar", wantMatch: true},
		{name: "HTTP DELETE bare", contract: cloudPremTraceContract, spanName: "HTTP DELETE", wantMatch: true},

		// Cloud-prem HTTP normalization (OTel emits "GET /path", contract has "HTTP GET *")
		{name: "normalized GET /path", contract: cloudPremTraceContract, spanName: "GET /api/v1/foo", wantMatch: true},
		{name: "normalized POST /path", contract: cloudPremTraceContract, spanName: "POST /api/v1/bar", wantMatch: true},
		{name: "normalized bare PUT", contract: cloudPremTraceContract, spanName: "PUT", wantMatch: true},

		// Cloud-prem non-matching
		{name: "random span rejected", contract: cloudPremTraceContract, spanName: "random.operation", wantMatch: false},
		{name: "empty name rejected", contract: cloudPremTraceContract, spanName: "", wantMatch: false},
		{name: "partial prefix rejected", contract: cloudPremTraceContract, spanName: "plug", wantMatch: false},
		{name: "api.execute prefix rejected", contract: cloudPremTraceContract, spanName: "api.execute.sub", wantMatch: false},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.wantMatch, test.contract.matches(test.spanName))
		})
	}
}

func TestNormalizeHTTPSpanName(t *testing.T) {
	for _, test := range []struct {
		input    string
		wantName string
		wantOK   bool
	}{
		{"GET /foo", "HTTP GET /foo", true},
		{"POST /bar", "HTTP POST /bar", true},
		{"DELETE", "HTTP DELETE", true},
		{"plugin.rest", "", false},
		{"GETTING", "", false},
		{"", "", false},
	} {
		t.Run(test.input, func(t *testing.T) {
			name, ok := normalizeHTTPSpanName(test.input)
			assert.Equal(t, test.wantOK, ok)
			if ok {
				assert.Equal(t, test.wantName, name)
			}
		})
	}
}
