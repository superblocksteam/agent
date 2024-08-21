package polyfills

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestInjectBase64(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name           string
		functionName   string
		inputParams    []any
		expectedResult string
		expectedError  error
	}{
		{
			name:           "btoa happy path",
			functionName:   "btoa",
			inputParams:    []any{"foo"},
			expectedResult: "Zm9v",
			expectedError:  nil,
		},
		{
			name:           "atob happy path",
			functionName:   "atob",
			inputParams:    []any{"Zm9v"},
			expectedResult: "foo",
			expectedError:  nil,
		},
	} {

		t.Run(test.name, func(t *testing.T) {
			result, err := injectAndCallPolyfillFunction(Base64, test.functionName, test.inputParams)
			assert.Equal(t, test.expectedError, err)
			assert.Equal(t, test.expectedResult, result.String())
		})
	}
}
