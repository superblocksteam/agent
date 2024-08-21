package fetch

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/golang/protobuf/jsonpb"
	"github.com/superblocksteam/agent/pkg/clients"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	syncerv1 "github.com/superblocksteam/agent/types/gen/go/syncer/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/runtime/protoiface"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	QueryParamEnvironment = "environment"
	QueryParamProfileName = "profile"
	QueryParamProfileID   = "profileId"
	QueryParamTest        = "test"
	QueryParamAuth        = "sb-auth"
	QueryParamRawResults  = "raw"
	QueryParamAsync       = "async"
)

type fetcher struct {
	serverClient clients.ServerClient
	intakeClient clients.IntakeClient
	logger       *zap.Logger
	unmarshaler  *jsonpb.Unmarshaler
}

type Options struct {
	ServerClient clients.ServerClient
	IntakeClient clients.IntakeClient
	Logger       *zap.Logger
}

// NOTE(frank): We mix proto request objects and unwrapped request objects here.
// Ideally we move to somethign like go-kit so we can separate the transport layer.
//
//go:generate mockery --name=Fetcher --output ./mocks --structname Fetcher
type Fetcher interface {
	FetchApi(context context.Context, request *apiv1.ExecuteRequest_Fetch, useAgentKey bool) (*apiv1.Definition, *structpb.Struct, error)
	FetchScheduledJobs(context.Context) (*transportv1.FetchScheduleJobResp, error)
	FetchIntegrationMetadata(context.Context, string) (*integrationv1.GetIntegrationResponse, error)
	FetchIntegration(context context.Context, integrationId string, profile *commonv1.Profile) (*Integration, error)
	FetchIntegrations(context.Context, *integrationv1.GetIntegrationsRequest, bool) (*integrationv1.GetIntegrationsResponse, error)
	DeleteSpecificUserTokens(context.Context) error
	UpsertMetadata(context.Context, *syncerv1.UpsertMetadataRequest) error
}

type FetchIntegrationResponse struct {
	Data struct {
		Integration *Integration `json:"datasource"`
	} `json:"data"`
}

type Integration struct {
	PluginId      string                 `json:"pluginId"`
	Configuration map[string]interface{} `json:"configuration"`
}

func New(options *Options) Fetcher {
	return &fetcher{
		serverClient: options.ServerClient,
		intakeClient: options.IntakeClient,
		logger:       options.Logger,
		unmarshaler:  &jsonpb.Unmarshaler{AllowUnknownFields: true},
	}
}

func (f *fetcher) FetchApi(ctx context.Context, options *apiv1.ExecuteRequest_Fetch, useAgentKey bool) (*apiv1.Definition, *structpb.Struct, error) {
	logger := utils.ContexualLogger(ctx, f.logger.With(zap.String("id", options.Id)))

	resp, err := tracer.Observe(ctx, "fetch.api", map[string]any{
		observability.OBS_TAG_RESOURCE_ID: options.Id,
	}, func(ctx context.Context, _ trace.Span) (*http.Response, error) {
		return f.sendFetchApiRequest(ctx, options, useAgentKey)
	}, nil)

	if resp == nil {
		logger.Error("could not fetch api from superblocks: response is nil", zap.Error(err))
		return nil, nil, new(sberrors.InternalError)
	}
	defer resp.Body.Close()

	if i, e := clients.Check(err, resp); e != nil {
		logger.Error(
			"could not fetch api from superblocks",
			zap.NamedError("originalErr", err),
			zap.NamedError("internalError", i),
			zap.NamedError("externalError", e),
			zap.Int("resp.StatusCode", respStatusCode(resp)),
			zap.String("resp.StatusCode.String", http.StatusText(respStatusCode(resp))),
			zap.Error(i),
		)
		return nil, nil, e
	}

	respData, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error("could not read fetch api response body", zap.Error(err))
		return nil, nil, new(sberrors.InternalError)
	}

	var result apiv1.Definition
	{
		if err := f.unmarshaler.Unmarshal(bytes.NewReader(respData), &result); err != nil {
			logger.Error("could not unmarshal api", zap.Error(err))
			return nil, nil, new(sberrors.InternalError)
		}
	}

	var rawResult structpb.Struct
	{
		if err := f.unmarshaler.Unmarshal(bytes.NewReader(respData), &rawResult); err != nil {
			logger.Error("could not unmarshal raw response into struct", zap.Error(err))
			return nil, nil, new(sberrors.InternalError)
		}

		if sig := result.GetApi().GetSignature().GetData(); sig != nil {
			rawResultSig, err := utils.GetStructField(&rawResult, "api.signature")
			if err != nil {
				logger.Error("could not unmarshal raw response into struct", zap.Error(err))
				return nil, nil, new(sberrors.InternalError)
			}

			rawResultSig.GetStructValue().Fields["data"] = structpb.NewStringValue(string(sig))
		}
	}

	return &result, &rawResult, nil
}

