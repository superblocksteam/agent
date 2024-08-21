package clients

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/golang/protobuf/jsonpb"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	agentv1 "github.com/superblocksteam/agent/types/gen/go/agent/v1"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
)

// This ensures that the resolver implements the ServerClient interface.
var _ ServerClient = new(serverClient)

type serverClient struct {
	baseUrl             string
	client              HttpClient
	headers             map[string]string
	timeout             *time.Duration
	unmarshaler         *jsonpb.Unmarshaler
	superblocksAgentKey string
}

type ServerClientOptions struct {
	URL                 string
	Client              HttpClient
	Timeout             *time.Duration
	Headers             map[string]string // Extra headers to send with every fetch request.
	SuperblocksAgentKey string
}

type RegisterAgentBody struct {
	PluginVersions     map[string][]string `json:"pluginVersions"`
	Type               int                 `json:"type"`
	Tags               map[string][]string `json:"tags"`
	SigningKeyId       string              `json:"signingKeyId"`
	VerificationKeyIds []string            `json:"verificationKeyIds"`
	VerificationKeys   map[string]string   `json:"verificationKeys"`
}

//go:generate mockery --name=ServerClient --output ./mocks --structname ServerClient
type ServerClient interface {
	PostRegister(context.Context, *time.Duration, http.Header, url.Values, any) (*http.Response, error)                                                   // Registers an agent
	DeleteAgent(context.Context, *time.Duration, http.Header, url.Values) (*http.Response, error)                                                         // Deletes an agent
	PostHealthcheck(context.Context, *time.Duration, http.Header, url.Values, any) (*http.Response, error)                                                // Sends a healthcheck
	GetApi(context.Context, *time.Duration, http.Header, url.Values, string, bool, string) (*http.Response, error)                                        // Fetches an api
	PostDatasource(context.Context, *time.Duration, http.Header, url.Values, string) (*http.Response, error)                                              // Fetches an integration
	PostSpecificUserToken(context.Context, *time.Duration, http.Header, url.Values, any) (*http.Response, error)                                          // Create user specific auth token
	DeleteSpecificUserTokens(context.Context, *time.Duration, http.Header, url.Values) (*http.Response, error)                                            // Delete user specific auth token
	GetSpecificUserToken(context.Context, *time.Duration, http.Header, url.Values, any) (*http.Response, error)                                           // Fetch user specific auth token
	PostOrgUserToken(context.Context, *time.Duration, http.Header, url.Values, any) (*http.Response, error)                                               // Create org specific auth token
	DeleteOrgUserToken(context.Context, *time.Duration, http.Header, url.Values) (*http.Response, error)                                                  // Delete org specific auth token
	GetOrgUserToken(context.Context, *time.Duration, http.Header, url.Values, any) (*http.Response, error)                                                // Get org specific auth token
	GetIntegrationConfiguration(context.Context, *time.Duration, http.Header, url.Values, string) (*http.Response, error)                                 // Get integration configuration
	PostPendingJobs(context.Context, *time.Duration, http.Header, url.Values, any) (*http.Response, error)                                                // Post pending jobs
	PostAuditLogs(context.Context, *time.Duration, http.Header, url.Values, *agentv1.AuditLogRequest) (*http.Response, error)                             // Post audit logs
	PostGSheetsTokenRefresh(context.Context, *time.Duration, http.Header, url.Values, any) (*http.Response, error)                                        // Post GSheets token refresh
	GetIntegrations(context.Context, *time.Duration, http.Header, url.Values, bool) (*http.Response, error)                                               // Get configurations
	PatchApis(context.Context, *time.Duration, http.Header, url.Values, *apiv1.PatchApisRequest) (*http.Response, error)                                  // Patch APIs
	PutApplicationSignatures(context.Context, *time.Duration, http.Header, url.Values, *apiv1.UpdateApplicationSignaturesRequest) (*http.Response, error) // Put Application Signatures
	PostClaimKeyRotationResourcesForSigningV2(context.Context, *time.Duration, http.Header, *securityv1.ResourcesToResignRequest) (*http.Response, error) // Claim key rotation resources for signing

	// UNUSED by orchestrator. But used by other clients
	PostClaimKeyRotationResourcesForSigning(context.Context, *time.Duration, http.Header, *securityv1.ResourcesToResignRequest) (*http.Response, error) // Claim key rotation resources for signing
}

