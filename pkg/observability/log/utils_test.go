package log

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

func TestLogrAdapaterEnabled(t *testing.T) {
	assert.True(t, new(LogrAdapter).Enabled(0))
}

func TestLogrAdapaterInfo(t *testing.T) {
	for _, test := range []struct {
		name string
		msg  string
	}{
		{
			name: "no fields",
			msg:  "hello",
		},
	} {
		core, logs := observer.New(zap.DebugLevel)

		t.Run(test.name, func(t *testing.T) {
			(&LogrAdapter{
				Logger: zap.New(core),
			}).Info(0, test.msg)
		})

		assert.Len(t, logs.All(), 1)
		assert.Equal(t, logs.All()[0].Message, test.msg)
		assert.Equal(t, logs.All()[0].Level, zapcore.Level(zap.DebugLevel))
	}
}

func TestLogrAdapaterError(t *testing.T) {
	for _, test := range []struct {
		name string
		msg  string
	}{
		{
			name: "no fields",
			msg:  "hello",
		},
	} {
		core, logs := observer.New(zap.InfoLevel)

		t.Run(test.name, func(t *testing.T) {
			(&LogrAdapter{
				Logger: zap.New(core),
			}).Error(errors.New("uh oh"), test.msg)
		})

		assert.Len(t, logs.All(), 1)

		log := logs.All()[0]
		fields := log.Context

		assert.Len(t, log.Context, 1)
		assert.Equal(t, log.Level, zapcore.Level(zap.ErrorLevel))
		assert.Equal(t, fields[0].Key, "error")
		assert.Equal(t, fields[0].Interface, errors.New("uh oh"))
	}
}

func TestToZapFields(t *testing.T) {
	for _, test := range []struct {
		in  []any
		out []zap.Field
	}{
		{
			out: []zap.Field{},
		},
		{
			in:  []any{"foo", "bar"},
			out: []zap.Field{zap.Any("foo", "bar")},
		},
		{
			in:  []any{5, "bar", "foo", "bar"},
			out: []zap.Field{zap.Any("foo", "bar")},
		},
		{
			in:  []any{5, "bar", "foo", "bar", "frank"},
			out: []zap.Field{zap.Any("foo", "bar")},
		},
	} {
		assert.Equal(t, test.out, toZapFields(test.in...))
	}
}
