package errors

import (
	"errors"

	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

type providerError struct {
	err error
}

func ProviderError(err ...error) error {
	if err == nil {
		return nil
	}

	return &providerError{errors.Join(err...)}
}

func (e *providerError) ToCommonV1() *commonv1.Error {
	return &commonv1.Error{
		Name:    "ProviderError",
		Message: e.err.Error(),
	}
}

func (e *providerError) Error() string {
	if e.err == nil {
		return "ProviderError"
	}

	return "ProviderError: " + e.err.Error()
}

func IsProviderError(err error) bool {
	if err == nil {
		return false
	}

	var typed *providerError
	return errors.As(err, &typed)
}

type cipherError struct {
	err error
}

func CipherError(err ...error) error {
	if err == nil {
		return nil
	}

	return &cipherError{errors.Join(err...)}
}

func (e *cipherError) ToCommonV1() *commonv1.Error {
	return &commonv1.Error{
		Name:    "CipherError",
		Message: e.err.Error(),
	}
}

func (e *cipherError) Error() string {
	if e.err == nil {
		return "CipherError"
	}

	return "CipherError: " + e.err.Error()
}

func IsCipherError(err error) bool {
	if err == nil {
		return false
	}

	var typed *cipherError
	return errors.As(err, &typed)
}

var (
	ErrUnknownProvider   = ProviderError(errors.New("The specified secrets provider is unknown."))
	ErrUnknownAuthMethod = ProviderError(errors.New("The specified auth method is unknown."))
	ErrAuthorization     = ProviderError(errors.New("Could not retrieve secrets due to permission issues."))
	ErrUnknown           = ProviderError(errors.New("Could not retrieve secrets due to an unknown error."))
	ErrCipherDecrypt     = CipherError(errors.New("Could not decrypt secret."))
	ErrCipherEncrypt     = CipherError(errors.New("Could not encrypt secret."))
)
