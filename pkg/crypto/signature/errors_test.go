package signature

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

func TestToCommonV1(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		err      error
		expected *commonv1.Error
	}{
		{
			name:     "empty",
			err:      SignatureError(),
			expected: nil,
		},
		{
			name: "normal",
			err:  SignatureError(errors.New("test")),
			expected: &commonv1.Error{
				Name:    "SignatureError",
				Message: "test",
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			se, ok := test.err.(*signatureError)

			assert.True(t, ok)
			assert.Equal(t, test.expected, se.ToCommonV1())
		})
	}
}

func TestError(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		err      error
		expected string
	}{
		{
			name:     "empty",
			err:      SignatureError(),
			expected: "SignatureError",
		},
		{
			name:     "normal",
			err:      SignatureError(errors.New("test")),
			expected: "SignatureError: test",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			se, ok := test.err.(*signatureError)

			assert.True(t, ok)
			assert.Equal(t, test.expected, se.Error())
		})
	}
}

func TestIsSignatureError(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name   string
		err    error
		result error
		ok     bool
	}{
		{
			name:   "empty",
			err:    SignatureError(),
			result: new(signatureError),
			ok:     true,
		},
		{
			name:   "nil",
			err:    nil,
			result: nil,
			ok:     false,
		},
		{
			name:   "nil",
			err:    errors.New("test"),
			result: errors.New("test"),
			ok:     false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, ok := IsSignatureError(test.err)

			assert.Equal(t, test.result, result)
			assert.Equal(t, test.ok, ok)
		})
	}
}
