package executor

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/superblocksteam/agent/internal/auth"
	"github.com/superblocksteam/agent/internal/fetch"
	"github.com/superblocksteam/agent/internal/flags"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/constants"
	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/engine"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/executor/middleware"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/observability"
	event "github.com/superblocksteam/agent/pkg/observability/emitter/event"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/plugin"
	"github.com/superblocksteam/agent/pkg/pool"
	"github.com/superblocksteam/agent/pkg/secrets"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/store/gc"
	"github.com/superblocksteam/agent/pkg/template"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/template/plugins/expression"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/worker"
	wops "github.com/superblocksteam/agent/pkg/worker/options"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	javascriptv1 "github.com/superblocksteam/agent/types/gen/go/plugins/javascript/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

// This ensures that the resolver implements the Resolve interface.
var _ Resolve = new(resolver)

type ctxKey int

const (
	ctxKeyBlockName ctxKey = iota
	ctxKeyStartTime
	ctxKeyParentName
	ctxKeyScopeLevel
	ctxKeyBlockIndex

	tokenNone    string = ""
	tokenTry     string = "TRY"
	tokenCatch   string = "CATCH"
	tokenFinally string = "FINALLY"
	tokenIf      string = "if"
	tokenElseIf  string = "elseIf"
	tokenElse    string = "else"
	tokenTrigger string = "TRIGGER"
	tokenProcess string = "PROCESS"
)

//go:generate mockery --name=Events --output . --filename mock_events.go --outpkg executor --structname MockEvents
type Events interface {
	Finish(*apictx.Context, *transportv1.Performance, error)
	Data(*apictx.Context, *structpb.Value)
	Start(*apictx.Context) *apictx.Context
	Request()
}

type resolver struct {
	orgId              string
	apiName            string
	worker             worker.Client
	logger             *zap.Logger
	files              []*transportv1.Request_Data_Data_Props_File
	fileServerUrl      string
	ctx                context.Context
	cancel             context.CancelCauseFunc
	rootStartTime      time.Time
	timeout            time.Duration
	wg                 *sync.WaitGroup
	execution          string
	key                utils.Map[string]
	variables          gc.GC
	fetcher            fetch.Fetcher
	tokenManager       auth.TokenManager
	fetchToken         string
	parallels          utils.List[chan struct{}]
	store              store.Store
	flags              flags.Flags
	integrations       map[string]*structpb.Struct
	estimates          map[string]*uint32
	manager            *manager
	stepMiddlewares    []middleware.Middleware[middleware.StepFunc]
	blockMiddlewares   []middleware.Middleware[middleware.BlockFunc]
	profile            string
	organizationPlan   string
	definitionMetadata *apiv1.Definition_Metadata
	createSandboxFunc  func() engine.Sandbox
	secrets            secrets.Secrets
	SecretManager      secrets.SecretManager
	attributes         []attribute.KeyValue
	isDeployed         bool
	// This is used to determine whether or not we should
	// be sending the agent key as part of the workflow fetch.
	// This should only be true in the case of a scheduled job
	useAgentKey               bool
	v8SupportedModules        map[string]bool
	templatePlugin            func(*plugins.Input) plugins.Plugin
	legacyTemplatePlugin      func(*plugins.Input) plugins.Plugin
	legacyTemplateResolver    func(context.Context, *utils.TokenJoiner, string) engine.Value
	legacyTemplateTokenJoiner *utils.TokenJoiner

	Events
	*Options
}

type Resolve interface {
	Step(*apictx.Context, *apiv1.Step, ...options.Option) (*transportv1.Performance, string, error)
	Wait(*apictx.Context, *apiv1.Block_Wait, ...options.Option) (string, string, error)
	Parallel(*apictx.Context, *apiv1.Block_Parallel, ...options.Option) (string, error)
	Loop(*apictx.Context, *apiv1.Block_Loop, ...options.Option) (string, error)
	Conditional(*apictx.Context, *apiv1.Block_Conditional, ...options.Option) (string, error)
	TryCatch(*apictx.Context, *apiv1.Block_TryCatch, ...options.Option) (string, error)
	Break(*apictx.Context, *apiv1.Block_Break, ...options.Option) error
	Return(*apictx.Context, *apiv1.Block_Return, ...options.Option) (string, error)
	Throw(*apictx.Context, *apiv1.Block_Throw, ...options.Option) error
	Variables(*apictx.Context, *apiv1.Variables, ...options.Option) (*apictx.Context, error)
	Stream(*apictx.Context, *apiv1.Block_Stream, ...options.Option) error
	Send(*apictx.Context, *apiv1.Block_Send, ...options.Option) error
}

func NewResolver(
	ctx context.Context,
	cancel context.CancelCauseFunc,
	orgId string,
	orgPlan string,
	worker worker.Client,
	logger *zap.Logger,
	fileServerUrl string,
	wg *sync.WaitGroup,
	executionId string,
	key utils.Map[string],
	variables gc.GC,
	store store.Store,
	flags flags.Flags,
	// sandbox engine.Sandbox,
	events Events,
	attributes []attribute.KeyValue,
	estimates map[string]*uint32,
	useAgentKey bool,
	blockMiddlewares []middleware.Middleware[middleware.BlockFunc],
	stepMiddlewares []middleware.Middleware[middleware.StepFunc],
	options *Options,
) *resolver {
	return &resolver{
		ctx:              constants.WithExecutionID(ctx, executionId),
		cancel:           cancel,
		orgId:            orgId,
		organizationPlan: orgPlan,
		worker:           worker,
		logger:           logger,
		fileServerUrl:    fileServerUrl,
		wg:               wg,
		execution:        executionId,
		key:              key,
		variables:        variables,
		store:            store,
		flags:            flags,
		Events:           events,
		attributes:       attributes,
		estimates:        estimates,
		useAgentKey:      useAgentKey,
		blockMiddlewares: blockMiddlewares,
		stepMiddlewares:  stepMiddlewares,
		parallels:        utils.NewList[chan struct{}](),
		manager: &manager{
			mutex:   sync.RWMutex{},
			exiters: map[string](chan *exit){},
		},
		apiName:                   options.Api.GetMetadata().GetName(),
		rootStartTime:             options.RootStartTime,
		timeout:                   options.Timeout,
		fetcher:                   options.Fetcher,
		tokenManager:              options.TokenManager,
		fetchToken:                options.FetchToken,
		definitionMetadata:        options.DefinitionMetadata,
		integrations:              options.Integrations,
		isDeployed:                options.IsDeployed,
		SecretManager:             options.SecretManager,
		secrets:                   options.Secrets,
		Options:                   options,
		v8SupportedModules:        make(map[string]bool),
		templatePlugin:            options.TemplatePlugin,
		legacyTemplatePlugin:      options.LegacyTemplatePlugin,
		legacyTemplateResolver:    options.LegacyTemplateResolver,
		legacyTemplateTokenJoiner: options.LegacyTemplateTokenJoiner,
	}
}

