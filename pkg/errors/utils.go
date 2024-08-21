package errors

import (
	"context"
	"errors"

	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/bufbuild/protovalidate-go"
)

func ToCommonV1(err error) *commonv1.Error {
	if err == nil {
		return nil
	}

	type transformer interface {
		ToCommonV1() *commonv1.Error
	}

	if e, ok := err.(*commonv1.Error); ok {
		return e
	}

	common, ok := err.(transformer)
	if ok {
		return common.ToCommonV1()
	}

	return &commonv1.Error{
		Message: err.Error(),
	}
}

func Logger(logger *zap.Logger, err error) func(string, ...zapcore.Field) {
	if err == nil {
		return func(string, ...zapcore.Field) {}
	}

	type isUserError interface {
		isUserError() bool
	}

	if e, ok := err.(isUserError); ok && e.isUserError() {
		return logger.Warn
	}

	if errors.Is(err, context.Canceled) {
		return logger.Warn
	}

	return logger.Error
}

func IsProtoValidateError(err error) bool {
	if err == nil {
		return false
	}

	var typed *protovalidate.ValidationError
	return errors.As(err, &typed)
}
