package executor

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/buger/jsonparser"
	"github.com/google/uuid"
	"github.com/superblocksteam/agent/internal/auth"
	"github.com/superblocksteam/agent/internal/fetch"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/constants"
	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/crypto/signature"
	"github.com/superblocksteam/agent/pkg/engine"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/store/gc"
	"github.com/superblocksteam/agent/pkg/template"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/template/plugins/mustache"
	"github.com/superblocksteam/agent/pkg/template/plugins/noop"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/validation"
	agentv1 "github.com/superblocksteam/agent/types/gen/go/agent/v1"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	pluginscommon "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	workflowv1pkg "github.com/superblocksteam/agent/types/gen/go/plugins/workflow/v1"
	v2 "github.com/superblocksteam/agent/types/gen/go/plugins/workflow/v2"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	storev1 "github.com/superblocksteam/agent/types/gen/go/store/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func ResolveTemplate[T any](ctx *apictx.Context, sandbox engine.Sandbox, logger *zap.Logger, template string, json bool, options ...engine.ResultOption) (*T, error) {
	e, err := sandbox.Engine(ctx.Context)
	if err != nil {
		return nil, err
	}
	defer e.Close()

	value := e.Resolve(ctx.Context, template, ctx.Variables)

	var resolved any
	{
		var err error

		if json {
			resolved, err = value.JSON()
		} else {
			resolved, err = value.Result(options...)
		}

		if err != nil {
			return nil, err
		}
	}

	if opts := engine.Apply(options...); opts.Source != nil && ctx.RequestOptions.IncludeResolved {
		var proto *structpb.Value
		{
			switch v := resolved.(type) {
			case []string:
				proto = encodedArrayToGoogleValue(v)
			default:
				if proto, err = structpb.NewValue(resolved); err != nil {
					logger.Warn("could not convert resolved value to proto; this is not in the critical path", zap.Error(err))
				}
			}
		}

		ctx.Resolve(*opts.Source, "", proto)
	}

	typed, ok := resolved.(T)
	if !ok {
		return nil, sberrors.BindingError(fmt.Errorf("binding expression resolved to the wrong type (%v)", resolved))
	}

	return &typed, nil
}

func Execute(ctx context.Context, options *Options, send func(*apiv1.StreamResponse) error) (done *Done, err error, userError error) {
	ctx = constants.WithApiType(
		constants.WithApiStartTime(
			ctx,
			time.Now().UnixMilli(),
		),
		utils.ApiType(options.Api),
	)

	execution, err := New(ctx, options)
	if err != nil {
		return nil, err, nil
	}

	go execution.Run(ctx)

	metrics.ApiExecutionEventsTotal.WithLabelValues("started", utils.ApiType(options.Api)).Inc()

	defer func() {
		var status string
		{
			if userError != nil || err != nil {
				status = "failed"
			} else {
				status = "succeeded"
			}
		}

		metrics.ApiExecutionEventsTotal.WithLabelValues(status, utils.ApiType(options.Api)).Inc()
	}()

	var internalError error

	for {
		select {
		case resp := <-execution.Event():
			if err := sberrors.ToCommonV1(ExtractErrorFromEvent(resp.GetEvent())); err != nil {
				userError = err
			}

			if err := resp.err; err != nil {
				handleQuotaError(resp.err, options, resp.GetEvent().Type)
				internalError = err
			}

			if send == nil {
				continue
			}

			if err := send(resp.StreamResponse); err != nil {
				options.Logger.Warn("could not send stream response", zap.Error(err))
			}
		case done := <-execution.Done():
			if send != nil {
				var response *apiv1.Event_Response = new(apiv1.Event_Response)
				{
					if done != nil {
						response.Last = done.Last
					}
				}

				if err := send(&apiv1.StreamResponse{
					Execution: execution.ID(),
					Event: &apiv1.Event{
						Name:      options.Api.GetMetadata().GetName(),
						Timestamp: timestamppb.New(time.Now()), // NOTE(frank): ugh, we use our fake time abstraction
						Event: &apiv1.Event_Response_{
							Response: response,
						},
					},
				}); err != nil {
					options.Logger.Warn("could not send stream response", zap.Error(err))
				}

				options.Logger.Info("completed execution", zap.String("id", execution.ID()))
			}

			handleTerminalQuotaError(internalError, options)
			return done, nil, userError
		}
	}
}

