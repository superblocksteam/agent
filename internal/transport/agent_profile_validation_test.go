package transport

import (
	"context"
	"testing"

	fetchmocks "github.com/superblocksteam/agent/internal/fetch/mocks"
	agentmetadata "github.com/superblocksteam/agent/internal/metadata"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/constants"
	sberror "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/secrets"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/worker"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

// newProfileConstrainedServer returns a server tagged to serve only the
// "production" profile, mirroring a cloud-prem data plane whose data_tags
// resolve to agent.tags=profile:production.
func newProfileConstrainedServer(t *testing.T) *server {
	t.Helper()
	return NewServer(&Config{
		Logger:        zap.NewNop(),
		Store:         store.Memory(),
		Worker:        &worker.MockClient{},
		Fetcher:       &fetchmocks.Fetcher{},
		SecretManager: secrets.NewSecretManager(),
		AgentTags: map[string]*utils.Set[string]{
			agentmetadata.ProfileTagKey: utils.NewSet("production"),
		},
		AgentEnvironment: "*",
	}).(*server)
}

func stagingProfile() *v1.Profile {
	name := "staging"
	return &v1.Profile{Name: &name}
}

// TestValidateAgentProfileForExecutionRejectsAllFetchVariants is the regression
// for the Atredis finding: a non-production data plane accepted a production
// profile via /v2/execute/stream because the agent-tag check only ran for the
// FetchCode (code-mode) variant. Every execute variant carries a profile that
// selects the data source, so every variant must be validated.
func TestValidateAgentProfileForExecutionRejectsAllFetchVariants(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	s := newProfileConstrainedServer(t)

	variants := map[string]*apiv1.ExecuteRequest{
		"fetch": {Request: &apiv1.ExecuteRequest_Fetch_{
			Fetch: &apiv1.ExecuteRequest_Fetch{Profile: stagingProfile()},
		}},
		"fetchByPath": {Request: &apiv1.ExecuteRequest_FetchByPath_{
			FetchByPath: &apiv1.ExecuteRequest_FetchByPath{Profile: stagingProfile()},
		}},
		"fetchCode": {Request: &apiv1.ExecuteRequest_FetchCode_{
			FetchCode: &apiv1.ExecuteRequest_FetchCode{Profile: stagingProfile()},
		}},
		"inlineDefinition": {
			Profile: stagingProfile(),
			Request: &apiv1.ExecuteRequest_Definition{Definition: &apiv1.Definition{}},
		},
	}

	for name, req := range variants {
		t.Run(name, func(t *testing.T) {
			err := s.validateAgentProfileForExecution(context.Background(), req)
			require.Error(t, err, "execute variant %q must reject an unsupported profile", name)
			assert.True(t, sberror.IsAuthorizationError(err), "expected AuthorizationError, got %v", err)
			assert.Contains(t, err.Error(), `profile "staging" is not supported by this agent`)
		})
	}
}

// TestProfileBearingRPCsRejectUnsupportedProfile asserts that every standalone
// data-source-touching RPC rejects a profile outside the agent's data tags
// before resolving any integration config or opening a connection.
func TestProfileBearingRPCsRejectUnsupportedProfile(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	cases := []struct {
		name string
		call func(s *server, ctx context.Context) error
	}{
		{"Metadata", func(s *server, ctx context.Context) error {
			_, err := s.Metadata(ctx, &apiv1.MetadataRequest{Profile: stagingProfile()})
			return err
		}},
		{"MetadataDeprecated", func(s *server, ctx context.Context) error {
			_, err := s.MetadataDeprecated(ctx, &apiv1.MetadataRequestDeprecated{Profile: stagingProfile()})
			return err
		}},
		{"Test", func(s *server, ctx context.Context) error {
			_, err := s.Test(ctx, &apiv1.TestRequest{Profile: stagingProfile()})
			return err
		}},
		{"Delete", func(s *server, ctx context.Context) error {
			_, err := s.Delete(ctx, &apiv1.DeleteRequest{Profile: stagingProfile()})
			return err
		}},
		{"ListSecrets", func(s *server, ctx context.Context) error {
			_, err := s.ListSecrets(ctx, &secretsv1.ListSecretsRequest{Profile: stagingProfile()})
			return err
		}},
		{"CheckAuth", func(s *server, ctx context.Context) error {
			_, err := s.CheckAuth(ctx, &apiv1.CheckAuthRequest{Profile: stagingProfile()})
			return err
		}},
		{"Login", func(s *server, ctx context.Context) error {
			_, err := s.Login(ctx, &apiv1.LoginRequest{Profile: stagingProfile()})
			return err
		}},
		{"ExchangeOauthCodeForToken", func(s *server, ctx context.Context) error {
			_, err := s.ExchangeOauthCodeForToken(ctx, &apiv1.ExchangeOauthCodeForTokenRequest{Profile: stagingProfile()})
			return err
		}},
		{"RequestOauthPasswordToken", func(s *server, ctx context.Context) error {
			_, err := s.RequestOauthPasswordToken(ctx, &apiv1.RequestOauthPasswordTokenRequest{Profile: stagingProfile()})
			return err
		}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := newProfileConstrainedServer(t)
			ctx := context.WithValue(context.Background(), constants.ContextKeyRequestUsesJwtAuth, true)
			err := tc.call(s, ctx)
			require.Error(t, err, "%s must reject an unsupported profile", tc.name)
			assert.True(t, sberror.IsAuthorizationError(err), "%s: expected AuthorizationError, got %v", tc.name, err)
			assert.Contains(t, err.Error(), `profile "staging" is not supported by this agent`)
		})
	}
}

// TestValidateAgentProfileIsNoOpForUnconstrainedAgent guards backward
// compatibility: a SaaS / single-agent OPA registers with no profile tags and
// the default agent.environment "*", so profile validation must never reject.
func TestValidateAgentProfileIsNoOpForUnconstrainedAgent(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	unconstrained := NewServer(&Config{
		Logger:           zap.NewNop(),
		Store:            store.Memory(),
		Worker:           &worker.MockClient{},
		Fetcher:          &fetchmocks.Fetcher{},
		SecretManager:    secrets.NewSecretManager(),
		AgentEnvironment: "*",
	}).(*server)

	ctx := context.Background()
	assert.NoError(t, unconstrained.validateAgentProfile(ctx, stagingProfile()))

	constrained := newProfileConstrainedServer(t)
	supported := "production"
	assert.NoError(t, constrained.validateAgentProfile(ctx, &v1.Profile{Name: &supported}))
	assert.NoError(t, constrained.validateAgentProfile(ctx, nil))

	// An empty profile (no key/name/environment/id) specifies no target
	// environment and must be a no-op even on a constrained agent.
	assert.NoError(t, constrained.validateAgentProfile(ctx, &v1.Profile{}))

	// A fetch variant carrying no profile likewise specifies no target
	// environment, so the execute gate must not reject it.
	noProfileFetch := &apiv1.ExecuteRequest{Request: &apiv1.ExecuteRequest_Fetch_{Fetch: &apiv1.ExecuteRequest_Fetch{}}}
	assert.NoError(t, constrained.validateAgentProfileForExecution(ctx, noProfileFetch))
}
