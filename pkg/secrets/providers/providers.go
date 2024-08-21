package providers

import (
	"context"

	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
)

type Provider interface {
	GetSecret(context.Context, *secretsv1.Details) (string, *string, error)
	ListSecrets(context.Context) ([]*secretsv1.Details, error)
	Name() string
	Close() error
}
