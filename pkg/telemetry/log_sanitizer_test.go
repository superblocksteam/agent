package telemetry

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	otellog "go.opentelemetry.io/otel/log"
)

//go:embed contracts/sanitizer-vectors.json
var sanitizerVectorsJSON []byte

//go:embed contracts/secret-fields.json
var secretFieldsContract []byte

type sanitizerVectors struct {
	SanitizeMessage []struct {
		Input    string `json:"input"`
		Expected string `json:"expected"`
	} `json:"sanitize_message"`
	IsSecretField struct {
		True  []string `json:"true"`
		False []string `json:"false"`
	} `json:"is_secret_field"`
}

type secretFieldsJSON struct {
	Exact    []string `json:"exact"`
	Patterns []string `json:"patterns"`
}

func TestSanitizeLogMessageMatchesTSContract(t *testing.T) {
	var vectors sanitizerVectors
	require.NoError(t, json.Unmarshal(sanitizerVectorsJSON, &vectors))

	for _, tc := range vectors.SanitizeMessage {
		t.Run(tc.Input, func(t *testing.T) {
			assert.Equal(t, tc.Expected, SanitizeLogMessage(tc.Input))
		})
	}
}

func TestIsSecretFieldMatchesTSContract(t *testing.T) {
	var vectors sanitizerVectors
	require.NoError(t, json.Unmarshal(sanitizerVectorsJSON, &vectors))

	for _, field := range vectors.IsSecretField.True {
		assert.True(t, IsSecretField(field), "expected IsSecretField(%q) = true", field)
	}
	for _, field := range vectors.IsSecretField.False {
		assert.False(t, IsSecretField(field), "expected IsSecretField(%q) = false", field)
	}
}

func TestSecretFieldsMatchTSContract(t *testing.T) {
	var contract secretFieldsJSON
	require.NoError(t, json.Unmarshal(secretFieldsContract, &contract))

	// Every TS exact field must be in Go's secretFields.
	for _, field := range contract.Exact {
		_, ok := secretFields[field]
		assert.True(t, ok, "Go secretFields missing TS field: %s", field)
	}

	// Every Go exact field must be in TS.
	tsSet := make(map[string]struct{}, len(contract.Exact))
	for _, f := range contract.Exact {
		tsSet[f] = struct{}{}
	}
	for field := range secretFields {
		assert.Contains(t, tsSet, field,
			"Go secretFields has field not in TS contract: %s", field)
	}

	// Verify same number of field patterns.
	assert.Len(t, secretFieldPatterns, len(contract.Patterns),
		"Go and TS have different number of secret field patterns")
}

func TestSanitizeLogObject(t *testing.T) {
	input := map[string]any{
		"message":  "token: abc123",
		"password": "secret",
		"nested": map[string]any{
			"api_key": "value",
			"ok":      "Bearer abc123",
		},
	}
	got := SanitizeLogObject(input).(map[string]any)

	require.NotContains(t, got, "password")
	assert.Equal(t, "token: [REDACTED]", got["message"])

	nested := got["nested"].(map[string]any)
	require.NotContains(t, nested, "api_key")
	assert.Equal(t, "Bearer [REDACTED]", nested["ok"])
}

func TestSanitizeLogValue(t *testing.T) {
	val := otellog.MapValue(
		otellog.String("token", "abc123"),
		otellog.String("message", "Bearer abc123"),
	)

	sanitized := SanitizeOtelLogValue(val, 0, nil)
	kvs := sanitized.AsMap()
	require.Len(t, kvs, 1)
	assert.Equal(t, "message", kvs[0].Key)
	assert.Equal(t, "Bearer [REDACTED]", kvs[0].Value.AsString())
}

func TestSanitizeLogObjectStruct(t *testing.T) {
	type creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Message  string `json:"message"`
	}
	input := creds{Username: "alice", Password: "hunter2", Message: "Bearer abc123"}
	got := SanitizeLogObject(input).(map[string]any)
	assert.NotContains(t, got, "password")
	assert.Equal(t, "alice", got["username"])
	assert.Equal(t, "Bearer [REDACTED]", got["message"])
}

func TestSanitizeLogObjectTypedMap(t *testing.T) {
	// Typed maps (e.g. map[string]string) should still have secret fields stripped.
	input := map[string]string{
		"username": "alice",
		"password": "hunter2",
		"message":  "Bearer abc123",
	}
	got := SanitizeLogObject(input).(map[string]any)
	assert.NotContains(t, got, "password")
	assert.Equal(t, "alice", got["username"])
	assert.Equal(t, "Bearer [REDACTED]", got["message"])
}

func TestSanitizeLogObjectTypedSlice(t *testing.T) {
	// Typed slices (e.g. []string) should still have secrets redacted.
	input := []string{"Bearer abc123", "safe value", "api_key: secret"}
	got := SanitizeLogObject(input).([]any)
	require.Len(t, got, 3)
	assert.Equal(t, "Bearer [REDACTED]", got[0])
	assert.Equal(t, "safe value", got[1])
	assert.Equal(t, "api_key: [REDACTED]", got[2])
}

func TestSanitizeAnyMaxDepth(t *testing.T) {
	// maxSanitizerDepth is 10. sanitizeAny returns "[MAX_DEPTH_REACHED]" when
	// depth > 10, so we need 12 levels of nesting: depths 0-10 process the map,
	// depth 11 hits the guard and returns the placeholder.
	var nested any = "deep value"
	for i := 0; i < 12; i++ {
		nested = map[string]any{"level": nested}
	}

	result := sanitizeAny(nested, 0)

	// Walk down through 11 map levels (depths 0-10 all produce maps).
	for i := 0; i < 11; i++ {
		m, ok := result.(map[string]any)
		require.True(t, ok, "expected map at depth %d", i)
		result = m["level"]
	}
	assert.Equal(t, "[MAX_DEPTH_REACHED]", result)
}

