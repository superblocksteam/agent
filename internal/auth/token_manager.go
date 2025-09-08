package auth

import (
	"context"
	"net/http"

	"github.com/jonboulle/clockwork"
	"github.com/superblocksteam/agent/internal/auth/oauth"
	"github.com/superblocksteam/agent/internal/auth/types"
	"github.com/superblocksteam/agent/internal/flags"
	"github.com/superblocksteam/agent/pkg/clients"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

//go:generate mockery --name=TokenManager --output ./mocks --structname TokenManager
type TokenManager interface {
	AddTokenIfNeeded(
		ctx context.Context,
		datasourceConfig *structpb.Struct,
		redactedDatasourceConfig *structpb.Struct,
		auth *v1.Auth,
		datasourceId string,
		configurationId string,
		pluginId string,
	) (types.TokenPayload, error)

	CheckAuth(
		ctx context.Context,
		integration *structpb.Struct,
		integrationId string,
		configurationId string,
		pluginId string,
	) (
		*types.CheckAuthResponse,
		error,
	)

	Login(
		ctx context.Context,
		integration *structpb.Struct,
		req *apiv1.LoginRequest,
	) (
		[]*http.Cookie,
		bool,
		error,
	)

	ExchangeOauthCodeForToken(
		ctx context.Context,
		authType string,
		authConfig *v1.OAuth_AuthorizationCodeFlow,
		accessCode string,
		integrationId string,
		configurationId string,
	) error

	// FetchNewOauthPasswordToken username password are for per user authentication
	FetchNewOauthPasswordToken(
		authConfig *v1.OAuth_PasswordGrantFlow,
	) (*types.Response, error)
}

type tokenManager struct {
	*oauth.OAuthClient
	oauth.OAuthCodeTokenFetcher
	clock  clockwork.Clock
	logger *zap.Logger
	flags  flags.Flags
}

func NewTokenManager(
	serverClient clients.ServerClient,
	clock clockwork.Clock,
	logger *zap.Logger,
	eagerRefreshThresholdMs int64,
	flags flags.Flags,
) TokenManager {
	fetcherCacher := oauth.NewApiFetcherCacher(serverClient, eagerRefreshThresholdMs)
	oauthClient := oauth.NewOAuthClient(fetcherCacher, clock, logger)
	oauthCodeTokenFetcher := oauth.NewOAuthCodeTokenFetcher(
		oauthClient,
		fetcherCacher,
		serverClient,
	)

	return &tokenManager{
		OAuthClient:           oauthClient,
		OAuthCodeTokenFetcher: oauthCodeTokenFetcher,
		clock:                 clock,
		logger:                logger.Named("TokenManager"),
		flags:                 flags,
	}
}

func (t *tokenManager) FetchNewOauthPasswordToken(authConfig *v1.OAuth_PasswordGrantFlow) (*types.Response, error) {
	return t.OAuthClient.FetchNewOauthPasswordToken(authConfig)
}
