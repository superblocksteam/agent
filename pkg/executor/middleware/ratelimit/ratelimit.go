package ratelimit

import (
	"fmt"
	"strings"
	"time"
)

const (
	UnitsSecond = "seconds"
	UnitsMinute = "minutes"
	UnitsHour   = "hours"
)

type RateLimit struct {
	Value int
	Units string
}

func (r RateLimit) WindowDuration() (time.Duration, error) {
	switch strings.ToLower(strings.TrimSpace(r.Units)) {
	case UnitsSecond:
		return time.Second, nil
	case UnitsMinute:
		return time.Minute, nil
	case UnitsHour:
		return time.Hour, nil
	default:
		return 0, fmt.Errorf("unsupported rate limit units %q", r.Units)
	}
}

func ParseRateLimit(raw map[string]any) (RateLimit, error) {
	parsed := RateLimit{}

	value, ok := raw["value"]
	if !ok {
		return parsed, fmt.Errorf("missing value field")
	}

	switch v := value.(type) {
	case int:
		parsed.Value = v
	case int32:
		parsed.Value = int(v)
	case int64:
		parsed.Value = int(v)
	case float32:
		parsed.Value = int(v)
	case float64:
		parsed.Value = int(v)
	default:
		return parsed, fmt.Errorf("value must be numeric, got %T", value)
	}

	unit, ok := raw["units"].(string)
	if !ok {
		return parsed, fmt.Errorf("units must be a string")
	}

	switch strings.ToLower(strings.TrimSpace(unit)) {
	case "second", "seconds", "sec", "secs", "s":
		parsed.Units = UnitsSecond
	case "minute", "minutes", "min", "mins", "m":
		parsed.Units = UnitsMinute
	case "hour", "hours", "hr", "hrs", "h":
		parsed.Units = UnitsHour
	default:
		return parsed, fmt.Errorf("unsupported units %q", unit)
	}

	return parsed, nil
}
