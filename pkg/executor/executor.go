package executor

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/superblocksteam/agent/internal/flags"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/crypto/signature"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/mocker"
	"github.com/superblocksteam/agent/pkg/observability/emitter/event"
	"github.com/superblocksteam/agent/pkg/observability/log"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/secrets"
	"github.com/superblocksteam/agent/pkg/validation"
	"github.com/thejerf/abtime"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/baggage"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/superblocksteam/agent/internal/auth"
	"github.com/superblocksteam/agent/internal/fetch"
	internalutils "github.com/superblocksteam/agent/internal/utils"
	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/executor/middleware"
	"github.com/superblocksteam/agent/pkg/executor/middleware/ratelimit"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/store/gc"
	"github.com/superblocksteam/agent/pkg/template"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/template/plugins/mustache"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/worker"
	agentv1 "github.com/superblocksteam/agent/types/gen/go/agent/v1"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	storev1 "github.com/superblocksteam/agent/types/gen/go/store/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

type Executor interface {
	ID() string
	Run(context.Context)
	Done() chan *Done
	Event() chan *Event
}

type Done struct {
	Output           *apiv1.Output
	Last             string
	GarbageCollector gc.GC
}

type execution struct {
	*Options

	done          chan *Done
	stream        chan *Event
	id            string
	variables     gc.GC
	resolver      *resolver // This could be the interface but less of a need since it's all private anyways.
	wg            *sync.WaitGroup
	now           func() time.Time
	inputs        []string
	detached      bool
	secretManager secrets.SecretManager
}

type Options struct {
	Logger                       *zap.Logger
	Store                        store.Store
	Flags                        flags.Flags
	Worker                       worker.Client
	Key                          utils.Map[string]
	Options                      *apiv1.ExecuteRequest_Options
	OrgPlan                      string
	Files                        []*apiv1.ExecuteRequest_File
	FileServerUrl                string
	Inputs                       map[string]*structpb.Value
	Fetcher                      fetch.Fetcher
	FetchToken                   string
	TokenManager                 auth.TokenManager
	Integrations                 map[string]*structpb.Struct
	Api                          *apiv1.Api
	RawApi                       *structpb.Value
	Renderer                     template.RenderFunc
	TemplatePlugin               func(*plugins.Input) plugins.Plugin
	LegacyTemplatePlugin         func(*plugins.Input) plugins.Plugin
	LegacyTemplateResolver       func(context.Context, *utils.TokenJoiner, string) engine.Value
	LegacyTemplateTokenJoiner    *utils.TokenJoiner
	RootStartTime                time.Time
	Timeout                      time.Duration
	Requester                    string
	DefinitionMetadata           *apiv1.Definition_Metadata
	IsDeployed                   bool
	GarbageCollect               bool
	SecretManager                secrets.SecretManager // NOTE(frank): We shouldn't pass this around, Rather, we put it in the inputs.
	DefaultResolveOptions        []options.Option
	UseAgentKey                  bool
	Stores                       *storev1.Stores
	Secrets                      secrets.Secrets
	Signature                    signature.Registry
	DisableSignatureVerification bool
	BranchName                   string
	Mocker                       mocker.Mocker
}

