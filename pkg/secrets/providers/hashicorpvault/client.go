package hashicorpvault

import (
	"context"

	"github.com/hashicorp/vault-client-go"
)

//go:generate mockery --name=client --output . --filename client_mock.go --outpkg hashicorpvault --structname mockClient
type client interface {
	Read(context.Context, string, ...vault.RequestOption) (*vault.Response[map[string]any], error)
	List(context.Context, string, ...vault.RequestOption) (*vault.Response[map[string]any], error)
}
