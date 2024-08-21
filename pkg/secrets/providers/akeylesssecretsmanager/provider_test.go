package akeylesssecretsmanager

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"testing"

	"github.com/akeylesslabs/akeyless-go/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	sberrors "github.com/superblocksteam/agent/pkg/errors"

	commonv1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

type mock struct {
	mockGetTokenErr                  error
	mockGetSecretValueMap            map[string]any
	mockGetSecretValueErr            error
	mockGetSecretValueHttpResponse   *http.Response
	mockListSecretValuesOutput       akeyless.ListItemsInPathOutput
	mockListSecretValuesErr          error
	mockListSecretValuesHttpResponse *http.Response
}

func (p *mock) GetToken(ctx context.Context, auth *akeyless.Auth) (akeyless.AuthOutput, *http.Response, error) {
	return akeyless.AuthOutput{Token: proto.String("someToken")}, nil, p.mockGetTokenErr
}

func (p *mock) GetSecretValue(ctx context.Context, gsv akeyless.GetSecretValue) (map[string]any, *http.Response, error) {
	return p.mockGetSecretValueMap, p.mockGetSecretValueHttpResponse, p.mockGetSecretValueErr
}

func (p *mock) ListSecretValues(ctx context.Context, listItems akeyless.ListItems) (akeyless.ListItemsInPathOutput, *http.Response, error) {
	return p.mockListSecretValuesOutput, p.mockListSecretValuesHttpResponse, p.mockListSecretValuesErr
}

func TestGetAkeylessAuthFromConfig(t *testing.T) {
	for _, tc := range []struct {
		name              string
		config            *secretsv1.AkeylessSecretsManager
		expectedAccessId  string
		expectedAccessKey string
		expectedEmail     string
		expectedPassword  string
		expectedErr       error
	}{
		{
			name: "api key happy path",
			config: &secretsv1.AkeylessSecretsManager{
				Auth: &commonv1.AkeylessAuth{
					Config: &commonv1.AkeylessAuth_ApiKey_{
						ApiKey: &commonv1.AkeylessAuth_ApiKey{
							AccessId:  "aid",
							AccessKey: "ak",
						},
					},
				},
			},
			expectedAccessId:  "aid",
			expectedAccessKey: "ak",
		},
		{
			name: "email happy path",
			config: &secretsv1.AkeylessSecretsManager{
				Auth: &commonv1.AkeylessAuth{
					Config: &commonv1.AkeylessAuth_Email_{
						Email: &commonv1.AkeylessAuth_Email{
							Email:    "e",
							Password: "p",
						},
					},
				},
			},
			expectedEmail:    "e",
			expectedPassword: "p",
		},
		{
			name:        "unsupported auth type",
			config:      &secretsv1.AkeylessSecretsManager{},
			expectedErr: errors.New("got unsupported auth type"),
		},
	} {

		t.Run(tc.name, func(t *testing.T) {
			actualAuth, err := getAkeylessAuthFromConfig(tc.config)
			require.Equal(t, tc.expectedErr, err)
			if tc.expectedAccessId != "" {
				assert.NotNil(t, tc.expectedAccessId)
				assert.Equal(t, tc.expectedAccessId, *actualAuth.AccessId)
			}
			if tc.expectedAccessKey != "" {
				assert.NotNil(t, tc.expectedAccessKey)
				assert.Equal(t, tc.expectedAccessKey, *actualAuth.AccessKey)
			}
			if tc.expectedEmail != "" {
				assert.NotNil(t, tc.expectedEmail)
				assert.Equal(t, tc.expectedEmail, *actualAuth.AdminEmail)
			}
			if tc.expectedPassword != "" {
				assert.NotNil(t, tc.expectedPassword)
				assert.Equal(t, tc.expectedPassword, *actualAuth.AdminPassword)
			}
		})
	}
}

