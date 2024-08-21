package polyfills

import (
	"errors"

	"testing"

	"github.com/stretchr/testify/assert"
	v8 "rogchap.com/v8go"
)

func TestUtil(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name          string
		inputIsolate  *v8.Isolate
		inputError    error
		expectedValue any
	}{
		{
			name:          "throw happy path",
			inputIsolate:  v8.NewIsolate(),
			inputError:    errors.New("foo"),
			expectedValue: "foo",
		},
	} {

		t.Run(test.name, func(t *testing.T) {
			result := Throw(test.inputIsolate, test.inputError)
			expectedV8Value, err := v8.NewValue(test.inputIsolate, test.expectedValue)
			assert.Nil(t, err)
			assert.Equal(t, expectedV8Value, result)
		})
	}
}