func New(ctx context.Context, options *Options) (Executor, error) {
	var id string
	{
		if id = constants.ExecutionID(ctx); id == "" {
			// NOTE(frank): I'm not sure if this will ever be the case anymore.
			uuid, err := utils.UUID()
			if err != nil {
				return nil, err
			}

			id = uuid
		}
	}

	var other []validation.ValidateFunc
	{
		if !options.DisableSignatureVerification {
			other = append(other, func(*apiv1.Api) []error {
				rawApi := options.RawApi
				if rawApi == nil {
					rawApi = structpb.NewNullValue()
				}

				if err := options.Signature.Verify(&securityv1.Resource{
					Config: &securityv1.Resource_ApiLiteral_{
						ApiLiteral: &securityv1.Resource_ApiLiteral{
							Data: rawApi,
						},
					},
				}); err != nil {
					return []error{err}
				}

				return nil
			})
		}
	}

	if err := validation.Validate(options.Api, other...); err != nil {
		return nil, &sberrors.ValidationError{Issues: err}
	}

	if len(options.Inputs) == 0 {
		options.Inputs = map[string]*structpb.Value{}
	}

	variables := gc.New(&gc.Options{
		Store: options.Store,
	})

	if options.Key == nil {
		options.Key = utils.NewMap[string]()
	}

	apiId := options.Api.GetMetadata().GetId()
	orgId := options.Api.GetMetadata().GetOrganization()

	options.Logger = tracer.Logger(ctx, options.Logger.With(
		zap.String(observability.OBS_TAG_PROFILE, options.DefinitionMetadata.Profile),
		zap.String(observability.OBS_TAG_ORG_ID, orgId),
		zap.String(observability.OBS_TAG_CORRELATION_ID, id),
		zap.String(observability.OBS_TAG_ORG_TIER, options.DefinitionMetadata.OrganizationPlan),
		zap.String(observability.OBS_TAG_ORG_NAME, options.DefinitionMetadata.OrganizationName),
	))

	ex := &execution{
		Options:       options,
		id:            id,
		done:          make(chan *Done),  // NOTE(frank): Play around with a buffered channel.
		stream:        make(chan *Event), // NOTE(frank): Play around with a buffered channel.
		wg:            &sync.WaitGroup{},
		now:           abtime.NewRealTime().Now,
		variables:     variables,
		inputs:        []string{},
		secretManager: options.SecretManager,
	}

	if options.Timeout == 0 {
		options.Timeout = time.Duration(options.Flags.GetApiTimeoutV2(options.Api, options.DefinitionMetadata.OrganizationPlan)) * time.Millisecond
	}

	if options.TemplatePlugin == nil {
		options.TemplatePlugin = mustache.Instance
	}

	// TODO(frank): I might need to merge this context with the gRPC context.
	ctx, cancel := context.WithCancelCause(ctx)

	estimates, err := ex.estimate(ctx, ex.Api)
	if err != nil {
		ex.Logger.Error("could not compute estimates", zap.Error(err))
		return nil, &sberrors.InternalError{}
	}

	userName, userType, _ := observability.ExtractUserInfo(ctx, options.DefinitionMetadata)
	ex.resolver = NewResolver(
		constants.WithExecutionID(ctx, ex.id),
		cancel,
		orgId,
		options.OrgPlan,
		ex.Worker,
		ex.Logger,
		ex.FileServerUrl,
		ex.wg,
		ex.id,
		ex.Key,
		ex.variables,
		ex.Store,
		ex.Flags,
		ex,
		ex.attributes(),
		estimates,
		ex.UseAgentKey,
		[]middleware.Middleware[middleware.BlockFunc]{
			ratelimit.BlockMiddleware(ex.Logger, ex.Store, ex.Flags, orgId, apiId, options.DefinitionMetadata.OrganizationPlan),
		},
		[]middleware.Middleware[middleware.StepFunc]{
			ratelimit.StepMiddleware(ex.Logger, ex.Store, ex.Flags, orgId, apiId, options.DefinitionMetadata.OrganizationPlan, userName, *userType, ex.isEnforceUserLimit()),
			ratelimit.ComputeUnitsStepMiddleware(ex.Logger, ex.Store, ex.Flags, orgId, options.DefinitionMetadata.OrganizationPlan),
		},
		options,
	)

	ex.Logger.Info("resolver configured", zap.String("fileServerUrl", ex.FileServerUrl))

	// NOTE(frank): I don't think I hate that this is here. I haven't given it that much though either.
	trace.SpanFromContext(ctx).SetAttributes(ex.resolver.attributes...)

	if _, err := tracer.Observe(ctx, "fetch.secrets", nil, func(ctx context.Context, _ trace.Span) (any, error) {
		return nil, secrets.RetrieveAndUnmarshalIfNeeded(
			constants.WithOrganizationID(ctx, orgId),
			options.Secrets,
			options.Stores.GetSecrets(),
			ex.Api,
			options.Integrations,
			options.Inputs,
		)
	}, nil); err != nil {
		options.Logger.Error("failed to retrieve secrets", zap.Error(err))
		return nil, err
	}

	return ex, nil
}

