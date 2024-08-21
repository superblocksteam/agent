package signature

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

type fakeHash struct {
	Buffer     []byte
	WriteError error
}

func (m *fakeHash) Write(p []byte) (n int, err error) {
	m.Buffer = append(m.Buffer, p...)
	return len(p), m.WriteError
}

func (m *fakeHash) Sum(b []byte) []byte {
	res := make([]byte, len(m.Buffer)+len(b))
	copy(res, m.Buffer)
	copy(res[len(m.Buffer):], b)

	return res
}

func (m *fakeHash) Reset() {
	m.Buffer = []byte{}
}

func (m *fakeHash) Size() int {
	return len(m.Buffer)
}

func (m *fakeHash) BlockSize() int {
	return 32
}

func TestHashPayload(t *testing.T) {
	for _, test := range []struct {
		name     string
		payload  []byte
		expected []byte
		err      bool
	}{
		{
			name:     "valid payload",
			payload:  []byte(`{"one":"two"}`),
			expected: []byte(`{"one":"two"}`),
		},
		{
			name:     "empty payload",
			payload:  []byte{},
			expected: []byte{},
		},
		{
			name:     "nil payload",
			payload:  nil,
			expected: []byte{},
		},
		{
			name:    "write error",
			payload: []byte("Hello, World!"),
			err:     true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			var writeErr error
			if test.err {
				writeErr = errors.New("hash function write error")
			}

			hash := &fakeHash{
				WriteError: writeErr,
			}

			res, err := hashPayload(test.payload, hash)

			if test.err {
				assert.EqualError(t, err, "hash function write error")
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.expected, res)
				assert.Equal(t, string(test.expected), string(hash.Buffer))
			}
		})
	}
}
