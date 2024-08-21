package polyfills

import (
	"bytes"
	"io"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/engine"
)

func TestInjectConsole(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name           string
		functionName   string
		inputParams    []any
		expectedStdOut string
		expectedStdErr string
		expectedError  error
	}{
		{
			name:           "console.log happy path",
			functionName:   "log",
			inputParams:    []any{"foo"},
			expectedStdOut: "foo\n",
			expectedStdErr: "",
			expectedError:  nil,
		},
		{
			name:           "console.info happy path",
			functionName:   "info",
			inputParams:    []any{"foo"},
			expectedStdOut: "foo\n",
			expectedStdErr: "",
			expectedError:  nil,
		},
		{
			name:           "console.debug happy path",
			functionName:   "debug",
			inputParams:    []any{"foo"},
			expectedStdOut: "foo\n",
			expectedStdErr: "",
			expectedError:  nil,
		},
		{
			name:           "console.error happy path",
			functionName:   "error",
			inputParams:    []any{"foo"},
			expectedStdOut: "",
			expectedStdErr: "foo\n",
			expectedError:  nil,
		},
		{
			name:           "console.warn happy path",
			functionName:   "warn",
			inputParams:    []any{"foo"},
			expectedStdOut: "",
			expectedStdErr: "foo\n",
			expectedError:  nil,
		},
	} {

		t.Run(test.name, func(t *testing.T) {
			stdout := &bytes.Buffer{}
			stderr := &bytes.Buffer{}

			polyfillFunc := func() Polyfill {
				return Console(&engine.Console{
					Stderr: stderr,
					Stdout: stdout,
				})
			}

			v8obj, iso, _ := injectPolyfill(polyfillFunc)
			consoleValue, err := v8obj.Get("console")
			assert.Equal(t, test.expectedError, err)

			consoleObj, err := consoleValue.AsObject()
			assert.Equal(t, test.expectedError, err)

			result, err := callPolyfillFunctionWithParams(consoleObj, iso, test.functionName, test.inputParams)
			assert.Equal(t, test.expectedError, err)
			assert.Equal(t, true, result.IsUndefined())

			actualStdout, _ := io.ReadAll(stdout)
			actualStderr, _ := io.ReadAll(stderr)
			assert.Equal(t, test.expectedStdOut, string(actualStdout), test.name)
			assert.Equal(t, test.expectedStdErr, string(actualStderr), test.name)

		})
	}
}