func Fetch(ctx context.Context, request *apiv1.ExecuteRequest, fetcher fetch.Fetcher, useAgentKey bool, logger *zap.Logger) (*apiv1.Definition, *structpb.Struct, error) {
	var def *apiv1.Definition
	var rawDef *structpb.Struct
	var err error

	if request.GetDefinition() != nil {
		if def, rawDef, err = fetchDefinitionFromRequest(ctx, request, fetcher, useAgentKey, logger); err != nil {
			return nil, nil, err
		}
	} else if f := request.GetFetch(); f != nil {
		if def, rawDef, err = fetcher.FetchApi(ctx, f, useAgentKey); err != nil {
			metrics.ApiFetchRequestsTotal.WithLabelValues("failed").Inc()
			return nil, nil, err
		}

		metrics.ApiFetchRequestsTotal.WithLabelValues("succeeded").Inc()
	} else if f := request.GetFetchByPath(); f != nil {
		if def, rawDef, err = fetcher.FetchApiByPath(ctx, f, useAgentKey); err != nil {
			metrics.ApiFetchRequestsTotal.WithLabelValues("failed").Inc()
			return nil, nil, err
		}

		metrics.ApiFetchRequestsTotal.WithLabelValues("succeeded").Inc()
	}

	if def == nil {
		return nil, nil, fmt.Errorf("malformed execute request: %w", err)
	}

	if def.Metadata == nil {
		def.Metadata = &apiv1.Definition_Metadata{} // NOTE(frank): Trying to prevent some nil pointers :)
	}

	if err := utils.ProtoValidate(def); err != nil {
		return nil, nil, err
	}

	if err := utils.ProtoValidate(rawDef); err != nil {
		return nil, nil, err
	}

	if errs := validation.ValidateDefinition(def); len(errs) > 0 {
		return nil, nil, errors.Join(errs...)
	}

	return def, rawDef, nil
}

func viewModeEnumToString(vm apiv1.ViewMode) string {
	switch vm {
	case apiv1.ViewMode_VIEW_MODE_EDIT:
		return "editor"
	case apiv1.ViewMode_VIEW_MODE_PREVIEW:
		return "preview"
	case apiv1.ViewMode_VIEW_MODE_DEPLOYED:
		return "deployed"
	default:
		return ""
	}
}

func fetchDefinitionFromRequest(ctx context.Context, request *apiv1.ExecuteRequest, fetcher fetch.Fetcher, useAgentKey bool, logger *zap.Logger) (*apiv1.Definition, *structpb.Struct, error) {
	def := request.GetDefinition()

	// Security: For inline definitions, validate profile restrictions before execution
	// Collect all integration IDs and determine which ones need to be fetched
	allIntegrationIds := make([]string, 0)
	integrationsToFetch := make([]string, 0)

	utils.ForEachBlockInAPI(def.GetApi(), func(block *apiv1.Block) {
		if step := block.GetStep(); step != nil && step.Integration != "" {
			allIntegrationIds = append(allIntegrationIds, step.Integration)
			// Check if we need to fetch this integration
			if _, ok := def.Integrations[step.Integration]; !ok {
				integrationsToFetch = append(integrationsToFetch, step.Integration)
			}
		}
	})

	// Validate profile restrictions if viewMode is explicitly provided
	if len(allIntegrationIds) > 0 && request.GetProfile() != nil && request.ViewMode != apiv1.ViewMode_VIEW_MODE_UNSPECIFIED {
		viewModeStr := viewModeEnumToString(request.ViewMode)

		err := fetcher.ValidateProfile(ctx, &integrationv1.ValidateProfileRequest{
			Profile:        request.GetProfile(),
			ViewMode:       viewModeStr,
			IntegrationIds: allIntegrationIds,
		})
		if err != nil {
			logger.Warn("profile validation failed for inline definition", zap.Error(err))
			return nil, nil, err
		}
	}

	// Fetch missing integration configurations
	if len(integrationsToFetch) > 0 {
		resp, err := fetcher.FetchIntegrations(ctx, &integrationv1.GetIntegrationsRequest{
			Ids:     integrationsToFetch,
			Profile: request.GetProfile(),
		}, useAgentKey)
		if err != nil {
			logger.Warn("integration fetch failed for inline definition", zap.Error(err))
			return nil, nil, err
		}

		if def.Integrations == nil {
			def.Integrations = map[string]*structpb.Struct{}
		}

		for _, integration := range resp.Data {
			if integration == nil || len(integration.Configurations) == 0 {
				logger.Warn("integration has no configurations", zap.String("id", integration.GetId()))
				continue
			}
			def.Integrations[integration.Id] = integration.Configurations[0].Configuration
		}
	}

	contains, err := utils.ContainsSuperblocksSecrets(def.GetApi(), def.GetIntegrations())
	if err != nil {
		contains = true // We're opting for a potentially slower execution than a failed one.
	}

	if contains && def.GetStores() == nil {
		stores, err := FetchSecretStores(ctx, fetcher, request.GetProfile().GetName(), useAgentKey, logger)
		if err != nil {
			logger.Error("failed to fetch secret stores", zap.Error(err))
			return nil, nil, err
		}

		def.Stores = &storev1.Stores{
			Secrets: stores,
		}
	}
	def.Metadata = &apiv1.Definition_Metadata{
		Profile:          request.GetProfile().GetName(),
		OrganizationPlan: request.GetDefinition().GetMetadata().GetOrganizationPlan(),
		OrganizationName: request.GetDefinition().GetMetadata().GetOrganizationName(),
	}

	rawApi, err := signature.ApiProtoToStructpb(def.GetApi())
	if err != nil {
		return nil, nil, err
	}

	rawDef, err := utils.ProtoToStructPb(def, nil)
	if err != nil {
		return nil, nil, err
	}

	var apiValue *structpb.Value
	if rawApi != nil {
		apiValue = structpb.NewStructValue(rawApi)
	} else {
		apiValue = structpb.NewNullValue()
	}

	rawDef.Fields["api"] = apiValue

	return def, rawDef, nil
}

