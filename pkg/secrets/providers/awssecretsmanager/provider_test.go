package awssecretsmanager

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/service/secretsmanager"
	"github.com/aws/aws-sdk-go/service/secretsmanager/secretsmanageriface"
	"github.com/stretchr/testify/assert"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"go.uber.org/zap"
)

type mockSecretsManagerClient struct {
	data map[string]string
	secretsmanageriface.SecretsManagerAPI
}

func (m *mockSecretsManagerClient) GetSecretValueWithContext(_ context.Context, input *secretsmanager.GetSecretValueInput, _ ...request.Option) (*secretsmanager.GetSecretValueOutput, error) {
	if val, ok := m.data[*input.SecretId]; ok {
		return &secretsmanager.GetSecretValueOutput{
			SecretString: &val,
		}, nil
	}

	return nil, awserr.New(secretsmanager.ErrCodeResourceNotFoundException, "do_not_rely_on_the_message", errors.New("do_not_rely_on_the_error"))
}

func (m *mockSecretsManagerClient) ListSecretsWithContext(_ context.Context, input *secretsmanager.ListSecretsInput, _ ...request.Option) (*secretsmanager.ListSecretsOutput, error) {
	var items []*secretsmanager.SecretListEntry
	{
		for name := range m.data {
			items = append(items, &secretsmanager.SecretListEntry{
				Name: aws.String(name),
			})
		}
	}

	return &secretsmanager.ListSecretsOutput{
		SecretList: items,
	}, nil
}

func TestGetSecrets(t *testing.T) {
	for _, test := range []struct {
		name   string
		seed   map[string]string
		secret string
		value  *string
		prefix string
	}{
		{
			name:   "absent",
			seed:   nil,
			secret: "foo",
			value:  nil,
		},
		{
			name:   "present",
			seed:   map[string]string{"foo": "bar"},
			secret: "foo",
			value:  aws.String("bar"),
		},
		{
			name:   "present",
			seed:   map[string]string{"foo": "bar"},
			secret: "foo",
			value:  aws.String("bar"),
		},
		{
			name:   "prefix_1",
			seed:   map[string]string{"/prefix/foo": "bar"},
			secret: "foo",
			prefix: "/prefix/",
			value:  aws.String("bar"),
		},
		{
			name:   "prefix_2",
			seed:   map[string]string{"/prefixfoo": "bar"},
			secret: "foo",
			prefix: "/prefix",
			value:  aws.String("bar"),
		},
	} {
		_, value, err := (&provider{
			client: &mockSecretsManagerClient{
				data: test.seed,
			},
			logger: zap.NewNop(),
			prefix: test.prefix,
		}).GetSecret(context.Background(), &secretsv1.Details{
			Alias: test.secret,
			Name:  test.prefix + test.secret,
		})

		assert.NoError(t, err, test.name)
		assert.Equal(t, test.value, value, test.name)
	}
}

func TestListSecrets(t *testing.T) {
	for _, test := range []struct {
		name     string
		seed     map[string]string
		expected []*secretsv1.Details
	}{
		{
			name: "present",
			seed: map[string]string{
				"foo": "bar",
			},
			expected: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
		},
		{
			name:     "absent",
			seed:     map[string]string{},
			expected: []*secretsv1.Details{},
		},
	} {
		values, err := (&provider{
			client: &mockSecretsManagerClient{
				data: test.seed,
			},
			logger: zap.NewNop(),
		}).ListSecrets(context.Background())

		assert.NoError(t, err, test.name)
		assert.Equal(t, test.expected, values, test.name)
	}
}
