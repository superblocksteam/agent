package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/superblocksteam/agent/internal/auth/types"
	"github.com/superblocksteam/agent/pkg/clients"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	TokenTypeRefresh = "refresh"
	TokenTypeAccess  = "token"
	TokenTypeId      = "id-token"

	// maxErrorBodyBytes caps how much of a non-2xx response body is read into an
	// error message, so a pathological server response (e.g. a large HTML error
	// page) cannot cause unbounded memory use.
	maxErrorBodyBytes = 4096

	// defaultEvictionTimeout bounds best-effort token eviction calls when no
	// explicit timeout is configured: eviction runs on an already-failed request,
	// so the client's default timeout (~1m) would otherwise delay delivery of the
	// failed response if the server hangs.
	defaultEvictionTimeout = 10 * time.Second
)

//go:generate mockery --name=FetcherCacher --output=../mocks --outpkg=mocks
type FetcherCacher interface {
	FetchSharedToken(authType string, authConfig *structpb.Struct, tokenType string, datasourceId string, configurationId string) (string, error)
	FetchUserToken(ctx context.Context, authType string, authConfig *structpb.Struct, tokenType string) (string, error)

	CacheSharedToken(authType string, authConfig *structpb.Struct, tokenType string, tokenValue string, expiresAt int64, integrationId string, configurationId string) error
	CacheUserToken(ctx context.Context, authType string, authConfig *structpb.Struct, tokenType string, tokenValue string, expiresAt int64, integrationId string, configurationId string) error

	// Invalidate{Shared,User}Token evict a cached token so the next execution
	// re-exchanges. The server derives the auth id from the same key fields
	// used by the Fetch/Cache methods.
	InvalidateSharedToken(authType string, authConfig *structpb.Struct, tokenType string, datasourceId string, configurationId string) error
	InvalidateUserToken(ctx context.Context, authType string, authConfig *structpb.Struct, tokenType string) error
}

type ApiFetcherCacher struct {
	serverClient            clients.ServerClient
	eagerRefreshThresholdMs int64
	evictionTimeout         time.Duration
	logger                  *zap.Logger
}

func NewApiFetcherCacher(serverClient clients.ServerClient, eagerRefreshThresholdMs int64, evictionTimeout time.Duration, logger *zap.Logger) FetcherCacher {
	if evictionTimeout <= 0 {
		evictionTimeout = defaultEvictionTimeout
	}
	if logger == nil {
		logger = zap.NewNop()
	}
	return &ApiFetcherCacher{
		serverClient:            serverClient,
		eagerRefreshThresholdMs: eagerRefreshThresholdMs,
		evictionTimeout:         evictionTimeout,
		logger:                  logger,
	}
}

func (f *ApiFetcherCacher) FetchSharedToken(authType string, authConfig *structpb.Struct, tokenType string, datasourceId string, configurationId string) (string, error) {
	return f.fetchToken(true, authType, authConfig, tokenType, datasourceId, configurationId, "")
}

func (f *ApiFetcherCacher) FetchUserToken(ctx context.Context, authType string, authConfig *structpb.Struct, tokenType string) (string, error) {
	var authorization string
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		authorization = md.Get("authorization")[0]
	}
	return f.fetchToken(false, authType, authConfig, tokenType, "", "", authorization)
}

func (f *ApiFetcherCacher) CacheSharedToken(authType string, authConfig *structpb.Struct, tokenType string, tokenValue string, expiresAt int64, integrationId string, configurationId string) error {
	return f.cacheToken(true, authType, authConfig, tokenType, tokenValue, expiresAt, "", integrationId, configurationId)
}

func (f *ApiFetcherCacher) CacheUserToken(ctx context.Context, authType string, authConfig *structpb.Struct, tokenType string, tokenValue string, expiresAt int64, integrationId string, configurationId string) error {
	var authorization string
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		authorization = md.Get("authorization")[0]
	}
	return f.cacheToken(false, authType, authConfig, tokenType, tokenValue, expiresAt, authorization, integrationId, configurationId)
}

func (f *ApiFetcherCacher) InvalidateSharedToken(authType string, authConfig *structpb.Struct, tokenType string, datasourceId string, configurationId string) error {
	return f.invalidateToken(true, authType, authConfig, tokenType, datasourceId, configurationId, "")
}

func (f *ApiFetcherCacher) InvalidateUserToken(ctx context.Context, authType string, authConfig *structpb.Struct, tokenType string) error {
	var authorization string
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if values := md.Get("authorization"); len(values) > 0 {
			authorization = values[0]
		}
	}
	return f.invalidateToken(false, authType, authConfig, tokenType, "", "", authorization)
}

