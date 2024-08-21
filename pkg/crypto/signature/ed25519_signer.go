package signature

import (
	"crypto/ed25519"
	"errors"
	"fmt"
	"hash"

	sberrors "github.com/superblocksteam/agent/pkg/errors"
)

type ed25519Signer struct {
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
}

func NewEd25519Signer(keySecret []byte, hashFn hash.Hash) (*ed25519Signer, error) {
	privateKey, publicKey, err := generateEd25519Key(keySecret, hashFn)
	if err != nil {
		return nil, err
	}

	return &ed25519Signer{
		privateKey,
		publicKey,
	}, nil
}

func (s *ed25519Signer) Algorithm() SigningAlgorithm {
	return ED25519
}

func (s *ed25519Signer) PublicKey() []byte {
	publicKeyCopy := make([]byte, len(s.publicKey))
	copy(publicKeyCopy, s.publicKey)
	return publicKeyCopy
}

func (s *ed25519Signer) Sign(payload []byte) ([]byte, error) {
	if payload == nil {
		return nil, &sberrors.ValidationError{Issues: []error{errors.New("payload must be provided to sign")}}
	}

	return ed25519.Sign(s.privateKey, payload), nil
}

func (s *ed25519Signer) Verify(payload, signature []byte) error {
	if !ed25519.Verify(s.publicKey, payload, signature) {
		return SignatureError(errors.New("integrity check failed"))
	}

	return nil
}

func generateEd25519Key(keySecret []byte, hashFn hash.Hash) (ed25519.PrivateKey, ed25519.PublicKey, error) {
	if len(keySecret) == 0 {
		return nil, nil, &sberrors.ValidationError{Issues: []error{errors.New("key secret must be provided to generate public/private key pair")}}
	}
	if hashFn == nil {
		return nil, nil, &sberrors.ValidationError{Issues: []error{errors.New("hash function must be provided to generate public/private key pair")}}
	}

	seed, err := hashPayload(keySecret, hashFn)
	if err != nil {
		return nil, nil, &sberrors.InternalError{Err: fmt.Errorf("failed to hash key secret: %w", err)}
	}

	privateKey := ed25519.NewKeyFromSeed(seed)

	return privateKey, privateKey.Public().(ed25519.PublicKey), nil
}
