package cipher

type plaintext struct{}

func Plaintext() Cipher {
	return &plaintext{}
}

func (es *plaintext) Encrypt(plaintext []byte) ([]byte, error) {
	return plaintext, nil
}

func (*plaintext) Decrypt(ciphertext []byte) ([]byte, error) {
	return ciphertext, nil
}