func (f *fetcher) FetchIntegrationMetadata(ctx context.Context, integrationId string) (*integrationv1.GetIntegrationResponse, error) {
	logger := f.logger.With(zap.String("integrationId", integrationId))

	resp, err := tracer.Observe(ctx, "fetch.integrationMetadata", map[string]any{ // todo: ask frank what this is exactly doing
		"integration-id": integrationId,
	}, func(context.Context, trace.Span) (*http.Response, error) {
		return f.sendFetchIntegrationMetadataRequest(ctx, integrationId)
	}, func(elapsed int64) {
		logger.Info(fmt.Sprintf("fetching integration (%s) took %dms", integrationId, elapsed), zap.Int64("duration", elapsed))
	})

	var typed integrationv1.GetIntegrationResponse
	{
		if err := f.process(resp, err, &typed); err != nil {
			logger.Error("could not fetch integration metadata from superblocks", zap.Error(err))
			return nil, err
		}
	}

	return &typed, nil
}

func (f *fetcher) FetchIntegration(ctx context.Context, integrationId string, profile *commonv1.Profile) (*Integration, error) {
	logger := f.logger.With(zap.String("integration_id", integrationId))
	headers := map[string][]string{}

	if metadata, ok := metadata.FromIncomingContext(ctx); ok {
		headers["Authorization"] = metadata.Get("authorization")
		headers["X-Superblocks-Authorization"] = metadata.Get("x-superblocks-authorization")
	}

	query := url.Values{}
	if profile != nil {
		if profile.Name != nil {
			query.Set(QueryParamProfileName, *profile.Name)
		}
		if profile.Id != nil {
			query.Set(QueryParamProfileID, *profile.Id)
		}
	}

	var cancel context.CancelFunc

	resp, err := tracer.Observe(ctx, "fetch.integration", map[string]any{
		"integration-id": integrationId,
	}, func(context.Context, trace.Span) (*http.Response, error) {
		return f.serverClient.PostDatasource(ctx, nil, headers, query, integrationId)
	}, func(elapsed int64) {
		logger.Info(fmt.Sprintf("fetching integration (%s) took %dms", integrationId, elapsed), zap.Int64("duration", elapsed))
	})

	if cancel != nil {
		defer cancel()
	}

	if resp != nil {
		defer resp.Body.Close()
	} else {
		logger.Error("could not fetch integration from superblocks: response is nil", zap.Error(err))
		return nil, new(sberrors.InternalError)
	}

	if i, e := clients.Check(err, resp); e != nil {
		bs, err := io.ReadAll(resp.Body)
		if err != nil {
			logger.Error(
				"could not fetch integration from superblocks",
				zap.NamedError("originalErr", err),
				zap.NamedError("internalError", i),
				zap.NamedError("externalError", e),
				zap.Int("resp.StatusCode", respStatusCode(resp)),
				zap.String("resp.StatusCode.String", http.StatusText(respStatusCode(resp))),
				zap.Error(i),
			)
		} else {
			logger.Error("could not fetch integration from superblocks", zap.Error(i), zap.String("resp", string(bs)))
		}
		return nil, e
	}

	var result FetchIntegrationResponse
	{
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			logger.Error("could not unmarshal integration configurations", zap.Error(err))
			return nil, new(sberrors.InternalError)
		}
	}

	if result.Data.Integration == nil {
		return nil, new(sberrors.NotFoundError)
	}

	return result.Data.Integration, nil
}

func (f *fetcher) FetchScheduledJobs(ctx context.Context) (*transportv1.FetchScheduleJobResp, error) {
	var cancel context.CancelFunc

	resp, err := tracer.Observe(
		ctx,
		"fetch.job",
		map[string]any{},
		func(context.Context, trace.Span) (*http.Response, error) {
			return f.sendFetchScheduleJobRequest(ctx)
		},
		nil,
	)

	if cancel != nil {
		defer cancel()
	}

	if i, e := clients.Check(err, resp); e != nil {
		f.logger.Error(
			"could not fetch scheduled jobs from superblocks",
			zap.NamedError("originalErr", err),
			zap.NamedError("internalError", i),
			zap.NamedError("externalError", e),
			zap.Int("resp.StatusCode", respStatusCode(resp)),
			zap.String("resp.StatusCode.String", http.StatusText(respStatusCode(resp))),
			zap.Error(i),
		)
		return nil, e
	}

	if resp != nil {
		defer resp.Body.Close()
	} else {
		f.logger.Error("could not fetch scheduled jobs from superblocks: response is nil", zap.Error(err))
		return nil, new(sberrors.InternalError)
	}

	var result transportv1.FetchScheduleJobResp
	{
		if err := f.unmarshaler.Unmarshal(resp.Body, &result); err != nil {
			f.logger.Error("could not unmarshal api", zap.Error(err))
			return nil, new(sberrors.InternalError)
		}
	}

	return &result, nil
}

