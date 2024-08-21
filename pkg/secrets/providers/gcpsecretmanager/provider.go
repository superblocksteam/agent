package gcpsecretmanager

import (
	"context"
	e "errors"
	"fmt"
	"regexp"

	secretmanager "cloud.google.com/go/secretmanager/apiv1"
	"cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
	"github.com/googleapis/gax-go/v2/apierror"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/secrets/errors"
	"github.com/superblocksteam/agent/pkg/secrets/options"
	"github.com/superblocksteam/agent/pkg/secrets/providers"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"go.uber.org/zap"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
	"google.golang.org/grpc/codes"
	"google.golang.org/protobuf/proto"
)

type provider struct {
	client    *secretmanager.Client
	logger    *zap.Logger
	projectId string
}

func Provider(ctx context.Context, config *secretsv1.GcpSecretManager, ops ...options.Option) (providers.Provider, error) {
	provider := &provider{
		logger:    options.Apply(ops...).Logger,
		projectId: config.GetProjectId(),
	}

	client, err := secretmanager.NewClient(ctx, option.WithCredentialsJSON(config.GetAuth().GetServiceAccount()))
	if e := provider.handleGcpError(err); e != nil {
		provider.logger.Error("could not create gcp secret manager client", zap.Error(err))
		return nil, e
	}

	provider.client = client

	return provider, nil
}

func (p *provider) GetSecret(ctx context.Context, details *secretsv1.Details) (string, *string, error) {
	resp, err := p.client.AccessSecretVersion(ctx, &secretmanagerpb.AccessSecretVersionRequest{
		Name: details.Name + "/versions/latest",
	})
	if err != nil {
		p.logger.Warn("could not get secret value", zap.String("name", details.Name), zap.Error(err))
		return "", nil, err
	}

	if resp == nil || resp.Payload == nil || resp.Payload.Data == nil {
		return details.Alias, nil, nil
	}

	return details.Alias, proto.String(string(resp.Payload.Data)), nil
}

func (p *provider) ListSecrets(ctx context.Context) ([]*secretsv1.Details, error) {
	values := []*secretsv1.Details{}

	it := p.client.ListSecrets(ctx, &secretmanagerpb.ListSecretsRequest{
		Parent: fmt.Sprintf("projects/%s", p.projectId),
	})

	for {
		secret, err := it.Next()
		if err == iterator.Done {
			break
		}
		if e := p.handleGcpError(err); e != nil {
			p.logger.Error("could not list secrets", zap.Error(e))
			return nil, e
		}

		var token string
		{
			regex, err := regexp.Compile(`projects/\d+/secrets/(.+)`)
			if err != nil {
				return nil, err
			}

			matches := regex.FindStringSubmatch(secret.Name)
			if len(matches) != 2 {
				return nil, errors.ErrUnknown
			}

			token = matches[1]
		}

		values = append(values, &secretsv1.Details{
			Alias: token,
			Name:  secret.Name,
		})
	}

	return values, nil
}

func (p *provider) Name() string {
	return "gcpsecretmanager"
}

func (p *provider) Close() error {
	return p.client.Close()
}

func (p *provider) handleGcpError(err error) error {
	if err == nil {
		return nil
	}

	// NOTE(frank): Google does not have a strongly typed error for this.
	if r, e := regexp.Compile(`missing .* field .*`); e == nil && r.Match([]byte(err.Error())) {
		p.logger.Error("gcp validation error", zap.Error(err))

		return &sberrors.ValidationError{
			Issues: []error{err},
		}
	}

	var ae *apierror.APIError
	if e.As(err, &ae) {
		p.logger.Error("gcp api error", zap.Error(err), zap.String("details", ae.Details().String()), zap.String("code", ae.GRPCStatus().Code().String()))

		if ae.GRPCStatus().Code() == codes.PermissionDenied {
			return errors.ErrAuthorization
		}
	}

	return errors.ProviderError(err)
}
