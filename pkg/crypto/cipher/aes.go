package cipher

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"io"
)

type aesCipher struct {
	key []byte
}

func AES(key []byte) Cipher {
	return &aesCipher{
		key: key,
	}
}

func (es *aesCipher) Encrypt(plaintext []byte) ([]byte, error) {
	block, err := aes.NewCipher(es.key)
	if err != nil {
		return nil, err
	}

	aesGcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, aesGcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	return aesGcm.Seal(nonce, nonce, plaintext, nil), nil
}

func (es *aesCipher) Decrypt(ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(es.key)
	if err != nil {
		return nil, err
	}

	aesGcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	if len(ciphertext) < aesGcm.NonceSize() {
		return nil, errors.New("ciphertext too short")
	}

	plaintext, err := aesGcm.Open(nil, ciphertext[:aesGcm.NonceSize()], ciphertext[aesGcm.NonceSize():], nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}