func (e *execution) attributes() []attribute.KeyValue {
	items := append([]attribute.KeyValue{
		attribute.String(observability.OBS_TAG_CORRELATION_ID, e.id),
		attribute.String(observability.OBS_TAG_PROFILE, e.DefinitionMetadata.Profile),
		attribute.String(observability.OBS_TAG_ORG_TIER, e.DefinitionMetadata.OrganizationPlan),
		attribute.String(observability.OBS_TAG_ORG_NAME, e.DefinitionMetadata.OrganizationName),
	}, observability.FieldsToAttributes(utils.ApiObservabilityFields(e.Api))...)

	if e.Api != nil {
		items = append(items,
			attribute.String(observability.OBS_TAG_API_TYPE, utils.ApiType(e.Api)),
			attribute.String(observability.OBS_TAG_API_ID, e.Api.GetMetadata().GetId()),
			attribute.String(observability.OBS_TAG_API_NAME, e.Api.GetMetadata().GetName()),
			attribute.String(observability.OBS_TAG_ORG_ID, e.Api.GetMetadata().GetOrganization()),
		)
	}

	return items
}

func (e *execution) contextWithBaggage(ctx context.Context) context.Context {
	members := []baggage.Member{}
	kvs := map[string]any{
		observability.OBS_TAG_AGENT_ID:       constants.AgentId(ctx),
		observability.OBS_TAG_AGENT_VERSION:  constants.AgentVersion(ctx),
		observability.OBS_TAG_CORRELATION_ID: constants.ExecutionID(ctx),
		observability.OBS_TAG_PROFILE:        e.DefinitionMetadata.Profile,
		observability.OBS_TAG_ORG_TIER:       e.DefinitionMetadata.OrganizationPlan,
		observability.OBS_TAG_ORG_NAME:       e.DefinitionMetadata.OrganizationName,
	}
	kvs = utils.MergeMaps(kvs, observability.EnrichUserInfoToMap(ctx, e.DefinitionMetadata))

	if e.Api != nil {
		kvs[observability.OBS_TAG_API_ID] = e.Api.GetMetadata().GetId()
		kvs = utils.MergeMaps(kvs, utils.ApiObservabilityFields(e.Api))
	}

	for k, v := range kvs {
		sanitizedValue := url.PathEscape(utils.ConvertToString(v))
		member, err := baggage.NewMember(k, sanitizedValue)
		if err != nil {
			e.Logger.Error("failed to create baggage member", zap.Error(err))
			return ctx
		}
		members = append(members, member)
	}

	bg, err := baggage.New(members...)
	if err != nil {
		e.Logger.Error("failed to create baggage", zap.Error(err))
		return ctx
	}

	return baggage.ContextWithBaggage(ctx, bg)
}

func (e *execution) isEnforceUserLimit() bool {
	return e.Api.GetTrigger().GetApplication() != nil || (e.Api.GetTrigger().GetWorkflow() != nil && e.IsDeployed)
}

func (e *execution) handleUploadFile() ([]*transportv1.Request_Data_Data_Props_File, error) {
	fileProps := []*transportv1.Request_Data_Data_Props_File{}

	for _, fileData := range e.Files {
		// Generate a unique filename using UUID
		filename, err := utils.UUID()
		if err != nil {
			e.Logger.Error("failed to generate filename: %v", zap.Error(err))
			return nil, err
		}

		path := os.TempDir()
		// Create a destination path with tmpdir() and the generated filename
		destination := filepath.Join(path, filename)

		// Save the file to disk
		err = os.WriteFile(destination, fileData.Buffer, 0644)
		if err != nil {
			e.Logger.Error("failed to save file: %v", zap.Error(err))
			return nil, err
		}

		fileProp := &transportv1.Request_Data_Data_Props_File{
			Originalname: fileData.OriginalName,
			Encoding:     fileData.Encoding,
			Mimetype:     fileData.MimeType,
			Size:         int64(len(fileData.Buffer)),
			Destination:  destination,
			Filename:     filename,
			Path:         destination, // todo: need refactor later
		}

		e.Logger.Info("successfully saved file",
			zap.String("originalName", fileData.OriginalName),
			zap.String("path", path),
			zap.String("destination", destination))

		fileProps = append(fileProps, fileProp)
	}

	return fileProps, nil
}

func (e *execution) deleteFiles(files []*transportv1.Request_Data_Data_Props_File) {
	for _, fileProp := range files {
		// Delete the file
		err := os.Remove(fileProp.Destination)
		if err != nil {
			e.Logger.Error("failed to delete file", zap.Error(err))
		}

		e.Logger.Debug("successfully delete file", zap.String("destination", fileProp.Destination))
	}
}

