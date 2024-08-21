package polyfills

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/store/mock"
)

func TestInjectVariableSet(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name           string
		whitelist      []string
		inputParams    []any
		expectedWrites map[string]string
		expectedError  error
	}{
		{
			name:           "set happy path",
			whitelist:      []string{"foo", "bar"},
			inputParams:    []any{"foo", "bar"},
			expectedWrites: map[string]string{"foo": "\"bar\""},
			expectedError:  nil,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockstore := &mock.Store{}

			mockstore.On("Write", context.Background(), &store.KV{
				Key:   "foo",
				Value: `"bar"`,
				TTL:   24 * time.Hour,
			}).Return(nil)

			polyfillFunc := func() Polyfill {
				return Variable("getFn", "setFn", mockstore, test.whitelist)
			}

			_, err := injectAndCallPolyfillFunction(polyfillFunc, "setFn", test.inputParams)
			assert.Equal(t, test.expectedError, err)

			mockstore.AssertExpectations(t)
		})
	}
}
