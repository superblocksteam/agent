package utils

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

type fakeTB struct {
	failed bool
	tb     testing.TB
}

func newFakeTB(tb testing.TB, expectTestFailure bool) *fakeTB {
	f := &fakeTB{tb: tb}
	tb.Cleanup(func() {
		require.Equal(tb, expectTestFailure, f.failed, "fakeTB did not fail as expected")
	})
	return f
}

func (f *fakeTB) Fatalf(format string, args ...any) {
	f.tb.Logf(format, args...)
	f.failed = true
}

func TestZapTestObservedLogger(t *testing.T) {
	log, logs := NewZapTestObservedLogger(t)
	msg := "hello world"
	log.Info(msg)
	require.Len(t, logs.All(), 1)
	require.Equal(t, msg, logs.All()[0].Entry.Message)
}

func TestZapTestRequireLogContains(t *testing.T) {
	log, logs := NewZapTestObservedLogger(t)
	msg := "hello world"
	log.Info(msg)
	RequireLogContains(t, logs, zap.InfoLevel, msg)
}

func TestZapTestRequireLogContainsMissing(t *testing.T) {
	log, logs := NewZapTestObservedLogger(t)
	log.Info("here", zap.String("else", "else")) // else for coverage
	RequireLogContains(newFakeTB(t, true), logs, zap.InfoLevel, "hello world")
}

func TestZapTestRequireLogErrorEqual(t *testing.T) {
	log, logs := NewZapTestObservedLogger(t)
	err := errors.New("hello world")
	log.Error("error", zap.Error(err))
	RequireLogErrorEqual(t, logs, zap.ErrorLevel, err.Error())
}

func TestZapTestRequireLogErrorEqualMissing(t *testing.T) {
	log, logs := NewZapTestObservedLogger(t)
	err := errors.New("hello world")
	log.Error("error", zap.String("else", "else")) // else for coverage
	RequireLogErrorEqual(newFakeTB(t, true), logs, zap.ErrorLevel, err.Error())
}

func TestZapTestRequireLogErrorIs(t *testing.T) {
	log, logs := NewZapTestObservedLogger(t)
	err := errors.New("hello world")
	log.Error("error", zap.Error(err))
	RequireLogErrorIs(t, logs, zap.ErrorLevel, err)
}

func TestZapTestRequireLogErrorIsMissing(t *testing.T) {
	log, logs := NewZapTestObservedLogger(t)
	err := errors.New("hello world")
	log.Error("error", zap.String("else", "else")) // else for coverage
	RequireLogErrorIs(newFakeTB(t, true), logs, zap.ErrorLevel, err)
}
