package oauth

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/internal/auth/types"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestFetchUserToken(t *testing.T) {
	tests := []struct {
		name                    string
		eagerRefreshThresholdMs int64
		authType                string
	}{
		{
			"oauth-code per user",
			1991,
			"oauth-code",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			serverClient := &mocks.ServerClient{}
			fetcherCacher := NewApiFetcherCacher(serverClient, tt.eagerRefreshThresholdMs, 0, zap.NewNop())

			ctx := context.Background()

			getTokenResponseBody := io.NopCloser(strings.NewReader("{}"))
			defer getTokenResponseBody.Close()

			serverClient.On("GetSpecificUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
				StatusCode: http.StatusOK,
				Body:       getTokenResponseBody,
			}, nil)

			_, err := fetcherCacher.FetchUserToken(ctx, tt.authType, nil, TokenTypeRefresh)

			assert.NoError(t, err)
			assert.Equal(t, tt.eagerRefreshThresholdMs, serverClient.Mock.Calls[0].Arguments.Get(4).(*types.FetchTokenRequest).EagerRefreshThresholdMs)
		})
	}
}

func TestInvalidateSharedToken(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	deleteResponseBody := io.NopCloser(strings.NewReader("{}"))
	defer deleteResponseBody.Close()

	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       deleteResponseBody,
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.NoError(t, err)
	serverClient.AssertNotCalled(t, "DeleteSpecificUserTokens")

	body, ok := serverClient.Mock.Calls[0].Arguments.Get(4).(*types.InvalidateTokenRequest)
	assert.True(t, ok)
	assert.Equal(t, string(OauthTokenExchange), body.AuthType)
	assert.Equal(t, TokenTypeAccess, body.TokenType)
	assert.Equal(t, "datasource-id", body.DatasourceId)
	assert.Equal(t, "configuration-id", body.ConfigurationId)
}

func TestInvalidateUserToken(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	deleteResponseBody := io.NopCloser(strings.NewReader("{}"))
	defer deleteResponseBody.Close()

	serverClient.On("DeleteSpecificUserTokens", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       deleteResponseBody,
	}, nil)

	ctx := context.Background()
	err := fetcherCacher.InvalidateUserToken(ctx, string(OauthTokenExchange), nil, TokenTypeAccess)

	assert.NoError(t, err)
	serverClient.AssertNotCalled(t, "DeleteOrgUserToken")

	body, ok := serverClient.Mock.Calls[0].Arguments.Get(4).(*types.InvalidateTokenRequest)
	assert.True(t, ok)
	assert.Equal(t, string(OauthTokenExchange), body.AuthType)
	assert.Equal(t, TokenTypeAccess, body.TokenType)
}

// drainTrackingBody records whether the response body was read to EOF before
// being closed, which is what allows net/http to reuse the TCP connection.
type drainTrackingBody struct {
	reader  io.Reader
	drained bool
	closed  bool
}

func (b *drainTrackingBody) Read(p []byte) (int, error) {
	n, err := b.reader.Read(p)
	if errors.Is(err, io.EOF) {
		b.drained = true
	}
	return n, err
}

func (b *drainTrackingBody) Close() error {
	b.closed = true
	return nil
}

func TestInvalidateSharedTokenDrainsBodyOnSuccess(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	body := &drainTrackingBody{reader: strings.NewReader("{}")}
	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       body,
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.NoError(t, err)
	assert.True(t, body.drained, "response body must be drained so the connection can be reused")
	assert.True(t, body.closed, "response body must be closed")
}

func TestInvalidateSharedTokenNotFoundIsLoggedNoOp(t *testing.T) {
	// 404 is a benign no-op (rolling-deploy version skew), but it must leave a
	// diagnostic log entry so a permanently-wrong endpoint is discoverable.
	core, logs := observer.New(zapcore.InfoLevel)
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.New(core))

	deleteResponseBody := io.NopCloser(strings.NewReader("not found"))
	defer deleteResponseBody.Close()

	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusNotFound,
		Body:       deleteResponseBody,
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.NoError(t, err)
	entries := logs.FilterMessageSnippet("404").All()
	assert.Len(t, entries, 1, "the 404 no-op must be logged")
}

func TestInvalidateSharedTokenUsesConfiguredEvictionTimeout(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 30*time.Second, zap.NewNop())

	deleteResponseBody := io.NopCloser(strings.NewReader("{}"))
	defer deleteResponseBody.Close()

	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       deleteResponseBody,
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.NoError(t, err)
	timeout, ok := serverClient.Mock.Calls[0].Arguments.Get(1).(*time.Duration)
	assert.True(t, ok)
	assert.Equal(t, 30*time.Second, *timeout)
}

