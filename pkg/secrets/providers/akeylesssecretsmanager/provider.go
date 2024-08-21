package akeylesssecretsmanager

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/akeylesslabs/akeyless-go/v4"
	"github.com/superblocksteam/agent/pkg/secrets/options"
	"github.com/superblocksteam/agent/pkg/secrets/providers"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"

	sberrors "github.com/superblocksteam/agent/pkg/errors"
)

const (
	// https://github.com/akeylesslabs/akeyless-go/blob/c3387e8b884542073274771cc94eb7c91b31494d/README.md?plain=1#L41
	// https://github.com/akeylesslabs/akeyless-go/blob/c3387e8b884542073274771cc94eb7c91b31494d/README.md?plain=1#L99
	DEFAULT_AKEYLESS_HOST = "https://api.akeyless.io"
)

type akeylessApi interface {
	GetToken(ctx context.Context, auth *akeyless.Auth) (akeyless.AuthOutput, *http.Response, error)
	GetSecretValue(ctx context.Context, gsv akeyless.GetSecretValue) (map[string]any, *http.Response, error)
	ListSecretValues(ctx context.Context, listItems akeyless.ListItems) (akeyless.ListItemsInPathOutput, *http.Response, error)
}

type real struct {
	client *akeyless.APIClient
}

func (p *real) GetToken(ctx context.Context, auth *akeyless.Auth) (akeyless.AuthOutput, *http.Response, error) {
	return p.client.V2Api.Auth(ctx).Body(*auth).Execute()
}

func (p *real) GetSecretValue(ctx context.Context, gsv akeyless.GetSecretValue) (map[string]any, *http.Response, error) {
	return p.client.V2Api.GetSecretValue(ctx).Body(gsv).Execute()
}

func (p *real) ListSecretValues(ctx context.Context, listItems akeyless.ListItems) (akeyless.ListItemsInPathOutput, *http.Response, error) {
	return p.client.V2Api.ListItems(ctx).Body(listItems).Execute()
}

type provider struct {
	config       *secretsv1.AkeylessSecretsManager
	prefix       string
	authBody     *akeyless.Auth
	currentToken string
	logger       *zap.Logger
	mutex        sync.Mutex

	akeylessApi
}

func Provider(ctx context.Context, config *secretsv1.AkeylessSecretsManager, ops ...options.Option) (providers.Provider, error) {
	logger := options.Apply(ops...).Logger.With(zap.String("prefix", config.GetPrefix()))

	host := DEFAULT_AKEYLESS_HOST
	if config != nil && config.Host != nil && *config.Host != "" {
		host = *config.Host
	}

	client := akeyless.NewAPIClient(&akeyless.Configuration{
		Servers: []akeyless.ServerConfiguration{
			{
				URL: host,
			},
		},
	})

	authBody, err := getAkeylessAuthFromConfig(config)
	if err != nil {
		return nil, err
	}

	prefix := normalizePrefix(config.GetPrefix())

	provider := &provider{
		akeylessApi: &real{client: client},
		config:      config,
		prefix:      prefix,
		authBody:    authBody,
		logger:      logger,
	}

	// initial refresh
	err = provider.refreshToken(ctx)
	if err != nil {
		return nil, err
	}

	return provider, nil
}

func (p *provider) refreshToken(ctx context.Context) error {
	authOut, _, err := p.GetToken(ctx, p.authBody)
	if err != nil {
		errMsg := "authentication failed"
		p.logError(errMsg, err)
		return fmt.Errorf("%s: %w", errMsg, err)
	}
	p.mutex.Lock()
	p.currentToken = authOut.GetToken()
	p.mutex.Unlock()
	return nil
}

func (p *provider) logError(msg string, err error) {
	var apiErr akeyless.GenericOpenAPIError
	zapErr := zap.Any("error", err)
	if errors.As(err, &apiErr) {
		zapErr = zap.Any("error", apiErr.Body())
	}
	p.logger.Error(msg, zapErr)
}

func (p *provider) GetSecret(ctx context.Context, details *secretsv1.Details) (string, *string, error) {

	if details == nil {
		return "", nil, &sberrors.ValidationError{Issues: []error{errors.New("details cannot be nil")}}
	}

	p.mutex.Lock()
	token := p.currentToken
	p.mutex.Unlock()

	// add leading slash if needed and prefix to name before retrieving from akeyless
	fullSecretPath := p.prefix + details.Name
	fullSecretPath = normalizeSecretNameToAkeyless(fullSecretPath)

	gsvBody := akeyless.GetSecretValue{
		Names: []string{fullSecretPath},
		Token: proto.String(token),
	}

	gsvOut, _, err := do[map[string]any](ctx, p, func(ctx context.Context, token string) (map[string]any, *http.Response, error) {
		return p.GetSecretValue(ctx, gsvBody)
	}, map[string]any{})

	if err != nil {
		p.logError("could not get secret value", err)
		return "", nil, err
	}

	secret, ok := gsvOut[fullSecretPath]
	if !ok {
		return "", nil, fmt.Errorf("could not find secret at path '%s'", details.Name)
	}

	secretString, ok := secret.(string)
	if !ok {
		return "", nil, errors.New("expected secret to be a string but it was not")
	}

	return details.Name, proto.String(secretString), nil
}

func (p *provider) ListSecrets(ctx context.Context) ([]*secretsv1.Details, error) {

	var filter *string
	{
		if p.prefix != "" {
			filter = proto.String(p.prefix)
		}

	}

	p.mutex.Lock()
	token := p.currentToken
	p.mutex.Unlock()

	var listItems akeyless.ListItemsInPathOutput
	details := []*secretsv1.Details{}
	body := akeyless.ListItems{Filter: filter, Token: proto.String(token), Json: proto.Bool(true)}

	listItems, _, err := do[akeyless.ListItemsInPathOutput](ctx, p, func(ctx context.Context, token string) (akeyless.ListItemsInPathOutput, *http.Response, error) {
		return p.ListSecretValues(ctx, body)
	}, akeyless.ListItemsInPathOutput{})

	if err != nil {
		p.logError("could not list secret values", err)
		return details, err
	}

	if listItems.Items == nil {
		return details, nil
	}

	for _, listItem := range *listItems.Items {
		// NOTE: item name from akeyless will ALWAYS start with a '/'
		if listItem.ItemName == nil {
			return details, errors.New("did not receive an item's name'")
		}
		fullSecretPath := *listItem.ItemName
		secretName := strings.TrimPrefix(fullSecretPath, p.prefix)
		secretName = normalizeSecretNameFromAkeyless(secretName)
		details = append(details, &secretsv1.Details{Alias: secretName, Name: secretName})
	}

	return details, nil
}

func (p *provider) Name() string {
	return "akeyless"
}

func (p *provider) Close() error {
	return nil
}
