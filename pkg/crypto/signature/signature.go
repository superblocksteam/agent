package signature

import (
	"hash"

	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
)

//go:generate mockery --name=Signature --output . --filename signature_mock.go --inpackage --outpkg signature --structname MockSignature
type Signature interface {
	Algorithm() pbutils.Signature_Algorithm
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
