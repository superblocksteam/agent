package log

import (
	"reflect"

	"go.uber.org/zap"
	"go.uber.org/zap/buffer"
	"go.uber.org/zap/zapcore"
)

type EncoderError struct {
	zapcore.Encoder
}

func (ee *EncoderError) Clone() zapcore.Encoder {
	return &EncoderError{ee.Encoder.Clone()}
}

func (ee *EncoderError) EncodeEntry(entry zapcore.Entry, fields []zapcore.Field) (*buffer.Buffer, error) {
	for _, field := range fields {
		if field.Key == "error" && field.Type == zapcore.ErrorType {
			err, ok := field.Interface.(error)
			if ok {
				t := reflect.TypeOf(err).String()
				// we use _ instead of . here because datadog tries to treat the key as an object when there's a .
				// and that's an issue because `{error: ..., error.type: ...}` becomes `{error: {type: ...}` which trashes the `error:`
				// can iterate on this approach
				fields = append(fields, zap.String(field.Key+"_type", t))
			}
			break
		}
	}
	return ee.Encoder.EncodeEntry(entry, fields)
}
