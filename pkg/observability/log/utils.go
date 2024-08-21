package log

import (
	"context"

	"github.com/go-logr/logr"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"go.uber.org/zap"
)

// NOTE(frank): https://github.com/grpc-ecosystem/go-grpc-middleware/blob/main/interceptors/logging/examples/zap/example_test.go
func InterceptorLogger(l *zap.Logger) logging.Logger {
	return logging.LoggerFunc(func(ctx context.Context, lvl logging.Level, msg string, fields ...any) {
		f := make([]zap.Field, 0, len(fields)/2)

		for i := 0; i < len(fields); i += 2 {
			key := fields[i]
			value := fields[i+1]

			switch v := value.(type) {
			case string:
				f = append(f, zap.String(key.(string), v))
			case int:
				f = append(f, zap.Int(key.(string), v))
			case bool:
				f = append(f, zap.Bool(key.(string), v))
			default:
				f = append(f, zap.Any(key.(string), v))
			}
		}

		logger := l.WithOptions(
			zap.WithCaller(false),
		).With(f...)

		switch lvl {
		case logging.LevelDebug:
			logger.Debug(msg)
		case logging.LevelInfo:
			logger.Info(msg)
		case logging.LevelWarn:
			logger.Warn(msg)
		case logging.LevelError:
			logger.Error(msg)
		default:
			logger.Info(msg)
		}
	})
}

// LogrAdapter provides an adapter that allows the use of zap as the underlying logger.
type LogrAdapter struct {
	Logger *zap.Logger
}

func (a *LogrAdapter) Init(info logr.RuntimeInfo) {}

func (a *LogrAdapter) Enabled(level int) bool {
	return true
}

func (a *LogrAdapter) Info(level int, msg string, fields ...any) {
	a.Logger.Debug(msg, toZapFields(fields)...)
}

func (a *LogrAdapter) Error(err error, msg string, fields ...any) {
	a.Logger.Error(msg, append([]zap.Field{zap.Error(err)}, toZapFields(fields)...)...)
}

func (a *LogrAdapter) WithValues(fields ...any) logr.LogSink {
	return &LogrAdapter{
		Logger: a.Logger.With(toZapFields(fields)...),
	}
}

func (a *LogrAdapter) WithName(name string) logr.LogSink {
	return &LogrAdapter{
		Logger: a.Logger.Named(name),
	}
}

func toZapFields(kvs ...any) []zap.Field {
	if len(kvs)%2 != 0 {
		kvs = kvs[:len(kvs)-1]
	}

	fields := make([]zap.Field, 0, len(kvs)/2)

	for i := 0; i < len(kvs); i += 2 {
		key, ok := kvs[i].(string)
		if !ok {
			continue
		}

		fields = append(fields, zap.Any(key, kvs[i+1]))
	}

	return fields
}
