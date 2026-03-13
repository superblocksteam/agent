package telemetry

import (
	"encoding/json"
	"fmt"
	"reflect"
	"regexp"
	"strings"

	otellog "go.opentelemetry.io/otel/log"
)

const maxSanitizerDepth = 10

type secretPattern struct {
	pattern     *regexp.Regexp
	replacement string
}

var secretPatterns = []secretPattern{
	{pattern: regexp.MustCompile(`(?i)(\bbearer\s+)[a-zA-Z0-9\-._~+/]+=*`), replacement: `${1}[REDACTED]`},
	{pattern: regexp.MustCompile(`(?i)(\bbasic\s+)\S+`), replacement: `${1}[REDACTED]`},
	{pattern: regexp.MustCompile(`(?i)(\bjwt\s+)[a-zA-Z0-9\-._~+/]+=*`), replacement: `${1}[REDACTED]`},
	{pattern: regexp.MustCompile(`(?i)(\btoken[:\s=]+)[a-zA-Z0-9\-._~+/]+=*`), replacement: `${1}[REDACTED]`},
	{pattern: regexp.MustCompile(`(?i)(\bapi[_\s]?key[:\s=]+)[a-zA-Z0-9\-._~+/]+=*`), replacement: `${1}[REDACTED]`},
	{pattern: regexp.MustCompile(`(?i)(\baccess[_\s]?token[:\s=]+)[a-zA-Z0-9\-._~+/]+=*`), replacement: `${1}[REDACTED]`},
	{pattern: regexp.MustCompile(`(?i)(\brefresh[_\s]?token[:\s=]+)[a-zA-Z0-9\-._~+/]+=*`), replacement: `${1}[REDACTED]`},
	{pattern: regexp.MustCompile(`\b[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\b`), replacement: `[JWT_REDACTED]`},
	{pattern: regexp.MustCompile(`\bsk-[A-Za-z0-9]{48}\b`), replacement: `[OPENAI_KEY_REDACTED]`},
	{pattern: regexp.MustCompile(`\bsk-ant-[A-Za-z0-9-]{32,}\b`), replacement: `[ANTHROPIC_KEY_REDACTED]`},
	{pattern: regexp.MustCompile(`\bAKIA[A-Z0-9]{16}\b`), replacement: `[AWS_KEY_REDACTED]`},
	{pattern: regexp.MustCompile(`\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b`), replacement: `[GITHUB_TOKEN_REDACTED]`},
	{pattern: regexp.MustCompile(`\b(sk|pk)-[a-zA-Z0-9]{32,}\b`), replacement: `[API_KEY_REDACTED]`},
	{pattern: regexp.MustCompile(`(?i)\b(postgres|mysql|mongodb|redis)://[^\s]+:[^\s]+@[^\s]+`), replacement: `[CONNECTION_STRING_REDACTED]`},
	{pattern: regexp.MustCompile(`-----BEGIN\s+(RSA\s+)?(PRIVATE|PUBLIC)\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?(PRIVATE|PUBLIC)\s+KEY-----`), replacement: `[PEM_KEY_REDACTED]`},
}

var secretFields = map[string]struct{}{
	"access_token":  {},
	"accesstoken":   {},
	"api_key":       {},
	"apikey":        {},
	"auth_token":    {},
	"authorization": {},
	"bearer":        {},
	"cookie":        {},
	"credentials":   {},
	"jwt":           {},
	"password":      {},
	"passwd":        {},
	"private_key":   {},
	"privatekey":    {},
	"refresh_token": {},
	"refreshtoken":  {},
	"secret":        {},
	"token":         {},
	"x-api-key":     {},
}

var secretFieldPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(?:^|[._-])password(?:[._-]|$)`),
	regexp.MustCompile(`(?i)(?:^|[._-])passwd(?:[._-]|$)`),
	regexp.MustCompile(`(?i)(?:^|[._-])secret(?:[._-]|$)`),
	regexp.MustCompile(`(?i)(?:^|[._-])private[._-]?key(?:[._-]|$)`),
	regexp.MustCompile(`(?i)(?:^|[._-])token(?:[._-]|$)`),
	regexp.MustCompile(`(?i)(?:^|[._-])jwt(?:[._-]|$)`),
	regexp.MustCompile(`(?i)(?:^|[._-])bearer(?:[._-]|$)`),
	regexp.MustCompile(`(?i)(?:^|[._-])credentials?(?:[._-]|$)`),
	regexp.MustCompile(`(?i)api[._-]?key`),
	regexp.MustCompile(`(?i)x[._-]api[._-]key`),
	regexp.MustCompile(`(?i)auth[._-]token`),
}

var stackTracePatterns = []*regexp.Regexp{
	regexp.MustCompile(`goroutine \d+`),               // Go
	regexp.MustCompile(`(?m)^\s+at `),                 // JS
	regexp.MustCompile(`(?m)^\s+File "`),              // Python
	regexp.MustCompile(`(?m)^\s+at [a-zA-Z]\S*\.\S+`), // Java
}

const stackTraceRedactedPlaceholder = "[STACK TRACE REDACTED - Tier 1 only]"

func IsSecretField(fieldName string) bool {
	lower := strings.ToLower(fieldName)
	if _, ok := secretFields[lower]; ok {
		return true
	}
	for _, pattern := range secretFieldPatterns {
		if pattern.MatchString(lower) {
			return true
		}
	}
	return false
}

