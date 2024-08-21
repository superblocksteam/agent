package oauth

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
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
			fetcherCacher := NewApiFetcherCacher(serverClient, tt.eagerRefreshThresholdMs)

			ctx := context.Background()

			getTokenResponseBody := io.NopCloser(strings.NewReader("{}"))
			defer getTokenResponseBody.Close()

			serverClient.On("GetSpecificUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
				StatusCode: http.StatusOK,
				Body:       getTokenResponseBody,
			}, nil)

			_, err := fetcherCacher.FetchUserToken(ctx, tt.authType, nil, TokenTypeRefresh)

			assert.NoError(t, err)
			assert.Equal(t, tt.eagerRefreshThresholdMs, serverClient.Mock.Calls[0].Arguments.Get(4).(*FetchTokenRequest).EagerRefreshThresholdMs)
		})
	}
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
			fetcherCacher := NewApiFetcherCacher(serverClient, tt.eagerRefreshThresholdMs)

			getTokenResponseBody := io.NopCloser(strings.NewReader("{}"))
			defer getTokenResponseBody.Close()

			serverClient.On("GetOrgUserToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
				StatusCode: http.StatusOK,
				Body:       getTokenResponseBody,
			}, nil)

			_, err := fetcherCacher.FetchSharedToken(tt.authType, nil, TokenTypeRefresh, tt.datasourceId, tt.configurationId)

			assert.NoError(t, err)
			assert.Equal(t, tt.eagerRefreshThresholdMs, serverClient.Mock.Calls[0].Arguments.Get(4).(*FetchTokenRequest).EagerRefreshThresholdMs)
		})
	}
}