// NOTE(frank): We may not need to return an error here.
// last: name of last block to execute (may not always be the last one if there's a return, throw, etc)
// ref: kvstore key of last block
func (r *resolver) blocks(ctx *apictx.Context, blocks []*apiv1.Block, settings ...options.Option) (last string, ref string, err error) {
	// NOTE(frank): Careful, I spent 2 whole days debugging an issue because were weren't copying the options.
	settings = options.Copy(settings...)
	ctx = ctx.WithOptions(options.Apply(settings...))

	// This registers a new channel of communication
	// so that other scopes can tell this scope to exit.
	exiter := r.manager.scope(strings.Join(ctx.Parents(), "."))

	// Sometimes we JUST need to terminate OUR OWN scope.
	// Hence, we're creating a scope specific context.
	thisScopeCtx, thisScopeCancel := context.WithCancelCause(r.ctx)
	defer thisScopeCancel(fmt.Errorf("block scope cancelled by deferred cancel")) // Ensuring we don't leak this context.

	for i := 0; i < len(blocks); i++ {
		select {
		// This will also be notified if the resolver itself needs
		// to exit as this context is a child of that context.
		case <-thisScopeCtx.Done():
			if thisScopeCtx.Err() != nil {
				r.logger.Debug("block scope cancelled or deadline exceeded", zap.Error(context.Cause(thisScopeCtx)))
			}
		case <-ctx.Options().Signal:
		default:
			if _, err := tracer.Observe(ctx.Context, "", nil, func(spanCtx context.Context, span trace.Span) (any, error) {
				span.SetAttributes(append(r.attributes,
					attribute.String(observability.OBS_TAG_RESOURCE_NAME, blocks[i].Name),
					attribute.String(observability.OBS_TAG_RESOURCE_TYPE, blocks[i].Type().String()),
					attribute.Int64(observability.OBS_TAG_REMAINING_TIME, r.timeLeftOnApi().Milliseconds()),
				)...)

				newCtx := ctx.Advance(blocks[i].Name)
				newCtx.Context = spanCtx

				if i == len(blocks)-1 {
					last = newCtx.Name
				}

				// Execute the block.
				chained := middleware.Chain[middleware.BlockFunc](r.Block, r.blockMiddlewares...)

				event.LogBlockStart(r.logger, ctx, blocks[i], r.orgId, r.isDeployed)
				newCtx, ref, err = chained(newCtx, blocks[i], settings...)
				if err != nil {
					event.LogBlockEnd(r.logger, ctx, blocks[i], r.orgId, r.isDeployed, apiv1.BlockStatus_BLOCK_STATUS_ERRORED)
				} else {
					event.LogBlockEnd(r.logger, ctx, blocks[i], r.orgId, r.isDeployed, apiv1.BlockStatus_BLOCK_STATUS_SUCCEEDED)
				}

				ctx.Merge(newCtx)

				// If there are no messages in the exiter communication
				// channel we can return and continue execution.
				if len(exiter) == 0 {
					return nil, err
				}

				// Read the message on the communication channel.
				event := <-exiter

				// We know no matter what that we'll need to exit this scope.
				// This invocation does not immedietaly exit but registers an
				// exit for when it is read at the beginning of the next loop.
				thisScopeCancel(fmt.Errorf("block scope cancelled"))

				// In some cases (i.e. a loop block), it is not enough to exit
				// our scope. Hence, if we've been given an explicit function
				// to call to perform a comprehensive exit, execute it.
				if breaker := ctx.Options().Breaker; breaker != nil {
					breaker(fmt.Errorf("block scope cancelled by breaker"))
				}

				// Alright here is where we have some weirdness. We're implicictly
				// determining whether or not we need to propogate our exit message
				// or whether it was only meant for us using the value of the fields.
				//
				//	event.empty() != "" -> we must propogate
				//	event.empty() == "" -> it was meant for us
				//
				// If it was only meant for us, we are done here and should return.
				if event.empty() {
					return nil, err
				}

				// Sometimes we don't need to back all the way out of our stacktrace.
				// In the case of a break block, we only need to back out of the loop.
				// The "until" field tells us how far we need to back out.
				if event.until != "" && event.until == ctx.Parent {
					return nil, err
				}

				// Use the notification channel we have with our parent
				// to let them know that that they need to exit as well.
				if manager, ok := r.manager.exiters[strings.Join(ctx.Parents()[:len(ctx.Parents())-1], ".")]; ok {
					manager <- event
					return nil, err
				}

				// If we're here, it means that we are the root as we have no parent.
				// The key that holds the result, if any, has been propogated to us.
				last = event.key

				return nil, err

			}, nil); err != nil && ctx.Context.Err() == nil {
				// NOTE(frank): We don't want to logs step errors that result in integration failures.
				if err == sberrors.ErrInternal {
					r.logger.Error(fmt.Sprintf("failed to resolve block %s due to an internal error", blocks[i].Name), zap.Error(err))
				}

				r.logger.Info(fmt.Sprintf("failed to resolve block %s due to a user error", blocks[i].Name), zap.Error(err))

				if !ctx.Options().IgnoreError {
					thisScopeCancel(fmt.Errorf("block scope cancelled by error"))
				}

				return "", "", err
			}
		}
	}

	return
}

func (r *resolver) AuthorizedBlocks(ctx *apictx.Context, blocks []*apiv1.Block, authorization *apiv1.Authorization, ops ...options.Option) (last string, ref string, err error) {
	if authorization != nil {
		authCtx := ctx.Advance("ApiAuthorizationCheck")
		authCtx.Type = apiv1.BlockType_BLOCK_TYPE_AUTHORIZATION_CHECK
		authorized := true // Default to authorized if no authorization config
		r.Start(authCtx)
		if authorization.GetType() == apiv1.AuthorizationType_AUTHORIZATION_TYPE_JS_EXPRESSION {
			// create a new context for the authorization check
			sandbox := r.createSandboxFunc()
			defer sandbox.Close()

			expression := authorization.GetExpression()

			// evaluate the authorization expression
			authorizedPtr, err := ResolveTemplate[bool](authCtx, sandbox, r.logger, expression, false, engine.WithJSONEncodeArrayItems())
			if err != nil {
				authorized = false
				// Write authorization result to store
				if authKey, authErr := r.store.Key("AUTHORIZATION", r.execution); authErr == nil {
					authPayload := (&apiv1.Output{
						Result: structpb.NewStructValue(&structpb.Struct{
							Fields: map[string]*structpb.Value{
								"authorized": structpb.NewBoolValue(authorized),
							},
						}),
					}).ToOld()
					if authData, authMarshalErr := json.Marshal(authPayload); authMarshalErr == nil {
						if writeErr := r.store.Write(ctx.Context, store.Pair(authKey, string(authData))); writeErr != nil {
							r.logger.Error("failed to write authorization result to store", zap.Error(writeErr))
						} else {
							// Add authorization key to refs so it can be retrieved later
							r.key.Put(authCtx.Name, authKey)
							// Record for garbage collection
							r.variables.Record(authKey)
						}
					}
				}
				if sberrors.IsBindingError(err) {
					message := "invalid authorization condition. Response must be a boolean"
					r.Finish(authCtx, nil, sberrors.ApiAuthorizationError(errors.New(message)))
					return "", "", sberrors.ApiAuthorizationError(errors.New(message))
				}
				r.Finish(authCtx, nil, err)
				return "", "", sberrors.ApiAuthorizationError(err)
			}

			// if the expression evaluates to false, return an error
			if !utils.PointerDeref(authorizedPtr) {
				authorized = false
				authorizationError := sberrors.ApiAuthorizationError(errors.New("you don't have permission to execute this API"))
				// Write authorization result to store
				if authKey, authErr := r.store.Key("AUTHORIZATION", r.execution); authErr == nil {
					authPayload := (&apiv1.Output{
						Result: structpb.NewStructValue(&structpb.Struct{
							Fields: map[string]*structpb.Value{
								"authorized": structpb.NewBoolValue(authorized),
							},
						}),
					}).ToOld()
					if authData, authMarshalErr := json.Marshal(authPayload); authMarshalErr == nil {
						if writeErr := r.store.Write(ctx.Context, store.Pair(authKey, string(authData))); writeErr != nil {
							r.logger.Error("failed to write authorization result to store", zap.Error(writeErr))
						} else {
							// Add authorization key to refs so it can be retrieved later
							r.key.Put(authCtx.Name, authKey)
							// Record for garbage collection
							r.variables.Record(authKey)
						}
					}
				}
				r.Finish(authCtx, nil, authorizationError)
				return "", "", authorizationError
			}
		}
		// Write successful authorization result to store
		if authKey, authErr := r.store.Key("AUTHORIZATION", r.execution); authErr == nil {
			authPayload := (&apiv1.Output{
				Result: structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"authorized": structpb.NewBoolValue(authorized),
					},
				}),
			}).ToOld()
			if authData, authMarshalErr := json.Marshal(authPayload); authMarshalErr == nil {
				if writeErr := r.store.Write(ctx.Context, store.Pair(authKey, string(authData))); writeErr != nil {
					r.logger.Error("failed to write authorization result to store", zap.Error(writeErr))
				} else {
					// Add authorization key to refs so it can be retrieved later
					r.key.Put(authCtx.Name, authKey)
					// Record for garbage collection
					r.variables.Record(authKey)
				}
			}
		}
		r.Finish(authCtx, nil, nil)
		ctx.Merge(authCtx)
	}

	return r.blocks(ctx, blocks, ops...)
}

