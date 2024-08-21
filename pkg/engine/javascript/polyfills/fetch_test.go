package polyfills

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	jsutils "github.com/superblocksteam/agent/pkg/engine/javascript/utils"
)

func TestInjectFetch(t *testing.T) {

	// set up an HTTP server to make fetch requests to
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json; utf-8")
		w.Write([]byte(`{"status": true}`))
	}))

	t.Parallel()

	for _, test := range []struct {
		name           string
		functionName   string
		inputParams    []any
		expectedResult any
		expectedError  error
	}{
		{
			name:           "fetch happy path",
			functionName:   "fetch",
			inputParams:    []any{srv.URL},
			expectedResult: `{"status": true}`,
			expectedError:  nil,
		},
	} {

		t.Run(test.name, func(t *testing.T) {
			v8obj, v8iso, v8ctx := injectPolyfill(Fetch)

			result, err := callPolyfillFunctionWithParams(v8obj, v8iso, test.functionName, test.inputParams)
			assert.Equal(t, test.expectedError, err)

			val, err := jsutils.ResolvePromise(context.Background(), v8ctx, result, nil)
			assert.Equal(t, test.expectedError, err)

			stringified, err := val.MarshalJSON()
			assert.NoError(t, err)

			var data map[string]any
			{
				assert.NoError(t, json.Unmarshal(stringified, &data))
			}

			body, ok := data["body"]
			assert.True(t, ok)

			assert.Equal(t, test.expectedResult, body)
		})
	}
}
