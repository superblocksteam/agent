package signer

import (
	"fmt"

	"go.uber.org/zap"

	"github.com/superblocksteam/agent/internal/signature/reconciler"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
)

type SignerManager interface {
	SignAndUpdateResource(res *pbsecurity.Resource) error
	Verify(res *pbsecurity.Resource) error

	SigningKeyID() string
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