func (r *resolver) Block(ctx *apictx.Context, block *apiv1.Block, ops ...options.Option) (newCtx *apictx.Context, ref string, err error) {
	if !ctx.Options().Async {
		r.wg.Add(1)
		defer r.wg.Done()
	}

	(*ctx).Type = block.Type()
	newCtx = ctx
	ctx = r.Start(ctx)

	name := ctx.Name

	// NOTE(frank): Need to think through Wait some more.
	persist := true

	metrics.AddCounter(ctx.Context, metrics.BlocksTotal,
		attribute.String("block_type", apiv1.BlockType_name[int32(block.Type())]),
		attribute.String("organization_id", r.orgId),
	)

	if step := block.GetStep(); step != nil {
		span := trace.SpanFromContext(ctx.Context)
		span.SetName("execute.block.step")

		perf, ref, rawError, err := maybeError(ctx, func() (*transportv1.Performance, string, error) {
			return middleware.Chain[middleware.StepFunc](r.Step, r.stepMiddlewares...)(ctx, step, ops...)
		})

		utils.EnrichSpanWithPerformance(span, perf)

		defer r.Finish(ctx, perf, rawError)

		// Since the output came from the worker, we need to record it for cleanup
		r.variables.Record(ref)

		if err != nil {
			sberrors.Logger(r.logger, err)("failed to resolve step", zap.Error(err))
			return newCtx, "", rawError
		}

		return newCtx.WithVariables(map[string]*transportv1.Variable{
			ctx.Name: {
				Key:  ref,
				Type: apiv1.Variables_TYPE_NATIVE,
				Mode: apiv1.Variables_MODE_READ,
			},
		}), ref, rawError
	}

	if wait := block.GetWait(); wait != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.wait")
		persist = false
		name, ref, err = r.Wait(ctx, wait, ops...)
	}
	if rtn := block.GetReturn(); rtn != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.return")
		ref, err = r.Return(ctx, rtn, ops...)
	}
	if send := block.GetSend(); send != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.send")
		err = r.Send(ctx, send, ops...)
	}
	if stream := block.GetStream(); stream != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.stream")
		err = r.Stream(ctx, stream, ops...)
	}
	if brk := block.GetBreak(); brk != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.break")
		err = r.Break(ctx, brk, ops...)
	}
	if throw := block.GetThrow(); throw != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.throw")
		err = r.Throw(ctx, throw, ops...)
	}
	if conditional := block.GetConditional(); conditional != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.conditional")
		ref, err = r.Conditional(ctx, conditional, ops...)
	}
	if loop := block.GetLoop(); loop != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.loop")
		ref, err = r.Loop(ctx, loop, ops...)
	}
	if parallel := block.GetParallel(); parallel != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.parallel")
		ref, err = r.Parallel(ctx, parallel, ops...)
	}
	if tryCatch := block.GetTryCatch(); tryCatch != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.trycatch")
		ref, err = r.TryCatch(ctx, tryCatch, ops...)
	}
	if variables := block.GetVariables(); variables != nil {
		trace.SpanFromContext(ctx.Context).SetName("execute.block.variables")
		newCtx, err = r.Variables(ctx, variables, ops...)
	}

	r.variables.Record(ref)

	if err == nil && ref != "" && persist {
		r.key.Put(ctx.Name, ref)
	}

	if err == nil && ref != "" {
		newCtx = newCtx.WithVariables(map[string]*transportv1.Variable{
			name: {
				Key:  ref,
				Type: apiv1.Variables_TYPE_NATIVE,
				Mode: apiv1.Variables_MODE_READ,
			},
		})
	}

	r.Finish(ctx, nil, err)

	return
}

func (r *resolver) Variables(ctx *apictx.Context, variables *apiv1.Variables, ops ...options.Option) (*apictx.Context, error) {
	sandbox := r.createSandboxFunc()
	defer sandbox.Close()
	return Variables(ctx, variables, sandbox, r.logger, r.variables, r.store, ops...)
}

// Variables writes / updates variables to the store and returns the modified context with the new variables
func Variables(
	ctx *apictx.Context, variables *apiv1.Variables, sandbox engine.Sandbox, logger *zap.Logger,
	garbage gc.GC, store store.Store, ops ...options.Option,
) (*apictx.Context, error) {
	if variables == nil || variables.Items == nil || len(variables.Items) < 1 {
		return ctx, nil
	}

	engine, err := sandbox.Engine(ctx.Context)
	if err != nil {
		return ctx, err
	}

	defer engine.Close()

	code := bytes.Buffer{}
	transport := map[string]*transportv1.Variable{}

	// If a variable is native, we need to set it to simple but only for the
	// duration of this function. After we run the engine, we'll update the context
	// to switch it back to native.
	native := map[string]*transportv1.Variable{}

	{
		code.WriteString("{{ (async() => {")

		for _, v := range variables.Items {
			if v.Key == "" {
				continue
			}

			if v.Mode == apiv1.Variables_MODE_UNSPECIFIED {
				v.Mode = apiv1.Variables_MODE_READWRITE
			}

			// NOTE(frank): If we are upserting an existing variable, we need to use the existing key.
			var ref string
			{
				if existing, ok := ctx.Variables.Get(v.Key); ok {
					ref = existing.Key
				} else if ref, err = store.Key("VARIABLE", v.Key); err != nil {
					logger.Error("failed to generate variable key", zap.Error(err))
					return ctx, sberrors.ErrInternal
				}
			}

			value := utils.IdempotentUnwrap(v.Value)

			// value needs to be JSON parseable, which empty string is not
			if value == "" {
				value = "null"
			}

			garbage.Record(ref)

			transport[v.Key] = &transportv1.Variable{
				Key:  ref,
				Type: v.Type,
				Mode: v.Mode,
			}

			switch v.Type {
			case apiv1.Variables_TYPE_SIMPLE:
				code.WriteString(v.Key + `.set(` + value + `);`)
			case apiv1.Variables_TYPE_ADVANCED:
				code.WriteString(`await ` + v.Key + `.set(` + value + `);`)
			case apiv1.Variables_TYPE_NATIVE, apiv1.Variables_TYPE_FILEPICKER:
				native[v.Key] = &transportv1.Variable{
					Key:  ref,
					Type: v.Type,
					Mode: apiv1.Variables_MODE_READ,
				}

				// natives are set as simple just for settings via the engine
				transport[v.Key].Type = apiv1.Variables_TYPE_SIMPLE
				transport[v.Key].Mode = apiv1.Variables_MODE_READWRITE
				code.WriteString(v.Key + `.set(` + value + `);`)

			default:
				return ctx, errors.New("unknown variable type")
			}
		}

		code.WriteString("return true; })() }}")
	}

	newCtx := ctx.WithVariables(transport)

	result, err := engine.Resolve(ctx.Context, code.String(), newCtx.Variables).Result()
	if err != nil {
		logger.Error("failed to resolve variable bindings", zap.Error(err))
		return ctx, err
	}

	if success, ok := result.(bool); !ok || !success {
		return ctx, errors.New("could not successfully assign variables")
	}

	// retain native variables after setting in engine
	return newCtx.WithVariables(native), nil
}

