package secrets

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/crypto/cipher"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/secrets/errors"
	"github.com/superblocksteam/agent/pkg/secrets/options"
	"github.com/superblocksteam/agent/pkg/secrets/providers"
	"github.com/superblocksteam/agent/pkg/secrets/providers/akeylesssecretsmanager"
	"github.com/superblocksteam/agent/pkg/secrets/providers/awssecretsmanager"
	"github.com/superblocksteam/agent/pkg/secrets/providers/gcpsecretmanager"
	"github.com/superblocksteam/agent/pkg/secrets/providers/hashicorpvault"
	"github.com/superblocksteam/agent/pkg/secrets/providers/mock"
	"github.com/superblocksteam/agent/pkg/store"
	kvstore "github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

type Secrets interface {
	List(context.Context, *secretsv1.Store) ([]*secretsv1.Details, error)
	Retrieve(context.Context, []*secretsv1.Store) (map[string]map[string]*string, error)
	Invalidate(context.Context, string, string, ...string) ([]*secretsv1.Invalidation, error)
}

type manager struct {
	cache   store.Store
	options []options.Option
	logger  *zap.Logger
	cipher  cipher.Cipher
}

func Manager(ops ...options.Option) Secrets {
	settings := options.Apply(ops...)

	return &manager{
		options: ops,
		logger:  settings.Logger,
		cache:   settings.Cache,
		cipher:  settings.Cipher,
	}
}

func (m *manager) List(ctx context.Context, store *secretsv1.Store) ([]*secretsv1.Details, error) {
	provider, err := provider(ctx, store, m.options...)
	if err != nil {
		m.logger.Error("failed to create provider", zap.Error(err))
		return nil, err
	}

	defer provider.Close()

	return provider.ListSecrets(ctx)
}

func (m *manager) Invalidate(ctx context.Context, store, configuration string, secrets ...string) (arr []*secretsv1.Invalidation, _ error) {
	orgId := constants.OrganizationID(ctx)

	if orgId == "" {
		m.logger.Error("org id not found in context")
		return nil, sberrors.ErrInternal
	}

	if len(secrets) != 0 {
		var keys []string
		{
			for _, secret := range secrets {
				keys = append(keys, cacheKey(orgId, store, configuration, secret))
				arr = append(arr, &secretsv1.Invalidation{
					Store:           store,
					ConfigurationId: configuration,
					Alias:           secret,
				})
			}
		}

		if err := m.cache.Delete(ctx, keys...); err != nil {
			m.logger.Error("failed to delete from cache", zap.Error(err), zap.Strings("secrets", keys))
			return nil, err
		}

		m.logger.Debug("deleted secrets from cache", zap.Strings("secrets", keys))
		return
	}

	prefix := cacheKeyPrefix(orgId, store, configuration)

	m.logger.Info("scanning for secrets to invalidate", zap.String("prefix", prefix), zap.String("store", store), zap.String("configuration", configuration))

	matches, err := m.cache.Scan(ctx, prefix)
	if err != nil {
		m.logger.Error("failed to scan cache", zap.Error(err))
		return nil, err
	}

	m.logger.Info("found secrets to invalidate", zap.Strings("keys", matches), zap.String("prefix", prefix), zap.String("store", store), zap.String("configuration", configuration))

	for _, match := range matches {
		parts := strings.Split(match, ".")

		if len(parts) != 5 {
			m.logger.Error("invalid cache key", zap.String("key", match))
			return nil, sberrors.ErrInternal
		}

		arr = append(arr, &secretsv1.Invalidation{
			Store:           store,
			ConfigurationId: parts[3],
			Alias:           parts[4],
		})
	}

	if err := m.cache.Delete(ctx, matches...); err != nil {
		m.logger.Error("failed to delete from cache", zap.Error(err), zap.Strings("matches", matches))
		return nil, err
	}

	m.logger.Debug("deleted secrets from cache", zap.Strings("secrets", matches))

	return
}