func FetchSecretStores(ctx context.Context, fetcher fetch.Fetcher, profile string, useAgentKey bool, logger *zap.Logger) ([]*secretsv1.Store, error) {
	resp, err := tracer.Observe[*integrationv1.GetIntegrationsResponse](ctx, "fetch.integrations", nil, func(ctx context.Context, _ trace.Span) (*integrationv1.GetIntegrationsResponse, error) {
		kind := integrationv1.Kind_KIND_SECRET

		return fetcher.FetchIntegrations(ctx, &integrationv1.GetIntegrationsRequest{
			Profile: &commonv1.Profile{
				Name: &profile,
			},
			Kind: &kind,
		}, useAgentKey)
	}, nil)
	if err != nil {
		logger.Error("failed to fetch secret integrations", zap.Error(err))
		return nil, err
	}

	if len(resp.Data) == 0 {
		return []*secretsv1.Store{}, nil
	}

	stores, err := utils.IntegrationsToSecretStores(resp.Data)
	if err != nil {
		logger.Error("failed to convert integration to secret stores", zap.Error(err))
		return nil, sberrors.ErrInternal
	}

	return stores, nil
}

// Filters out parameters that are not present in the V2 API trigger parameters
func filterParameters(parameters *commonv1.HttpParameters, trigger *apiv1.Trigger_Workflow) {
	for k := range parameters.Query {
		_, exists := trigger.GetParameters().GetQuery()[k]
		if !exists {
			delete(parameters.Query, k)
		}
	}

	for k := range parameters.Body {
		_, exists := trigger.GetParameters().GetBody()[k]
		if !exists {
			delete(parameters.Body, k)
		}
	}
}