func (r *resolver) Step(ctx *apictx.Context, step *apiv1.Step, ops ...options.Option) (*transportv1.Performance, string, error) {
	opts := options.Apply(ops...)

	// NOTE(frank): wtf
	r.variables.Record(fmt.Sprintf("%s.context.global.preparedStatementContext", r.execution))

	// workflows are handled a bit differently
	if workflowv1 := step.GetWorkflow(); workflowv1 != nil {
		sandbox := r.createSandboxFunc()
		defer sandbox.Close()

		_, ref, _, err := HandleWorkflow(
			ctx,
			sandbox,
			workflowv1,
			func(_ *apiv1.Definition) string { return ctx.Name },
			r.templatePlugin,
			true,
			r.Options,
			ops...,
		)

		return nil, ref, err
	}

	p, ok := step.GetConfig().(plugin.Plugin)
	if !ok {
		return nil, "", errors.New("plugin must satisfy the plugin interface")
	}

	trace.SpanFromContext(ctx.Context).SetAttributes(
		attribute.String(observability.OBS_TAG_PLUGIN_NAME, p.Name()),
		attribute.String(observability.OBS_TAG_INTEGRATION_ID, step.GetIntegration()),
	)

	action, err := p.Build()
	if err != nil {
		return nil, "", err
	}

	// TODO investigate why a null filed in action config fail the worker execution
	delete(action, "superblocksMetadata")

	// NOTE(frank): We're going to do a v2 of the transport as a fast follow (March 2023).
	var props *transportv1.Request_Data_Data_Props
	{
		action, err := structpb.NewStruct(action)
		if err != nil {
			return nil, "", err
		}

		var resolvedActionCfg *structpb.Struct
		var shouldRender bool
		{
			isStreamingExecution := wops.Apply(opts.Worker...).Stream != nil

			if shouldRender = shouldRenderActionConfig(action, p.Type(), isStreamingExecution); shouldRender {
				sandbox := r.createSandboxFunc()
				defer sandbox.Close()
				rendered, err := template.RenderProtoValue(ctx, structpb.NewStructValue(action), r.templatePlugin, sandbox, r.logger)
				if err != nil {
					return nil, "", err
				}
				resolvedActionCfg = rendered.GetStructValue()
			} else if r.shouldConvertToLegacyBindings(action, p.Type(), isStreamingExecution) {
				rendered, err := template.RenderProtoValueWithResolver(
					ctx,
					structpb.NewStructValue(action),
					r.legacyTemplatePlugin,
					r.legacyTemplateResolver,
					r.legacyTemplateTokenJoiner,
					r.logger,
				)
				if err != nil {
					return nil, "", err
				}

				resolvedActionCfg = rendered.GetStructValue()
			} else {
				resolvedActionCfg = action
			}
		}

		// Evaluate parameters expression for parameterized SQL
		// This checks for a 'parameters' field (flat or nested in runSql), evaluates it as JS,
		// and sets 'preparedStatementContext' at the top level for the worker shim
		if hasParametersField(resolvedActionCfg) {
			sandbox := r.createSandboxFunc()
			defer sandbox.Close()
			if err := evaluateParameters(ctx, sandbox, resolvedActionCfg, r.logger); err != nil {
				return nil, "", err
			}
		}
		useWasmBindingsSandbox := r.flags.GetJsBindingsUseWasmBindingsSandboxEnabled(r.organizationPlan, r.orgId)

		props = &transportv1.Request_Data_Data_Props{
			ActionConfiguration:    resolvedActionCfg,
			BindingKeys:            []*transportv1.Request_Data_Data_Props_Binding{},
			ExecutionId:            r.execution,
			StepName:               ctx.Name,
			Environment:            r.profile, // NOTE(frank): I don't think we need this anymore.
			Variables:              ctx.ReferencedVariables(resolvedActionCfg.String()),
			FileServerUrl:          r.fileServerUrl,
			Files:                  r.files,
			Render:                 !shouldRender, // NOTE(frank): We can deprecate this once all rendering is moved to the orchestrator.
			Version:                "v2",
			UseWasmBindingsSandbox: useWasmBindingsSandbox,
		}

		if integration, ok := r.integrations[step.GetIntegration()]; ok {
			unrenderedDatasourceConfig := structpb.NewStructValue(integration)
			// making a copy
			unrenderedRedactedDatasourceConfig, err := structpb.NewValue(integration.AsMap())
			if err != nil {
				return nil, "", err
			}

			sandbox := r.createSandboxFunc()
			defer sandbox.Close()

			rendered, renderedRedacted, err := EvaluateDatasource(
				ctx,
				sandbox,
				unrenderedDatasourceConfig,
				unrenderedRedactedDatasourceConfig,
				step.GetIntegration(),
				"",
				p.Name(),
				r.variables,
				r.Options,
				ops...)
			if err != nil {
				return nil, "", err
			}

			datasourceConfig := rendered.Kind.(*structpb.Value_StructValue).StructValue
			redactedDatasourceConfig := renderedRedacted.Kind.(*structpb.Value_StructValue).StructValue
			props.DatasourceConfiguration = datasourceConfig
			// This took me a long time to figure out, but redaction is used purely for return the curl request string
			// with redacted values so that the user does not see secrets in the curl request. Recommend moving said logic
			// to the monorepo server
			props.RedactedDatasourceConfiguration = redactedDatasourceConfig
		} else {
			r.logger.Warn("Api Integration required but not found.",
				zap.String("integration", step.GetIntegration()),
				zap.String("apiName", r.apiName),
				zap.String("orgId", r.orgId),
			)
		}
	}

	var mockResponse *structpb.Value
	var mockMatched bool
	var mockError error
	{
		if r.Mocker != nil {
			mockResponse, mockMatched, mockError = r.Mocker.Handle(
				ctx.Context,
				ctx.Name,
				p.Name(),
				props.ActionConfiguration,
			)
		}
	}

	if mockError != nil {
		r.Logger.Error("failed to handle mock", zap.Error(err))
		return nil, "", err
	}

	if mockMatched {
		r.logger.Info("this step was mocked")

		// NOTE(frank): This logic should live here, not in the mock handler.
		// 	            It's not the responsibility of the mock handler to
		//              determine what the caller wants to do with the response.

		pair, err := store.PairWithID((&apiv1.Output{
			Result: mockResponse,
		}).ToOld())

		if err != nil {
			r.Logger.Error("failed to prepare kv pair for mock response", zap.Error(err))
			return nil, "", err
		}

		if err := r.store.Write(ctx.Context, pair); err != nil {
			r.Logger.Error("failed to write mock response to the store", zap.Error(err))
			return nil, "", err
		}

		r.key.Put(ctx.Name, pair.Key)

		return nil, pair.Key, nil
	}

	estimate, ok := r.estimates[ctx.Name]
	if !ok {
		estimate = utils.Pointer[uint32](math.MaxUint32)
	}

	apiTimeoutErrorPrecedence := r.timeLeftOnApi().Milliseconds() < int64(r.flags.GetStepDurationV2(r.organizationPlan, r.orgId))
	workerOpts := append(opts.Worker, wops.OrganizationPlan(r.organizationPlan), wops.OrgId(r.orgId))

	req := &worker.ExecuteRequest{
		Context: context.WithValue(ctx.Context, worker.ContextKeyEstimate, estimate),
		Request: &transportv1.Request_Data_Data{
			Props:  props,
			Quotas: r.constructQuotaProps(),
		},
		Plugin:  r.getPluginNameForExecution(p, props.GetActionConfiguration()),
		Options: workerOpts,
	}

	var perf *transportv1.Performance
	var key string
	{
		if opts.Queue != nil {
			req.Inbox = make(chan *worker.ExecuteResponse)
			opts.Queue <- req
			resp := <-req.Inbox
			perf, key, err = resp.Performance, resp.Key, resp.Error
		} else {
			perf, key, err = r.worker.Execute(
				constants.WithRemainingDuration(req.Context, r.timeLeftOnApi()), req.Plugin, req.Request,
				append(req.Options, wops.ApiTimeoutErrorPrecedence(apiTimeoutErrorPrecedence, sberrors.ApiTimeoutQuotaError(r.timeout.Seconds())))...,
			)
		}
	}

	r.key.Put(ctx.Name, key)

	// add integration error logic handling
	if typedError, ok := sberrors.IsIntegrationError(err); ok {
		metrics.AddCounter(ctx.Context, metrics.IntegrationErrorsTotal,
			attribute.String("plugin_name", p.Name()),
			attribute.String("code", typedError.Code().String()),
		)
	}

	return perf, key, err
}