func TestSanitizeAnyNonStringKeyMap(t *testing.T) {
	input := map[int]string{1: "one", 2: "two"}
	result := sanitizeAny(input, 0)
	// Non-string-key maps pass through unchanged (the reflect.Map branch).
	assert.Equal(t, input, result)
}

func TestSanitizeOtelLogValueCustomTransform(t *testing.T) {
	val := otellog.MapValue(
		otellog.String("greeting", "hello world"),
		otellog.String("name", "alice"),
	)

	sanitized := SanitizeOtelLogValue(val, 0, strings.ToUpper)
	kvs := sanitized.AsMap()
	require.Len(t, kvs, 2)
	assert.Equal(t, "HELLO WORLD", kvs[0].Value.AsString())
	assert.Equal(t, "ALICE", kvs[1].Value.AsString())
}

func TestSanitizeOtelLogValueMaxDepth(t *testing.T) {
	// maxSanitizerDepth is 10. Same logic as sanitizeAny: we need 12 levels
	// of nesting so that depth 11 triggers the guard.
	var nested otellog.Value = otellog.StringValue("deep value")
	for i := 0; i < 12; i++ {
		nested = otellog.MapValue(otellog.KeyValue{Key: "level", Value: nested})
	}

	result := SanitizeOtelLogValue(nested, 0, nil)

	// Walk down through 11 map levels (depths 0-10 all produce maps).
	for i := 0; i < 11; i++ {
		kvs := result.AsMap()
		require.Len(t, kvs, 1, "expected 1 kv at depth %d", i)
		result = kvs[0].Value
	}
	assert.Equal(t, "[MAX_DEPTH_REACHED]", result.AsString())
}

func TestSanitizeOtelLogValueBytes(t *testing.T) {
	val := otellog.BytesValue([]byte("bearer abc123"))
	sanitized := SanitizeOtelLogValue(val, 0, nil)
	assert.Equal(t, "bearer [REDACTED]", sanitized.AsString())
}

func TestSanitizeLogErrorNil(t *testing.T) {
	assert.Nil(t, SanitizeLogError(nil))
}

func TestSanitizeLogErrorWithError(t *testing.T) {
	result := SanitizeLogError(fmt.Errorf("bearer abc123"))
	m, ok := result.(map[string]any)
	require.True(t, ok)
	assert.Equal(t, true, m["_sanitized"])
	assert.Equal(t, "bearer [REDACTED]", m["error"])

	// Error containing a stack trace should have it redacted.
	errWithStack := fmt.Errorf("panic: runtime error\ngoroutine 1 [running]:\nmain.main()")
	result = SanitizeLogError(errWithStack)
	m, ok = result.(map[string]any)
	require.True(t, ok)
	assert.Equal(t, "panic: runtime error\n"+stackTraceRedactedPlaceholder, m["error"])
}

func TestSanitizeLogErrorWithNonError(t *testing.T) {
	result := SanitizeLogError("bearer abc123")
	// A plain string is not an error, so it goes through sanitizeAny.
	assert.Equal(t, "bearer [REDACTED]", result)
}

func TestSafeJSONStringNil(t *testing.T) {
	assert.Equal(t, "{}", SafeJSONString(nil))
}

func TestSafeJSONStringPlainString(t *testing.T) {
	assert.Equal(t, "token: [REDACTED]", SafeJSONString("token: abc123"))
}

func TestSanitizeAnyNilPointer(t *testing.T) {
	var p *string
	result := sanitizeAny(p, 0)
	assert.Nil(t, result)
}

func TestSanitizeAnyPointerDeref(t *testing.T) {
	s := "bearer abc123"
	result := sanitizeAny(&s, 0)
	assert.Equal(t, "bearer [REDACTED]", result)
}

func TestRedactStackTrace(t *testing.T) {
	for _, test := range []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "go stack trace",
			input:    "panic: runtime error\ngoroutine 1 [running]:\nmain.main()\n\t/app/main.go:10",
			expected: "panic: runtime error\n" + stackTraceRedactedPlaceholder,
		},
		{
			name:     "js stack trace",
			input:    "Error: something failed\n    at Object.<anonymous> (/app/index.js:1:1)\n    at Module._compile (node:internal/modules/cjs/loader:1234:14)",
			expected: "Error: something failed\n" + stackTraceRedactedPlaceholder,
		},
		{
			name:     "python stack trace",
			input:    "Traceback (most recent call last):\n  File \"/app/main.py\", line 10, in <module>\n    raise ValueError(\"bad\")",
			expected: "Traceback (most recent call last):\n" + stackTraceRedactedPlaceholder,
		},
		{
			name:     "non stack trace passes through",
			input:    "just a normal log message with no stack",
			expected: "just a normal log message with no stack",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "secret in first line of stack trace is redacted",
			input:    "Error: Bearer abc123\n    at Object.<anonymous> (/app/index.js:1:1)",
			expected: "Error: Bearer [REDACTED]\n" + stackTraceRedactedPlaceholder,
		},
		{
			name:     "single line with no stack trace applies secret sanitization",
			input:    "token: abc123",
			expected: "token: [REDACTED]",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expected, RedactStackTrace(test.input))
		})
	}
}