func SanitizeLogMessage(message string) string {
	if message == "" {
		return message
	}
	sanitized := message
	for _, p := range secretPatterns {
		sanitized = p.pattern.ReplaceAllString(sanitized, p.replacement)
	}
	return sanitized
}

func containsStackTrace(text string) bool {
	for _, p := range stackTracePatterns {
		if p.MatchString(text) {
			return true
		}
	}
	return false
}

func RedactStackTrace(stack string) string {
	if stack == "" {
		return stack
	}
	if !containsStackTrace(stack) {
		return SanitizeLogMessage(stack)
	}
	lines := strings.SplitN(stack, "\n", 2)
	firstLine := SanitizeLogMessage(lines[0])
	if len(lines) == 1 {
		return firstLine
	}
	return firstLine + "\n" + stackTraceRedactedPlaceholder
}

func SanitizeLogObject(obj any) any {
	return sanitizeAny(obj, 0)
}

func SanitizeLogError(err any) any {
	if err == nil {
		return nil
	}
	if e, ok := err.(error); ok {
		return map[string]any{
			"_sanitized": true,
			"error":      RedactStackTrace(e.Error()),
		}
	}
	sanitized := sanitizeAny(err, 0)
	if m, ok := sanitized.(map[string]any); ok {
		m["_sanitized"] = true
		return m
	}
	return sanitized
}

func SafeJSONString(v any) string {
	if v == nil {
		return "{}"
	}
	if str, ok := v.(string); ok {
		return SanitizeLogMessage(str)
	}
	b, err := json.Marshal(sanitizeAny(v, 0))
	if err != nil {
		return fmt.Sprintf(`{"error":"marshal_failed","message":%q}`, SanitizeLogMessage(err.Error()))
	}
	return string(b)
}

func sanitizeAny(v any, depth int) any {
	if depth > maxSanitizerDepth {
		return "[MAX_DEPTH_REACHED]"
	}

	switch val := v.(type) {
	case nil:
		return nil
	case string:
		return RedactStackTrace(val)
	case []byte:
		return RedactStackTrace(string(val))
	case bool, int, int8, int16, int32, int64, float32, float64, uint, uint8, uint16, uint32, uint64:
		return val
	case []any:
		out := make([]any, 0, len(val))
		for _, item := range val {
			out = append(out, sanitizeAny(item, depth+1))
		}
		return out
	case map[string]any:
		out := make(map[string]any, len(val))
		for k, raw := range val {
			if IsSecretField(k) {
				continue
			}
			out[k] = sanitizeAny(raw, depth+1)
		}
		return out
	default:
		rv := reflect.ValueOf(v)
		switch rv.Kind() {
		case reflect.Slice, reflect.Array:
			out := make([]any, 0, rv.Len())
			for i := 0; i < rv.Len(); i++ {
				out = append(out, sanitizeAny(rv.Index(i).Interface(), depth+1))
			}
			return out
		case reflect.Map:
			if rv.Type().Key().Kind() == reflect.String {
				out := make(map[string]any, rv.Len())
				for _, k := range rv.MapKeys() {
					key := k.String()
					if IsSecretField(key) {
						continue
					}
					out[key] = sanitizeAny(rv.MapIndex(k).Interface(), depth+1)
				}
				return out
			}
		case reflect.Struct:
			// Convert struct to map[string]any via JSON round-trip so secret
			// field filtering applies to struct field names.
			b, err := json.Marshal(v)
			if err == nil {
				var m map[string]any
				if json.Unmarshal(b, &m) == nil {
					return sanitizeAny(m, depth)
				}
			}
		case reflect.Ptr:
			if !rv.IsNil() {
				return sanitizeAny(rv.Elem().Interface(), depth+1)
			}
			return nil
		}
		return val
	}
}

// SanitizeOtelLogValue recursively sanitizes an OTel log value. The transform
// function is applied to every string leaf. Pass nil to use the default
// (RedactStackTrace + SanitizeLogMessage).
func SanitizeOtelLogValue(v otellog.Value, depth int, transform func(string) string) otellog.Value {
	if depth > maxSanitizerDepth {
		return otellog.StringValue("[MAX_DEPTH_REACHED]")
	}
	if transform == nil {
		transform = defaultStringTransform
	}

	switch v.Kind() {
	case otellog.KindString:
		return otellog.StringValue(transform(v.AsString()))
	case otellog.KindBytes:
		return otellog.StringValue(transform(string(v.AsBytes())))
	case otellog.KindSlice:
		items := v.AsSlice()
		out := make([]otellog.Value, 0, len(items))
		for _, item := range items {
			out = append(out, SanitizeOtelLogValue(item, depth+1, transform))
		}
		return otellog.SliceValue(out...)
	case otellog.KindMap:
		kvs := v.AsMap()
		out := make([]otellog.KeyValue, 0, len(kvs))
		for _, kv := range kvs {
			if IsSecretField(kv.Key) {
				continue
			}
			out = append(out, otellog.KeyValue{
				Key:   kv.Key,
				Value: SanitizeOtelLogValue(kv.Value, depth+1, transform),
			})
		}
		return otellog.MapValue(out...)
	default:
		return v
	}
}

func defaultStringTransform(s string) string {
	return RedactStackTrace(s)
}
