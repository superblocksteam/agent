package mock

import (
	"context"

	"github.com/superblocksteam/agent/pkg/secrets/options"
	"github.com/superblocksteam/agent/pkg/secrets/providers"
	"github.com/superblocksteam/agent/pkg/utils"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
)

type provider struct {
	data utils.Map[string]
}

func Provider(_ context.Context, config *secretsv1.MockStore, ops ...options.Option) (providers.Provider, error) {
	data := utils.NewMap[string]()

	for k, v := range config.GetData() {
		data.Put(k, v)
	}

	return &provider{data}, nil
}

func (p *provider) GetSecret(ctx context.Context, details *secretsv1.Details) (string, *string, error) {
	value, ok := p.data.Get(details.Name)
	if !ok {
		return "", nil, nil
	}

	return details.Alias, &value, nil
}

func (p *provider) ListSecrets(context.Context) ([]*secretsv1.Details, error) {
	arr := []*secretsv1.Details{}

	for _, key := range p.data.Keys().Contents() {
		arr = append(arr, &secretsv1.Details{
			Name:  key,
			Alias: key,
		})
	}

	return arr, nil
}

func (p *provider) Name() string {
	return "mock"
}

func (p *provider) Close() error {
	return nil
}
