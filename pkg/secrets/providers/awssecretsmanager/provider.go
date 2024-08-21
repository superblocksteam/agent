package awssecretsmanager

import (
	"context"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/secretsmanager"
	"github.com/aws/aws-sdk-go/service/secretsmanager/secretsmanageriface"
	"github.com/superblocksteam/agent/pkg/secrets/errors"
	"github.com/superblocksteam/agent/pkg/secrets/options"
	"github.com/superblocksteam/agent/pkg/secrets/providers"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"go.uber.org/zap"
)

type provider struct {
	client secretsmanageriface.SecretsManagerAPI
	prefix string
	logger *zap.Logger
}

func Provider(_ context.Context, config *secretsv1.AwsSecretsManager, ops ...options.Option) (providers.Provider, error) {
	logger := options.Apply(ops...).Logger.With(zap.String("prefix", config.GetPrefix()))

	client, err := providers.InitAws[secretsmanager.SecretsManager](secretsmanager.New, config.GetAuth(), ops...)
	if err != nil {
		logger.Error("could not create aws session", zap.Error(err))
		return nil, err
	}

	return &provider{
		client: client,
		prefix: config.GetPrefix(),
		logger: logger,
	}, nil
}

func (p *provider) GetSecret(ctx context.Context, details *secretsv1.Details) (string, *string, error) {
	resp, err := p.client.GetSecretValueWithContext(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(details.Name),
	})
	if err != nil {
		p.logger.Warn("could not get secret value", zap.String("name", details.Name), zap.Error(err))

		if providers.IsAwsAuthError(err) {
			return "", nil, errors.ErrAuthorization
		}

		if aerr, ok := err.(awserr.Error); ok {
			switch aerr.Code() {
			case secretsmanager.ErrCodeResourceNotFoundException:
				return details.Alias, nil, nil
			}
		}

		return "", nil, errors.ErrUnknown
	}

	if resp == nil || resp.SecretString == nil {
		return details.Alias, nil, nil
	}

	return details.Alias, resp.SecretString, nil
}

func (p *provider) ListSecrets(ctx context.Context) ([]*secretsv1.Details, error) {
	arr := []*secretsv1.Details{}

	input := &secretsmanager.ListSecretsInput{
		Filters: []*secretsmanager.Filter{},
	}

	if p.prefix != "" {
		input.Filters = append(input.Filters, &secretsmanager.Filter{
			Key:    aws.String("name"),
			Values: []*string{aws.String(p.prefix)},
		})
	}

	for {
		result, err := p.client.ListSecretsWithContext(ctx, input)
		if err != nil {
			p.logger.Error("could not list secrets", zap.Error(err))

			if providers.IsAwsAuthError(err) {
				return nil, errors.ErrAuthorization
			}

			return nil, err
		}

		for _, secret := range result.SecretList {
			arr = append(arr, &secretsv1.Details{
				Name:  *secret.Name,
				Alias: strings.TrimPrefix(*secret.Name, p.prefix),
			})
		}

		if result.NextToken == nil {
			break
		}

		input.NextToken = result.NextToken
	}

	return arr, nil
}

func (p *provider) Name() string {
	return "awssecretsmanager"
}

func (p *provider) Close() error {
	return nil
}
