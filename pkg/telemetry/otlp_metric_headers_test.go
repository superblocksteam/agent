package telemetry

import (
	"bytes"
	"log/slog"
	"strings"
	"sync"
	"testing"
)

func TestShouldAttachOTLPAuthHeaders(t *testing.T) {
	tests := []struct {
		name string
		url  string
		want bool
	}{
		{
			name: "https superblocks collector",
			url:  "https://traces.intake.superblocks.com/v1/metrics",
			want: true,
		},
		{
			name: "https superblocks root domain",
			url:  "https://superblocks.com/v1/metrics",
			want: true,
		},
		{
			name: "https localhost mixed case",
			url:  "https://LOCALHOST:4318/v1/metrics",
			want: true,
		},
		{
			name: "http localhost collector",
			url:  "http://localhost:4318/v1/metrics",
			want: true,
		},
		{
			name: "http loopback collector",
			url:  "http://127.0.0.1:4318/v1/metrics",
			want: true,
		},
		{
			name: "http ipv6 loopback collector",
			url:  "http://[::1]:4318/v1/metrics",
			want: true,
		},
		{
			name: "http remote collector",
			url:  "http://collector.example.com:4318/v1/metrics",
			want: false,
		},
		{
			name: "http ipv6 non loopback collector",
			url:  "http://[2001:db8::1]:4318/v1/metrics",
			want: false,
		},
		{
			name: "https non superblocks collector",
			url:  "https://collector.example.com:4318/v1/metrics",
			want: false,
		},
		{
			name: "unsupported scheme",
			url:  "grpc://collector.example.com:4317/v1/metrics",
			want: false,
		},
		{
			name: "empty URL",
			url:  "",
			want: false,
		},
		{
			name: "malformed URL",
			url:  ":// bad",
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, _ := shouldAttachOTLPAuthHeaders(tt.url)
			if got != tt.want {
				t.Fatalf("shouldAttachOTLPAuthHeaders(%q) = %v, want %v", tt.url, got, tt.want)
			}
		})
	}
}

func TestOTLPMetricHeaderOptions(t *testing.T) {
	headers := map[string]string{"x-superblocks-agent-key": "abc"}

	if got := OTLPMetricHeaderOptions("http://collector.example.com:4318/v1/metrics", headers); len(got) != 0 {
		t.Fatalf("expected no header options for insecure remote http endpoint, got %d options", len(got))
	}

	if got := OTLPMetricHeaderOptions("https://traces.intake.superblocks.com/v1/metrics", headers); len(got) == 0 {
		t.Fatal("expected header options for allowlisted https endpoint")
	}
}

func TestOTLPMetricHeaderOptions_FastPathNoHeaders(t *testing.T) {
	resetHeaderDropWarningsForTest()
	_, logOutput, restore := installTestLogger()
	defer restore()

	if got := OTLPMetricHeaderOptions("http://collector.example.com:4318/v1/metrics", nil); len(got) != 0 {
		t.Fatalf("expected no options for nil headers, got %d options", len(got))
	}

	if got := OTLPMetricHeaderOptions("http://collector.example.com:4318/v1/metrics", map[string]string{}); len(got) != 0 {
		t.Fatalf("expected no options for empty headers, got %d options", len(got))
	}

	if strings.Contains(logOutput(), "dropping OTLP auth headers") {
		t.Fatal("expected no warning when no headers are provided")
	}
}

func TestOTLPMetricHeaderOptions_LogsHeaderDropOnce(t *testing.T) {
	resetHeaderDropWarningsForTest()
	headers := map[string]string{"x-superblocks-agent-key": "abc"}
	_, logOutput, restore := installTestLogger()
	defer restore()

	const endpoint = "http://collector.example.com:4318/v1/metrics"
	_ = OTLPMetricHeaderOptions(endpoint, headers)
	_ = OTLPMetricHeaderOptions(endpoint, headers)

	logText := logOutput()
	if got := strings.Count(logText, "dropping OTLP auth headers for unsafe endpoint"); got != 1 {
		t.Fatalf("expected one header-drop warning for repeated endpoint, got %d logs: %s", got, logText)
	}

	if !strings.Contains(logText, "reason=http_non_loopback") {
		t.Fatalf("expected deny reason in warning log, got: %s", logText)
	}
}

func resetHeaderDropWarningsForTest() {
	headerDropWarnings = sync.Map{}
}

func installTestLogger() (*bytes.Buffer, func() string, func()) {
	var buf bytes.Buffer
	previous := slog.Default()
	slog.SetDefault(slog.New(slog.NewTextHandler(&buf, nil)))

	return &buf, func() string {
			return buf.String()
		}, func() {
			slog.SetDefault(previous)
		}
}

func TestShouldAttachOTLPAuthHeaders_MalformedWithHeadersIsDenied(t *testing.T) {
	resetHeaderDropWarningsForTest()
	headers := map[string]string{"x-superblocks-agent-key": "abc"}
	_, logOutput, restore := installTestLogger()
	defer restore()

	if got := OTLPMetricHeaderOptions(":// bad", headers); len(got) != 0 {
		t.Fatalf("expected no options for malformed endpoint, got %d options", len(got))
	}

	if !strings.Contains(logOutput(), "reason=malformed_url") {
		t.Fatalf("expected malformed_url deny reason in logs, got: %s", logOutput())
	}

	if strings.Contains(logOutput(), ":// bad") {
		t.Fatalf("expected malformed raw endpoint to be redacted from logs, got: %s", logOutput())
	}
}

func TestOTLPMetricHeaderOptions_DoesNotLogSensitiveURLComponents(t *testing.T) {
	resetHeaderDropWarningsForTest()
	headers := map[string]string{"x-superblocks-agent-key": "abc"}
	_, logOutput, restore := installTestLogger()
	defer restore()

	const endpoint = "https://user:super-secret@collector.example.com:4318/v1/metrics?token=abc123#frag"
	_ = OTLPMetricHeaderOptions(endpoint, headers)

	logText := logOutput()
	if !strings.Contains(logText, "endpoint=https://collector.example.com:4318") {
		t.Fatalf("expected sanitized endpoint in logs, got: %s", logText)
	}

	for _, leaked := range []string{
		"user:super-secret",
		"token=abc123",
		"/v1/metrics",
		"#frag",
	} {
		if strings.Contains(logText, leaked) {
			t.Fatalf("expected log redaction for %q, got: %s", leaked, logText)
		}
	}
}