func (e *execution) Run(ctx context.Context) {
	e.Request()

	ctx = e.contextWithBaggage(ctx)
	ctx, cancel := context.WithTimeoutCause(ctx, e.Timeout, sberrors.ApiTimeoutQuotaError(e.Timeout.Seconds()))
	defer cancel()

	defer func() {
		if e.GarbageCollect {
			e.Logger.Debug("performing garbage collection", zap.Strings("variables", e.variables.Contents()))

			if err := e.variables.Run(context.Background()); err != nil {
				e.Logger.Error("could not gc api variables", zap.Error(err))
			}
		}
	}()

	if e.Api == nil || e.Api.Metadata == nil {
		e.Logger.Error("api is malformed", zap.Any("api", e.Api))
		return
	}

	// NOTE(frank): I think this entire function needs a refactor but this variable
	// is used so we can hoist the finish log in a defer.
	var err error

	fields := append(
		append(
			[]zap.Field{zap.String(observability.OBS_TAG_REMOTE, "true")},
			observability.EnrichUserInfo(ctx, e.DefinitionMetadata)...), observability.FieldsToZap(utils.ApiObservabilityFields(e.Api))...,
	)

	e.Logger.Info(fmt.Sprintf("The %s %s has been started.", utils.ApiType(e.Api), e.Api.GetMetadata().GetName()),
		append(fields, zap.String(observability.OBS_TAG_RESOURCE_ACTION, "started"))...,
	)

	auditFields := generateAuditLog(ctx, e.Options)
	auditFields = append(auditFields, zap.Bool("audit", true))
	e.Logger.Info("audit log: api start", auditFields...)

	defer func() {
		var verb string
		var status agentv1.AuditLogRequest_AuditLog_ApiRunStatus
		{
			if err != nil {
				verb = "failed"
				auditFields = append(auditFields, zap.String("error", err.Error()))
				status = agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED
			} else {
				verb = "finished"
				status = agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_SUCCESS
			}
		}

		auditFields = append(auditFields, []zap.Field{
			zap.String("status", status.String()),
			zap.Int64("end", time.Now().UnixMilli()),
		}...)

		e.Logger.Info("audit log: api execute end", auditFields...)

		e.Logger.Info(fmt.Sprintf("The %s %s has %s.", utils.ApiType(e.Api), e.Api.GetMetadata().GetName(), verb),
			append(fields, zap.String(observability.OBS_TAG_RESOURCE_ACTION, verb))...,
		)
	}()

	// upload files
	files, err := e.handleUploadFile()
	if err != nil {
		return
	}
	e.resolver.files = files
	defer e.deleteFiles(files)

	e.resolver.createSandboxFunc = func() engine.Sandbox {
		return javascript.Sandbox(ctx, &javascript.Options{
			Logger:    e.Logger,
			Store:     e.Store,
			AfterFunc: internalutils.EngineAfterFunc,
		})
	}

	var sbctx *apictx.Context
	{
		sbctx = apictx.New(&apictx.Context{
			Execution:      e.id,
			Context:        constants.WithExecutionID(ctx, e.id), // TODO(frank): We seem to set this value a few times; seems wrong.
			RequestOptions: e.Options.Options,
		})

		var agentAppVarMap = map[string]*structpb.Value{}
		for k, v := range e.secretManager.GetSecrets() {
			agentAppVarMap[k] = structpb.NewStringValue(v)
		}

		e.Options.Inputs["Env"] = structpb.NewStructValue(&structpb.Struct{Fields: agentAppVarMap})

		variables, err := ExtractVariablesFromInputs(e.Options.Inputs, files)
		if err != nil {
			e.Logger.Error("could not extract variables from inputs", zap.Error(err))
			e.done <- nil
			return
		}

		sbctx, err = e.resolver.Variables(sbctx, &apiv1.Variables{
			Items: variables,
		})
		if err != nil {
			e.Logger.Error("could not resolve variables", zap.Error(err))
			e.done <- nil
			return
		}
	}

	event.LogApiStart(e.Logger, e.id, e.Api, e.Api.GetMetadata().GetOrganization(), e.IsDeployed)
	last, _, err := e.resolver.AuthorizedBlocks(sbctx, e.Api.GetBlocks(), e.Api.GetAuthorization(), e.DefaultResolveOptions...)
	if err != nil {
		if sbctx.Context.Err() == context.Canceled {
			err = context.Canceled
		}

		sberrors.Logger(e.Logger, err)("failed to resolve api", zap.Error(err))
		e.done <- nil

		// NOTE(frank): We should check at some point if we can just continue instead of return early.
		return
	}

	e.wg.Wait()

	// No matter how good our static validation is, we will NEVER be able to
	// tell if a user is truly joining on a parallel block with WAIT_NONE.
	// Because of this, we need to join on any outstanding parallels.
	e.join()
	event.LogApiEnd(e.Logger, e.id, e.Api, e.Api.GetMetadata().GetOrganization(), e.IsDeployed)

	if ctx.Err() == context.Canceled {
		e.Logger.Warn("execution was canceled", zap.Error(ctx.Err()))
		e.done <- nil
		return
	}

	if e.Options.Options.GetExcludeOutput() {
		e.done <- &Done{
			Last:             last,
			GarbageCollector: e.variables,
		}
		return
	}

	output, err := FetchBlockOutput(ctx, e.Key, e.Store, last)
	if err != nil {
		sberrors.Logger(e.Logger, err)("could not read the output for the final block from the store", zap.Error(err))
		e.done <- nil
		return
	}

	// There is no "request" in the root output.
	output.Request = ""
	output.RequestV2 = nil

	e.done <- &Done{
		Output:           output,
		Last:             last,
		GarbageCollector: e.variables,
	}

	e.detached = true
}

