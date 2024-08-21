package log

import (
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/superblocksteam/agent/pkg/observability/emitter"
)

type Options struct {
	Level         string
	InitialFields map[string]any
	Emitters      []emitter.Emitter
	Zen           bool
}

func Logger(options *Options) (*zap.Logger, error) {
	level, err := zap.ParseAtomicLevel(options.Level)
	if err != nil {
		return nil, err
	}

	config := zap.NewProductionConfig()
	config.Level = level
	config.InitialFields = options.InitialFields
	config.EncoderConfig.EncodeTime = zapcore.TimeEncoder(func(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
		enc.AppendInt64(t.UnixMilli())
	})
	config.DisableStacktrace = options.Zen

	l, err := config.Build(zap.WrapCore(func(core zapcore.Core) zapcore.Core {
		return zapcore.NewCore(
			&EncoderError{zapcore.NewJSONEncoder(config.EncoderConfig)},
			zapcore.AddSync(os.Stderr),
			core,
		)
	}))
	if err != nil {
		return nil, err
	}

	var initial []zap.Field
	{
		for k, v := range options.InitialFields {
			initial = append(initial, zap.Any(k, v))
		}
	}

	var cores []zapcore.Core
	{
		cores = append(cores, &redacted{l.Core()})

		for _, emitter := range options.Emitters {
			emitter.Logger(l)
			cores = append(cores, (NewCore(emitter)).With(initial))
		}
	}

	return zap.New(
		zapcore.NewTee(cores...),
		zap.AddCaller(),
		zap.AddStacktrace(zapcore.ErrorLevel),
	), nil
}

func Leveled(l *zap.Logger, e error) func(string, ...zapcore.Field) {
	if e == nil {
		return l.Info
	}

	return l.Error
}
