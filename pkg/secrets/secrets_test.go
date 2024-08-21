package secrets

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/crypto/cipher"
	"github.com/superblocksteam/agent/pkg/store"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	pluginscommonv1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

func init() {
	metrics.RegisterMetrics()
}

func TestInvalidate(t *testing.T) {
	for _, test := range []struct {
		name          string
		before, after map[string]string
		store         string
		configuration string
		secrets       []string
		err           bool
		result        []*secretsv1.Invalidation
	}{
		{
			name: "normal",
			before: map[string]string{
				"secret.org-123.mock.c-123.foo": "bar",
			},
			after:         map[string]string{},
			store:         "mock",
			configuration: "c-123",
			secrets: []string{
				"foo",
			},
			result: []*secretsv1.Invalidation{
				{
					Store:           "mock",
					ConfigurationId: "c-123",
					Alias:           "foo",
				},
			},
		},
	} {
		var cache store.Store
		{
			cache = store.Memory()

			for k, v := range test.before {
				assert.NoError(t, cache.Write(context.Background(), store.Pair(k, []byte(v))))
			}
		}

		manager := &manager{
			logger: zap.NewNop(),
			cache:  cache,
			cipher: cipher.Plaintext(),
		}

		result, err := manager.Invalidate(constants.WithOrganizationID(context.Background(), "org-123"), test.store, test.configuration, test.secrets...)

		if test.err {
			assert.Error(t, err)
			return
		}

		assert.NoError(t, err)
		assert.Equal(t, test.result, result)

		for k, v := range test.after {
			value, err := manager.cache.Read(context.Background(), k)

			assert.NoError(t, err)
			assert.Len(t, value, 1)
			assert.NotNil(t, value[0])
			assert.Equal(t, v, string(value[0].([]byte)))
		}
	}
}

func TestRetrieve(t *testing.T) {
	for _, test := range []struct {
		name     string
		stores   []*secretsv1.Store
		expected map[string]map[string]*string
		cache    map[string]string
		cached   bool
		key      string
		err      bool
	}{
		{
			name: "test",
			stores: []*secretsv1.Store{
				{
					Metadata: &commonv1.Metadata{
						Name: "mock",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_Mock{
							Mock: &secretsv1.MockStore{
								Data: map[string]string{
									"foo": "bar",
								},
							},
						},
					},
					ConfigurationId: "c-123",
					Ttl:             proto.Int32(5),
					Cache:           true,
				},
			},
			expected: map[string]map[string]*string{
				"mock": {
					"foo": aws.String("bar"),
				},
			},
			cache: map[string]string{
				"secret.org-123.mock.c-123.foo": "bar",
			},
			cached: true,
			key:    "22f0e749288e8455bd525b12fe857726",
		},
		{
			name: "ignorable error",
			stores: []*secretsv1.Store{
				{
					Metadata: &commonv1.Metadata{
						Name: "mock",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_Mock{
							Mock: &secretsv1.MockStore{
								Data: map[string]string{
									"foo": "bar",
								},
							},
						},
					},
					ConfigurationId: "c-123",
					Ttl:             proto.Int32(5),
					Cache:           true,
				},
				{
					Metadata: &commonv1.Metadata{
						Name: "aws",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_AwsSecretsManager{
							AwsSecretsManager: &secretsv1.AwsSecretsManager{
								Auth: &pluginscommonv1.AwsAuth{
									Config: &pluginscommonv1.AwsAuth_Static_{
										Static: &pluginscommonv1.AwsAuth_Static{
											AccessKeyId:     "foo",
											SecretAccessKey: "bar",
										},
									},
								},
							},
						},
					},
				},
			},
			expected: map[string]map[string]*string{
				"mock": {
					"foo": aws.String("bar"),
				},
				"aws": nil,
			},
			cache: map[string]string{
				"secret.org-123.mock.c-123.foo": "bar",
			},
			cached: true,
			key:    "22f0e749288e8455bd525b12fe857726",
		},
		{
			name: "invalid_cipher_key",
			stores: []*secretsv1.Store{
				{
					Metadata: &commonv1.Metadata{
						Name: "mock",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_Mock{
							Mock: &secretsv1.MockStore{
								Data: map[string]string{
									"foo": "bar",
								},
							},
						},
					},
					Ttl:   proto.Int32(5),
					Cache: true,
				},
			},
			key: "wrong",
			err: true,
		},
		{
			name: "no_ttl",
			stores: []*secretsv1.Store{
				{
					Metadata: &commonv1.Metadata{
						Name: "mock",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_Mock{
							Mock: &secretsv1.MockStore{
								Data: map[string]string{
									"foo": "bar",
								},
							},
						},
					},
					ConfigurationId: "c-123",
				},
			},
			expected: map[string]map[string]*string{
				"mock": {
					"foo": aws.String("bar"),
				},
			},
			cache: map[string]string{
				"secret.org-123.mock.c-123.foo": "bar",
			},
		},
		{
			name: "mixed_ttl",
			stores: []*secretsv1.Store{
				{
					Metadata: &commonv1.Metadata{
						Name: "mock_1",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_Mock{
							Mock: &secretsv1.MockStore{
								Data: map[string]string{
									"foo": "bar",
								},
							},
						},
					},
					ConfigurationId: "c-123",
					Ttl:             proto.Int32(5),
					Cache:           true,
				},
				{
					Metadata: &commonv1.Metadata{
						Name: "mock_2",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_Mock{
							Mock: &secretsv1.MockStore{
								Data: map[string]string{
									"bar": "foo",
								},
							},
						},
					},
					ConfigurationId: "c-123",
				},
			},
			expected: map[string]map[string]*string{
				"mock_1": {
					"foo": aws.String("bar"),
				},
				"mock_2": {
					"bar": aws.String("foo"),
				},
			},
			cache: map[string]string{
				"secret.org-123.mock_1.c-123.foo": "bar",
			},
			key:    "22f0e749288e8455bd525b12fe857726",
			cached: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			manager := &manager{
				logger: zap.NewNop(),
				cache:  store.Memory(),
				cipher: cipher.AES([]byte(test.key)),
			}

			values, err := manager.Retrieve(constants.WithOrganizationID(context.Background(), "org-123"), test.stores)

			if test.err {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)
			assert.Equal(t, test.expected, values)

			for k, v := range test.cache {
				value, err := manager.cache.Read(context.Background(), k)
				assert.NoError(t, err)
				assert.Len(t, value, 1)

				if test.cached {
					plaintext, err := cipher.AES([]byte(test.key)).Decrypt(value[0].([]byte))

					assert.NoError(t, err)
					assert.Equal(t, string(plaintext), v)
				} else {
					assert.Nil(t, value[0])
				}
			}
		})
	}
}

func TestList(t *testing.T) {
	for _, test := range []struct {
		name     string
		store    *secretsv1.Store
		expected []*secretsv1.Details
	}{
		{
			name: "test",
			store: &secretsv1.Store{
				Metadata: &commonv1.Metadata{
					Name: "mock",
				},
				Provider: &secretsv1.Provider{
					Config: &secretsv1.Provider_Mock{
						Mock: &secretsv1.MockStore{
							Data: map[string]string{
								"foo": "bar",
							},
						},
					},
				},
			},
			expected: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			values, err := (&manager{logger: zap.NewNop(), cache: store.Memory()}).List(context.Background(), test.store)

			assert.NoError(t, err)
			assert.Equal(t, test.expected, values)
		})
	}
}
