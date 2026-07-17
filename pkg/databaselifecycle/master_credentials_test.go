package databaselifecycle

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
)

type staticCredentialResolver struct {
	value string
}

func (r staticCredentialResolver) Resolve(ctx context.Context, ref, field string) (string, error) {
	return r.value, nil
}

func TestRefMasterCredentialResolverEnforcesAllowedPrefixesAndDecodesDocument(t *testing.T) {
	const allowedARN = "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!managed-cluster"
	resolver := NewRefMasterCredentialResolver(
		func(ctx context.Context) (refresolver.Resolver, error) {
			return staticCredentialResolver{value: `{"username":"cluster_master","password":"transient-password"}`}, nil
		},
		[]string{"arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!managed-"},
	)

	credentials, err := resolver.Resolve(context.Background(), refresolver.Ref{
		Resolver: refresolver.ResolverAWSSecretsManager,
		Ref:      allowedARN,
	})

	require.NoError(t, err)
	require.Equal(t, MasterCredentials{Username: "cluster_master", Password: "transient-password"}, credentials)

	_, err = resolver.Resolve(context.Background(), refresolver.Ref{
		Resolver: refresolver.ResolverAWSSecretsManager,
		Ref:      "arn:aws:secretsmanager:us-east-1:123456789012:secret:other-cluster",
	})
	require.ErrorIs(t, err, refresolver.ErrRefNotAllowed)
}