func TestInvalidateSharedTokenDefaultsEvictionTimeout(t *testing.T) {
	// A zero (unset) eviction timeout falls back to the 10s default so eviction
	// can never inherit the client's much longer default timeout.
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	deleteResponseBody := io.NopCloser(strings.NewReader("{}"))
	defer deleteResponseBody.Close()

	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       deleteResponseBody,
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.NoError(t, err)
	timeout, ok := serverClient.Mock.Calls[0].Arguments.Get(1).(*time.Duration)
	assert.True(t, ok)
	assert.Equal(t, defaultEvictionTimeout, *timeout)
}

func TestInvalidateUserTokenForwardsAuthHeaderAndConfig(t *testing.T) {
	// The authorization header from the incoming gRPC metadata and the auth
	// config must both be forwarded so the server can derive the cache key for
	// the right user.
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	deleteResponseBody := io.NopCloser(strings.NewReader("{}"))
	defer deleteResponseBody.Close()

	serverClient.On("DeleteSpecificUserTokens", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       deleteResponseBody,
	}, nil)

	authConfig, err := structpb.NewStruct(map[string]interface{}{
		"clientId": "client-1",
	})
	assert.NoError(t, err)

	ctx := metadata.NewIncomingContext(context.Background(), metadata.New(map[string]string{
		"authorization": "Bearer user-token",
	}))

	err = fetcherCacher.InvalidateUserToken(ctx, string(OauthTokenExchange), authConfig, TokenTypeAccess)

	assert.NoError(t, err)

	headers, ok := serverClient.Mock.Calls[0].Arguments.Get(2).(http.Header)
	assert.True(t, ok)
	assert.Equal(t, "Bearer user-token", headers.Get("authorization"))

	body, ok := serverClient.Mock.Calls[0].Arguments.Get(4).(*types.InvalidateTokenRequest)
	assert.True(t, ok)
	assert.Equal(t, map[string]interface{}{"clientId": "client-1"}, body.AuthConfig)
}

func TestInvalidateUserTokenTransportError(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	transportErr := errors.New("connection refused")
	serverClient.On("DeleteSpecificUserTokens", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, transportErr)

	err := fetcherCacher.InvalidateUserToken(context.Background(), string(OauthTokenExchange), nil, TokenTypeAccess)

	assert.ErrorIs(t, err, transportErr)
}

func TestInvalidateUserTokenNilResponse(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	serverClient.On("DeleteSpecificUserTokens", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, nil)

	err := fetcherCacher.InvalidateUserToken(context.Background(), string(OauthTokenExchange), nil, TokenTypeAccess)

	assert.EqualError(t, err, "failed to invalidate token: nil response")
}

func TestInvalidateSharedTokenErrorStatusNilBody(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusInternalServerError,
		Body:       nil,
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.EqualError(t, err, "failed to invalidate token, status code: 500")
}

type errReader struct{}

func (errReader) Read([]byte) (int, error) {
	return 0, errors.New("read error")
}

func TestInvalidateSharedTokenErrorStatusUnreadableBody(t *testing.T) {
	// A body read failure must not mask the status-code error.
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusInternalServerError,
		Body:       io.NopCloser(errReader{}),
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.EqualError(t, err, "failed to invalidate token, status code: 500")
}

func TestInvalidateSharedTokenErrorStatusOversizedBodyIsCapped(t *testing.T) {
	// A pathological error body (e.g. an HTML error page) must not be read unbounded
	// into memory or the error message.
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusInternalServerError,
		Body:       io.NopCloser(strings.NewReader(strings.Repeat("x", 10000))),
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.Error(t, err)
	assert.LessOrEqual(t, len(err.Error()), maxErrorBodyBytes+len("failed to invalidate token, status code: 500: "))
}

func TestCacheUserTokenForwardsAuthHeaderAndBody(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	cacheResponseBody := io.NopCloser(strings.NewReader("{}"))
	defer cacheResponseBody.Close()

	serverClient.On("PostSpecificUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       cacheResponseBody,
	}, nil)

	ctx := metadata.NewIncomingContext(context.Background(), metadata.New(map[string]string{
		"authorization": "Bearer user-token",
	}))

	err := fetcherCacher.CacheUserToken(ctx, string(OauthTokenExchange), nil, TokenTypeAccess, "token-value", 1700000000, "integration-id", "configuration-id")

	assert.NoError(t, err)
	serverClient.AssertNotCalled(t, "PostOrgUserToken")

	headers, ok := serverClient.Mock.Calls[0].Arguments.Get(2).(http.Header)
	assert.True(t, ok)
	assert.Equal(t, "Bearer user-token", headers.Get("authorization"))

	body, ok := serverClient.Mock.Calls[0].Arguments.Get(4).(*types.CacheTokenRequest)
	assert.True(t, ok)
	assert.Equal(t, "token-value", body.TokenValue)
	assert.Equal(t, "integration-id", body.DatasourceId)
	assert.Equal(t, "configuration-id", body.ConfigurationId)
	assert.NotEmpty(t, body.ExpiresAt)
}