// NOTE(frank: All of this becomes SO MUCH EASIER the server exposes a gRPC client.
func (f *fetcher) FetchIntegrations(ctx context.Context, req *integrationv1.GetIntegrationsRequest, useAgentKey bool) (*integrationv1.GetIntegrationsResponse, error) {
	query := map[string][]string{}
	{
		if req.Profile != nil {
			if req.Profile.Name != nil {
				query[QueryParamProfileName] = []string{*req.Profile.Name}
			}

			if req.Profile.Id != nil {
				query[QueryParamProfileID] = []string{*req.Profile.Id}
			}
		}

		if req.Slug != nil {
			query["slug"] = []string{*req.Slug}
		}

		if req.Kind != nil {
			query["kind"] = []string{strings.TrimPrefix((*req.Kind).String(), "KIND_")}
		}

		for _, integration := range req.Ids {
			if _, ok := query["id"]; !ok {
				query["id"] = []string{}
			}

			query["id"] = append(query["id"], integration)
		}
	}

	// NOTE(frank): There is no other access pattern here. Just the proxied bearer token.
	headers := map[string][]string{}
	{
		if metadata, ok := metadata.FromIncomingContext(ctx); ok {
			headers["Authorization"] = metadata.Get("authorization") // NOTE(frank): Maybe we just pass all of the metadata?
			headers["X-Superblocks-Authorization"] = metadata.Get("x-superblocks-authorization")
		}
	}

	resp, err := tracer.Observe(ctx, "fetch.integrations", nil, func(context.Context, trace.Span) (*http.Response, error) {
		return f.serverClient.GetIntegrations(ctx, nil, headers, query, useAgentKey)
	}, nil)

	if i, e := clients.Check(err, resp); e != nil {
		f.logger.Error(
			"could not fetch integrations",
			zap.NamedError("details", i),
			zap.NamedError("originalErr", err),
			zap.NamedError("internalError", i),
			zap.NamedError("externalError", e),
			zap.Int("resp.StatusCode", respStatusCode(resp)),
			zap.String("resp.StatusCode.String", http.StatusText(respStatusCode(resp))),
			zap.Error(e),
		)
		return nil, e
	}

	var typed integrationv1.GetIntegrationsResponse
	{
		if err := f.process(resp, err, &typed); err != nil {
			f.logger.Error("could not parse integrations response", zap.Error(err))
			return nil, new(sberrors.InternalError)
		}
	}

	return &typed, nil
}

func (f *fetcher) UpsertMetadata(ctx context.Context, req *syncerv1.UpsertMetadataRequest) error {
	logger := f.logger.With(zap.String("operation", "upsertMetadata"))

	resp, err := tracer.Observe(ctx, "flush.intake.metadata", nil, func(context.Context, trace.Span) (*http.Response, error) {
		return f.intakeClient.UpsertMetadata(ctx, nil, req)
	}, nil)

	if resp != nil {
		defer resp.Body.Close()
	} else {
		logger.Error("could not upsert configuration metadata: response is nil", zap.Error(err))
		return new(sberrors.InternalError)
	}

	if i, e := clients.Check(err, resp); e != nil {
		logger.Error(
			"could not upsert configuration metadata",
			zap.NamedError("originalErr", err),
			zap.NamedError("internalError", i),
			zap.NamedError("externalError", e),
			zap.Int("resp.StatusCode", respStatusCode(resp)),
			zap.String("resp.StatusCode.String", http.StatusText(respStatusCode(resp))),
			zap.Error(i),
		)
		return e
	}

	// TODO(frank): Potentially handle errors in the response body.

	return nil
}

