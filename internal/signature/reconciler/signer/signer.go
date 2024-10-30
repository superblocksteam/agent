package signer

import (
	"fmt"

	"go.uber.org/zap"

	"github.com/superblocksteam/agent/internal/signature/reconciler"
	"github.com/superblocksteam/agent/pkg/crypto/signature"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
)

type SignerManager interface {
	SignAndUpdateResource(res *pbsecurity.Resource) error
	Verify(res *pbsecurity.Resource) error

	SigningKeyID() string
	PublicKeys() map[string]signature.PublicKey
}

type signer struct {
	log *zap.Logger
	sm  SignerManager
}

var _ reconciler.Signer = &signer{}

func New(log *zap.Logger, sm SignerManager) *signer {
	return &signer{
		log: log.Named("signing/reconciler/signer"),
		sm:  sm,
	}
}

func (s *signer) SignAndUpdateResource(res *pbsecurity.Resource) error {
	err := s.sm.Verify(res)
	if err != nil {
		return fmt.Errorf("error verifying resource: %w", err)
	}

	if err := s.sm.SignAndUpdateResource(res); err != nil {
		return fmt.Errorf("error signing and updating resource: %w", err)
	}

	return nil
}

func (s *signer) SigningKeyID() string {
	return s.sm.SigningKeyID()
}

func (s *signer) PublicKey() []byte {
	return s.sm.PublicKeys()[s.SigningKeyID()].Value
}

func (s *signer) Algorithm() pbutils.Signature_Algorithm {
	return s.sm.PublicKeys()[s.SigningKeyID()].Algorithm
}