func (m *manager) Retrieve(ctx context.Context, stores []*secretsv1.Store) (map[string]map[string]*string, error) {
	orgId := constants.OrganizationID(ctx)

	if orgId == "" {
		m.logger.Error("org id not found in context")
		return nil, sberrors.ErrInternal
	}

	results, err := utils.SprayAndCollect[map[string]*string, *secretsv1.Store](stores, func(store *secretsv1.Store) (string, map[string]*string, error) {
		provider, err := tracer.Observe[providers.Provider](ctx, "init.store", map[string]any{
			"store": "secrets",
		}, func(ctx context.Context, span trace.Span) (providers.Provider, error) {
			p, e := provider(ctx, store, m.options...)
			if e != nil {
				return nil, sberrors.IgnorableError(e)
			}

			span.SetAttributes(
				attribute.String("provider", p.Name()),
			)
			return p, nil
		}, nil)
		if err != nil {
			m.logger.Error("failed to create provider", zap.Error(err))
			return store.GetMetadata().GetName(), nil, err
		}

		defer provider.Close()

		values, err := tracer.Observe[map[string]*string](ctx, "get.secrets", map[string]any{
			"provider": provider.Name(),
			"name":     store.GetMetadata().GetName(),
		}, func(ctx context.Context, span trace.Span) (map[string]*string, error) {
			secrets, err := provider.ListSecrets(ctx)
			if err != nil {
				metrics.TrackedErrorsTotal.WithLabelValues(strconv.Itoa(sberrors.CodeSecretsList)).Inc()
				m.logger.Error("could not list secrets", zap.Error(err))
				return nil, sberrors.IgnorableError(err)
			}

			if len(secrets) == 0 {
				return nil, nil
			}

			// Construct the keys we're going to ask the cache for.
			var keys []string
			{
				for _, secret := range secrets {
					keys = append(keys, cacheKey(orgId, store.GetMetadata().GetName(), store.GetConfigurationId(), secret.GetAlias()))
				}
			}

			// Ask the cache if it has the secrets we're looking for.
			results, err := m.cache.Read(ctx, keys...)
			if err != nil || len(results) != len(keys) {
				metrics.TrackedErrorsTotal.WithLabelValues(strconv.Itoa(sberrors.CodeSecretsCacheRead)).Inc()
				m.logger.Error("failed to read from cache", zap.Error(err))
				results = make([]any, len(keys)) // This simulates a cache miss
			}

			var fetch []*secretsv1.Details
			var cached map[string]*string
			{
				for idx, result := range results {
					// This means the cache didn't come up big. We'll need to fetch.
					if result == nil {
						fetch = append(fetch, secrets[idx])
						continue
					}

					// Lazy init.
					if cached == nil {
						cached = map[string]*string{}
					}

					var ciphertext []byte
					{
						if _, ok := result.([]byte); ok {
							ciphertext = result.([]byte)
						} else if _, ok := result.(string); ok {
							ciphertext = []byte(result.(string))
						} else {
							m.logger.Error("unknown ciphertext type")
							continue
						}
					}

					plaintext, err := m.cipher.Decrypt(ciphertext)
					if err != nil {
						metrics.TrackedErrorsTotal.WithLabelValues(strconv.Itoa(sberrors.CodeSecretsCipherDecrypt)).Inc()
						m.logger.Error("failed to decrypt secret", zap.Error(err))
						continue
					}

					// Let's go! We have a cached value.
					cached[secrets[idx].GetAlias()] = proto.String(string(plaintext))
				}
			}

			metrics.SecretsCacheLookupsTotal.WithLabelValues("miss").Add(float64(len(fetch)))
			metrics.SecretsCacheLookupsTotal.WithLabelValues("hit").Add(float64(len(cached)))

			fetched, _ := utils.SprayAndCollect[*string, *secretsv1.Details](fetch, func(secret *secretsv1.Details) (string, *string, error) {
				alias, value, err := provider.GetSecret(ctx, secret)
				if err != nil {
					metrics.TrackedErrorsTotal.WithLabelValues(strconv.Itoa(sberrors.CodeSecretsGet)).Inc()
					return secret.GetAlias(), nil, nil
				}

				return alias, value, nil
			})

			trace.SpanFromContext(ctx).SetAttributes(
				attribute.StringSlice("cached", utils.ObjectKeys[*string](cached)),
				attribute.StringSlice("fetched", utils.ObjectKeys[*string](fetched)),
			)

			// Should we cache the results?
			if store.GetCache() && store.GetTtl() > 0 {
				var pairs []*kvstore.KV
				{
					for key, value := range fetched {
						if value == nil {
							continue
						}

						ciphertext, err := m.cipher.Encrypt([]byte(*value))
						if err != nil {
							metrics.TrackedErrorsTotal.WithLabelValues(strconv.Itoa(sberrors.CodeSecretsCipherEncrypt)).Inc()
							m.logger.Error("failed to encrypt secret", zap.Error(err))
							return nil, errors.ErrCipherEncrypt
						}

						pairs = append(pairs, &kvstore.KV{
							Key:   cacheKey(orgId, store.GetMetadata().GetName(), store.GetConfigurationId(), key),
							Value: ciphertext,
							TTL:   time.Duration(store.GetTtl()) * time.Second,
						})
					}
				}

				// Hydrate the cache.
				if err := m.cache.Write(ctx, pairs...); err != nil {
					m.logger.Error("failed to write to cache", zap.Error(err))
				}
			}

			// Merge the cached and fetched results.
			return utils.MergeMaps[*string](cached, fetched), nil
		}, nil)
		if err != nil {
			m.logger.Error("failed to get secrets", zap.Error(err))
			return store.GetMetadata().GetName(), nil, err
		}

		return store.GetMetadata().GetName(), values, nil
	})

	if err != nil {
		m.logger.Error("failed to retrieve secrets", zap.Error(err))
		// NOTE(frank): We do not want all APIs to start failing is someone
		//              configures an incorrect secrets provider; especially
		//              if it's not in use by this API.
		if _, ok := sberrors.IsIgnorableError(err); !ok {
			return nil, err
		}
	}

	return results, nil
}

