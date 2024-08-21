package hashicorpvault

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/hashicorp/vault-client-go"
	"github.com/hashicorp/vault-client-go/schema"
	"github.com/superblocksteam/agent/pkg/secrets/errors"
	"github.com/superblocksteam/agent/pkg/secrets/options"
	"github.com/superblocksteam/agent/pkg/secrets/providers"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

var (
	timeout = 10 * time.Second
)

type provider struct {
	client      client
	logger      *zap.Logger
	vaultPath   string
	secretsPath string
	version     secretsv1.HashicorpVault_Version
}

func Provider(ctx context.Context, config *secretsv1.HashicorpVault, ops ...options.Option) (providers.Provider, error) {
	provider := &provider{
		logger:      options.Apply(ops...).Logger.With(zap.String("vaultPath", config.GetPath())).With(zap.String("secretsPath", config.GetSecretsPath())),
		vaultPath:   config.GetPath(),
		secretsPath: config.GetSecretsPath(),
		version:     config.GetVersion(),
	}

	// prepare a client with the given base address
	client, err := vault.New(
		vault.WithAddress(config.GetAddress()),
		vault.WithRequestTimeout(timeout),
		WithLoggingTransport(provider.logger),
		WithLogger(provider.logger),
	)

	if err != nil {
		provider.logger.Error("could not create vault client", zap.Error(err))
		return nil, err
	}

	if config.GetNamespace() != "" {
		if err := client.SetNamespace(config.GetNamespace()); err != nil {
			provider.logger.Error("could not set vault namespace", zap.Error(err))
			return nil, err
		}
	}

	var token string
	{
		switch config.GetAuth().Config.(type) {
		case *secretsv1.HashicorpVault_Auth_Token:
			token = config.GetAuth().GetToken()
		case *secretsv1.HashicorpVault_Auth_AppRole_:
			resp, err := client.Auth.AppRoleLogin(
				ctx,
				schema.AppRoleLoginRequest{
					RoleId:   config.Auth.GetAppRole().GetRoleId(),
					SecretId: config.Auth.GetAppRole().GetSecretId(),
				},
			)
			if err != nil {
				provider.logger.Error("could not login with approle", zap.Error(err))
				return nil, err
			}

			token = resp.Auth.ClientToken
		}
	}

	if err := client.SetToken(token); err != nil {
		provider.logger.Error("could not set vault token", zap.Error(err))
		return nil, err
	}

	if err := provider.RefreshToken(ctx, &client.Auth); err != nil {
		provider.logger.Warn("could not refresh token", zap.Error(err))
	}

	provider.client = client

	return provider, nil
}

func (p *provider) RefreshToken(ctx context.Context, auth authClient) error {
	// Fetch token and attempt to renew it
	authToken, err := p.LookupToken(ctx, auth)
	if err != nil {
		return fmt.Errorf("could not lookup token: %w", err)
	}

	if _, err := p.RenewToken(ctx, auth, authToken); err != nil {
		return fmt.Errorf("could not renew token: %w", err)
	}

	return nil
}

func (*provider) LookupToken(ctx context.Context, auth authClient) (map[string]any, error) {
	resp, err := auth.TokenLookUpSelf(ctx)
	if err != nil {
		return nil, err
	}

	if resp == nil {
		return nil, fmt.Errorf("lookup token response was nil")
	}

	return resp.Data, nil
}

func (p *provider) RenewToken(ctx context.Context, auth authClient, token map[string]any) (bool, error) {
	// Check if token is renewable
	if v, ok := token["renewable"].(bool); !ok || !v {
		p.logger.Debug("token is not renewable")
		return false, nil
	}

	// Get ttl used when the token was created
	ttl, ok := token["creation_ttl"].(json.Number)
	if !ok {
		p.logger.Warn("failed to read 'creation_ttl' from token, defaulting to 3600 seconds")
		ttl = json.Number("3600")
	}

	if _, err := auth.TokenRenewSelf(ctx, schema.TokenRenewSelfRequest{Increment: ttl.String()}); err != nil {
		return false, err
	}

	p.logger.Debug("renewed access token")
	return true, nil
}