func TestCacheSharedTokenTransportError(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	transportErr := errors.New("connection refused")
	serverClient.On("PostOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, transportErr)

	err := fetcherCacher.CacheSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "token-value", 0, "integration-id", "configuration-id")

	assert.ErrorIs(t, err, transportErr)
}

func TestCacheSharedTokenErrorStatusWithBody(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	cacheResponseBody := io.NopCloser(strings.NewReader("boom"))
	defer cacheResponseBody.Close()

	serverClient.On("PostOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusInternalServerError,
		Body:       cacheResponseBody,
	}, nil)

	err := fetcherCacher.CacheSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "token-value", 0, "integration-id", "configuration-id")

	assert.EqualError(t, err, "failed to cache token, status code: 500: boom")
}

func TestCacheSharedTokenErrorStatusUnreadableBody(t *testing.T) {
	// A body read failure must not mask the status-code error.
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	serverClient.On("PostOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusInternalServerError,
		Body:       io.NopCloser(errReader{}),
	}, nil)

	err := fetcherCacher.CacheSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "token-value", 0, "integration-id", "configuration-id")

	assert.EqualError(t, err, "failed to cache token, status code: 500")
}

func TestCacheSharedTokenErrorStatusOversizedBodyIsCapped(t *testing.T) {
	// A pathological error body (e.g. an HTML error page) must not be read unbounded
	// into memory or the error message.
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	serverClient.On("PostOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusInternalServerError,
		Body:       io.NopCloser(strings.NewReader(strings.Repeat("x", 10000))),
	}, nil)

	err := fetcherCacher.CacheSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "token-value", 0, "integration-id", "configuration-id")

	assert.Error(t, err)
	assert.LessOrEqual(t, len(err.Error()), maxErrorBodyBytes+len("failed to cache token, status code: 500: "))
}

func TestInvalidateSharedTokenServerError(t *testing.T) {
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	deleteResponseBody := io.NopCloser(strings.NewReader("boom"))
	defer deleteResponseBody.Close()

	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusInternalServerError,
		Body:       deleteResponseBody,
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.Error(t, err)
}

func TestInvalidateSharedTokenNotFoundIsNoOp(t *testing.T) {
	// A 404 means the server predates this endpoint (rolling deploy / version skew). Eviction is
	// best-effort, so it must be treated as a benign no-op rather than an error.
	serverClient := &mocks.ServerClient{}
	fetcherCacher := NewApiFetcherCacher(serverClient, 0, 0, zap.NewNop())

	deleteResponseBody := io.NopCloser(strings.NewReader("not found"))
	defer deleteResponseBody.Close()

	serverClient.On("DeleteOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusNotFound,
		Body:       deleteResponseBody,
	}, nil)

	err := fetcherCacher.InvalidateSharedToken(string(OauthTokenExchange), nil, TokenTypeAccess, "datasource-id", "configuration-id")

	assert.NoError(t, err)
}

func TestFetchSharedToken(t *testing.T) {
	tests := []struct {
		name                    string
		eagerRefreshThresholdMs int64
		authType                string
		datasourceId            string
		configurationId         string
	}{
		{
			"oauth-code shared",
			2014,
			"oauth-code",
			"datasource-id",
			"configuration-id",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			serverClient := &mocks.ServerClient{}
			fetcherCacher := NewApiFetcherCacher(serverClient, tt.eagerRefreshThresholdMs, 0, zap.NewNop())

			getTokenResponseBody := io.NopCloser(strings.NewReader("{}"))
			defer getTokenResponseBody.Close()

			serverClient.On("GetOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
				StatusCode: http.StatusOK,
				Body:       getTokenResponseBody,
			}, nil)

			_, err := fetcherCacher.FetchSharedToken(tt.authType, nil, TokenTypeRefresh, tt.datasourceId, tt.configurationId)

			assert.NoError(t, err)
			assert.Equal(t, tt.eagerRefreshThresholdMs, serverClient.Mock.Calls[0].Arguments.Get(4).(*types.FetchTokenRequest).EagerRefreshThresholdMs)
		})
	}
}
