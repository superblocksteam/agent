package flags

import (
	"context"
	"sync"
	"time"

	"github.com/launchdarkly/go-sdk-common/v3/ldcontext"
	"github.com/launchdarkly/go-sdk-common/v3/ldlog"
	"github.com/launchdarkly/go-sdk-common/v3/lduser"
	ld "github.com/launchdarkly/go-server-sdk/v7"
	"github.com/launchdarkly/go-server-sdk/v7/ldcomponents"
	"github.com/launchdarkly/go-server-sdk/v7/ldfiledata"
	"github.com/launchdarkly/go-server-sdk/v7/ldfilewatch"
	"github.com/superblocksteam/agent/pkg/flags/options"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

//go:generate mockery --name=ldClient --output . --filename ldClient_mock.go --outpkg flags --structname MockLdClient
type ldClient interface {
	IntVariation(key string, context ldcontext.Context, defaultVal int) (int, error)
	Float64Variation(key string, context ldcontext.Context, defaultVal float64) (float64, error)
	BoolVariation(key string, context ldcontext.Context, defaultVal bool) (bool, error)
	StringVariation(key string, context ldcontext.Context, defaultVal string) (string, error)
	Close() error
}

type launchdarkly struct {
	done    chan struct{}
	key     string
	logger  *zap.Logger
	options options.Options

	mu     sync.Mutex
	alive  bool
	client ldClient

	run.ForwardCompatibility
}

func (flags *launchdarkly) GetStepSizeByOrg(orgId string) int {
	return flags.getIntVariation("agent.quota.org.step.size.bytes", orgId, flags.options.DefaultStepSizeByOrg)
}

func (flags *launchdarkly) GetStepSizeV2(tier string, orgId string) int {
	return flags.getIntVariationV2("agent.quota.step.size.bytes", tier, orgId, flags.options.DefaultStepSizeByOrg)
}

func (flags *launchdarkly) GetStepRateByOrg(orgId string) int {
	return flags.getIntVariation("agent.quota.org.step.rate.seconds", orgId, flags.options.DefaultStepRateByOrg)
}

func (flags *launchdarkly) GetStepRateV2(tier string, orgId string) int {
	return flags.getIntVariationV2("agent.quota.org.step.rate.seconds", tier, orgId, flags.options.DefaultStepRateByOrg)
}

func (flags *launchdarkly) GetStepRatePerApiByOrg(workflowId string) int {
	return flags.getIntVariation("agent.quota.api.step.rate.seconds", workflowId, flags.options.DefaultStepRatePerApiByOrg)
}

func (flags *launchdarkly) GetStepRatePerApiV2(tier string, orgId string) int {
	return flags.getIntVariationV2("agent.quota.api.step.rate.seconds", tier, orgId, flags.options.DefaultStepRatePerApiByOrg)
}

func (flags *launchdarkly) GetStepRatePerPluginV2(tier string, orgId string, pluginName string) int {
	return flags.getIntVariationCustomDims("agent.quota.plugin.step.rate.seconds", orgId, map[string]string{"tier": tier, "plugin": pluginName}, flags.options.DefaultStepRatePerPluginByOrg)
}

func (flags *launchdarkly) GetStepRatePerUserByOrg(orgId string) int {
	return flags.getIntVariation("agent.quota.user.step.rate.seconds", orgId, flags.options.DefaultStepRatePerUserByOrg)
}

func (flags *launchdarkly) GetStepRatePerUserV2(tier string, orgId string) int {
	return flags.getIntVariationV2("agent.quota.user.step.rate.seconds", tier, orgId, flags.options.DefaultStepRatePerUserByOrg)
}

func (flags *launchdarkly) GetStepDurationByOrg(orgId string) int {
	return flags.getIntVariation("agent.quota.org.step.duration.milliseconds", orgId, flags.options.DefaultStepDurationByOrg)
}

func (flags *launchdarkly) GetStepDurationV2(tier string, orgId string) int {
	return flags.getIntVariationV2("agent.quota.org.step.duration.milliseconds", tier, orgId, flags.options.DefaultStepDurationByOrg)
}

func (flags *launchdarkly) GetMaxParallelPoolSizeByAPI(apiId string) int {
	return flags.getIntVariation("agent.quota.api.parallel.pool.size.max", apiId, flags.options.DefaultMaxParallelPoolSizeByAPI)
}

func (flags *launchdarkly) GetMaxParallelPoolSizeV2(tier string, orgId string) int {
	return flags.getIntVariationV2("agent.quota.api.parallel.pool.size.max", tier, orgId, flags.options.DefaultMaxParallelPoolSizeByAPI)
}

func (flags *launchdarkly) GetMaxStreamSendSizeByOrg(orgId string) int {
	return flags.getIntVariation("agent.quota.org.stream.send.size.max", orgId, flags.options.DefaultMaxStreamSendSizeByOrg)
}

func (flags *launchdarkly) GetMaxStreamSendSizeV2(tier string, orgId string) int {
	return flags.getIntVariationV2("agent.quota.org.stream.send.size.max", tier, orgId, flags.options.DefaultMaxStreamSendSizeByOrg)
}

func (flags *launchdarkly) GetComputeMinutesPerWeekV2(tier string, orgId string) float64 {
	return flags.getFloatVariation("agent.quota.minutes.rate.week", tier, orgId, flags.options.DefaultMaxComputeMinutesPerWeek)
}

func (flags *launchdarkly) GetGoWorkerEnabled(tier string, orgId string) bool {
	return flags.getBoolVariation("worker.go.enabled", tier, orgId, flags.options.DefaultGoWorkerEnabled)
}

func (flags *launchdarkly) GetWorkflowPluginInheritanceEnabled(orgId string) bool {
	return flags.getBoolVariationByOrg("agent.plugins.workflow.inherit_parameters.enabled", orgId, flags.options.DefaultWorkflowPluginInheritanceEnabled)
}

func (flags *launchdarkly) GetApiTimeoutV2(api *apiv1.Api, tier string) float64 {
	fallback := flags.options.DefaultApiTimeout
	orgId := api.GetMetadata().GetOrganization()

	logger := flags.logger.With(
		zap.String(observability.OBS_TAG_ORG_ID, orgId),
		zap.String(observability.OBS_TAG_API_ID, api.GetMetadata().GetId()),
		zap.String(observability.OBS_TAG_ORG_TIER, tier),
		zap.String(observability.OBS_TAG_RESOURCE_TYPE, utils.ApiType(api)),
	)

	var flag string
	{
		switch api.GetTrigger().GetConfig().(type) {
		case *apiv1.Trigger_Application_:
			flag = "agent.quota.api.timeout.trigger.application.milliseconds"
		case *apiv1.Trigger_Workflow_:
			flag = "agent.quota.api.timeout.trigger.workflow.milliseconds"
		case *apiv1.Trigger_Job_:
			flag = "agent.quota.api.timeout.trigger.job.milliseconds"
		default:
			logger.Warn("could not retrieve flag value: unknown trigger; returning default value")
			return fallback
		}
	}

	return flags.getFloatVariation(flag, tier, orgId, fallback)
}

func (flags *launchdarkly) GetFlagSource() int {
	return SourceLaunchDarkly
}

func LaunchDarkly(key string, ops ...options.Option) Client {
	settings := options.Apply(ops...)

	return &launchdarkly{
		done:    make(chan struct{}),
		key:     key,
		logger:  settings.Logger,
		options: settings,
	}
}

func (flags *launchdarkly) Init() error {
	var config ld.Config
	{
		if conf := flags.options.Config; conf != nil {
			config = ld.Config{
				DataSource: ldfiledata.DataSource().
					FilePaths(*conf).
					Reloader(ldfilewatch.WatchFiles),
				Events: ldcomponents.NoEvents(),
			}
		} else {
			config = ld.Config{
				DataSource: ldcomponents.StreamingDataSource().InitialReconnectDelay(5 * time.Second),
				Offline:    false,
			}
		}

		config.DiagnosticOptOut = true
	}

	// NOTE(frank): Without this, there is SO MUCH NOISE. We should also pass in our own logger.
	// but the LD cliet has this buried under one too many abstraction layers so deferring.
	config.Logging = ldcomponents.Logging().MinLevel(ldlog.Error)

	// NOTE(frank): From the LD documentation: If you set waitFor to zero, the function will return immediately after creating the client instance, and do any further initialization in the background.
	client, err := ld.MakeCustomClient(flags.key, config, 5*time.Second)
	if err != nil {
		return err
	}

	flags.mu.Lock()
	defer flags.mu.Unlock()
	flags.alive = true
	flags.client = client

	return nil
}

func (flags *launchdarkly) Run(context.Context) error {
	if err := flags.Init(); err != nil {
		return err
	}

	<-flags.done
	return nil
}

func (flags *launchdarkly) Alive() bool {
	flags.mu.Lock()
	defer flags.mu.Unlock()
	return flags != nil && flags.alive
}

func (*launchdarkly) Name() string {
	return "launchdarkly"
}

func (flags *launchdarkly) Close(context.Context) error {
	if flags == nil {
		return nil
	}

	close(flags.done)

	flags.mu.Lock()
	client := flags.client
	flags.mu.Unlock()

	if client != nil {
		return client.Close()
	}

	return nil
}

func (flags *launchdarkly) getIntVariation(flag, org string, fallback int) int {
	value, err := flags.client.IntVariation(flag, lduser.NewUser(org), fallback)
	if err != nil {
		flags.logger.Error("could not retrieve flag value; returning default value", zap.String("flag", flag), zap.Error(err))
	}

	return value
}

func (flags *launchdarkly) getIntVariationV2(flag, tier string, orgId string, fallback int) int {
	return flags.getIntVariationCustomDims(flag, orgId, map[string]string{"tier": tier}, fallback)
}

func (flags *launchdarkly) getIntVariationCustomDims(flag string, orgId string, dims map[string]string, fallback int) int {
	ctxBldr := (&ldcontext.Builder{}).Kind("user").Key(orgId)
	for k, v := range dims {
		ctxBldr = ctxBldr.SetString(k, v)
	}

	ctx, err := ctxBldr.TryBuild()
	if err != nil {
		flags.logger.Error("could not create launchdarkly context; returning default value", zap.String("flag", flag), zap.Error(err))
		return fallback
	}

	value, err := flags.client.IntVariation(flag, ctx, fallback)
	if err != nil {
		flags.logger.Warn("could not retrieve flag value; returning default value", zap.String("flag", flag), zap.Error(err))
	}

	return value
}

func (flags *launchdarkly) getFloatVariation(flag, tier string, orgId string, fallback float64) float64 {
	ctx, err := (&ldcontext.Builder{}).Kind("user").Key(orgId).SetString("tier", tier).TryBuild()
	if err != nil {
		flags.logger.Error("could not create launchdarkly context; returning default value", zap.String("flag", flag), zap.Error(err))
		return fallback
	}

	value, err := flags.client.Float64Variation(flag, ctx, fallback)
	if err != nil {
		flags.logger.Warn("could not retrieve flag value; returning default value", zap.String("flag", flag), zap.Error(err))
	}

	return value
}

func (flags *launchdarkly) getBoolVariationByOrg(flag, orgId string, fallback bool) bool {
	ctx, err := (&ldcontext.Builder{}).Kind("user").Key(orgId).TryBuild()
	if err != nil {
		flags.logger.Error("could not create launchdarkly context; returning default value", zap.String("flag", flag), zap.Error(err))
		return fallback
	}

	value, err := flags.client.BoolVariation(flag, ctx, fallback)
	if err != nil {
		flags.logger.Error("could not retrieve flag value; returning default value", zap.String("flag", flag), zap.Error(err))
	}

	return value
}

func (flags *launchdarkly) getBoolVariation(flag string, tier string, orgId string, fallback bool) bool {
	ctx, err := (&ldcontext.Builder{}).Kind("user").Key(orgId).SetString("tier", tier).TryBuild()
	if err != nil {
		flags.logger.Error("could not create launchdarkly context; returning default value", zap.String("flag", flag), zap.Error(err))
		return fallback
	}

	value, err := flags.client.BoolVariation(flag, ctx, fallback)
	if err != nil {
		flags.logger.Warn("could not retrieve flag value; returning default value", zap.String("flag", flag), zap.Error(err))
	}

	return value
}