func (f *ApiFetcherCacher) invalidateToken(isShared bool, authType string, authConfig *structpb.Struct, tokenType string, datasourceId string, configurationId string, authHeader string) error {
	authConfigMap := map[string]interface{}{}
	if authConfig != nil {
		authConfigMap = authConfig.AsMap()
	}
	body := &types.InvalidateTokenRequest{
		AuthType:        authType,
		AuthConfig:      authConfigMap,
		TokenType:       tokenType,
		DatasourceId:    datasourceId,
		ConfigurationId: configurationId,
	}

	headers := http.Header{}
	if authHeader != "" {
		headers.Set("authorization", authHeader)
	}

	// Eviction is a best-effort side effect on an already-failed request, so bound it with a short
	// timeout (configurable via auth.eviction.timeout.ms; see defaultEvictionTimeout). We use
	// context.Background (not the request context) because the request context is typically
	// already cancelled by the time eviction runs.
	timeout := f.evictionTimeout

	var res *http.Response
	var err error
	if isShared {
		res, err = f.serverClient.DeleteOrgUserToken(context.Background(), &timeout, headers, nil, body)
	} else {
		res, err = f.serverClient.DeleteSpecificUserTokens(context.Background(), &timeout, headers, nil, body)
	}

	if err != nil {
		return err
	}
	if res == nil {
		return fmt.Errorf("failed to invalidate token: nil response")
	}
	if res.Body != nil {
		// Drain (bounded) before closing so net/http can return the underlying
		// TCP connection to the pool; an unread body forces a new connection on
		// the next eviction call.
		defer func() {
			_, _ = io.Copy(io.Discard, io.LimitReader(res.Body, maxErrorBodyBytes))
			_ = res.Body.Close()
		}()
	}

	// A 404 means the server predates this endpoint (e.g. the orchestrator was upgraded ahead of
	// the server during a rolling deploy). Eviction is best-effort and the token self-heals on the
	// next exchange, so treat it as a benign no-op rather than a noisy error. Log it so a
	// permanently-wrong endpoint (URL misconfiguration, path drift) is still discoverable.
	if res.StatusCode == http.StatusNotFound {
		f.logger.Info("token invalidation endpoint returned 404; treating as no-op",
			zap.String("authType", authType),
			zap.Bool("shared", isShared),
			zap.String("datasourceId", datasourceId),
			zap.String("configurationId", configurationId),
		)
		return nil
	}

	if res.StatusCode != http.StatusOK {
		if res.Body == nil {
			return fmt.Errorf("failed to invalidate token, status code: %d", res.StatusCode)
		}
		bs, readErr := io.ReadAll(io.LimitReader(res.Body, maxErrorBodyBytes))
		if readErr != nil {
			return fmt.Errorf("failed to invalidate token, status code: %d", res.StatusCode)
		}
		return fmt.Errorf("failed to invalidate token, status code: %d: %s", res.StatusCode, string(bs))
	}

	return nil
}

func (f *ApiFetcherCacher) cacheToken(isShared bool, authType string, authConfig *structpb.Struct, tokenType string, tokenValue string, expiresAt int64, authHeader string, integrationId string, configurationId string) error {
	var expiresAtStr string

	if expiresAt != 0 {
		expiresAtStr = time.Unix(expiresAt, 0).Format(time.RFC3339)
	}

	body := &types.CacheTokenRequest{
		AuthType:        authType,
		AuthConfig:      authConfig.AsMap(),
		TokenType:       tokenType,
		TokenValue:      tokenValue,
		ExpiresAt:       expiresAtStr,
		DatasourceId:    integrationId,
		ConfigurationId: configurationId,
	}

	headers := http.Header{}
	if authHeader != "" {
		headers.Set("authorization", authHeader)
	}

	var res *http.Response
	var err error
	if isShared {
		res, err = f.serverClient.PostOrgUserToken(context.Background(), nil, headers, nil, body)
	} else {
		res, err = f.serverClient.PostSpecificUserToken(context.Background(), nil, headers, nil, body)
	}

	if err != nil {
		return err
	}

	if res.StatusCode != http.StatusOK {
		bs, err := io.ReadAll(io.LimitReader(res.Body, maxErrorBodyBytes))
		if err != nil {
			return fmt.Errorf("failed to cache token, status code: %d", res.StatusCode)
		} else {
			return fmt.Errorf("failed to cache token, status code: %d: %s", res.StatusCode, string(bs))
		}
	}

	return nil
}

func (f *ApiFetcherCacher) fetchToken(isShared bool, authType string, authConfig *structpb.Struct, tokenType string, datasourceId string, configurationId string, authHeader string) (string, error) {
	req := &types.FetchTokenRequest{
		AuthType:                authType,
		AuthConfig:              authConfig.AsMap(),
		TokenType:               tokenType,
		EagerRefreshThresholdMs: f.eagerRefreshThresholdMs,
	}

	if datasourceId != "" {
		req.DatasourceId = datasourceId
	}

	if configurationId != "" {
		req.ConfigurationId = configurationId
	}

	headers := http.Header{}
	if authHeader != "" {
		headers.Set("authorization", authHeader)
	}

	var res *http.Response
	var err error
	if isShared {
		res, err = f.serverClient.GetOrgUserToken(context.Background(), nil, headers, nil, req)
	} else {
		res, err = f.serverClient.GetSpecificUserToken(context.Background(), nil, headers, nil, req)
	}

	if err != nil {
		return "", err
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}

	fetchRes := &types.FetchTokenResponse{}
	err = json.Unmarshal(body, fetchRes)
	if err != nil {
		return "", err
	}

	return fetchRes.Data, nil
}
