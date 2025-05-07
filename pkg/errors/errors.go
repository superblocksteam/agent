package errors

import (
	"errors"
	"fmt"
	"strings"

	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	v8 "rogchap.com/v8go"
)

const (
	GrpcContextCancelledMsg = "rpc error: code = Canceled desc = context canceled"
)

var (
	ErrAuthorization = AuthorizationError()
	ErrNotFound      = new(NotFoundError)
	ErrInternal      = new(InternalError)
	ErrBadRequest    = BadRequestError()
)

type redisDataCorruptionError struct {
	err error
}

func RedisDataCorruptionError(errs ...error) error {
	return &redisDataCorruptionError{errors.Join(errs...)}
}

func (e *redisDataCorruptionError) Error() string {
	if e.err == nil {
		return "RedisDataCorruptionError"
	}

	return e.err.Error()
}

type RedisInternalError struct{ Err error }

func (e *RedisInternalError) Error() string {
	return e.Err.Error()
}

type bindingError struct {
	err             error
	includeLocation bool
}

func BindingError(err error, options ...BindingErrorOption) error {
	if err == nil {
		return nil
	}

	opts := Apply(options...)

	var message string
	if js, ok := err.(*v8.JSError); ok {
		if opts.includeLocation {
			// parse the line number
			// we expect this format: "{file_name}:{line_number}:{position}"
			// source: https://github.com/rogchap/v8go/blob/master/errors_test.go
			parts := strings.Split(js.Location, ":")
			var lineNum string
			if len(parts) < 2 {
				// TODO: (joey) there's likely a better way to handle this
				lineNum = "?"
			} else {
				lineNum = parts[1]
			}
			message = fmt.Sprintf("Error on line %s:\\n%s", lineNum, js.Message)
		} else {
			message = js.Message
		}
		return &bindingError{errors.New(message), opts.includeLocation}
	}

	return &bindingError{err, opts.includeLocation}
}

func (e *bindingError) ToCommonV1() *commonv1.Error {
	return &commonv1.Error{
		Name:    "BindingError",
		Message: e.err.Error(),
	}
}

func (e *bindingError) Error() string {
	return e.err.Error()
}

func (*bindingError) isUserError() bool {
	return true
}

func IsBindingError(err error) bool {
	if err == nil {
		return false
	}

	var typed *bindingError
	return errors.As(err, &typed)
}

type integrationError struct {
	err  error
	code commonv1.Code
}

func IntegrationError(err error, code commonv1.Code) error {
	return &integrationError{err, code}
}

func (e *integrationError) Error() string {
	return e.err.Error()
}

func (e *integrationError) Code() commonv1.Code {
	return e.code
}

func (*integrationError) isUserError() bool {
	return true
}

func IsIntegrationError(err error) (*integrationError, bool) {
	if err == nil {
		return nil, false
	}

	var typed *integrationError

	if errors.As(err, &typed) {
		return typed, true
	}

	return nil, false
}

func ToIntegrationError(err error) error {
	if err == nil {
		return nil
	}

	if e, ok := err.(*integrationError); ok {
		return e
	} else {
		return IntegrationError(err, commonv1.Code_CODE_UNSPECIFIED)
	}
}

func (e *integrationError) ToCommonV1() *commonv1.Error {
	return &commonv1.Error{
		Name:    "IntegrationError",
		Message: e.err.Error(),
		Code:    e.Code(),
	}
}

type ValidationError struct {
	Issues []error
}

func (e *ValidationError) Is(target error) bool {
	if _, ok := target.(*ValidationError); ok {
		return true
	}

	for _, issue := range e.Issues {
		if errors.Is(issue, target) {
			return true
		}
	}

	return false
}

func (e *ValidationError) Error() string {
	var err error

	for _, issue := range e.Issues {
		err = errors.Join(err, issue)
	}

	return err.Error()
}

func (e *ValidationError) ToCommonV1() *commonv1.Error {
	return &commonv1.Error{
		Name:    "ValidationError",
		Message: e.Error(),
	}
}

func IsValidationError(err error) (*ValidationError, bool) {
	if err == nil {
		return nil, false
	}

	var typed *ValidationError
	if errors.As(err, &typed) {
		return typed, true
	}

	return typed, false
}

type authorizationError struct {
	err error
}

func AuthorizationError(err ...error) error {
	return &authorizationError{errors.Join(err...)}
}

func (e *authorizationError) Error() string {
	if e.err == nil {
		return "AuthorizationError"
	}

	return "AuthorizationError: " + e.err.Error()
}

func IsAuthorizationError(err error) bool {
	if err == nil {
		return false
	}

	var typed *authorizationError
	return errors.As(err, &typed)
}

type integrationOAuthError struct {
	err error
}

func IntegrationOAuthError(err ...error) error {
	return &integrationOAuthError{errors.Join(err...)}
}

func (e *integrationOAuthError) Error() string {
	if e.err == nil {
		return "IntegrationOAuthError"
	}

	return "IntegrationOAuthError: " + e.err.Error()
}

func IsIntegrationOAuthError(err error) bool {
	if err == nil {
		return false
	}

	var typed *integrationOAuthError
	return errors.As(err, &typed)
}

func (e *integrationOAuthError) Is(target error) bool {
	if _, ok := target.(*integrationOAuthError); ok {
		return true
	}
	return errors.Is(e.err, target)
}

type NotFoundError struct{}

func (e *NotFoundError) Error() string {
	return "NotFoundError"
}

// TODO(frank): Switch to function like our other errors.
type InternalError struct {
	Err error
}

func (e *InternalError) Is(target error) bool {
	if _, ok := target.(*InternalError); ok {
		return true
	}
	return errors.Is(e.Err, target)
}

func (e *InternalError) Error() string {
	if e.Err == nil {
		return "InternalError"
	}

	return "InternalError: " + e.Err.Error()
}

type healthCheckError struct {
	msg string
}

func (e *healthCheckError) Error() string {
	return fmt.Sprintf("HealthCheckError: %s", e.msg)
}
func HealthCheckError(msg string) *healthCheckError {
	return &healthCheckError{
		msg: msg,
	}
}
func IsHealthCheckError(err error) bool {
	if err == nil {
		return false
	}
	var typed *healthCheckError
	return errors.As(err, &typed)
}

type ignorableError struct {
	err error
}

func IgnorableError(err error) error {
	return &ignorableError{fmt.Errorf("IgnorableError: %w", err)}
}

func (e *ignorableError) Error() string {
	if e.err == nil {
		return "IgnorableError"
	}

	return e.err.Error()
}

func IsIgnorableError(err error) (error, bool) {
	if err == nil {
		return nil, false
	}

	var typed *ignorableError
	if errors.As(err, &typed) {
		return typed, true
	}

	return err, false
}

type badRequestError struct {
	err error
}

func BadRequestError(err ...error) error {
	return &badRequestError{errors.Join(err...)}
}

func (e *badRequestError) Error() string {
	if e.err == nil {
		return "BadRequestError"
	}

	return "BadRequestError: " + e.err.Error()
}

func IsBadRequestError(err error) bool {
	if err == nil {
		return false
	}

	var typed *badRequestError
	return errors.As(err, &typed)
}

func IsQuotaError(err error) (error, bool) {
	if err == nil {
		return nil, false
	}

	var typed *QuotaError
	if errors.As(err, &typed) {
		return typed, true
	}

	return err, false
}
