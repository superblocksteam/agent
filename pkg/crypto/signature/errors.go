package signature

import (
	"errors"

	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type signatureError struct {
	err error
}

func SignatureError(err ...error) error {
	return &signatureError{errors.Join(err...)}
}

func (e *signatureError) ToCommonV1() *commonv1.Error {
	if e.err == nil {
		return nil
	}

	return &commonv1.Error{
		Name:    "SignatureError",
		Message: e.err.Error(),
	}
}

func (e *signatureError) Error() string {
	if e.err == nil {
		return "SignatureError"
	}

	return "SignatureError: " + e.err.Error()
}

func (e *signatureError) GRPCStatus() *status.Status {
	return status.New(codes.FailedPrecondition, e.Error())
}

func IsSignatureError(err error) (error, bool) {
	if err == nil {
		return nil, false
	}

	var typed *signatureError
	if errors.As(err, &typed) {
		return typed, true
	}

	return err, false
}