func HandleWorkflow(
	ctx *apictx.Context,
	sandbox engine.Sandbox,
	workflowv1 *workflowv1pkg.Plugin,
	getName func(*apiv1.Definition) string,
	templatePlugin func(*plugins.Input) plugins.Plugin,
	isStep bool,
	executeOpts *Options,
	options ...options.Option,
) (string, string, *Done, error) {

	workflowv2, err := ToV2(workflowv1, executeOpts.Logger)
	if err != nil {
		return "", "", nil, err
	}

	// We resolve the workflow parameters after fetching the workflow definition, but we want to resolve the workflow ID
	// now so that we can ensure it's a valid ID before making the fetch request.
	if resolvedId, err := template.RenderProtoValue(ctx, structpb.NewStringValue(workflowv2.GetId()), templatePlugin, sandbox, executeOpts.Logger); err == nil {
		workflowv2.Id = resolvedId.GetStringValue()
	}

	request := constructHandleWorkflowFetchRequest(workflowv2, executeOpts, isStep)

	executeOpts.Logger.Debug("fetching workflow", zap.String("id", workflowv2.GetId()))

	def, rawDef, err := Fetch(
		ctx.Context,
		request,
		executeOpts.Fetcher,
		executeOpts.UseAgentKey,
		executeOpts.Logger,
	)
	if err != nil {
		return "", "", nil, err
	}

	executeOpts.Logger.Debug("fetched workflow", zap.String("id", workflowv2.GetId()))

	name := getName(def)

	persist := func(key string) {
		executeOpts.Key.Put(name, key)
	}

	// NOTE(frank): We could do a check that verifies if the API is a workflow.
	// However, I think this is an unecessary constraint. Everything will "just work"
	// If it's an API or Job as well.
	var parameters *commonv1.HttpParameters
	{
		if trigger := def.GetApi().GetTrigger().GetWorkflow(); trigger != nil {
			parameters = workflowv2.Parameters
			filterParameters(parameters, trigger)
		} else {
			parameters = &commonv1.HttpParameters{
				Query: map[string]*structpb.Value{},
				Body:  map[string]*structpb.Value{},
			}
		}
	}

	var inputs map[string]*structpb.Value
	{
		// NOTE(frank): I wrote this before I wrote RenderProtoValue. I think we
		// can throw away some of the following code in favor of it.
		renderFunc := template.New(
			templatePlugin,
			template.DefaultEngineResolver(sandbox, ctx.Variables),
			utils.NoOpTokenJoiner,
			executeOpts.Logger,
		).Render

		rendered, err := parameters.WithSuperblocksInjected(executeOpts.DefinitionMetadata.Profile).AsInputs(
			ctx.Context,
			func(c context.Context, input string) (*string, error) {
				return renderFunc(c, &plugins.Input{Data: input})
			},
		)

		if err != nil {
			executeOpts.Logger.Error("could not render workflow parameters", zap.Error(err))
			return "", "", nil, err
		}

		inputs = rendered
	}

	refs := utils.NewMap[string]()

	var requester string
	if executeOpts.Api != nil {
		requester = fmt.Sprintf("Nested execution from %s", executeOpts.Api.GetMetadata().GetName())
	} else {
		requester = def.GetApi().GetMetadata().GetName()
	}

	rawApiValue, _ := utils.GetStructField(rawDef, "api")

	done, err, userError := Execute(context.WithValue(ctx.Context, constants.ContextKeyApiStartTime, time.Now().UnixMilli()), &Options{
		Logger:                executeOpts.Logger,
		Store:                 executeOpts.Store,
		Key:                   refs,
		Worker:                executeOpts.Worker,
		Fetcher:               executeOpts.Fetcher,
		Api:                   def.Api,
		RawApi:                rawApiValue,
		Integrations:          def.Integrations,
		FileServerUrl:         executeOpts.FileServerUrl,
		TokenManager:          executeOpts.TokenManager,
		IsDeployed:            true,
		Flags:                 executeOpts.Flags,
		Requester:             requester,
		Options:               request.Options,
		Inputs:                inputs,
		DefaultResolveOptions: options,
		DefinitionMetadata:    executeOpts.DefinitionMetadata,
		SecretManager:         executeOpts.SecretManager,
		FetchToken:            executeOpts.FetchToken,
		RootStartTime:         executeOpts.RootStartTime,
		Timeout:               executeOpts.Timeout,
		GarbageCollect:        false,                   // VERY important - do not garbage collect the workflow output, need to handle it manually before it gets deleted by the GC
		UseAgentKey:           executeOpts.UseAgentKey, // This is to inform the resolve whether it's correct to pass the agent key. The agent key should only be used if it's a nested workflow from a scheduled job
		Secrets:               executeOpts.Secrets,
		Stores:                def.Stores,
		Signature:             executeOpts.Signature,
	}, nil)
	if err != nil {
		return "", "", nil, err
	}

	key, err := executeOpts.Store.Key("VARIABLE", "")

	if err != nil {
		sberrors.Logger(executeOpts.Logger, err)("failed to create store key for workflow output", zap.Error(err))
		return "", "", nil, sberrors.ErrInternal
	}

	if userError != nil {
		data, err := json.Marshal(map[string]any{
			"output": map[string]any{
				"error": userError.Error(),
			},
		})
		if err != nil {
			sberrors.Logger(executeOpts.Logger, err)("could not marshal workflow error output", zap.Error(err))
			return "", "", nil, sberrors.ErrInternal
		}

		if err := executeOpts.Store.Write(ctx.Context, store.Pair(key, string(data))); err != nil {
			sberrors.Logger(executeOpts.Logger, err)("could not write error workflow result to the store", zap.Error(err))
			return "", "", nil, sberrors.ErrInternal
		}
	} else if done == nil || done.Last == "" {
		// NOTE(frank): Yes, we should probably be strongly typing the representation of an output in Redis.
		if err := executeOpts.Store.Write(ctx.Context, store.Pair(key, `{"output": {}}`)); err != nil {
			sberrors.Logger(executeOpts.Logger, err)("could not write empty workflow result to the store", zap.Error(err))
			return "", "", nil, sberrors.ErrInternal
		}
	} else {
		ref, ok := refs.Get(done.Last)
		if !ok {
			executeOpts.Logger.Error("expected a store reference for the provided block")
			return "", "", nil, sberrors.ErrInternal
		}

		// TODO(frank): Gross, get the key biz logic out of there ASAP.
		if err := executeOpts.Store.Copy(ctx.Context, ref, key); err != nil {
			sberrors.Logger(executeOpts.Logger, err)("could not copy workflow result to step result", zap.Error(err))
			return "", "", nil, sberrors.ErrInternal
		}
	}

	persist(key)

	// only garbage collect after the fact. Otherwise, our workflow output would be deleted before we can copy it
	if done != nil && done.GarbageCollector != nil {
		executeOpts.Logger.Debug("performing garbage collection", zap.Strings("variables", done.GarbageCollector.Contents()))
		if err := done.GarbageCollector.Run(context.Background()); err != nil {
			executeOpts.Logger.Error("could not gc api variables", zap.Error(err))
		}
	}

	// NOTE(frank): Deferring figuring out how we should propogate performance for this type of step.
	return name, key, done, nil
}

func constructHandleWorkflowFetchRequest(plugin *v2.Plugin, options *Options, isStep bool) *apiv1.ExecuteRequest {
	fetchOptions := &apiv1.ExecuteRequest_Fetch{
		Id: plugin.GetId(),
		Profile: &commonv1.Profile{
			Name: utils.Pointer(options.DefinitionMetadata.Profile),
		},
		Token: utils.Pointer(options.FetchToken),
	}

	inheritModeAndBranch := isStep && options.Flags.GetWorkflowPluginInheritanceEnabled(options.Api.Metadata.GetOrganization())

	if inheritModeAndBranch && !options.IsDeployed {
		fetchOptions.ViewMode = apiv1.ViewMode_VIEW_MODE_EDIT
	} else {
		fetchOptions.ViewMode = apiv1.ViewMode_VIEW_MODE_DEPLOYED
	}

	if inheritModeAndBranch && options.BranchName != "" {
		fetchOptions.BranchName = utils.Pointer(options.BranchName)
	}

	return &apiv1.ExecuteRequest{
		Options: &apiv1.ExecuteRequest_Options{},
		Request: &apiv1.ExecuteRequest_Fetch_{
			Fetch: fetchOptions,
		},
	}
}