func (r *resolver) getPluginNameForExecution(p plugin.Plugin, actionConfig *structpb.Struct) string {
	if _, ok := p.(*apiv1.Step_Javascript); ok && r.flags.GetGoWorkerEnabled(r.organizationPlan, r.orgId) && canRouteToV8(actionConfig, r.v8SupportedModules, r.logger) {
		return "v8"
	}
	return p.Type()
}

func (r *resolver) constructQuotaProps() *transportv1.Request_Data_Data_Quota {
	if r.flags == nil {
		return nil
	}

	duration := int64(r.flags.GetStepDurationV2(r.organizationPlan, r.orgId))
	if r.timeLeftOnApi().Milliseconds() < duration {
		duration = r.timeLeftOnApi().Milliseconds()
	}

	return &transportv1.Request_Data_Data_Quota{
		Size:     int32(r.flags.GetStepSizeV2(r.organizationPlan, r.orgId)),
		Duration: int32(duration),
	}
}

func (r *resolver) Stream(ctx *apictx.Context, block *apiv1.Block_Stream, ops ...options.Option) error {
	msgCh := make(chan string, options.Apply(ops...).BufferSize)
	done := make(chan *struct{})
	autoSend := !block.GetOptions().GetDisableAutoSend()

	breaker, cancel := context.WithCancelCause(ctx.Context)
	defer cancel(fmt.Errorf("stream block was canceled"))

	ctx.Context = breaker
	var processErr error

	// NOTE(frank): We do not terminate on message error yet. We can defer this until we have
	//				a long lived stream trigger. We'll need a way to propagate a cancellation.
	go func() {
		// NOTE(frank): It is the job of the transport to close this channel.
		for msg := range msgCh {
			metrics.AddUpDownCounter(ctx.Context, metrics.StreamBufferItemsTotal, -1)
			metrics.AddCounter(ctx.Context, metrics.BlocksStreamEventsTotal)

			if len(block.GetProcess().GetBlocks()) == 0 && autoSend {
				if err := r.Send(ctx, &apiv1.Block_Send{
					Message: msg,
				}); err != nil {
					r.logger.Error("could not send message", zap.Error(err))
				}

				continue
			}

			var newCtx *apictx.Context
			{
				newCtx, processErr = r.Variables(ctx, &apiv1.Variables{
					Items: []*apiv1.Variables_Config{
						{ // Our validation ensures block.Variables is defined.
							Key:   block.Variables.Item,
							Value: fmt.Sprintf(`{{ %s }}`, msg), // We don't need to use %q as we're guaranteed to have a JSON encoded string.
							Type:  apiv1.Variables_TYPE_SIMPLE,
							Mode:  apiv1.Variables_MODE_READWRITE,
						},
					},
				})
				if processErr != nil {
					if ctx.Context.Err() == context.Canceled {
						processErr = nil

						// NOTE(frank): This might lead to unexpected behavior. However, it is consistent with our
						// contract for return blocks while in a loop or parallel; we exit immediately.
						r.logger.Info("context was canceled (most likely by a return block) while processing an event")
					} else {
						r.logger.Error("could not create variable for process block", zap.Error(processErr))
					}
					continue
				}
			}

			processCtx := newCtx.Sink(tokenProcess)

			last, _, processErr := r.blocks(processCtx, block.Process.Blocks, append(ops, options.Breaker(cancel), options.IgnoreError())...)
			if processErr != nil {
				r.logger.Error("could not process message", zap.Error(processErr))
				continue
			}

			output, processErr := FetchBlockOutput(ctx.Context, r.key, r.store, last)
			if processErr != nil {
				r.logger.Error("could not fetch block output", zap.Error(processErr))
				continue
			}

			if autoSend {
				r.Data(ctx, output.Result)
			}
		}

		done <- nil
	}()

	// We shouldn't call `r.Step()` directly because we want all of the orchestration that
	// the `Blocks()` method provides (i.e. start/end events, signal propogation, etc).
	_, _, err := r.blocks(ctx.Sink(tokenTrigger), []*apiv1.Block{
		{
			Name: block.Trigger.Name,
			Config: &apiv1.Block_Step{
				Step: block.Trigger.Step,
			},
		},
	}, append(ops, options.Worker(wops.Receive(msgCh)))...)

	// NOTE(frank): We MUST wait for the goroutine to return gracefully before we return.
	<-done

	if err != nil {
		return err
	}
	return processErr
}

func (r *resolver) Send(ctx *apictx.Context, block *apiv1.Block_Send, ops ...options.Option) (err error) {
	var serialized []byte
	{
		if _, err := getExpressionFromInput(block.Message); err != nil {
			// CASE: We were passed a literal string; not a binding. It may or may not be JSON.
			//		 We're going to give better performance to values already JSON encoded. This
			//		 approach is also required so that we don't double encode values.
			var pb structpb.Value
			{
				if err := (&pb).UnmarshalJSON([]byte(block.Message)); err == nil {
					r.Data(ctx, &pb)
					return nil
				}
			}

			// CASE: Literal value that IS NOT JSON encoded.
			serialized, err = json.Marshal(block.Message)
			if err != nil {
				r.logger.Error("could not json marshal message", zap.Error(err), zap.String("message", block.Message))
				return err
			}
		} else {
			sandbox := r.createSandboxFunc()
			defer sandbox.Close()
			message, err := ResolveTemplate[string](ctx, sandbox, r.logger, block.Message, true)
			if err != nil {
				r.logger.Error("could not resolve message", zap.Error(err), zap.String("message", block.Message))
				ctx.AppendFormPath("message")
				return err
			}

			serialized = []byte(*message)
			byteSize := len(serialized)
			if byteSize > ctx.MaxStreamSendSize {
				return sberrors.StreamSizeQuotaError(ctx.MaxStreamSendSize)
			}
		}
	}

	var pb structpb.Value
	{
		if err := (&pb).UnmarshalJSON(serialized); err != nil {
			r.logger.Error("could not json unmarshal message into structpb", zap.Error(err), zap.String("message", string(serialized)))
			return err
		}
	}

	r.Data(ctx, &pb)
	return nil
}

func (r *resolver) Wait(ctx *apictx.Context, step *apiv1.Block_Wait, ops ...options.Option) (string, string, error) {
	var condition string
	{
		if utils.IsTemplate(step.Condition) || isJavaScriptExpression(step.Condition) {
			sandbox := r.createSandboxFunc()
			defer sandbox.Close()
			cond, err := ResolveTemplate[string](ctx, sandbox, r.logger, step.Condition, false, engine.WithResolved("condition"))
			if err != nil {
				ctx.AppendFormPath("condition")
				return "", "", err
			}

			condition = *cond
		} else {
			condition = step.Condition
		}
	}

	ch, ok := ctx.Parallels.Get(condition)
	if !ok {
		return "", "", nil
	}

	// TODO(frank): probs need to add some sort of timeout
	<-ch

	close(ch)
	ctx.Parallels.Del(condition) // NOTE(frank): Add unit tests. There was a bug that existed for 6 monts here.

	ref, ok := r.key.Get(condition)
	if !ok {
		return "", "", nil
	}

	return condition, ref, nil
}

