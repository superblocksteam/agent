package logfx

import (
	"testing"

	"github.com/spf13/viper"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func verifyOk(t *testing.T) *zap.Logger {
	logger, err := New(ProvideDefaultOptions())
	require.NoError(t, err, "New error unexpected")
	require.NotNil(t, logger, "logger not returned")

	return logger
}

func TestNewOk(t *testing.T) {
	logger := verifyOk(t)

	require.Equal(t, zapcore.InfoLevel, logger.Level(), "default info level is expected")
}

func TestNewOkLevelSetWithViper(t *testing.T) {
	viper.SetDefault("log.level", "error")
	logger := verifyOk(t)

	require.Equal(t, zapcore.ErrorLevel, logger.Level(), "error level is expected")
}
