package resigner

import (
	"errors"

	"github.com/superblocksteam/agent/pkg/crypto/signature"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	"go.uber.org/zap"
)

type ResourceResigner interface {
	Do([]*securityv1.Resource) ([]*securityv1.Resource, error)
}

type resourceResigner struct {
	signer signature.Registry
	logger *zap.Logger
}

func New(signer signature.Registry, logger *zap.Logger) ResourceResigner {
	return &resourceResigner{
		signer: signer,
		logger: logger,
	}
}

func (r *resourceResigner) Do(resources []*securityv1.Resource) ([]*securityv1.Resource, error) {
	updatedResources := make([]*securityv1.Resource, 0, len(resources))

	for _, resource := range resources {
		if err := r.signer.Verify(resource); err != nil {
			return nil, err
		}

		if err := r.signer.SignAndUpdateResource(resource); err != nil {
			if errors.Is(err, sberrors.ErrInternal) {
				return nil, err
			}
			return nil, sberrors.BadRequestError(err)
		}

		// consider making a deep copy in the future if necessary
		updatedResources = append(updatedResources, resource)
	}

	return updatedResources, nil
}