func (r *resolver) Return(ctx *apictx.Context, block *apiv1.Block_Return, ops ...options.Option) (ref string, err error) {
	expr, err := getExpressionFromInput(block.Data)
	if err != nil {
		return "", err
	}

	// NOTE(frank): This is not performant but is the easiest to do and fits well with the flow of the code.
	//				We can be better and actually never leave the orchestrator for this block type.
	_, ref, err = r.Step(ctx, &apiv1.Step{
		Config: &apiv1.Step_Javascript{
			Javascript: &javascriptv1.Plugin{
				Body: fmt.Sprintf("return %s;", expr),
			},
		},
	})

	if err != nil {
		return
	}

	if breaker := ctx.Options().Breaker; breaker != nil {
		breaker(fmt.Errorf("block scope cancelled by breaker"))
	}

	// TODO(frank): Add this scope specific manager to the context.
	if manager, ok := r.manager.exiters[strings.Join(ctx.Parents(), ".")]; ok {
		manager <- &exit{key: ctx.Name}
	} else {
		return "", errors.New("there is no manager for this scope")
	}

	return
}

func (r *resolver) Throw(ctx *apictx.Context, throw *apiv1.Block_Throw, ops ...options.Option) error {
	sandbox := r.createSandboxFunc()
	defer sandbox.Close()
	message, err := ResolveTemplate[string](ctx, sandbox, r.logger, throw.Error, false, engine.WithResolved("error"))
	if err != nil {
		ctx.AppendFormPath("error")
		return err
	}

	return errors.New(*message)
}

func (r *resolver) Break(ctx *apictx.Context, step *apiv1.Block_Break, ops ...options.Option) error {
	// We set as boolean to allow truthy / falsy conditions to be used.
	sandbox := r.createSandboxFunc()
	defer sandbox.Close()
	shouldBreak, err := ResolveTemplate[bool](ctx, sandbox, r.logger, step.Condition, false, engine.WithAsBoolean(), engine.WithResolved("condition"))
	if err != nil {
		ctx.AppendFormPath("condition")
		return err
	}

	if !*shouldBreak {
		return nil
	}

	if manager, ok := r.manager.exiters[strings.Join(ctx.Parents(), ".")]; ok {
		manager <- &exit{
			until: ctx.Loop(),
		}
	} else {
		return errors.New("there is no manager for this scope")
	}

	return nil
}

func (r *resolver) TryCatch(ctx *apictx.Context, step *apiv1.Block_TryCatch, ops ...options.Option) (ref string, err error) {
	// A catch with empty or nil blocks is still valid / should catch the error.
	if step.Catch != nil {
		ops = append(ops, options.IgnoreError())
	}

	_, ref, err = r.blocks(ctx.Sink(tokenTry), step.Try.Blocks, ops...)

	if err != nil && step.Catch != nil {
		if len(step.Catch.Blocks) > 0 {
			var newCtx *apictx.Context
			{
				if step.Variables != nil && step.Variables.Error != "" {
					newCtx, err = r.Variables(ctx, &apiv1.Variables{
						Items: []*apiv1.Variables_Config{
							{
								Key:   step.Variables.Error,
								Value: fmt.Sprintf(`{{ %q }}`, err),
								Type:  apiv1.Variables_TYPE_SIMPLE,
								Mode:  apiv1.Variables_MODE_READWRITE,
							},
						},
					})
					if err != nil {
						return "", err
					}
				} else {
					newCtx = ctx
				}
			}

			// if catch throws an error, bubble it up
			_, ref, err = r.blocks(newCtx.ClearOptions().Sink(tokenCatch), step.Catch.Blocks)
		} else {
			// Swallow the error if no catch blocks, but catch still defined
			err = nil
		}
	}

	// run the finally regardless of the error
	var finallyErr error
	if step.Finally != nil && len(step.Finally.Blocks) > 0 {
		_, ref, finallyErr = r.blocks(ctx.ClearOptions().Sink(tokenFinally), step.Finally.Blocks)
	}

	// Override the error only if finally throws an error. Otherwise, we should retain the original error from try or catch instead of overriding
	if finallyErr != nil {
		err = finallyErr
	}

	// If the try error was caught, but no step was executed in the process of catching it (eg empty catch blocks), then we need to set some output
	if ref == "" && err == nil {
		ref, err = emptyOutput(r.store)
	}

	return
}

func (r *resolver) Conditional(ctx *apictx.Context, step *apiv1.Block_Conditional, ops ...options.Option) (ref string, err error) {
	matched := false

	run := func(branch *apiv1.Block_Conditional_Condition, path ...string) error {
		condition := utils.Escape(branch.Condition)

		// We set as boolean to allow truthy / falsy conditions to be used.
		sandbox := r.createSandboxFunc()
		defer sandbox.Close()
		shouldRunBranch, err := ResolveTemplate[bool](ctx, sandbox, r.logger, condition, false, engine.WithAsBoolean(), engine.WithResolved(strings.Join(path, ".")))
		if err != nil {
			ctx.AppendFormPath("if", "condition")
			return err
		}

		if *shouldRunBranch {
			matched = true
			if _, ref, err = r.blocks(ctx.Sink(strings.Join(path, "_")), branch.Blocks, ops...); err != nil {
				return err
			}
		}

		return nil
	}

	err = run(step.If, tokenIf, "condition")
	if err != nil {
		return
	}

	for idx, branch := range step.ElseIf {
		if matched {
			break
		}

		err = run(branch, tokenElseIf, strconv.Itoa(idx), "condition")
		if err != nil {
			return
		}
	}

	if step.Else != nil && len(step.Else.Blocks) > 0 && !matched {
		_, ref, err = r.blocks(ctx.Sink(tokenElse), step.Else.Blocks)
		if err != nil {
			return
		}
		matched = true
	}

	// A match can happen with no blocks, so we also need to check empty ref
	if !matched || ref == "" {
		// NOTE(frank): We should maybe:
		// 	(1) share the same no output per exeuction.
		// 	(2) hoist this up in a general case to Blocks().
		ref, err = emptyOutput(r.store)
	}

	return
}