func (p *provider) GetSecret(ctx context.Context, details *secretsv1.Details) (string, *string, error) {
	// GET SECRETS V1: https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v1#read-secret
	// PATH: /v1/{secret_path}/{path_to_secret}

	// GET SECRETS V2: https://stackoverflow.com/a/65610626/12092703 (NOT LISTED IN DOCS)
	// PATH: /v1/{secret_path}/data/{path_to_secret}

	path, err := p.buildPath("data")
	if err != nil {
		return "", nil, err
	}

	resp, err := p.client.Read(ctx, path+"/"+details.Name)
	if err != nil {
		p.logger.Error("could not read secret", zap.Error(err), zap.String("name", details.Name))
		return details.Alias, nil, nil
	}

	if resp == nil || resp.Data == nil || len(resp.Data) == 0 {
		return details.Alias, nil, nil
	}

	var secret any
	{
		switch p.version {
		case secretsv1.HashicorpVault_VERSION_V2:
			secret = resp.Data["data"]
		case secretsv1.HashicorpVault_VERSION_V1:
			secret = resp.Data
		}
	}

	data, err := json.Marshal(secret)
	if err != nil {
		p.logger.Error("could not marshal secret data", zap.Error(err), zap.String("name", details.Name))
		return "", nil, err
	}

	return details.Alias, proto.String(string(data)), nil
}

func (p *provider) ListSecrets(ctx context.Context) ([]*secretsv1.Details, error) {
	// LIST SECRETS FOR V1: https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v1#list-secrets
	// PATH: /v1/{secret_path}/{path_to_secret} [METHOD MUST BE ‘LIST’]

	// LIST SECRETS FOR V2: https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#list-secrets
	// PATH: /v1/{secret_path}/metadata/{path_to_secret}?list=true

	path, err := p.buildPath("metadata")
	if err != nil {
		return nil, err
	}

	resp, err := p.client.List(ctx, path)
	if err != nil {
		p.logger.Error("could not list secrets", zap.Error(err))

		if vault.IsErrorStatus(err, http.StatusNotFound) {
			return nil, errors.ProviderError(err)
		}

		return nil, err
	}

	if resp == nil || resp.Data == nil {
		p.logger.Warn("response was nil")
		return nil, nil
	}

	keys, ok := resp.Data["keys"].([]any)
	if !ok {
		p.logger.Warn("response did not contain expected keys field")
		return nil, nil
	}

	var secrets []*secretsv1.Details
	{
		for _, name := range keys {
			data, ok := name.(string)
			if !ok {
				p.logger.Warn("key was not a string", zap.Any("key", name))
				continue
			}

			if strings.HasSuffix(data, "/") {
				// NOTE(frank): This indicates that a path resides here but not a secret.
				continue
			}

			secrets = append(secrets, &secretsv1.Details{
				Alias: data,
				Name:  data,
			})
		}
	}

	return secrets, nil
}

func (p *provider) Name() string {
	return "hashicorpvault"
}

func (p *provider) Close() error {
	return nil
}

// Returns a path based off of the version and given token
func (p *provider) buildPath(token string) (string, error) {

	vaultPath := strings.Trim(p.vaultPath, "/")
	secretsPath := strings.Trim(p.secretsPath, "/")

	switch p.version {
	case secretsv1.HashicorpVault_VERSION_V1:
		if secretsPath != "" {
			return fmt.Sprintf("%s/%s", vaultPath, secretsPath), nil
		}
		return vaultPath, nil
	case secretsv1.HashicorpVault_VERSION_V2:
		if secretsPath != "" {
			return fmt.Sprintf("%s/%s/%s", vaultPath, token, secretsPath), nil
		}
		return fmt.Sprintf("%s/%s", vaultPath, token), nil
	default:
		return "", errors.ProviderError(fmt.Errorf("unknown version %s", p.version))
	}
}
