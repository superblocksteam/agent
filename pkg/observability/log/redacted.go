package log

import (
	"go.uber.org/zap/zapcore"
)

type redacted struct {
	core zapcore.Core
}

func (c *redacted) With(fields []zapcore.Field) zapcore.Core {
	return &redacted{c.core.With(fields)}
}

func (c *redacted) Check(entry zapcore.Entry, checked *zapcore.CheckedEntry) *zapcore.CheckedEntry {
	if c.Enabled(entry.Level) {
		return checked.AddCore(entry, c)
	}

	return checked
}

func (c *redacted) Write(entry zapcore.Entry, fields []zapcore.Field) error {
	// base case
	if len(fields) == 0 {
		return c.core.Write(entry, nil)
	}

	// base case
	if len(fields) == 1 && fields[0].Key == "remote" {
		return c.core.Write(entry, nil)
	}

	newFields := make([]zapcore.Field, len(fields))
	idx := 0
	for _, field := range fields {
		if field.Key != "remote" {
			newFields[idx] = field
			idx++
		}
	}

	return c.core.Write(entry, newFields[:idx])
}

func (c *redacted) Enabled(level zapcore.Level) bool { return c.core.Enabled(level) }
func (c *redacted) Sync() error                      { return c.core.Sync() }