func TestRefreshToken(t *testing.T) {
	logger := zap.NewNop()
	for _, tc := range []struct {
		name            string
		mockGetTokenErr error
		config          *secretsv1.AkeylessSecretsManager
		expectedToken   string
		expectedErr     error
	}{
		{
			name: "access key happy path",
			config: &secretsv1.AkeylessSecretsManager{
				Auth: &commonv1.AkeylessAuth{
					Config: &commonv1.AkeylessAuth_ApiKey_{}},
			},
			expectedToken: "someToken",
		},
		{
			name: "password happy path",
			config: &secretsv1.AkeylessSecretsManager{
				Auth: &commonv1.AkeylessAuth{
					Config: &commonv1.AkeylessAuth_Email_{}},
			},
			expectedToken: "someToken",
		},
		{
			name:            "get token returns error",
			mockGetTokenErr: errors.New("foo"),
			config: &secretsv1.AkeylessSecretsManager{
				Auth: &commonv1.AkeylessAuth{
					Config: &commonv1.AkeylessAuth_Email_{}},
			},
			expectedErr: fmt.Errorf("authentication failed: %w", errors.New("foo")),
		},
		{
			name: "openapi error",
			config: &secretsv1.AkeylessSecretsManager{
				Auth: &commonv1.AkeylessAuth{
					Config: &commonv1.AkeylessAuth_Email_{}},
			},
			mockGetTokenErr: akeyless.GenericOpenAPIError{},
			expectedErr:     fmt.Errorf("authentication failed: %w", akeyless.GenericOpenAPIError{}),
		},
	} {

		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			provider := &provider{
				akeylessApi: &mock{mockGetTokenErr: tc.mockGetTokenErr},
				config:      tc.config,
				prefix:      "",
				logger:      logger,
			}
			err := provider.refreshToken(ctx)
			require.Equal(t, tc.expectedErr, err)
			assert.Equal(t, tc.expectedToken, provider.currentToken)
		})
	}
}

func TestGetSecret(t *testing.T) {
	logger := zap.NewNop()
	for _, tc := range []struct {
		name                           string
		prefix                         string
		mockGetTokenErr                error
		mockGetSecretValueMap          map[string]any
		mockGetSecretValueErr          error
		mockGetSecretValueHttpResponse *http.Response
		details                        *secretsv1.Details
		expectedAlias                  string
		expectedSecret                 *string
		expectedErr                    error
	}{
		{
			name:                  "get secret happy path",
			mockGetSecretValueMap: map[string]any{"/foo": "bar"},
			details:               &secretsv1.Details{Name: "foo"},
			expectedAlias:         "foo",
			expectedSecret:        proto.String("bar"),
		},
		{
			name:                  "get secret with prefix happy path",
			prefix:                "pre",
			mockGetSecretValueMap: map[string]any{"/pre/foo": "bar"},
			details:               &secretsv1.Details{Name: "foo"},
			expectedAlias:         "foo",
			expectedSecret:        proto.String("bar"),
		},
		{
			name:        "nil details",
			expectedErr: &sberrors.ValidationError{Issues: []error{errors.New("details cannot be nil")}},
		},
		{
			name:                           "cant get secret value",
			mockGetSecretValueErr:          errors.New("foo"),
			mockGetSecretValueHttpResponse: &http.Response{StatusCode: http.StatusBadRequest},
			expectedErr:                    errors.New("foo"),
			details:                        &secretsv1.Details{Name: ""},
		},
		{
			name:        "cant find secret",
			expectedErr: errors.New("could not find secret at path 'foo'"),
			details:     &secretsv1.Details{Name: "foo"},
		},
		{
			name:                  "secret isnt castable to string",
			mockGetSecretValueMap: map[string]any{"/foo": 1},
			expectedErr:           errors.New("expected secret to be a string but it was not"),
			details:               &secretsv1.Details{Name: "foo"},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			// constructor calls normalizePrefix so lets simulate that
			prefix := normalizePrefix(tc.prefix)
			provider := &provider{
				akeylessApi: &mock{
					mockGetTokenErr:                tc.mockGetTokenErr,
					mockGetSecretValueMap:          tc.mockGetSecretValueMap,
					mockGetSecretValueErr:          tc.mockGetSecretValueErr,
					mockGetSecretValueHttpResponse: tc.mockGetSecretValueHttpResponse,
				},
				config: &secretsv1.AkeylessSecretsManager{
					// auth type doesn't matter in the context of this test
					Auth: &commonv1.AkeylessAuth{Config: &commonv1.AkeylessAuth_Email_{}},
				},
				prefix: prefix,
				logger: logger,
			}
			actualAlias, actualSecret, actualErr := provider.GetSecret(ctx, tc.details)
			require.Equal(t, tc.expectedErr, actualErr)
			assert.Equal(t, tc.expectedAlias, actualAlias)
			assert.Equal(t, tc.expectedSecret, actualSecret)
		})
	}
}

