package log

import (
	"go.uber.org/zap/zapcore"

	"github.com/superblocksteam/agent/pkg/observability/emitter"
)

type core struct {
	emitter emitter.Emitter
	// This is actually not used as an encoder but just a map of fields.
	// The encoding is done by the emitter itself.
	// The performance concerns are irrelevant of the encoder implementation
	// are irrelevant.
	fields  *zapcore.MapObjectEncoder
	trigger bool
}

func NewCore(emitter emitter.Emitter) zapcore.Core {
	return &core{
		emitter: emitter,
		fields:  zapcore.NewMapObjectEncoder(),
		trigger: false,
	}
}

func (c *core) With(fields []zapcore.Field) zapcore.Core {
	newCore := c.clone()

	for _, field := range fields {
		field.AddTo(newCore.fields)
		if field.Key == c.emitter.Trigger() {
			newCore.trigger = true
		}
	}

	return newCore
}

func (c *core) Check(entry zapcore.Entry, checked *zapcore.CheckedEntry) *zapcore.CheckedEntry {
	if c.Enabled(entry.Level) {
		return checked.AddCore(entry, c)
	}
	return checked
}

func (c *core) Write(entry zapcore.Entry, fields []zapcore.Field) error {
	if !c.emitter.Enabled() {
		return nil
	}

	write := func() bool {
		if c.trigger {
			return true
		}

		for _, field := range fields {
			if field.Key == c.emitter.Trigger() {
				return true
			}
		}

		return false
	}

	// We don't want to encode the log entry unless we absolutly have to.
	if !write() {
		return nil
	}

	// NOTE: This may not be performant at large scale.
	// We need to duplicate the map so that if it's modified we do not
	// alter the values in the child logger itself.
	// This does mean that we need to ensure we are not modifying the values of the map
	// in the emitter.
	var emitterFields *zapcore.MapObjectEncoder
	{
		emitterFields = zapcore.NewMapObjectEncoder()

		for k, v := range c.fields.Fields {
			emitterFields.Fields[k] = v
		}

		for _, field := range fields {
			field.AddTo(emitterFields)
		}
	}

	return c.emitter.Write(entry.Time, entry.Level.String(), entry.Message, emitterFields.Fields)
}

func (c *core) Enabled(level zapcore.Level) bool { return true }
func (c *core) Sync() error                      { return nil }

func (c *core) clone() *core {
	newFields := zapcore.NewMapObjectEncoder()
	for k, v := range c.fields.Fields {
		newFields.Fields[k] = v
	}

	return &core{
		emitter: c.emitter,
		fields:  newFields,
	}
}
