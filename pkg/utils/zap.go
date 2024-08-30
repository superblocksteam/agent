package utils

import (
	"errors"
	"testing"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest"
	"go.uber.org/zap/zaptest/observer"
)

// subset of testing.TB; testing.TB has private method which means its not possible to implement a
// fake for it
type FatalTB interface {
	Fatalf(format string, args ...any)
}

func NewZapTestObservedLogger(tb testing.TB) (*zap.Logger, *observer.ObservedLogs) {
	coreObserver, logs := observer.New(zapcore.DebugLevel)

	// see zaptest.NewLogger implementation
	writer := zaptest.NewTestingWriter(tb)
	zapOptions := []zap.Option{
		// Send zap errors to the same writer and mark the test as failed if
		// that happens.
		zap.ErrorOutput(writer.WithMarkFailed(true)),
	}
	coreTesting := zapcore.NewCore(
		zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig()),
		writer,
		zapcore.DebugLevel,
	)
	core := zapcore.NewTee(coreObserver, coreTesting)
	log := zap.New(core, zapOptions...)

	return log, logs
}

// LogContains returns true if there is at least one log that has the given Message at the given level.
func LogContains(logs *observer.ObservedLogs, level zapcore.Level, msg string) bool {
	found := false
	for _, le := range logs.FilterLevelExact(level).All() {
		if le.Message == msg {
			found = true
			break
		}
	}

	return found
}

// RequireLogContains finds at least one log message that has the given Message at the given level, or fails
// the test if not.
func RequireLogContains(tb FatalTB, logs *observer.ObservedLogs, level zapcore.Level, msg string) {
	if !LogContains(logs, level, msg) {
		tb.Fatalf("failed: logs (level %q) does not contain %q", level.String(), msg)
	}
}

// RequireLogErrorEqual finds at least one log message that has the given zap.Error(err) at the
// given level whose err.Error() is equal to msg.
func RequireLogErrorEqual(tb FatalTB, logs *observer.ObservedLogs, level zapcore.Level, msg string) {
	found := false
	for _, le := range logs.FilterLevelExact(level).All() {
		for _, field := range le.Context {
			if field.Key != "error" {
				continue
			}
			if err, ok := field.Interface.(error); ok && err.Error() == msg {
				found = true
				break
			}
		}
	}

	if !found {
		tb.Fatalf("failed: logs (level %q) does not contain error.Error() %q", level.String(), msg)
	}
}

// RequireLogErrorIs finds at least one log message that has the given zap.Error(err) at the
// given level whose errors.Is(err, expectedErr) is true.
func RequireLogErrorIs(tb FatalTB, logs *observer.ObservedLogs, level zapcore.Level, expectedErr error) {
	found := false
	for _, le := range logs.FilterLevelExact(level).All() {
		for _, field := range le.Context {
			if field.Key != "error" {
				continue
			}
			if err, ok := field.Interface.(error); ok && errors.Is(err, expectedErr) {
				found = true
				break
			}
		}
	}

	if !found {
		tb.Fatalf(
			"failed: logs (level %q) does not contain errors.Is(err, %q)",
			level.String(),
			expectedErr.Error(),
		)
	}
}
