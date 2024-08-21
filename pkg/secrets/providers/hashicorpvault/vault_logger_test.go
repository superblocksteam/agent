package hashicorpvault

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

func TestAddFields_SkipsOddNumberFields(t *testing.T) {
	observedCore, observedLogs := observer.New(zap.DebugLevel)
	observedLogger := zap.New(observedCore)

	expected := observer.LoggedEntry{
		Entry: zapcore.Entry{
			Message: "AddFields called with odd number of arguments, skipping adding fields",
			Level:   zap.WarnLevel,
		},
		Context: []zapcore.Field{
			zap.String("component", "vault"),
		},
	}

	vaultLogger := &vaultLogger{observedLogger}
	retLogger := vaultLogger.AddFields("key1", "value", "key2")

	assert.NotNil(t, retLogger)
	assert.Len(t, observedLogs.All(), 1)

	received := observedLogs.FilterLevelExact(zap.WarnLevel).AllUntimed()
	assert.Len(t, received, 1)
	assert.Equal(t, expected, received[0])
}

func TestLogger_SetsFieldsAndLogs(t *testing.T) {
	testCases := []struct {
		name     string
		level    zapcore.Level
		message  string
		fields   []any
		expected observer.LoggedEntry
	}{
		{
			name:    "Error log",
			level:   zap.ErrorLevel,
			message: "Error message",
			fields:  []any{},
			expected: observer.LoggedEntry{
				Entry: zapcore.Entry{
					Message: "Error message",
					Level:   zap.ErrorLevel,
				},
				Context: []zapcore.Field{
					zap.String("component", "vault"),
				},
			},
		},
		{
			name:    "Error log with fields",
			level:   zap.ErrorLevel,
			message: "Error message",
			fields: []any{
				"key1", "value1",
				"key2", "value2",
			},
			expected: observer.LoggedEntry{
				Entry: zapcore.Entry{
					Message: "Error message",
					Level:   zap.ErrorLevel,
				},
				Context: []zapcore.Field{
					zap.String("component", "vault"),
					zap.String("key1", "value1"),
					zap.String("key2", "value2"),
				},
			},
		},
		{
			name:    "Info log",
			level:   zap.InfoLevel,
			message: "Info message",
			fields:  []any{},
			expected: observer.LoggedEntry{
				Entry: zapcore.Entry{
					Message: "Info message",
					Level:   zap.InfoLevel,
				},
				Context: []zapcore.Field{
					zap.String("component", "vault"),
				},
			},
		},
		{
			name:    "Info log with fields",
			level:   zap.InfoLevel,
			message: "Info message",
			fields: []any{
				"key1", "value1",
				"key2", "value2",
			},
			expected: observer.LoggedEntry{
				Entry: zapcore.Entry{
					Message: "Info message",
					Level:   zap.InfoLevel,
				},
				Context: []zapcore.Field{
					zap.String("component", "vault"),
					zap.String("key1", "value1"),
					zap.String("key2", "value2"),
				},
			},
		},
		{
			name:    "Debug log",
			level:   zap.DebugLevel,
			message: "Debug message",
			fields:  []any{},
			expected: observer.LoggedEntry{
				Entry: zapcore.Entry{
					Message: "Debug message",
					Level:   zap.DebugLevel,
				},
				Context: []zapcore.Field{
					zap.String("component", "vault"),
				},
			},
		},
		{
			name:    "Debug log with fields",
			level:   zap.DebugLevel,
			message: "Debug message",
			fields: []any{
				"key1", "value1",
				"key2", "value2",
			},
			expected: observer.LoggedEntry{
				Entry: zapcore.Entry{
					Message: "Debug message",
					Level:   zap.DebugLevel,
				},
				Context: []zapcore.Field{
					zap.String("component", "vault"),
					zap.String("key1", "value1"),
					zap.String("key2", "value2"),
				},
			},
		},
		{
			name:    "Warning log",
			level:   zap.WarnLevel,
			message: "Warning message",
			fields:  []any{},
			expected: observer.LoggedEntry{
				Entry: zapcore.Entry{
					Message: "Warning message",
					Level:   zap.WarnLevel,
				},
				Context: []zapcore.Field{
					zap.String("component", "vault"),
				},
			},
		},
		{
			name:    "Warning log with fields",
			level:   zap.WarnLevel,
			message: "Warning message",
			fields: []any{
				"key1", "value1",
				"key2", "value2",
			},
			expected: observer.LoggedEntry{
				Entry: zapcore.Entry{
					Message: "Warning message",
					Level:   zap.WarnLevel,
				},
				Context: []zapcore.Field{
					zap.String("component", "vault"),
					zap.String("key1", "value1"),
					zap.String("key2", "value2"),
				},
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			observedCore, observedLogs := observer.New(zap.DebugLevel)
			observedLogger := zap.New(observedCore)

			vaultLogger := &vaultLogger{observedLogger}

			switch tc.level {
			case zap.ErrorLevel:
				vaultLogger.Error(tc.message, tc.fields...)
			case zap.InfoLevel:
				vaultLogger.Info(tc.message, tc.fields...)
			case zap.DebugLevel:
				vaultLogger.Debug(tc.message, tc.fields...)
			case zap.WarnLevel:
				vaultLogger.Warn(tc.message, tc.fields...)
			}

			assert.Len(t, observedLogs.All(), 1)
			received := observedLogs.FilterLevelExact(tc.level).AllUntimed()
			assert.Len(t, received, 1)
			assert.Equal(t, tc.expected, received[0])
		})
	}
}