func (e *execution) Event() chan *Event {
	return e.stream
}

func (e *execution) Done() chan *Done {
	return e.done
}

func (e *execution) ID() string {
	return e.id
}

func (e *execution) Request() {
	// TODO(frank): Move event stuff into here.

	e.stream <- &Event{
		StreamResponse: &apiv1.StreamResponse{
			Execution: e.id,
			Event: &apiv1.Event{
				Name:      e.Api.GetMetadata().GetName(),
				Timestamp: timestamppb.New(e.now()),
				Event:     &apiv1.Event_Request_{},
			},
		},
	}
}

func (e *execution) Start(ctx *apictx.Context) *apictx.Context {
	tracer.Logger(ctx.Context, e.Logger).Info(fmt.Sprintf("The block %s has been started.", ctx.Name),
		ctx.Fields(
			e.DefinitionMetadata,
			zap.String(observability.OBS_TAG_REMOTE, "true"),
			zap.String(observability.OBS_TAG_RESOURCE_ACTION, "started"),
		)...,
	)

	event := e.event(ctx)
	event.Event.Event = &apiv1.Event_Start_{
		Start: &apiv1.Event_Start{},
	}
	e.stream <- event

	ctx.Context = context.WithValue(ctx.Context, ctxKeyStartTime, e.now().UnixMilli())

	return ctx
}