func (r *resolver) Loop(ctx *apictx.Context, step *apiv1.Block_Loop, ops ...options.Option) (ref string, err error) {
	var items []string

	switch step.Type {
	case apiv1.Block_Loop_TYPE_FOR:
		sandbox := r.createSandboxFunc()
		defer sandbox.Close()
		v, err := ResolveTemplate[int32](ctx, sandbox, r.logger, step.Range, false, engine.WithResolved("range"))
		if err != nil {
			ctx.AppendFormPath("range")
			return "", sberrors.BindingError(errors.New("loop range must evalute to a number"))
		}

		for i := 0; i < int(*v); i++ {
			items = append(items, "null")
		}
	case apiv1.Block_Loop_TYPE_FOREACH:
		sandbox := r.createSandboxFunc()
		defer sandbox.Close()
		vals, err := ResolveTemplate[[]string](ctx, sandbox, r.logger, step.Range, false, engine.WithJSONEncodeArrayItems(), engine.WithResolved("range"))
		if err != nil {
			ctx.AppendFormPath("range")
			return "", sberrors.BindingError(errors.New("loop range must evalute to an array"))
		}

		items = *vals
	case apiv1.Block_Loop_TYPE_WHILE:
		metrics.AddCounter(ctx.Context, metrics.BlocksLoopForeverTotal)
		r.logger.Debug("executing a while loop, could potentially forever loop :scary:")
	default:
		return "", fmt.Errorf("invalid loop type: %s", step.Type)
	}

	idx := 0 // NOTE(frank): closure
	iterationCtx := ctx
	refs := utils.NewList[string]()

	next := func(ctx *apictx.Context) (int, string, bool, error) {
		defer func() {
			idx++
		}()

		if step.Type == apiv1.Block_Loop_TYPE_WHILE {
			// We set as boolean to allow truthy / falsy conditions to be used.
			sandbox := r.createSandboxFunc()
			defer sandbox.Close()
			shouldContinue, err := ResolveTemplate[bool](ctx, sandbox, r.logger, step.Range, false, engine.WithAsBoolean())
			if err != nil {
				ctx.AppendFormPath("range")
				return 0, "", false, err
			}

			return idx, "null", *shouldContinue, nil
		}

		if idx == len(items) {
			return 0, "", false, nil
		}

		return idx, items[idx], true, nil
	}

	breaker, cancel := context.WithCancelCause(ctx.Context)
	defer cancel(fmt.Errorf("loop was cancelled"))

	ops = append(ops, options.Breaker(cancel))

	for {
		select {
		case <-r.ctx.Done():
			if r.ctx.Err() != nil {
				r.logger.Debug("loop was cancelled or deadline exceeded", zap.Error(context.Cause(r.ctx)))
			}
			return
		// This catches messages that UPSTREAMS send us.
		case <-ctx.Options().Signal:
			return
		// This catches messages that DOWNSTREAMS send us.
		case <-breaker.Done():
			if ref, err = r.collectAndFlush(ctx, refs, ArrayFlusher); err != nil {
				return "", err
			}

			return
		default:
			i, item, ok, e := next(iterationCtx)
			if e != nil {
				err = e
				return
			}

			if !ok {
				if ref, err = r.collectAndFlush(ctx, refs, ArrayFlusher); err != nil {
					return "", err
				}

				return
			}

			if step.Variables != nil {
				variables := &apiv1.Variables{
					Items: []*apiv1.Variables_Config{},
				}

				variables.Items = append(variables.Items, &apiv1.Variables_Config{
					Key:   step.Variables.Index,
					Value: fmt.Sprintf("{{ %d }}", i),
					Type:  apiv1.Variables_TYPE_SIMPLE,
					Mode:  apiv1.Variables_MODE_READWRITE,
				})

				variables.Items = append(variables.Items, &apiv1.Variables_Config{
					Key:   step.Variables.Item,
					Value: fmt.Sprintf(`{{ %s }}`, item),
					Type:  apiv1.Variables_TYPE_SIMPLE,
					Mode:  apiv1.Variables_MODE_READWRITE,
				})

				iterationCtx, err = r.Variables(ctx, variables)
				if err != nil {
					r.logger.Error("could not create variables for loop", zap.Error(err))
					return
				}
			} else {
				iterationCtx = ctx
			}

			metrics.AddCounter(ctx.Context, metrics.BlocksLoopIterationsTotal, attribute.String("type", step.Type.String()))
			_, r, e := r.blocks(iterationCtx.Sink(tokenNone), step.Blocks, ops...)
			if e != nil {
				return "", e
			}

			refs.Add(r)
		}
	}
}

// NOTE(frank): This method is too long.
func (r *resolver) Parallel(ctx *apictx.Context, step *apiv1.Block_Parallel, ops ...options.Option) (string, error) {
	status := make(chan struct{}, 1)
	ctx.Parallels.Put(ctx.Name, status)
	r.parallels.Add(status)

	// done := ctx.Parallel()

	// NOTE(frank): I think one global break here works.
	// I don't see why this needs to be per path.
	breaker, cancel := context.WithCancelCause(ctx.Context)

	ops = append(ops, []options.Option{
		options.Breaker(cancel),
		options.Signal(breaker.Done()),
	}...)

	if step.Wait == apiv1.Block_Parallel_WAIT_NONE {
		ops = append(ops, options.Async())
	}

	var paths utils.Map[[]*apiv1.Block]
	var variables utils.Map[*apiv1.Variables]
	var variation string
	{
		variables = utils.NewMap[*apiv1.Variables]()
		paths = utils.NewMap[[]*apiv1.Block]()

		if step.GetStatic() != nil {
			variation = "static"
			for k, v := range step.GetStatic().Paths {
				paths.Put(k, v.Blocks)
			}
		} else if step.GetDynamic() != nil {
			variation = "dynamic"
			sandbox := r.createSandboxFunc()
			defer sandbox.Close()
			loopable, err := ResolveTemplate[any](ctx, sandbox, r.logger, step.GetDynamic().Paths, false, engine.WithJSONEncodeArrayItems(), engine.WithResolved("dynamic.paths"))
			if err != nil {
				ctx.AppendFormPath("dynamic", "paths")
				return "", sberrors.BindingError(errors.New("parallel paths must evalute to a number or an array"))
			}

			var times int
			var items bool
			{
				switch v := (*loopable).(type) {
				case int32:
					times = int(v)
				case []string:
					items = true
					times = len(v)
				default:
					return "", sberrors.BindingError(errors.New("dynamic path bindings must resolve to a number or an array"))
				}
			}

			for i := 0; i < times; i++ {
				paths.Put(strconv.Itoa(i), step.GetDynamic().Blocks)

				if !items || step.GetDynamic().Variables == nil {
					continue
				}

				variables.Put(strconv.Itoa(i), &apiv1.Variables{
					Items: []*apiv1.Variables_Config{
						{
							Key:   step.GetDynamic().Variables.Item,
							Value: fmt.Sprintf(`{{ %s }}`, (*loopable).([]string)[i]),
							Type:  apiv1.Variables_TYPE_SIMPLE,
							Mode:  apiv1.Variables_MODE_READWRITE,
						},
					},
				})
			}
		} else {
			return "", errors.New("parallel block is malformed")
		}
	}

	errCh := make(chan error, paths.Size())
	refs := utils.NewMap[string]() // Holds the kvstore refs for the last step of each iteration.
	var ch chan *worker.ExecuteRequest

	wait := func(refs utils.Map[string]) (ref string, err error) {
		defer cancel(fmt.Errorf("parallel block was cancelled"))
		if ch != nil {
			defer close(ch)
		}

		defer func() {
			if ch, ok := ctx.Parallels.Get(ctx.Name); ok {
				ch <- struct{}{}
			}
		}()

		for i := 0; i < paths.Size(); i++ {
			// NOTE(frank): We don't have to use a wait group here because
			// we're using this error channel to synchronize.
			if e := <-errCh; e != nil {
				err = errors.Join(err, e)
			}
		}

		if err != nil {
			return
		}

		keys, values := refs.Entries()

		var flusher Flusher
		{
			if step.GetDynamic() != nil {
				flusher = ArrayFlusher
			} else {
				flusher = ObjectFlusher(keys)
			}
		}

		return r.collectAndFlush(ctx, values, flusher)
	}

	if ctx.Options().Queue == nil {
		var workers int
		{
			if step.PoolSize == nil || *step.PoolSize == 0 || int32(paths.Size()) < *step.PoolSize {
				workers = paths.Size()
			} else {
				workers = int(*step.PoolSize)
			}

			if workers > ctx.MaxParellelPoolSize {
				r.logger.Warn("parallel pool size exceeds max parallel pool size", zap.Int("pool_size", workers), zap.Int("max_pool_size", ctx.MaxParellelPoolSize))
				workers = ctx.MaxParellelPoolSize
			}

			workers *= 2 // NOTE(frank): We must be greater than the number of paths due to the potential for a stream block.
		}

		ch = make(chan *worker.ExecuteRequest, workers)

		if err := pool.RoundTrip(ch, pool.Handler[*worker.ExecuteRequest, *worker.ExecuteResponse](func(req *worker.ExecuteRequest) *worker.ExecuteResponse {
			p, k, e := r.worker.Execute(constants.WithRemainingDuration(req.Context, r.timeLeftOnApi()), req.Plugin, req.Request, req.Options...)

			return &worker.ExecuteResponse{
				Performance: p,
				Key:         k,
				Error:       e,
			}
		}), []pool.Option{
			pool.Size(workers),
			pool.Logger(r.logger),
		}...); err != nil {
			return "", err
		}

		ops = append(ops, options.Queue(ch))
	}

	for name, blocks := range paths.ToGoMap() {
		variable, ok := variables.Get(name)
		if !ok {
			variable = nil
		}

		go func(name string, blocks []*apiv1.Block, variable *apiv1.Variables) {
			defer func() {
				if reason := recover(); reason != nil {
					r.logger.Error("go routine handling parallel path panicked", zap.Error(fmt.Errorf("%v", reason)))
					errCh <- sberrors.ErrInternal
				}
			}()

			ctx, err := r.Variables(ctx.Sink(name), variable)
			if err != nil {
				errCh <- err
				return
			}

			metrics.AddCounter(ctx.Context, metrics.BlocksParallelPathsTotal,
				attribute.String("type", variation),
				attribute.String("wait", step.GetWait().String()),
			)

			_, ref, err := r.blocks(ctx, blocks, ops...)
			if err != nil {
				errCh <- err
				return
			}

			refs.Put(name, ref)

			errCh <- nil
		}(name, blocks, variable)
	}

	if step.Wait == apiv1.Block_Parallel_WAIT_ALL {
		return wait(refs)
	} else {
		go func() {
			if _, err := wait(refs); err != nil {
				r.logger.Error("could not wait for parallel block", zap.Error(err))
			}
		}()
	}

	return "", nil
}

