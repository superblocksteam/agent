package hashicorpvault

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"testing"

	"github.com/hashicorp/vault-client-go"
	"github.com/hashicorp/vault-client-go/schema"
	"github.com/stretchr/testify/assert"
	mock "github.com/stretchr/testify/mock"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

func TestRefreshToken(t *testing.T) {
	for _, test := range []struct {
		name      string
		cancelCtx bool
		tokenResp *vault.Response[map[string]any]
		lookupErr error
		renewErr  error
		expected  error
	}{
		{
			name: "refresh token succeeds",
			tokenResp: &vault.Response[map[string]any]{
				Data: map[string]any{
					"renewable": true,
				},
			},
			expected: nil,
		},
		{
			name:      "refresh token succeeds with canceled context",
			cancelCtx: true,
			tokenResp: &vault.Response[map[string]any]{
				Data: map[string]any{
					"renewable": true,
				},
			},
			expected: nil,
		},
		{
			name:      "lookup token fails",
			lookupErr: errors.New("403: permission denied"),
			expected:  fmt.Errorf("could not lookup token: %w", errors.New("403: permission denied")),
		},
		{
			name: "renew token fails",
			tokenResp: &vault.Response[map[string]any]{
				Data: map[string]any{
					"renewable": true,
				},
			},
			renewErr: errors.New("403: bad token"),
			expected: fmt.Errorf("could not renew token: %w", errors.New("403: bad token")),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			anyCtx := context.Background()
			if test.cancelCtx {
				var cancelFunc context.CancelFunc
				anyCtx, cancelFunc = context.WithCancel(anyCtx)
				cancelFunc()
			}

			authClient := &mockAuthClient{}
			authClient.On("TokenLookUpSelf", anyCtx).Return(test.tokenResp, test.lookupErr)
			authClient.On("TokenRenewSelf", anyCtx, mock.Anything).Return(nil, test.renewErr)

			provider := &provider{
				logger: zap.NewNop(),
			}

			err := provider.RefreshToken(anyCtx, authClient)

			assert.Equal(t, test.expected, err)
		})
	}
}

func TestLookupToken(t *testing.T) {
	for _, test := range []struct {
		name        string
		cancelCtx   bool
		response    *vault.Response[map[string]any]
		err         error
		expected    map[string]any
		expectedErr error
	}{
		{
			name: "success",
			response: &vault.Response[map[string]any]{
				Data: map[string]any{
					"token":   "bar",
					"success": true,
				},
			},
			expected: map[string]any{
				"token":   "bar",
				"success": true,
			},
			err: nil,
		},
		{
			name:      "success with canceled context",
			cancelCtx: true,
			response: &vault.Response[map[string]any]{
				Data: map[string]any{
					"token":   "bar",
					"success": true,
				},
			},
			expected: map[string]any{
				"token":   "bar",
				"success": true,
			},
			err: nil,
		},
		{
			name:        "lookup error",
			err:         errors.New("403: permission denied"),
			expectedErr: errors.New("403: permission denied"),
		},
		{
			name:        "nil response",
			expectedErr: errors.New("lookup token response was nil"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			anyCtx := context.Background()
			if test.cancelCtx {
				var cancelFunc context.CancelFunc
				anyCtx, cancelFunc = context.WithCancel(anyCtx)
				cancelFunc()
			}

			authClient := &mockAuthClient{}
			authClient.On("TokenLookUpSelf", anyCtx).Return(test.response, test.err)

			provider := &provider{
				logger: zap.NewNop(),
			}

			tokenData, err := provider.LookupToken(anyCtx, authClient)

			assert.Equal(t, test.expected, tokenData)
			assert.Equal(t, test.expectedErr, err)
		})
	}
}

