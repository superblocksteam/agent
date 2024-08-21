package hashicorpvault

import (
	context "context"

	vault "github.com/hashicorp/vault-client-go"
	schema "github.com/hashicorp/vault-client-go/schema"
)

//go:generate mockery --name=authClient --output . --filename auth_client_mock.go --outpkg hashicorpvault --structname mockAuthClient
type authClient interface {
	TokenLookUpSelf(context.Context, ...vault.RequestOption) (*vault.Response[map[string]any], error)
	TokenRenewSelf(context.Context, schema.TokenRenewSelfRequest, ...vault.RequestOption) (*vault.Response[map[string]any], error)
}
