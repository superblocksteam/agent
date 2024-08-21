package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/superblocksteam/agent/pkg/clients"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	TokenTypeRefresh = "refresh"
	TokenTypeAccess  = "token"
	TokenTypeId      = "id-token"
)

//go:generate mockery --name=FetcherCacher --output=../mocks --outpkg=mocks
type FetcherCacher interface {
	FetchSharedToken(authType string, authConfig *structpb.Struct, tokenType string, datasourceId string, configurationId string) (string, error)
	FetchUserToken(ctx context.Context, authType string, authConfig *structpb.Struct, tokenType string) (string, error)

	CacheSharedToken(authType string, authConfig *structpb.Struct, tokenType string, tokenValue string, expiresAt int64, integrationId string, configurationId string) error
	CacheUserToken(ctx context.Context, authType string, authConfig *structpb.Struct, tokenType string, tokenValue string, expiresAt int64, integrationId string, configurationId string) error
}

type ApiFetcherCacher struct {
	serverClient            clients.ServerClient
	eagerRefreshThresholdMs int64
}

// TODO: move to types
type CacheTokenRequest struct {
	AuthType        string                 `json:"authType"`
	AuthConfig      map[string]interface{} `json:"authConfig"`
	TokenType       string                 `json:"tokenType"`
	TokenValue      string                 `json:"tokenValue"`
	DatasourceId    string                 `json:"datasourceId,omitempty"`
	ConfigurationId string                 `json:"configurationId,omitempty"`
	ExpiresAt       string                 `json:"expiresAt,omitempty"`
}

// TODO: move to types
type FetchTokenRequest struct {
	AuthType                string                 `json:"authType"`
	AuthConfig              map[string]interface{} `json:"authConfig"`
	TokenType               string                 `json:"tokenType"`
	EagerRefreshThresholdMs int64                  `json:"eagerRefreshThresholdMs"`
	DatasourceId            string                 `json:"datasourceId,omitempty"`
	ConfigurationId         string                 `json:"configurationId,omitempty"`
}

type FetchTokenResponse struct {
	Data string `json:"data"`
}

func NewApiFetcherCacher(serverClient clients.ServerClient, eagerRefreshThresholdMs int64) FetcherCacher {
	return &ApiFetcherCacher{
		serverClient:            serverClient,
		eagerRefreshThresholdMs: eagerRefreshThresholdMs,
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

func (f *ApiFetcherCacher) cacheToken(isShared bool, authType string, authConfig *structpb.Struct, tokenType string, tokenValue string, expiresAt int64, authHeader string, integrationId string, configurationId string) error {
	var expiresAtStr string

	if expiresAt != 0 {
		expiresAtStr = time.Unix(expiresAt, 0).Format(time.RFC3339)
	}

	body := &CacheTokenRequest{
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
		bs, err := io.ReadAll(res.Body)
		if err != nil {
			return fmt.Errorf("failed to cache token, status code: %d", res.StatusCode)
		} else {
			return fmt.Errorf("failed to cache token, status code: %d: %s", res.StatusCode, string(bs))
		}
	}

	return nil
}

func (f *ApiFetcherCacher) fetchToken(isShared bool, authType string, authConfig *structpb.Struct, tokenType string, datasourceId string, configurationId string, authHeader string) (string, error) {
	req := &FetchTokenRequest{
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

	fetchRes := &FetchTokenResponse{}
	err = json.Unmarshal(body, fetchRes)
	if err != nil {
		return "", err
	}

	return fetchRes.Data, nil
}