// Does multiple things for a raw datasource:
// 1. Adds auth tokens if necessary
// 2. (if has a dynamic workflow configuration) executes the workflow
// 3. Evalutes the bindings in the datasource (mainly for oauth / firebase tokens)
// authConfigNew is the proto define message that will contain auth parameters
func EvaluateDatasource(
	ctx *apictx.Context,
	sandbox engine.Sandbox,
	unrenderedDatasourceConfig *structpb.Value,
	unrenderedRedactedDatasourceConfig *structpb.Value,
	integrationId string,
	configurationIdOverride string,
	pluginName string,
	garbage gc.GC,
	executeOpts *Options,
	options ...options.Option,
) (*structpb.Value, *structpb.Value, error) {
	// Since this can be done in multiple steps inside a parallel block, we need to ensure that the subsequent write to fields
	// does not affect concurrently running evaluations
	cloned, _ := proto.Clone(unrenderedDatasourceConfig).(*structpb.Value)
	unrendered := cloned.GetStructValue()

	// This currently is just being read so we don't need to clone here
	unrenderedRedacted := unrenderedRedactedDatasourceConfig.GetStructValue()

	executeOpts.Logger.Debug("evaluating datasource", zap.String("plugin", pluginName))

	ctxWithDynWfOutput, err := executeDynamicWorkflow(ctx, unrendered, sandbox, garbage, mustache.Instance, executeOpts, options...)
	if err != nil {
		return nil, nil, err
	}

	// Resolve bindings in the auth config (and new auth config) before fetching/generating auth tokens (if necessary)
	var authFieldResolved *structpb.Value
	var authFieldRenderingErr error

	if authField, err := utils.GetStructField(unrendered, "connection.auth"); err == nil {
		if authFieldResolved, err = getRenderedConfig(ctxWithDynWfOutput, authField, mustache.Instance, sandbox, executeOpts.Logger); err != nil {
			authFieldResolved = authField
			authFieldRenderingErr = err
		}
	}

	authConfigNew, err := ConstructAuth(authFieldResolved)
	if err != nil {
		return nil, nil, err
	}

	authConfig, err := getRenderedConfig(ctxWithDynWfOutput, unrendered.GetFields()["authConfig"], mustache.Instance, sandbox, executeOpts.Logger)
	if err != nil {
		// If we can't render the authConfig, we should use the config defined under 'connection.auth'.
		// If there is no config defined under 'connection.auth', or there was an error rendering the
		// config under 'connection.auth' (for example it depends on a variable that is not defined)
		// we should return an error.
		if authConfigNew == nil || authFieldRenderingErr != nil {
			return nil, nil, errors.Join(err, authFieldRenderingErr)
		}

		executeOpts.Logger.Debug("rendering authConfig failed, using config defined under 'connection.auth'", zap.Error(err))
	}

	if authConfig != nil {
		unrendered.Fields["authConfig"] = authConfig
	}

	configurationId := configurationIdOverride
	if configurationId == "" {
		if id, ok := unrendered.GetFields()["id"]; ok {
			configurationId = id.GetStringValue()
		}
	}

	// Modifies datasource in-place with auth tokens if necessary (e.g. oauth, dynamic creds)
	tokenPayload, err := executeOpts.TokenManager.AddTokenIfNeeded(
		ctxWithDynWfOutput.Context,
		unrendered,
		unrenderedRedacted,
		authConfigNew,
		integrationId,
		configurationId,
		pluginName,
	)
	if err != nil {
		return nil, nil, err
	}

	authToken := tokenPayload.Token
	authIdToken := tokenPayload.IdToken
	authUserId := tokenPayload.UserId
	tokenDecoded := tokenPayload.TokenDecoded
	bindingName := tokenPayload.BindingName

	newVars := []*apiv1.Variables_Config{}
	newVarsRedacted := []*apiv1.Variables_Config{}

	if authToken != "" && bindingName != "" {
		objPairs := []string{fmt.Sprintf("token: '%s'", authToken)}
		redactedObjPairs := []string{fmt.Sprintf("token: '%s'", auth.RedactedSecret)}
		if authUserId != "" {
			objPairs = append(objPairs, fmt.Sprintf("userId: '%s'", authUserId))
			redactedObjPairs = append(redactedObjPairs, fmt.Sprintf("userId: '%s'", authUserId))
		}
		if authIdToken != "" {
			objPairs = append(objPairs, fmt.Sprintf("idToken: '%s'", authIdToken))
			redactedObjPairs = append(redactedObjPairs, fmt.Sprintf("idToken: '%s'", auth.RedactedSecret))
		}
		if tokenDecoded != nil {
			tokenDecodedJson, err := protojson.Marshal(tokenDecoded)
			if err != nil {
				return nil, nil, err
			}
			objPairs = append(objPairs, fmt.Sprintf("tokenDecoded: %s", string(tokenDecodedJson)))
			redactedObjPairs = append(redactedObjPairs, fmt.Sprintf("tokenDecoded: %s", "{}"))
		}
		value := fmt.Sprintf("{{ { %s } }}", strings.Join(objPairs, ", "))
		valueRedacted := fmt.Sprintf("{{ { %s } }}", strings.Join(redactedObjPairs, ", "))

		newVars = append(newVars, &apiv1.Variables_Config{
			Key:   bindingName,
			Value: value,
			Type:  apiv1.Variables_TYPE_NATIVE,
			Mode:  apiv1.Variables_MODE_READ,
		})
		newVarsRedacted = append(newVarsRedacted, &apiv1.Variables_Config{
			Key:   bindingName,
			Value: valueRedacted,
			Type:  apiv1.Variables_TYPE_NATIVE,
			Mode:  apiv1.Variables_MODE_READ,
		})
	}

	newCtx, err := Variables(ctxWithDynWfOutput, &apiv1.Variables{Items: newVars}, sandbox, executeOpts.Logger, garbage, executeOpts.Store, options...)
	if err != nil {
		return nil, nil, err
	}
	newCtxRedacted, err := Variables(ctxWithDynWfOutput, &apiv1.Variables{Items: newVarsRedacted}, sandbox, executeOpts.Logger, garbage, executeOpts.Store, options...)
	if err != nil {
		return nil, nil, err
	}

	// TODO: can we figure out how to render proto value without variables? That way we don't need to write to the store with Variables()
	datasourceConfig, err := renderDatasourceConfig(newCtx, cloned, sandbox, executeOpts.Logger)
	if err != nil {
		return nil, nil, err
	}

	redactedDatasourceConfig, err := renderDatasourceConfig(newCtxRedacted, unrenderedRedactedDatasourceConfig, sandbox, executeOpts.Logger)
	if err != nil {
		return nil, nil, err
	}

	return datasourceConfig, redactedDatasourceConfig, nil
}

