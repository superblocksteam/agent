package hashicorpvault

import (
	"github.com/hashicorp/vault-client-go"
	"go.uber.org/zap"
)

type vaultLogger struct {
	*zap.Logger
}

func (v *vaultLogger) AddFields(keysAndValues ...interface{}) *zap.Logger {
	logger := v.Logger.With(zap.String("component", "vault"))

	if len(keysAndValues)%2 == 0 {
		for i := 0; i < len(keysAndValues); i += 2 {
			logger = logger.With(zap.Any(keysAndValues[i].(string), keysAndValues[i+1]))
		}
	} else {
		logger.Warn("AddFields called with odd number of arguments, skipping adding fields")
	}

	return logger
}

func (v *vaultLogger) Error(msg string, keysAndValues ...interface{}) {
	v.AddFields(keysAndValues...).Error(msg)
}

func (v *vaultLogger) Info(msg string, keysAndValues ...interface{}) {
	v.AddFields(keysAndValues...).Info(msg)
}

func (v *vaultLogger) Debug(msg string, keysAndValues ...interface{}) {
	v.AddFields(keysAndValues...).Debug(msg)
}

func (v *vaultLogger) Warn(msg string, keysAndValues ...interface{}) {
	v.AddFields(keysAndValues...).Warn(msg)
}

func WithLogger(logger *zap.Logger) vault.ClientOption {
	return func(cc *vault.ClientConfiguration) error {
		cc.RetryConfiguration.Logger = &vaultLogger{logger}
		return nil
	}
}
