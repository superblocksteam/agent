package signature

import (
	"hash"
)

type SigningAlgorithm uint

const (
	UNKNOWN SigningAlgorithm = iota
	HMAC
	ECDSA
	ED25519
)

//go:generate mockery --name=Signature --output . --filename signature_mock.go --inpackage --outpkg signature --structname MockSignature
type Signature interface {
	Algorithm() SigningAlgorithm
	PublicKey() []byte
	Sign(payload []byte) ([]byte, error)
	Verify(payload, signature []byte) error
}

func hashPayload(payload []byte, hashFn hash.Hash) ([]byte, error) {
	_, err := hashFn.Write(payload)
	if err != nil {
		return nil, err
	}

	return hashFn.Sum(nil), nil
}