func (s *serverClient) PostRegister(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body any) (*http.Response, error) {
	headers = combineHeaders(map[string]string{
		"Content-Type": "application/json",
	}, headers)
	return s.sendRequest(ctx, timeout, http.MethodPost, "api/v1/agents/register", headers, query, body, true)
}

func (s *serverClient) DeleteAgent(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values) (*http.Response, error) {
	return s.sendRequest(ctx, timeout, http.MethodDelete, "api/v1/agents", headers, query, nil, true)
}

func (s *serverClient) PostHealthcheck(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body any) (*http.Response, error) {
	headers = combineHeaders(map[string]string{
		"Content-Type": "application/json",
	}, headers)
	return s.sendRequest(ctx, timeout, http.MethodPost, "api/v1/agents/healthcheck", headers, query, nil, true)
}

func (s *serverClient) GetApi(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, apiId string, useAgentKey bool, branchName string) (*http.Response, error) {
	path := fmt.Sprintf("%s/%s", "api/v3/apis", apiId)
	if branchName != "" {
		path = fmt.Sprintf("%s/%s/%s/%s", "api/v3/apis", apiId, "branches", url.PathEscape(branchName))
	}
	return s.sendRequest(ctx, timeout, http.MethodGet, path, headers, query, nil, useAgentKey)
}

// This is actually fetching the datasource, not creating one
func (s *serverClient) PostDatasource(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, integrationId string) (*http.Response, error) {
	path := fmt.Sprintf("%s/%s", "api/v1/agents/datasource", integrationId)
	return s.sendRequest(ctx, timeout, http.MethodPost, path, headers, query, nil, true)
}

func (s *serverClient) PostSpecificUserToken(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body any) (*http.Response, error) {
	headers = combineHeaders(map[string]string{
		"Content-Type": "application/json",
	}, headers)
	return s.sendRequest(ctx, timeout, http.MethodPost, "api/v1/agents/user/userToken", headers, query, body, true)
}

func (s *serverClient) GetSpecificUserToken(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body any) (*http.Response, error) {
	headers = combineHeaders(map[string]string{
		"Content-Type": "application/json",
	}, headers)
	return s.sendRequest(ctx, timeout, http.MethodGet, "api/v1/agents/user/userToken", headers, query, body, true)
}

func (s *serverClient) DeleteSpecificUserTokens(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values) (*http.Response, error) {
	return s.sendRequest(ctx, timeout, http.MethodDelete, "api/v1/agents/user/userToken", headers, query, nil, true)
}

func (s *serverClient) PostOrgUserToken(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body any) (*http.Response, error) {
	headers = combineHeaders(map[string]string{
		"Content-Type": "application/json",
	}, headers)
	return s.sendRequest(ctx, timeout, http.MethodPost, "api/v1/agents/userToken", headers, query, body, true)
}

func (s *serverClient) DeleteOrgUserToken(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values) (*http.Response, error) {
	return s.sendRequest(ctx, timeout, http.MethodDelete, "api/v1/agents/userToken", headers, query, nil, true)
}

func (s *serverClient) GetOrgUserToken(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body any) (*http.Response, error) {
	headers = combineHeaders(map[string]string{
		"Content-Type": "application/json",
	}, headers)
	return s.sendRequest(ctx, timeout, http.MethodGet, "api/v1/agents/userToken", headers, query, body, true)
}

func (s *serverClient) GetIntegrationConfiguration(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, integrationId string) (*http.Response, error) {
	path := fmt.Sprintf("%s/%s", "api/v1/agents/integrations", integrationId)
	return s.sendRequest(ctx, timeout, http.MethodGet, path, headers, query, nil, false)
}