func renderDatasourceConfig(ctx *apictx.Context, datasource *structpb.Value, sandbox engine.Sandbox, logger *zap.Logger) (*structpb.Value, error) {
	bindingsSet := utils.NewSet[string]()
	if bindingFields, err := utils.GetStructField(datasource.GetStructValue(), "bindingFields"); err == nil {
		utils.FindStringsInStruct(bindingFields, func(s string) {
			bindingsSet.Add(s)
		})
	}

	pluginSelector := func(s *plugins.Input) plugins.Plugin {
		if field := s.GetMeta().GetFieldName(); field != "" && bindingsSet.Contains(field) {
			return noop.Instance(s)
		}

		return mustache.Instance(s)
	}

	datasourceConfig, err := template.RenderProtoValue(ctx, datasource, pluginSelector, sandbox, logger)
	if err != nil {
		return nil, err
	}

	return datasourceConfig, nil
}

func maybeError[T any](ctx *apictx.Context, fn func() (*T, string, error)) (*T, string, error, error) {
	result, ref, err := fn()

	if ctx.Options().IgnoreError {
		return result, ref, err, nil
	}

	return result, ref, err, err
}

func IsLeaf(t apiv1.BlockType) bool {
	leafs := []apiv1.BlockType{
		apiv1.BlockType_BLOCK_TYPE_SEND,
		apiv1.BlockType_BLOCK_TYPE_VARIABLES,
		apiv1.BlockType_BLOCK_TYPE_STEP,
		apiv1.BlockType_BLOCK_TYPE_RETURN,
		apiv1.BlockType_BLOCK_TYPE_BREAK,
		apiv1.BlockType_BLOCK_TYPE_THROW,
	}

	return slices.Index(leafs, t) != -1
}

func FetchBlockOutput(ctx context.Context, refs utils.Map[string], store store.Store, name string) (*apiv1.Output, error) {
	ref, ok := refs.Get(name)
	if !ok {
		return &apiv1.Output{}, nil
	}

	values, err := store.Read(ctx, ref)
	if err != nil {
		return nil, err
	}

	if len(values) == 0 || values[0] == nil {
		return &apiv1.Output{}, nil
	}

	// Important: the unmarshal for this type is defined gen/go/api/v1/codec. That's how
	// the step output gets unmarshalled into the output.Result
	var output apiv1.Output
	{
		if jsonErr := json.Unmarshal([]byte(values[0].(string)), &output); jsonErr != nil {
			values = nil // Help out the GC

			return nil, jsonErr
		}

		values = nil // fHelp out the GC
	}

	return &output, nil
}

