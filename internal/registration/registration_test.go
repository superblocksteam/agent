package registration

import (
	"context"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	clients "github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
	"go.uber.org/zap"
)

func TestRegistrationRequest(t *testing.T) {
	t.Parallel()
	mockHttpClient := mocks.NewHttpClient(t)
	mockHttpClient.On("Do", mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       http.NoBody,
	}, nil)

	logger := zap.NewNop()

	serverClient := clients.NewServerClient(&clients.ServerClientOptions{
		URL: "https://foo.bar.com",
		Headers: map[string]string{
			"x-superblocks-agent-id": "foobar",
		},
		Client:              mockHttpClient,
		SuperblocksAgentKey: "foobar",
	})

	registrator := New(&Options{
		Logger:               logger,
		ServerClient:         serverClient,
		Tags:                 map[string][]string{"foo": {"bar"}},
		AgentUrl:             "http://localhost:8080",
		AgentVersion:         "0.0.1",
		AgentVersionExternal: "0.0.2",
		Environment:          "*",
		SigningKeyId:         "123",
		VerificationKeys: map[string]string{
			"123": "key1",
		},
	}).(*registrator)

	err := registrator.register(context.Background())
	assert.NoError(t, err)

	expectedRequestHeaders := http.Header{}
	expectedRequestHeaders.Set("x-superblocks-agent-key", "foobar")
	expectedRequestHeaders.Set("x-superblocks-agent-id", "foobar")
	expectedRequestHeaders.Set("x-superblocks-agent-host-url", "http://localhost:8080")
	expectedRequestHeaders.Set("x-superblocks-agent-version", "0.0.1")
	expectedRequestHeaders.Set("x-superblocks-agent-version-external", "0.0.2")
	expectedRequestHeaders.Set("x-superblocks-agent-environment", "*")
	expectedRequestHeaders.Set("content-type", "application/json")

	mockHttpClient.AssertNumberOfCalls(t, "Do", 1)
	request := mockHttpClient.Calls[0].Arguments[0].(*http.Request)
	body, err := io.ReadAll(request.Body)
	assert.NoError(t, err)
	assert.Equal(t, "https://foo.bar.com/api/v1/agents/register", request.URL.String())
	assert.Equal(t, http.MethodPost, request.Method)
	assert.Equal(t, expectedRequestHeaders, request.Header)
	assert.Equal(t, "{\"pluginVersions\":{\"athena\":[\"0.0.1\"],\"bigquery\":[\"0.0.7\"],\"cockroachdb\":[\"0.0.2\"],\"confluent\":[\"0.0.1\"],\"cosmosdb\":[\"0.0.1\"],\"couchbase\":[\"0.0.2\"],\"databricks\":[\"0.0.1\"],\"dynamodb\":[\"0.0.7\"],\"email\":[\"0.0.7\"],\"gcs\":[\"0.0.1\"],\"graphql\":[\"0.0.8\"],\"gsheets\":[\"0.0.18\"],\"javascript\":[\"0.0.9\"],\"kafka\":[\"0.0.1\"],\"kinesis\":[\"0.0.1\"],\"mariadb\":[\"0.0.11\"],\"mongodb\":[\"0.0.7\"],\"mssql\":[\"0.0.10\"],\"mysql\":[\"0.0.11\"],\"openai\":[\"0.0.3\"],\"oracledb\":[\"0.0.1\"],\"postgres\":[\"0.0.11\"],\"python\":[\"0.0.7\"],\"redis\":[\"0.0.1\"],\"redpanda\":[\"0.0.1\"],\"redshift\":[\"0.0.7\"],\"restapi\":[\"0.0.12\"],\"restapiintegration\":[\"0.0.13\"],\"rockset\":[\"0.0.7\"],\"s3\":[\"0.0.10\"],\"salesforce\":[\"0.0.1\"],\"smtp\":[\"0.0.1\"],\"snowflake\":[\"0.0.7\"],\"superblocks-ocr\":[\"0.0.1\"],\"workflow\":[\"0.0.4\"]},\"type\":2,\"tags\":{\"foo\":[\"bar\"]},\"signingKeyId\":\"123\",\"verificationKeyIds\":[\"123\"],\"verificationKeys\":{\"123\":\"key1\"}}\n", string(body))
}
