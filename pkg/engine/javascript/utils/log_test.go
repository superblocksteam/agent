package utils

import (
	"bytes"
	"io"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLog(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name        string
		message     string
		expectedErr error
	}{
		{
			name:    "happy path",
			message: "foo bar",
		},
	} {

		t.Run(test.name, func(t *testing.T) {
			rw := &bytes.Buffer{}
			err := Log(rw, test.message)
			assert.Equal(t, test.expectedErr, err)

			contents, _ := io.ReadAll(rw)
			assert.Equal(t, test.message, string(contents))
		})
	}
}