func (r *resolver) collectAndFlush(ctx *apictx.Context, refs utils.List[string], fn Flusher) (ref string, err error) {
	var results []any
	{
		if refs.Size() > 0 {
			results, err = r.store.Read(ctx.Context, refs.Contents()...)
			if err != nil {
				return "", err
			}

			// NOTE(frank): Free up the store as early as possible.
			// WARNING(frank): This is commented out because there's an edge case with return where it's deleted before it's read.
			// go func() {
			// 	if err := r.store.Delete(context.Background(), refs.Contents()...); err != nil {
			// 		r.logger.Error("could not delete intermediate loop or parallel outputs", zap.Error(err))
			// 	}
			// }()
		}
	}

	var collected bytes.Buffer
	{
		idx := -1
		null := "null"

		next := func() (*string, int, error) {
			idx++

			if idx == len(results) {
				return nil, idx, nil
			}

			if idx > 0 {
				results[idx-1] = nil // NOTE(frank): Give to the GC.

				if _, err := collected.WriteString(","); err != nil {
					return nil, idx, sberrors.ErrInternal
				}
			}

			if results[idx] == nil {
				return &null, idx, nil
			}

			val, ok := results[idx].(string)
			if !ok {
				return nil, idx, sberrors.ErrInternal
			}

			data, err := extractJSONOutputAtKey(val, "output", true)
			if err != nil {
				return &null, idx, nil
			}

			return &data, idx, nil
		}

		if err := fn(&collected, next); err != nil {
			return "", err
		}

	}

	// The key name here doesn't matter.
	if ref, err = r.store.Key("ITERATION", ""); err != nil {
		return "", sberrors.ErrInternal
	}

	if err := r.store.Write(ctx.Context, store.Pair(ref, collected.String())); err != nil {
		return "", err
	}

	r.key.Put(ctx.Name, ref)
	r.variables.Record(ref)

	return ref, nil
}

func (r *resolver) shouldConvertToLegacyBindings(action *structpb.Struct, pluginType string, stream bool) bool {
	// If the legacy template plugin or resolver is not set, we should not convert to legacy bindings
	if r.legacyTemplatePlugin == nil || r.legacyTemplateResolver == nil || r.legacyTemplateTokenJoiner == nil {
		return false
	}

	// If the action config should be rendered, there is no need to convert to legacy bindings
	if shouldRenderActionConfig(action, pluginType, stream) {
		return false
	}

	// We should not convert python or javascript plugins to legacy bindings since the
	// body of their steps should already be valid python/javascript and thus does not
	// need to be wrapped in mustache templates
	if pluginType == "python" || pluginType == "javascript" || pluginType == "v8" {
		return false
	}

	return true
}

func shouldRenderActionConfig(action *structpb.Struct, pluginType string, stream bool) bool {
	// Stream denotes whether we are in the trigger section of a stream block.
	// Currently, we defer binding resolution to the worker under certain cases
	// for the execute worker event. However, we want to move this all to the
	// orchestrator at a later date. However, because we can start resolving
	// bindings in the orchestrator for all net new things, we can bypass the
	// other logic in this function for stream blocks.
	if stream {
		return true
	}

	// We should not evaluate prepared SQL statements on db plugins since they handle resolution in their own way
	// at the plugin level

	// OLD GENERAL SQL MODEL [TYPESCRIPT]
	if usePreparedSql, ok := action.Fields["usePreparedSql"]; ok && usePreparedSql.GetBoolValue() {
		return false
	}

	// NEW GENERAL SQL MODEL [PROTOBUF]
	// TODO: (joey) add an e2e test for this logic similar to how the OLD GENERAL SQL MODEL has
	// we cannot add this now since the only plugin that uses this currently (Athena) is unable to run locally
	if value, err := utils.GetStructField(action, "runSql.useParameterized"); err == nil && value.GetBoolValue() {
		return false
	}

	// We should not evaluate python or javascript plugins since variables get injected into the plugin,
	// and {{ }} might be valid code that we should not resolve in the action config
	if pluginType == "python" || pluginType == "javascript" || pluginType == "v8" {
		return false
	}

	// We have special logic for escaping on rest api integrations
	if pluginType == "restapi" || pluginType == "restapiintegration" {
		return false
	}

	// fileObjects field (S3, GCS) may reference file arrays without "files." in the binding
	// Only skip rendering if it contains a binding pattern
	if fileObjectsField, ok := action.Fields["fileObjects"]; ok {
		if strVal, isString := fileObjectsField.Kind.(*structpb.Value_StringValue); isString {
			str := strVal.StringValue
			// Check if it's actually a binding (contains $ or {{)
			if strings.Contains(str, "$") || strings.Contains(str, "{{") {
				return false
			}
		}
	}

	var referencesFilePicker func(value *structpb.Value) bool
	// Check if the action config references file-related bindings that should be resolved by the worker
	referencesFilePicker = func(value *structpb.Value) bool {
		switch value.Kind.(type) {
		case *structpb.Value_StringValue:
			str := value.GetStringValue()
			// Check for file-related bindings that should be resolved by the worker
			return strings.Contains(str, "readContents") || strings.Contains(str, "files.")
		case *structpb.Value_ListValue:
			for _, v := range value.GetListValue().Values {
				if referencesFilePicker(v) {
					return true
				}
			}
		case *structpb.Value_StructValue:
			for _, v := range value.GetStructValue().Fields {
				if referencesFilePicker(v) {
					return true
				}
			}
		}
		return false
	}

	return !referencesFilePicker(structpb.NewStructValue(action))
}

func isJavaScriptExpression(input string) bool {
	return expression.Instance(&plugins.Input{Data: input}).Scan()
}

// Input can either be a JavaScript expression, or it must be a legacy style binding (i.e. expression
// wrapped in mustache tags {{ }}).
//
// The expression template's scan will detect if the data is a JavaScript template literal or an IIFE. If it is neither
// of these, we will treat the data as a legacy style binding.
func getExpressionFromInput(input string) (string, error) {
	expressionTemplate := expression.Instance(&plugins.Input{Data: input})

	if expressionTemplate.Scan() {
		return expressionTemplate.Value(), nil
	}

	result, err := utils.Unwrap(input)
	if err != nil {
		return "", err
	}

	return result, nil
}

func (r *resolver) timeLeftOnApi() time.Duration {
	if r.timeout == 0 {
		return time.Duration(math.MaxInt32) * time.Second
	}

	return r.timeout - time.Since(r.rootStartTime)
}