func provider(ctx context.Context, store *secretsv1.Store, ops ...options.Option) (providers.Provider, error) {
	switch store.GetProvider().GetConfig().(type) {
	case *secretsv1.Provider_AkeylessSecretsManager:
		return akeylesssecretsmanager.Provider(ctx, store.GetProvider().GetAkeylessSecretsManager(), ops...)
	case *secretsv1.Provider_AwsSecretsManager:
		return awssecretsmanager.Provider(ctx, store.GetProvider().GetAwsSecretsManager(), ops...)
	case *secretsv1.Provider_GcpSecretManager:
		return gcpsecretmanager.Provider(ctx, store.GetProvider().GetGcpSecretManager(), ops...)
	case *secretsv1.Provider_Mock:
		return mock.Provider(ctx, store.GetProvider().GetMock(), ops...)
	case *secretsv1.Provider_HashicorpVault:
		return hashicorpvault.Provider(ctx, store.GetProvider().GetHashicorpVault(), ops...)

	// NOTE(frank): This is where you'd register an additional provider.
	default:
		return nil, errors.ErrUnknownProvider
	}
}

func cacheKeyPrefix(org, store, configuration string) string {
	prefix := fmt.Sprintf("secret.%s.%s.", org, store)

	if configuration != "" {
		prefix += fmt.Sprintf("%s.", configuration)
	}

	return prefix
}

func cacheKey(org, store, configuration, secret string) string {
	return cacheKeyPrefix(org, store, configuration) + secret
}