// NOTE(frank): We're not going to try to fail fast with authorization.
func (f *fetcher) sendFetchApiRequest(ctx context.Context, options *apiv1.ExecuteRequest_Fetch, useAgentKey bool) (*http.Response, error) {
	headers := map[string][]string{}
	{
		// The token is generally used for organization level access, whereas the authorization header is used for user level access (more locked down)
		if options.Token != nil && *options.Token != "" {
			headers["x-superblocks-api-key"] = []string{*options.Token}
		} else {
			if metadata, ok := metadata.FromIncomingContext(ctx); ok {
				headers["Authorization"] = metadata.Get("authorization") // NOTE(frank): Maybe we just pass all of the metadata?
				headers["X-Superblocks-Authorization"] = metadata.Get("x-superblocks-authorization")
			}
		}
	}

	query := url.Values{}

	query.Set("hydrate", "true")
	query.Set("v2", "true")

	if profile := options.Profile; profile != nil {
		if profile.Name != nil {
			query.Set(QueryParamProfileName, *profile.Name)
		}
		if profile.Environment != nil {
			query.Set(QueryParamEnvironment, *profile.Environment)
		}
		if profile.Id != nil {
			query.Set(QueryParamProfileID, *profile.Id)
		}
	}

	if (options.Test != nil && !*options.Test) || options.ViewMode == apiv1.ViewMode_VIEW_MODE_DEPLOYED {
		query.Set("isPublished", "true")
	}

	// https://github.com/superblocksteam/superblocks/blob/master/packages/shared/src/types/event/index.ts#L24-L28
	switch options.ViewMode {
	case apiv1.ViewMode_VIEW_MODE_EDIT:
		query.Set("viewMode", "editor")
	case apiv1.ViewMode_VIEW_MODE_PREVIEW:
		query.Set("viewMode", "preview")
	case apiv1.ViewMode_VIEW_MODE_DEPLOYED:
		query.Set("viewMode", "deployed")
	}

	if options.CommitId != nil {
		query.Set("commitId", *options.CommitId)
	}

	branchName := ""
	if options.BranchName != nil {
		branchName = *options.BranchName
	}

	return f.serverClient.GetApi(ctx, nil, headers, query, options.Id, useAgentKey, branchName)
}

func (f *fetcher) DeleteSpecificUserTokens(ctx context.Context) error {
	headers := map[string][]string{}

	if metadata, ok := metadata.FromIncomingContext(ctx); ok {
		headers["Authorization"] = metadata.Get("authorization")
		headers["X-Superblocks-Authorization"] = metadata.Get("x-superblocks-authorization")
	}

	resp, err := f.serverClient.DeleteSpecificUserTokens(ctx, nil, headers, nil)
	if err != nil {
		return err
	}

	if resp != nil {
		defer resp.Body.Close()
	} else {
		f.logger.Warn("could not delete user token: response is nil", zap.Error(err))
		return new(sberrors.InternalError)
	}

	if i, e := clients.Check(err, resp); e != nil {
		bs, err := io.ReadAll(resp.Body)
		if err != nil {
			f.logger.Warn(
				"could not fetch integration from superblocks",
				zap.NamedError("originalErr", err),
				zap.NamedError("internalError", i),
				zap.NamedError("externalError", e),
				zap.Int("resp.StatusCode", respStatusCode(resp)),
				zap.String("resp.StatusCode.String", http.StatusText(respStatusCode(resp))),
				zap.Error(i),
			)
		} else {
			f.logger.Warn(
				"could not fetch integration from superblocks",
				zap.NamedError("originalErr", err),
				zap.NamedError("internalError", i),
				zap.NamedError("externalError", e),
				zap.Int("resp.StatusCode", respStatusCode(resp)),
				zap.String("resp.StatusCode.String", http.StatusText(respStatusCode(resp))),
				zap.Error(i),
				zap.String("resp", string(bs)),
			)
		}
		return e
	}

	return nil
}

func (f *fetcher) sendFetchIntegrationMetadataRequest(ctx context.Context, integrationId string) (*http.Response, error) {
	headers := map[string][]string{}

	if metadata, ok := metadata.FromIncomingContext(ctx); ok {
		headers["Authorization"] = metadata.Get("authorization")
		headers["X-Superblocks-Authorization"] = metadata.Get("x-superblocks-authorization")
	}

	return f.serverClient.GetIntegrationConfiguration(ctx, nil, headers, nil, integrationId)
}

func (f *fetcher) sendFetchScheduleJobRequest(ctx context.Context) (*http.Response, error) {
	return f.serverClient.PostPendingJobs(ctx, nil, nil, nil, nil)
}

func (f *fetcher) process(resp *http.Response, err error, dest protoiface.MessageV1) error {
	if resp == nil {
		return nil
	}

	if resp != nil && resp.Body != nil {
		defer resp.Body.Close()
	}

	if i, e := clients.Check(err, resp); e != nil {
		f.logger.Error(
			"Encountered an error while processing response",
			zap.NamedError("originalErr", err),
			zap.NamedError("internalError", i),
			zap.NamedError("externalError", e),
			zap.Int("resp.StatusCode", respStatusCode(resp)),
			zap.String("resp.StatusCode.String", http.StatusText(respStatusCode(resp))),
			zap.Error(i),
		)
		return e
	}

	if resp.Body == nil {
		return nil
	}

	if err := f.unmarshaler.Unmarshal(resp.Body, dest); err != nil {
		return err
	}

	return nil
}

func respStatusCode(resp *http.Response) int {
	if resp != nil {
		return resp.StatusCode
	}
	return 0
}