func executeDynamicWorkflow(
	ctx *apictx.Context,
	datasource *structpb.Struct,
	sandbox engine.Sandbox,
	garbage gc.GC,
	templatePlugin func(*plugins.Input) plugins.Plugin,
	executeOpts *Options,
	options ...options.Option,
) (*apictx.Context, error) {

	dynamicConfig, exists := datasource.GetFields()["dynamicWorkflowConfiguration"]
	if !exists {
		return ctx, nil
	}

	configFields := dynamicConfig.GetStructValue().GetFields()
	if enabled := configFields["enabled"]; !enabled.GetBoolValue() {
		return ctx, nil
	}

	workflowId := configFields["workflowId"].GetStringValue()
	if workflowId == "" {
		return ctx, nil
	}

	executeOpts.Logger.Debug("evaluating dynamic workflow configuration", zap.String("workflowId", workflowId))

	workflowName, _, done, err := HandleWorkflow(
		ctx,
		sandbox,
		&workflowv1pkg.Plugin{
			Workflow: workflowId,
		},
		func(f *apiv1.Definition) string {
			return f.GetApi().GetMetadata().GetName()
		},
		templatePlugin,
		false,
		executeOpts,
		options...,
	)
	if err != nil {
		return nil, err
	}

	if done == nil {
		executeOpts.Logger.Error(
			"workflow execution returned nil done",
			zap.String(observability.OBS_TAG_API_NAME, workflowName),
			zap.String(observability.OBS_TAG_API_ID, workflowId),
		)

		return nil, sberrors.ErrInternal
	}

	if done.Output == nil {
		executeOpts.Logger.Error(
			"workflow execution returned nil output",
			zap.String(observability.OBS_TAG_API_NAME, workflowName),
			zap.String(observability.OBS_TAG_API_ID, workflowId),
		)

		return nil, sberrors.ErrInternal
	}

	output := done.Output.GetResult()
	if output == nil {
		executeOpts.Logger.Error(
			"workflow output is nil",
			zap.String(observability.OBS_TAG_API_NAME, workflowName),
			zap.String(observability.OBS_TAG_API_ID, workflowId),
		)

		return nil, sberrors.ErrInternal
	}

	outputBytes, err := output.MarshalJSON()
	if err != nil {
		return nil, err
	}

	result := fmt.Sprintf(`{{ { response: %s } }}`, outputBytes)

	executeOpts.Logger.Debug("adding dynamic workflow output to variables", zap.String("workflowName", workflowName))

	// old way to reference a dynamic workflow output
	newVars := []*apiv1.Variables_Config{
		{
			Key:   workflowName,
			Value: result,
			Type:  apiv1.Variables_TYPE_NATIVE,
			Mode:  apiv1.Variables_MODE_READ,
		},
	}

	// the new way to reference a dynamic workflow output
	newVars = append(newVars, &apiv1.Variables_Config{
		Key:   "credentials",
		Value: result,
		Type:  apiv1.Variables_TYPE_NATIVE,
		Mode:  apiv1.Variables_MODE_READ,
	})

	newCtx, err := Variables(ctx, &apiv1.Variables{Items: newVars}, sandbox, executeOpts.Logger, garbage, executeOpts.Store, options...)
	if err != nil {
		return nil, err
	}

	return newCtx, nil
}

func getRenderedConfig(
	ctx *apictx.Context,
	config *structpb.Value,
	plugin func(*plugins.Input) plugins.Plugin,
	sandbox engine.Sandbox,
	logger *zap.Logger,
) (*structpb.Value, error) {

	if config == nil {
		return nil, nil
	}

	rendered, err := template.RenderProtoValue(ctx, config, plugin, sandbox, logger)
	if err != nil {
		return nil, err
	}

	return rendered, nil
}

func generateAuditLog(ctx context.Context, options *Options) []zap.Field {
	auditLogId := uuid.New().String()
	startTime := ctx.Value(constants.ContextKeyApiStartTime).(int64)

	zapFields := []zap.Field{
		zap.String("auditLogId", auditLogId),
		zap.Bool("isDeployed", options.IsDeployed),
		zap.String("target", options.Api.GetMetadata().GetId()),
		zap.String("organizationId", options.Api.GetMetadata().GetOrganization()),
		zap.Int64("start", startTime),
	}

	if options.Requester != "" {
		zapFields = append(zapFields, zap.String("source", options.Requester))
	} else if constants.CallerIpAddress(ctx) != "" {
		zapFields = append(zapFields, zap.String("source", constants.CallerIpAddress(ctx)))
	}

	_, userType, ok := observability.ExtractUserInfo(ctx, options.DefinitionMetadata)
	if ok {
		zapFields = append(zapFields, zap.String("userType", observability.GetUserTypeStringFromPb(*userType)))
	}

	var triggerType agentv1.AuditLogRequest_AuditLog_AuditLogEntityType
	var entityId string

	switch options.Api.GetTrigger().GetConfig().(type) {
	case *apiv1.Trigger_Application_:
		triggerType = agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION
		entityId = options.Api.GetTrigger().GetApplication().GetId()
		zapFields = append(zapFields, zap.String("applicationId", options.Api.GetTrigger().GetApplication().GetId()))
	case *apiv1.Trigger_Workflow_:
		triggerType = agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_WORKFLOW
		entityId = options.Api.GetMetadata().GetId()
	case *apiv1.Trigger_Job_:
		triggerType = agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_SCHEDULED_JOB
		entityId = options.Api.GetMetadata().GetId()
	}

	zapFields = append(zapFields, zap.String("entityId", entityId),
		zap.String("entityType", triggerType.String()))

	return zapFields
}

func emptyOutput(s store.Store) (string, error) {
	ref, err := s.Key("EMPTY", "")
	if err != nil {
		return "", sberrors.ErrInternal
	}

	if err := s.Write(context.Background(), store.Pair(ref, `{ "output": null }`)); err != nil {
		return "", sberrors.ErrInternal
	}

	return ref, nil
}

func extractJSONOutputAtKey(x, k string, e bool) (string, error) {
	data, kind, _, err := jsonparser.Get([]byte(x), k)
	if err != nil {
		return "", sberrors.ErrInternal
	}

	// If the value is a string, we need to wrap it in quotes.
	if kind == jsonparser.String && e {
		return `"` + string(data) + `"`, nil
	}

	return string(data), nil
}

