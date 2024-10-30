package errors

import (
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	v8 "rogchap.com/v8go"
)

func TestBindingError(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name           string
		err            error
		options        BindingErrorOption
		expectedErrMsg string
	}{
		{
			name:           "happy path",
			err:            errors.New("foo"),
			expectedErrMsg: "foo",
		},
		{
			name:           "v8 js err no options",
			err:            &v8.JSError{Message: "message", Location: "name.js:1:2", StackTrace: "stacktrace"},
			expectedErrMsg: "message",
		},
		{
			name:           "v8 js err valid location include location",
			err:            &v8.JSError{Message: "message", Location: "name.js:1:2", StackTrace: "stacktrace"},
			options:        WithLocation(),
			expectedErrMsg: "Error on line 1:\\nmessage",
		},
		{
			name:           "v8 js err invalid location include location",
			err:            &v8.JSError{Message: "message", Location: "badlocation", StackTrace: "stacktrace"},
			options:        WithLocation(),
			expectedErrMsg: "Error on line ?:\\nmessage",
		},
	} {

		t.Run(test.name, func(t *testing.T) {
			var bindingError error
			if test.options != nil {
				bindingError = BindingError(test.err, test.options)
			} else {
				bindingError = BindingError(test.err)
			}
			assert.Equal(t, test.expectedErrMsg, bindingError.Error())
		})
	}
}

func TestIntegrationError(t *testing.T) {
	for _, test := range []struct {
		name         string
		err          error
		code         v1.Code
		expectedErr  error
		expectedCode v1.Code
	}{
		{
			name:         "happy path, syntax error code",
			err:          errors.New("happy path"),
			code:         v1.Code_CODE_INTEGRATION_SYNTAX,
			expectedErr:  IntegrationError(errors.New("happy path"), v1.Code_CODE_INTEGRATION_SYNTAX),
			expectedCode: v1.Code_CODE_INTEGRATION_SYNTAX,
		},
		{
			name:         "nil error",
			err:          nil,
			code:         v1.Code_CODE_UNSPECIFIED,
			expectedErr:  IntegrationError(nil, v1.Code_CODE_UNSPECIFIED),
			expectedCode: v1.Code_CODE_UNSPECIFIED,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			actualErr := IntegrationError(test.err, test.code)
			expectedIntegrationErr, okExpected := test.expectedErr.(*integrationError)
			actualIntegrationErr, okActual := actualErr.(*integrationError)
			assert.Equal(t, okExpected, true)
			assert.Equal(t, okActual, true)
			assert.Equal(t, expectedIntegrationErr.err, actualIntegrationErr.err)
			assert.Equal(t, test.expectedCode, actualIntegrationErr.Code())
			assert.Equal(t, test.expectedErr, actualErr)
		})
	}
}

func TestIsIntegrationError(t *testing.T) {
	for _, test := range []struct {
		name         string
		err          error
		expectedErr  error
		expectedBool bool
	}{
		{
			name:         "happy path",
			err:          IntegrationError(errors.New("happy path"), v1.Code_CODE_UNSPECIFIED),
			expectedErr:  IntegrationError(errors.New("happy path"), v1.Code_CODE_UNSPECIFIED),
			expectedBool: true,
		},
		{
			name:         "unhappy path, not integration error",
			err:          errors.New("foo"),
			expectedErr:  (*integrationError)(nil),
			expectedBool: false,
		},
		{
			name:         "nil error",
			err:          nil,
			expectedErr:  (*integrationError)(nil),
			expectedBool: false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			actualErr, actualBool := IsIntegrationError(test.err)
			assert.Equal(t, test.expectedErr, actualErr)
			assert.Equal(t, test.expectedBool, actualBool)
		})
	}
}

func TestToIntegrationError(t *testing.T) {
	for _, test := range []struct {
		name        string
		err         error
		expectedErr error
	}{
		{
			name:        "happy path",
			err:         IntegrationError(errors.New("happy path"), v1.Code_CODE_INTEGRATION_SYNTAX),
			expectedErr: IntegrationError(errors.New("happy path"), v1.Code_CODE_INTEGRATION_SYNTAX),
		},
		{
			name:        "unhappy path, not integration error",
			err:         errors.New("unhappy path, not integration error"),
			expectedErr: IntegrationError(errors.New("unhappy path, not integration error"), v1.Code_CODE_UNSPECIFIED),
		},
		{
			name:        "nil error",
			err:         nil,
			expectedErr: nil,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			actualErr := ToIntegrationError(test.err)
			assert.Equal(t, test.expectedErr, actualErr)
		})
	}
}

func TestIsIntegrationOAuthError(t *testing.T) {
	for _, test := range []struct {
		name           string
		err            error
		expectedResult bool
	}{
		{
			name:           "happy path",
			err:            IntegrationOAuthError(),
			expectedResult: true,
		},
		{
			name:           "unhappy path",
			err:            errors.New("foo"),
			expectedResult: false,
		},
		{
			name:           "nil error",
			err:            nil,
			expectedResult: false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expectedResult, IsIntegrationOAuthError(test.err))
		})
	}
}

func TestIntegrationOAuthErrorString(t *testing.T) {
	for _, test := range []struct {
		name           string
		err            error
		expectedResult string
	}{
		{
			name:           "with nested error",
			err:            errors.New("foo"),
			expectedResult: "IntegrationOAuthError: foo",
		},
		{
			name:           "without nested error",
			err:            nil,
			expectedResult: "IntegrationOAuthError",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expectedResult, IntegrationOAuthError(test.err).Error())
		})
	}
}

func TestToCommonV1Error(t *testing.T) {
	for _, test := range []struct {
		name          string
		err           error
		actualName    string
		actualCode    v1.Code
		actualMessage string
	}{
		{
			name:          "happy path, syntax error code",
			err:           IntegrationError(errors.New("happy path"), v1.Code_CODE_INTEGRATION_SYNTAX),
			actualName:    "IntegrationError",
			actualCode:    v1.Code_CODE_INTEGRATION_SYNTAX,
			actualMessage: "happy path",
		},
		{
			name:          "unspecified error code",
			err:           errors.New("unspecified error code"),
			actualName:    "",
			actualCode:    v1.Code_CODE_UNSPECIFIED,
			actualMessage: "unspecified error code",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			actualErr := ToCommonV1(test.err)
			assert.Equal(t, actualErr.Name, test.actualName)
			assert.Equal(t, actualErr.Code, test.actualCode)
			assert.Equal(t, actualErr.Message, test.actualMessage)
		})
	}
}

func TestUnwrapJoined(t *testing.T) {
	for _, testCase := range []struct {
		name         string
		err          error
		expectedErrs []error
	}{
		{
			name:         "no error",
			err:          nil,
			expectedErrs: nil,
		},
		{
			name:         "not wrapped error",
			err:          errors.New("not wrapped error"),
			expectedErrs: nil,
		},
		{
			name:         "wrapped error",
			err:          fmt.Errorf("wrapped: %w", errors.New("not wrapped error")),
			expectedErrs: []error{errors.New("not wrapped error")},
		},
		{
			name:         "joined errors",
			err:          errors.Join(errors.New("error 1"), errors.New("error 2"), errors.New("error 3")),
			expectedErrs: []error{errors.New("error 1"), errors.New("error 2"), errors.New("error 3")},
		},
	} {
		t.Run(testCase.name, func(t *testing.T) {
			assert.Equal(t, testCase.expectedErrs, UnwrapJoined(testCase.err))
		})
	}
}