func TestRenewToken(t *testing.T) {
	for _, test := range []struct {
		name        string
		cancelCtx   bool
		tokenData   map[string]any
		renewErr    error
		expected    bool
		expectedErr error
		expectedTtl string
	}{
		{
			name: "successfully renewed token",
			tokenData: map[string]any{
				"renewable":    true,
				"creation_ttl": json.Number("300"),
			},
			expected:    true,
			expectedTtl: "300",
		},
		{
			name:      "successfully renewed token with canceled context",
			cancelCtx: true,
			tokenData: map[string]any{
				"renewable":    true,
				"creation_ttl": json.Number("300"),
			},
			expected:    true,
			expectedTtl: "300",
		},
		{
			name: "token is not renewable",
			tokenData: map[string]any{
				"renewable": false,
			},
			expected: false,
		},
		{
			name:      "token missing renewable attribute",
			tokenData: map[string]any{},
			expected:  false,
		},
		{
			name: "missing creation ttl default to 3600",
			tokenData: map[string]any{
				"renewable": true,
			},
			expected:    true,
			expectedTtl: "3600",
		},
		{
			name: "renew token fails",
			tokenData: map[string]any{
				"renewable":    true,
				"creation_ttl": json.Number("600"),
			},
			renewErr:    errors.New("403: bad token"),
			expected:    false,
			expectedErr: errors.New("403: bad token"),
			expectedTtl: "600",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			anyCtx := context.Background()
			if test.cancelCtx {
				var cancelFunc context.CancelFunc
				anyCtx, cancelFunc = context.WithCancel(anyCtx)
				cancelFunc()
			}

			authClient := &mockAuthClient{}
			authClient.On("TokenRenewSelf", anyCtx, schema.TokenRenewSelfRequest{Increment: test.expectedTtl}).Return(nil, test.renewErr)

			provider := &provider{
				logger: zap.NewNop(),
			}

			renewed, err := provider.RenewToken(anyCtx, authClient, test.tokenData)

			assert.Equal(t, test.expected, renewed)
			assert.Equal(t, test.expectedErr, err)
		})
	}
}

func TestListSecrets(t *testing.T) {
	for _, test := range []struct {
		name        string
		details     []*secretsv1.Details
		version     secretsv1.HashicorpVault_Version
		vaultPath   string
		secretsPath string
		parameter   string
		err         bool
		response    []any
	}{
		{
			name: "v1 with only vault path (no slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath: "my_path",
			parameter: "my_path",
			err:       false,
		},
		{
			name: "v1 with only vault path (slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath: "my_path/with/slashes",
			parameter: "my_path/with/slashes",
			err:       false,
		},
		{
			name: "v1 with vault path (no slashes) and secrets path (no slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath:   "my_path",
			secretsPath: "sec_path",
			parameter:   "my_path/sec_path",
			err:         false,
		},
		{
			name: "v1 with vault path (slashes) and secrets path (no slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath:   "my_path/with/slashes",
			secretsPath: "sec_path",
			parameter:   "my_path/with/slashes/sec_path",
			err:         false,
		},
		{
			name: "v1 with vault path (no slashes) and secrets path (slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath:   "my_path",
			secretsPath: "sec_path/with/slashes",
			parameter:   "my_path/sec_path/with/slashes",
			err:         false,
		},
		{
			name: "v1 with vault path (slashes) and secrets path (slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath:   "my_path/with/slashes",
			secretsPath: "sec_path/with/slashes",
			parameter:   "my_path/with/slashes/sec_path/with/slashes",
			err:         false,
		},
		{
			name: "v2 with only vault path (no slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V2,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath: "my_path",
			parameter: "my_path/metadata",
			err:       false,
		},
		{
			name: "v2 with only vault path (slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V2,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath: "my_path/with/slashes",
			parameter: "my_path/with/slashes/metadata",
			err:       false,
		},
		{
			name: "v2 with vault path (no slashes) and secrets path (no slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V2,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath:   "my_path",
			secretsPath: "sec_path",
			parameter:   "my_path/metadata/sec_path",
			err:         false,
		},
		{
			name: "v2 with vault path (slashes) and secrets path (no slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V2,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath:   "my_path/with/slashes",
			secretsPath: "sec_path",
			parameter:   "my_path/with/slashes/metadata/sec_path",
			err:         false,
		},
		{
			name: "v2 with vault path (slashes) and secrets path (no slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V2,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath:   "my_path/with/slashes",
			secretsPath: "sec_path",
			parameter:   "my_path/with/slashes/metadata/sec_path",
			err:         false,
		},
		{
			name: "v2 with vault path (no slashes) and secrets path (slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V2,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath:   "my_path",
			secretsPath: "sec_path/with/slashes",
			parameter:   "my_path/metadata/sec_path/with/slashes",
			err:         false,
		},
		{
			name: "v2 with vault path (slashes) and secrets path (slashes)",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V2,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo"},
					},
				},
				nil,
			},
			vaultPath:   "my_path/with/slashes",
			secretsPath: "sec_path/with/slashes",
			parameter:   "my_path/with/slashes/metadata/sec_path/with/slashes",
			err:         false,
		},
		{
			name: "with other tree roots",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo", "bar/"},
					},
				},
				nil,
			},
			err: false,
		},
		{
			name:    "malformed version",
			details: nil,
			version: secretsv1.HashicorpVault_Version(5),
			response: []any{
				&vault.Response[map[string]any]{},
				nil,
			},
			err: true,
		},
		{
			name: "with malformed keys",
			details: []*secretsv1.Details{
				{
					Name:  "foo",
					Alias: "foo",
				},
			},
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"keys": []any{"foo", "bar/", 5},
					},
				},
				nil,
			},
			err: false,
		},
		{
			name:    "malformed client response (wrong response key)",
			details: nil,
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"frank": []any{"foo"},
					},
				},
				nil,
			},
			err: false,
		},
		{
			name:    "malformed client response",
			details: nil,
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				&vault.Response[map[string]any]{},
				nil,
			},
			err: false,
		},
		{
			name:    "client error (not found)",
			details: nil,
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				nil,
				&vault.ResponseError{
					StatusCode: http.StatusNotFound,
				},
			},
			err: true,
		},
		{
			name:    "client error",
			details: nil,
			version: secretsv1.HashicorpVault_VERSION_V1,
			response: []any{
				nil,
				errors.New("client error"),
			},
			err: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			client := &mockClient{}
			client.On("List", mock.Anything, mock.Anything).Return(test.response...)

			provider := &provider{
				client:      client,
				logger:      zap.NewNop(),
				version:     test.version,
				vaultPath:   test.vaultPath,
				secretsPath: test.secretsPath,
			}

			details, err := provider.ListSecrets(context.Background())

			if test.err {
				assert.Error(t, err)
				return
			}

			client.AssertExpectations(t)

			assert.NoError(t, err)
			assert.Equal(t, 1, len(client.Calls))
			assert.Equal(t, test.parameter, client.Calls[0].Arguments.Get(1).(string))
			assert.Equal(t, test.details, details)
		})
	}
}