// This should be deprecated...
func (s *serverClient) PostPendingJobs(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body any) (*http.Response, error) {
	return s.sendRequest(ctx, timeout, http.MethodPost, "api/v2/agents/pending-jobs", headers, query, body, true)
}

func (s *serverClient) PostAuditLogs(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body *agentv1.AuditLogRequest) (*http.Response, error) {
	headers = combineHeaders(map[string]string{
		"Content-Type": "application/json",
	}, headers)
	return s.sendRequest(ctx, timeout, http.MethodPost, "api/v2/agents/audit", headers, query, body, true)
}

func (s *serverClient) PostGSheetsTokenRefresh(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body any) (*http.Response, error) {
	headers = combineHeaders(map[string]string{
		"Content-Type": "application/json",
	}, headers)
	return s.sendRequest(ctx, timeout, http.MethodPost, "api/v1/oauth2/gsheets/refresh", headers, query, body, true)
}

func (s *serverClient) GetIntegrations(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, useAgentKey bool) (*http.Response, error) {
	return s.sendRequest(ctx, timeout, http.MethodGet, "api/v1/integrations", headers, query, nil, useAgentKey)
}

func (s *serverClient) PatchApis(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body *apiv1.PatchApisRequest) (*http.Response, error) {
	return s.sendRequest(ctx, timeout, http.MethodPatch, "api/v3/apis", headers, query, body, true)
}

func (s *serverClient) PutApplicationSignatures(ctx context.Context, timeout *time.Duration, headers http.Header, query url.Values, body *apiv1.UpdateApplicationSignaturesRequest) (*http.Response, error) {
	return s.sendRequest(ctx, timeout, http.MethodPut, "api/v2/applications/signatures", headers, query, body, true)
}

func (s *serverClient) PostClaimKeyRotationResourcesForSigning(ctx context.Context, timeout *time.Duration, headers http.Header, body *securityv1.ResourcesToResignRequest) (*http.Response, error) {
	return s.sendRequest(ctx, timeout, http.MethodPost, "api/v1/keyrotations/claim-resources", headers, nil, body, false)
}

func (s *serverClient) PostClaimKeyRotationResourcesForSigningV2(ctx context.Context, timeout *time.Duration, headers http.Header, body *securityv1.ResourcesToResignRequest) (*http.Response, error) {
	return s.sendRequest(ctx, timeout, http.MethodPost, "api/v2/keyrotations/claim-resources", headers, nil, body, true)
}

func (s *serverClient) sendRequest(ctx context.Context, timeout *time.Duration, method string, path string, headers http.Header, query url.Values, body any, useAgentKey bool) (*http.Response, error) {
	if useAgentKey {
		headers = combineHeaders(map[string]string{
			"x-superblocks-agent-key": s.superblocksAgentKey,
		}, headers)
	}

	if timeout == nil {
		timeout = s.timeout
	}

	ctx, _ = context.WithTimeout(ctx, *timeout)

	req, err := s.buildRequest(ctx, method, path, headers, query, body)
	if err != nil {
		return nil, err
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}

	return resp, nil
}

func (s *serverClient) buildRequest(ctx context.Context, method string, path string, headers http.Header, query url.Values, body any) (*http.Request, error) {
	return buildRequest(ctx, method, s.baseUrl, path, combineHeaders(s.headers, headers), query, body)
}

func NewServerClient(options *ServerClientOptions) ServerClient {
	var client HttpClient
	{
		if options.Client == nil {
			client = tracer.DefaultHttpClient()
		} else {
			client = options.Client
		}
	}

	if options.Timeout == nil {
		timeout := 1 * time.Minute
		options.Timeout = &timeout
	}

	return &serverClient{
		baseUrl:             options.URL,
		client:              client,
		headers:             options.Headers,
		timeout:             options.Timeout,
		unmarshaler:         &jsonpb.Unmarshaler{AllowUnknownFields: true},
		superblocksAgentKey: options.SuperblocksAgentKey,
	}
}
