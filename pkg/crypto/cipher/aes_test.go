package cipher

import (
	"bytes"
	"crypto/aes"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEncrypt(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		input    []byte
		hasError bool
		key      []byte
	}{
		{
			name:     "empty",
			input:    nil,
			hasError: false,
			key:      []byte("supersecretpassw"),
		},
		{
			name:     "normal",
			input:    []byte("Hello, World!"),
			hasError: false,
			key:      []byte("supersecretpassw"),
		},
		{
			name:     "Just below block size",
			input:    bytes.Repeat([]byte("a"), aes.BlockSize-1),
			key:      []byte("supersecretpassw"),
			hasError: false,
		},
		{
			name:     "Exactly block size",
			input:    bytes.Repeat([]byte("a"), aes.BlockSize),
			hasError: false,
			key:      []byte("supersecretpassw"),
		},
		{
			name:     "Just above block size",
			input:    bytes.Repeat([]byte("a"), aes.BlockSize+1),
			hasError: false,
			key:      []byte("supersecretpassw"),
		},
		{
			name:     "malformed key",
			input:    bytes.Repeat([]byte("a"), aes.BlockSize+1),
			hasError: true,
			key:      []byte(nil),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			cipher := AES(test.key)

			encrypted, err := cipher.Encrypt(test.input)

			if test.hasError {
				assert.NotNil(t, err)
				return
			}

			assert.Nil(t, err)
			assert.False(t, bytes.Equal(test.input, encrypted), "Encrypted output should not match input")
			decrypted, decErr := cipher.Decrypt(encrypted)
			assert.Nil(t, decErr)
			assert.Equal(t, test.input, decrypted)
		})
	}
}

func TestDecrypt(t *testing.T) {
	t.Parallel()

	cipher := AES([]byte("supersecretpassw"))
	ciphertext, err := cipher.Encrypt([]byte("fjdkslafjdksjfksfdjksflsaf"))
	assert.Nil(t, err)

	for _, test := range []struct {
		name     string
		input    []byte
		expected []byte
		err      bool
		key      []byte
	}{
		{
			name:     "normal",
			input:    ciphertext,
			expected: []byte("fjdkslafjdksjfksfdjksflsaf"),
			key:      []byte("supersecretpassw"),
		},
		{
			name:     "Decrypt short invalid data",
			input:    []byte("short"),
			expected: nil,
			err:      true,
			key:      []byte("supersecretpassw"),
		},
		{
			name:     "Corrupt nonce in encrypted data",
			input:    append([]byte("bad!"), ciphertext[4:]...),
			expected: nil,
			err:      true,
			key:      []byte("supersecretpassw"),
		},
		{
			name:     "Corrupt content in encrypted data",
			input:    append(cloneBytes(ciphertext[:4]), []byte("corrupt")...),
			expected: nil,
			err:      true,
			key:      []byte("supersecretpassw"),
		},
		{
			name:     "malformed key",
			input:    append(cloneBytes(ciphertext[:4]), []byte("corrupt")...),
			expected: nil,
			err:      true,
			key:      []byte(nil),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			decrypter := AES(test.key)

			decrypted, err := decrypter.Decrypt(test.input)

			if test.err {
				assert.NotNil(t, err)
				return
			}

			assert.Nil(t, err)
			assert.Equal(t, test.expected, decrypted)
		})
	}
}

func cloneBytes(b []byte) []byte {
	clone := make([]byte, len(b))
	copy(clone, b)
	return clone
}