func TestGetSecret(t *testing.T) {
	for _, test := range []struct {
		name                  string
		details               *secretsv1.Details
		expectedAlias         string
		expectedValue         *string
		vaultPath             string
		secretsPath           string
		parameter             string
		engineVersion         secretsv1.HashicorpVault_Version
		expectError           bool
		mockGetSecretResponse []any
	}{
		{
			name:        "v1 with only vault path (no slashes)",
			vaultPath:   "vault_path",
			secretsPath: "",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V1,
			expectError:   false,
			parameter:     "vault_path/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"foo": "bar",
					},
				},
				nil,
			},
		},
		{
			name:        "v1 with only vault path (slashes)",
			vaultPath:   "vault_path/with/slashes",
			secretsPath: "",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V1,
			expectError:   false,
			parameter:     "vault_path/with/slashes/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"foo": "bar",
					},
				},
				nil,
			},
		},
		{
			name:        "v1 with vault path (no slashes) and secrets path (no slashes)",
			vaultPath:   "vault_path",
			secretsPath: "secrets_path",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V1,
			expectError:   false,
			parameter:     "vault_path/secrets_path/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"foo": "bar",
					},
				},
				nil,
			},
		},
		{
			name:        "v1 with vault path (slashes) and secrets path (no slashes)",
			vaultPath:   "vault_path/with/slashes",
			secretsPath: "secrets_path",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V1,
			expectError:   false,
			parameter:     "vault_path/with/slashes/secrets_path/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"foo": "bar",
					},
				},
				nil,
			},
		},
		{
			name:        "v1 with vault path (no slashes) and secrets path (slashes)",
			vaultPath:   "vault_path",
			secretsPath: "secrets_path/with/slashes",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V1,
			expectError:   false,
			parameter:     "vault_path/secrets_path/with/slashes/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"foo": "bar",
					},
				},
				nil,
			},
		},
		{
			name:        "v1 with vault path (slashes) and secrets path (slashes)",
			vaultPath:   "vault_path/with/slashes",
			secretsPath: "secrets_path/with/slashes",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V1,
			expectError:   false,
			parameter:     "vault_path/with/slashes/secrets_path/with/slashes/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"foo": "bar",
					},
				},
				nil,
			},
		},
		{
			name:        "v2 with only vault path (no slashes)",
			vaultPath:   "vault_path",
			secretsPath: "",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V2,
			expectError:   false,
			parameter:     "vault_path/data/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"data": map[string]any{
							"foo": "bar",
						},
					},
				},
				nil,
			},
		},
		{
			name:        "v2 with only vault path (slashes)",
			vaultPath:   "vault_path/with/slashes",
			secretsPath: "",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V2,
			expectError:   false,
			parameter:     "vault_path/with/slashes/data/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"data": map[string]any{
							"foo": "bar",
						},
					},
				},
				nil,
			},
		},
		{
			name:        "v2 with vault path (no slashes) and secrets path (no slashes)",
			vaultPath:   "vault_path",
			secretsPath: "secrets_path",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V2,
			expectError:   false,
			parameter:     "vault_path/data/secrets_path/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"data": map[string]any{
							"foo": "bar",
						},
					},
				},
				nil,
			},
		},
		{
			name:        "v2 with vault path (slashes) and secrets path (no slashes)",
			vaultPath:   "vault_path/with/slashes",
			secretsPath: "secrets_path",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V2,
			expectError:   false,
			parameter:     "vault_path/with/slashes/data/secrets_path/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"data": map[string]any{
							"foo": "bar",
						},
					},
				},
				nil,
			},
		},
		{
			name:        "v2 with vault path (no slashes) and secrets path (slashes)",
			vaultPath:   "vault_path",
			secretsPath: "secrets_path/with/slashes",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V2,
			expectError:   false,
			parameter:     "vault_path/data/secrets_path/with/slashes/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"data": map[string]any{
							"foo": "bar",
						},
					},
				},
				nil,
			},
		},
		{
			name:        "v2 with vault path (slashes) and secrets path (slashes)",
			vaultPath:   "vault_path/with/slashes",
			secretsPath: "secrets_path/with/slashes",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "foo",
			expectedValue: proto.String(`{"foo":"bar"}`),
			engineVersion: secretsv1.HashicorpVault_VERSION_V2,
			expectError:   false,
			parameter:     "vault_path/with/slashes/data/secrets_path/with/slashes/foo",
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"data": map[string]any{
							"foo": "bar",
						},
					},
				},
				nil,
			},
		},
		{
			name: "malformed version",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			expectedAlias: "",
			expectedValue: nil,
			engineVersion: secretsv1.HashicorpVault_Version(5),
			expectError:   true,
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{},
				nil,
			},
		},
		{
			name: "client error",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			vaultPath:     "vault_path",
			expectedAlias: "foo",
			expectedValue: nil,
			engineVersion: secretsv1.HashicorpVault_VERSION_V2,
			expectError:   false,
			parameter:     "vault_path/data/foo",
			mockGetSecretResponse: []any{
				nil,
				errors.New("client error"),
			},
		},
		{
			name: "malformed client response",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			vaultPath:     "vault_path",
			expectedAlias: "foo",
			expectedValue: nil,
			parameter:     "vault_path/data/foo",
			engineVersion: secretsv1.HashicorpVault_VERSION_V2,
			expectError:   false,
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{},
				},
				nil,
			},
		},
		{
			name:        "marshal error",
			vaultPath:   "vault_path",
			secretsPath: "",
			details: &secretsv1.Details{
				Name:  "foo",
				Alias: "foo",
			},
			engineVersion: secretsv1.HashicorpVault_VERSION_V2,
			expectError:   true,
			mockGetSecretResponse: []any{
				&vault.Response[map[string]any]{
					Data: map[string]any{
						"data": make(chan int),
					},
				},
				nil,
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			client := &mockClient{}
			client.On("Read", mock.Anything, mock.Anything, mock.Anything).Return(test.mockGetSecretResponse...)

			provider := &provider{
				client:      client,
				vaultPath:   test.vaultPath,
				secretsPath: test.secretsPath,
				version:     test.engineVersion,
				logger:      zap.NewNop(),
			}

			alias, value, err := provider.GetSecret(context.Background(), test.details)

			if test.expectError {
				assert.Error(t, err)
				return
			}

			client.AssertExpectations(t)

			assert.Equal(t, test.expectedAlias, alias)
			assert.Equal(t, test.expectedValue, value)
			assert.NoError(t, err)
			assert.Equal(t, 1, len(client.Calls))
			assert.Equal(t, test.parameter, client.Calls[0].Arguments.Get(1).(string))
		})
	}
}

