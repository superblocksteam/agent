package cipher

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestPlaintextEncrypt(t *testing.T) {
	for _, test := range []struct {
		name string
		err  bool
		out  []byte
		in   []byte
	}{
		{
			name: "happy path",
			err:  false,
			out:  []byte("hello world"),
			in:   []byte("hello world"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, err := Plaintext().Encrypt(test.in)

			if test.err {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.out, result)
			}
		})
	}
}

func TestPlaintextDecrypt(t *testing.T) {
	for _, test := range []struct {
		name string
		err  bool
		out  []byte
		in   []byte
	}{
		{
			name: "happy path",
			err:  false,
			out:  []byte("hello world"),
			in:   []byte("hello world"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, err := Plaintext().Decrypt(test.in)

			if test.err {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.out, result)
			}
		})
	}
}