func encodedArrayToGoogleValue(data []string) *structpb.Value {
	message := "we encountered an error while parsing this binding"
	dest := make([]any, len(data))

	for idx, val := range data {
		if val == "" {
			val = "null"
		}

		if err := json.Unmarshal([]byte(val), &dest[idx]); err != nil {
			return structpb.NewStringValue(message)
		}
	}

	list, err := structpb.NewList(dest)
	if err != nil {
		return structpb.NewStringValue(message)
	}

	dest = nil

	return &structpb.Value{
		Kind: &structpb.Value_ListValue{
			ListValue: list,
		},
	}
}

func propogate(err error, block apiv1.BlockType) bool {
	if IsLeaf(block) {
		return true
	}

	switch v := err.(type) {
	case *commonv1.Error:
		// NOTE(frank): Add more types here that we want to propoate.
		if slices.Index([]string{"BindingError", "QuotaError", "ApiAuthorizationError"}, v.Name) != -1 {
			return true
		}
	}

	return false
}

func ExtractErrorFromEvent(event *apiv1.Event) error {
	// We bubble up errors to the block. This means that if a step fails in a loop, the loop will show that error too.
	// Beacuse we don't want these duplicated failures showing at the top level, we'll only append to the root error
	// if it originates from a step.
	if end := event.GetEnd(); end != nil && end.GetError() != nil && !end.GetError().Handled && propogate(end.GetError(), event.Type) {
		return end.GetError()
	}

	return nil
}

// ConstructAuth extracts connection.auth which is of proto type Auth if it's available
func ConstructAuth(authField *structpb.Value) (*pluginscommon.Auth, error) {
	// if the auth field is not available the caller will use auth fron old path
	if authField == nil {
		return nil, nil
	}

	unmarshaler := protojson.UnmarshalOptions{DiscardUnknown: true}
	auth := pluginscommon.Auth{}

	authJsonInBytes, err := authField.MarshalJSON()
	if err != nil {
		return nil, errors.New("auth field MarshalJSON failed")
	}

	// Try to unmarshal to proto Auth
	if err := unmarshaler.Unmarshal(authJsonInBytes, &auth); err != nil {
		return nil, errors.New("auth field JSON unmarshal failed")
	}
	return &auth, nil
}

func handleQuotaError(err error, options *Options, t apiv1.BlockType) {
	var quotaErr *sberrors.QuotaError
	if errors.As(err, &quotaErr) && IsLeaf(t) && !quotaErr.IsTerminal {
		options.Logger.Info("quota error", zap.String("error", quotaErr.Error()), zap.String("kind", quotaErr.Kind))
		metrics.QuotaErrorsTotal.WithLabelValues(quotaErr.Kind, options.Api.GetMetadata().GetOrganization(), options.DefinitionMetadata.OrganizationName, options.DefinitionMetadata.OrganizationPlan).Inc()
	}
}

func handleTerminalQuotaError(err error, options *Options) {
	var quotaErr *sberrors.QuotaError
	if errors.As(err, &quotaErr) && quotaErr.IsTerminal {
		options.Logger.Info("quota error", zap.String("error", quotaErr.Error()), zap.String("kind", quotaErr.Kind))
		metrics.QuotaErrorsTotal.WithLabelValues(quotaErr.Kind, options.Api.GetMetadata().GetOrganization(), options.DefinitionMetadata.OrganizationName, options.DefinitionMetadata.OrganizationPlan).Inc()
	}
}

func ExtractVariablesFromInputs(all map[string]*structpb.Value, files []*transportv1.Request_Data_Data_Props_File) ([]*apiv1.Variables_Config, error) {
	variables := []*apiv1.Variables_Config{}

	for k, v := range all {
		// NOTE(frank): I think this is here to work around some UI data issue.
		if k == "" {
			continue
		}

		var isFile bool
		{
			v, isFile = enrich(v, files)
		}

		data, err := protojson.Marshal(v)
		if err != nil {
			return nil, err
		}

		variable := &apiv1.Variables_Config{
			Key:   k,
			Value: fmt.Sprintf("{{ %s }}", string(data)),
			Mode:  apiv1.Variables_MODE_READ,
		}

		if isFile {
			variable.Type = apiv1.Variables_TYPE_FILEPICKER
		} else {
			variable.Type = apiv1.Variables_TYPE_NATIVE
		}

		variables = append(variables, variable)

		v = nil // NOTE(frank): release to the gc
	}

	return variables, nil
}

func enrich(v *structpb.Value, files []*transportv1.Request_Data_Data_Props_File) (*structpb.Value, bool) {
	typed, ok := v.GetKind().(*structpb.Value_StructValue)
	if !ok {
		return v, false
	}

	value, ok := typed.StructValue.Fields["files"]
	if !ok {
		return v, false
	}

	list, ok := value.GetKind().(*structpb.Value_ListValue)
	if !ok {
		return v, false
	}

	for _, file := range list.ListValue.Values {
		file, ok := file.GetKind().(*structpb.Value_StructValue)
		if !ok {
			return v, false
		}

		val, ok := file.StructValue.Fields["$superblocksId"]
		if !ok {
			return v, false
		}

		id, ok := val.GetKind().(*structpb.Value_StringValue)
		if !ok || id.StringValue == "" {
			return v, false
		}

		for _, f := range files {
			if f.Originalname != id.StringValue {
				continue
			}

			file.StructValue.Fields["path"] = structpb.NewStringValue(f.Path)
			break
		}
	}

	return v, true
}