func TestListSecrets(t *testing.T) {
	logger := zap.NewNop()
	for _, tc := range []struct {
		name                             string
		prefix                           string
		mockGetTokenErr                  error
		mockListSecretValuesOutput       akeyless.ListItemsInPathOutput
		mockListSecretValuesErr          error
		mockListSecretValuesHttpResponse *http.Response
		expectedDetails                  []*secretsv1.Details
		expectedErr                      error
	}{

		{
			name:            "happy path with 0 secrets",
			expectedDetails: []*secretsv1.Details{},
		},
		{
			name:                       "happy path with 1 secret",
			mockListSecretValuesOutput: akeyless.ListItemsInPathOutput{Items: &[]akeyless.Item{{ItemName: proto.String("foo")}}},
			expectedDetails:            []*secretsv1.Details{{Alias: "foo", Name: "foo"}},
		},
		{
			name: "happy path with many secrets",
			mockListSecretValuesOutput: akeyless.ListItemsInPathOutput{
				Items: &[]akeyless.Item{
					{ItemName: proto.String("foo")},
					{ItemName: proto.String("bar")},
				},
			},
			expectedDetails: []*secretsv1.Details{
				{Alias: "foo", Name: "foo"},
				{Alias: "bar", Name: "bar"},
			},
		},
		{
			name:   "happy path with prefix (single folder, no slashes)",
			prefix: "pre",
			mockListSecretValuesOutput: akeyless.ListItemsInPathOutput{
				Items: &[]akeyless.Item{
					{ItemName: proto.String("/pre/foo")},
					{ItemName: proto.String("/pre/bar")},
				},
			},
			expectedDetails: []*secretsv1.Details{
				{Alias: "foo", Name: "foo"},
				{Alias: "bar", Name: "bar"},
			},
		},
		{
			name:   "happy path with prefix (single folder, leading slash)",
			prefix: "/pre",
			mockListSecretValuesOutput: akeyless.ListItemsInPathOutput{
				Items: &[]akeyless.Item{
					{ItemName: proto.String("/pre/foo")},
					{ItemName: proto.String("/pre/bar")},
				},
			},
			expectedDetails: []*secretsv1.Details{
				{Alias: "foo", Name: "foo"},
				{Alias: "bar", Name: "bar"},
			},
		},
		{
			name:                             "cant list secrets",
			mockListSecretValuesErr:          errors.New("foo"),
			mockListSecretValuesHttpResponse: &http.Response{StatusCode: http.StatusBadRequest},
			expectedErr:                      errors.New("foo"),
			expectedDetails:                  []*secretsv1.Details{},
		},
		{
			name: "item is missing a name",
			mockListSecretValuesOutput: akeyless.ListItemsInPathOutput{
				Items: &[]akeyless.Item{
					{ItemName: proto.String("foo")},
					{},
				},
			},
			expectedDetails: []*secretsv1.Details{
				{Alias: "foo", Name: "foo"},
			},
			expectedErr: errors.New("did not receive an item's name'"),
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			// constructor calls normalizePrefix so lets simulate that
			prefix := normalizePrefix(tc.prefix)
			provider := &provider{
				akeylessApi: &mock{
					mockGetTokenErr:                  tc.mockGetTokenErr,
					mockListSecretValuesOutput:       tc.mockListSecretValuesOutput,
					mockListSecretValuesErr:          tc.mockListSecretValuesErr,
					mockListSecretValuesHttpResponse: tc.mockListSecretValuesHttpResponse,
				},
				config: &secretsv1.AkeylessSecretsManager{
					// auth type doesn't matter in the context of this test
					Auth: &commonv1.AkeylessAuth{Config: &commonv1.AkeylessAuth_Email_{}},
				},
				prefix: prefix,
				logger: logger,
			}
			actualDetails, actualErr := provider.ListSecrets(ctx)
			require.Equal(t, tc.expectedErr, actualErr)
			assert.Equal(t, tc.expectedDetails, actualDetails)
		})
	}
}

func TestName(t *testing.T) {
	provider := &provider{}
	name := provider.Name()
	assert.Equal(t, "akeyless", name)
}

func TestClose(t *testing.T) {
	provider := &provider{}
	err := provider.Close()
	assert.NoError(t, err)
}