func (e *execution) Finish(ctx *apictx.Context, perf *transportv1.Performance, err error) {
	if ctx == nil {
		ctx = apictx.New(&apictx.Context{
			Context: context.Background(),
			Type:    apiv1.BlockType_BLOCK_TYPE_UNSPECIFIED,
		})
	}

	// If the client cancels the request, there's no need to continue.
	if ctx.Context.Err() == context.Canceled {
		return
	}

	logger := tracer.Logger(ctx.Context, e.Logger)

	// Construct a base event with properties that
	// are shared with the other event types.
	event := e.event(ctx)

	var performance *apiv1.Performance
	{
		if perf != nil {
			performance = new(apiv1.Performance)

			if start, ok := ctx.Context.Value(ctxKeyStartTime).(int64); ok {
				performance.Start = start
				performance.Finish = e.now().UnixMilli()
				performance.Total = performance.Finish - performance.Start

			}

			if perf != nil && perf.PluginExecution != nil {
				performance.Execution = int64(perf.PluginExecution.Value) / 1000 // NOTE(frank): the worker will return this value in microseconds
				performance.Overhead = performance.Total - performance.Execution

				if performance.Overhead < 0 {
					// NOTE(frank): This would be a bug but I don't want to propogate this to the client.
					performance.Overhead = 0
				}

				if ctx.Type == apiv1.BlockType_BLOCK_TYPE_STEP && e.Api.GetMetadata().GetId() != "" {
					// NOTE(frank): We should batch these and write once per API
					go func() {
						estimate := performance.Execution
						if err != nil {
							estimate = math.MaxUint32
						}

						key := estimateKey(e.Api.GetMetadata().GetId(), ctx.Name)

						if err := e.Store.Write(context.Background(), store.Pair(key, estimate)); err != nil {
							logger.Error("failed to report estimate", zap.Error(err))
						}

						e.Store.Expire(context.Background(), 24*time.Hour, key)
					}()
				}
			}
		}
	}

	var output *apiv1.Output
	{
		if !e.detached && e.Options.Options != nil && e.Options.Options.IncludeEventOutputs {
			// NOTE(frank): this is messy; refactor
			o, oerr := FetchBlockOutput(ctx.Context, e.Key, e.Store, ctx.Name)
			if oerr != nil {
				// TODO(frank): I think we're logging this for blocks that have no outputs.
				// Hence, this will log a lot of false positives.
				logger.Error("could not retrieve output", zap.Error(oerr))
				err = errors.Join(err, oerr)
			} else {
				output = o
			}

		}
	}

	fields := ctx.Fields(e.DefinitionMetadata,
		zap.String(observability.OBS_TAG_REMOTE, "true"),
	)

	var finalErr *commonv1.Error
	var status apiv1.BlockStatus
	var verb string
	{
		if err != nil {
			if context.Cause(ctx.Context) != nil {
				err = context.Cause(ctx.Context)
			}
			event.err = err

			finalErr = sberrors.ToCommonV1(err)
			finalErr.Handled = ctx.Options().IgnoreError
			finalErr.BlockPath = ctx.BlockPath()
			finalErr.FormPath = ctx.FormPath()
			status = apiv1.BlockStatus_BLOCK_STATUS_ERRORED
			verb = "failed"

			fields = append(fields, zap.Error(err))
		} else {
			status = apiv1.BlockStatus_BLOCK_STATUS_SUCCEEDED
			verb = "finished"
		}
	}

	log.Leveled(logger, err)(fmt.Sprintf("The block %s has %s.", ctx.Name, verb), append(fields, zap.String(observability.OBS_TAG_RESOURCE_ACTION, verb))...)

	event.Event.Event = &apiv1.Event_End_{
		End: &apiv1.Event_End{
			Performance: performance,
			Output:      output,
			Error:       finalErr,
			Status:      status,
			Resolved:    ctx.GetResolved(),
		},
	}

	e.stream <- event
}

func (e *execution) Data(ctx *apictx.Context, value *structpb.Value) {
	event := e.event(ctx)
	event.Event.Event = &apiv1.Event_Data_{
		Data: &apiv1.Event_Data{
			Value: value,
		},
	}
	e.stream <- event
}

func (e *execution) event(ctx *apictx.Context) *Event {
	var parent *string
	if ctx.Parent != "" {
		parent = &ctx.Parent
	}
	return &Event{
		StreamResponse: &apiv1.StreamResponse{
			Execution: e.id,
			Event: &apiv1.Event{
				Name:      ctx.Name,
				Timestamp: timestamppb.New(e.now()),
				Parent:    parent,
				Type:      ctx.Type,
			},
		},
	}
}

func (e *execution) estimate(ctx context.Context, api *apiv1.Api) (map[string]*uint32, error) {
	backdoor := []*uint32{}
	refs := []string{}
	estimates := map[string]*uint32{}

	if e.Api.GetMetadata().GetId() == "" {
		return estimates, nil
	}

	utils.ForEachBlockInAPI(api, func(block *apiv1.Block) {
		step := block.GetStep()

		// NOTE(frank): We only care about steps.
		if step == nil {
			return
		}

		// The portal makes it so that we can assign a value after the fact.
		var portal uint32
		estimates[block.Name] = &portal

		refs = append(refs, estimateKey(e.Api.GetMetadata().GetId(), block.Name))
		backdoor = append(backdoor, &portal)
	})

	if len(refs) == 0 {
		return estimates, nil
	}

	results, err := e.Store.Read(ctx, refs...)
	if err != nil {
		return nil, err
	}

	for i := 0; i < len(results); i++ {
		if results[i] == nil {
			continue
		}

		if _, ok := results[i].(string); !ok {
			e.Logger.Warn(fmt.Sprintf("encountered estimate (%v) that was not a string", results[i]))
			continue
		}

		ui64, e := strconv.ParseUint(results[i].(string), 10, 32)
		if e != nil {
			return nil, err
		}

		(*backdoor[i]) = uint32(ui64)
	}

	return estimates, nil
}

func estimateKey(apiID, stepName string) string {
	return fmt.Sprintf("ESTIMATE.%s.%s", apiID, stepName)
}

func (e *execution) join() {
	for _, ch := range e.resolver.parallels.Contents() {
		_, open := <-ch

		if open {
			close(ch)
		}
	}
}