func TestBuildPath(t *testing.T) {
	for _, test := range []struct {
		name         string
		vaultPath    string
		secretsPath  string
		token        string
		version      secretsv1.HashicorpVault_Version
		expectedPath string
		expectError  bool
	}{
		{
			name:         "v1 only vault path (no slashes) (no token)",
			vaultPath:    "vault_path",
			secretsPath:  "",
			token:        "",
			version:      secretsv1.HashicorpVault_VERSION_V1,
			expectedPath: "vault_path",
		},
		{
			name:         "v2 only vault path (no slashes) (token)",
			vaultPath:    "vault_path",
			secretsPath:  "",
			token:        "t",
			version:      secretsv1.HashicorpVault_VERSION_V2,
			expectedPath: "vault_path/t",
		},
		{
			name:         "v1 vault path (no slashes) secret path (no slashes) (no token)",
			vaultPath:    "vault_path",
			secretsPath:  "secret_path",
			token:        "",
			version:      secretsv1.HashicorpVault_VERSION_V1,
			expectedPath: "vault_path/secret_path",
		},
		{
			name:         "v2 vault path (no slashes) secret path (no slashes) (token)",
			vaultPath:    "vault_path",
			secretsPath:  "secret_path",
			token:        "t",
			version:      secretsv1.HashicorpVault_VERSION_V2,
			expectedPath: "vault_path/t/secret_path",
		},
		{
			name:         "v1 vault path (slashes) secret path (no slashes) (no token)",
			vaultPath:    "vault_path/with/slashes",
			secretsPath:  "secret_path",
			token:        "",
			version:      secretsv1.HashicorpVault_VERSION_V1,
			expectedPath: "vault_path/with/slashes/secret_path",
		},
		{
			name:         "v2 vault path (slashes) secret path (no slashes) (token)",
			vaultPath:    "vault_path/with/slashes",
			secretsPath:  "secret_path",
			token:        "t",
			version:      secretsv1.HashicorpVault_VERSION_V2,
			expectedPath: "vault_path/with/slashes/t/secret_path",
		},
		{
			name:         "v1 vault path (no slashes) secret path (slashes) (no token)",
			vaultPath:    "vault_path",
			secretsPath:  "secret_path/with/slashes",
			token:        "",
			version:      secretsv1.HashicorpVault_VERSION_V1,
			expectedPath: "vault_path/secret_path/with/slashes",
		},
		{
			name:         "v2 vault path (no slashes) secret path (slashes) (token)",
			vaultPath:    "vault_path",
			secretsPath:  "secret_path/with/slashes",
			token:        "t",
			version:      secretsv1.HashicorpVault_VERSION_V2,
			expectedPath: "vault_path/t/secret_path/with/slashes",
		},
		{
			name:         "v1 vault path (slashes) secret path (slashes) (no token)",
			vaultPath:    "vault_path/with/slashes",
			secretsPath:  "secret_path/with/slashes",
			token:        "",
			version:      secretsv1.HashicorpVault_VERSION_V1,
			expectedPath: "vault_path/with/slashes/secret_path/with/slashes",
		},
		{
			name:         "v2 vault path (slashes) secret path (slashes) (token)",
			vaultPath:    "vault_path/with/slashes",
			secretsPath:  "secret_path/with/slashes",
			token:        "t",
			version:      secretsv1.HashicorpVault_VERSION_V2,
			expectedPath: "vault_path/with/slashes/t/secret_path/with/slashes",
		},
		{
			name:         "v1 vault path and secret path have leading and trailing slash (no token)",
			vaultPath:    "/vault_path/",
			secretsPath:  "/secret_path/",
			token:        "",
			version:      secretsv1.HashicorpVault_VERSION_V1,
			expectedPath: "vault_path/secret_path",
		},
		{
			name:         "v2 vault path and secret path have leading and trailing slash (token)",
			vaultPath:    "/vault_path/",
			secretsPath:  "/secret_path/",
			token:        "t",
			version:      secretsv1.HashicorpVault_VERSION_V2,
			expectedPath: "vault_path/t/secret_path",
		},
		{
			name:        "invalid version",
			version:     secretsv1.HashicorpVault_VERSION_UNSPECIFIED,
			expectError: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			provider := &provider{
				version:     test.version,
				vaultPath:   test.vaultPath,
				secretsPath: test.secretsPath,
			}
			path, err := provider.buildPath(test.token)
			if test.expectError {
				assert.Error(t, err)
				return
			}
			assert.NoError(t, err)
			assert.Equal(t, test.expectedPath, path)

		})
	}
}

func TestName(t *testing.T) {
	for _, test := range []struct {
		name             string
		expectedResponse string
	}{
		{
			name:             "get name",
			expectedResponse: "hashicorpvault",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			provider := &provider{}
			resp := provider.Name()
			assert.Equal(t, resp, test.expectedResponse)

		})
	}
}

func TestClose(t *testing.T) {
	for _, test := range []struct {
		name             string
		expectedResponse error
	}{
		{
			name:             "close no op",
			expectedResponse: nil,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			provider := &provider{}
			resp := provider.Close()
			assert.Equal(t, resp, test.expectedResponse)

		})
	}
}
