package flags

import (
	"github.com/superblocksteam/agent/internal/flags/options"
	"github.com/superblocksteam/agent/pkg/flagsclient"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"go.uber.org/zap"
)

type launchdarkly struct {
	flagsclient.FlagsClient

	logger  *zap.Logger
	options options.Options
}

func LaunchDarkly(client flagsclient.FlagsClient, ops ...options.Option) Client {
	settings := options.Apply(ops...)

	return &launchdarkly{
		FlagsClient: client,
		logger:      settings.Logger,
		options:     settings,
	}
}

func (flags *launchdarkly) GetFlagSource() int {
	return SourceLaunchDarkly
}

func (flags *launchdarkly) GetStepSizeByOrg(orgId string) int {
	return flags.GetIntVariationByOrg("agent.quota.org.step.size.bytes", orgId, flags.options.DefaultStepSizeByOrg)
}

func (flags *launchdarkly) GetStepSizeV2(tier string, orgId string) int {
	return flags.GetIntVariation("agent.quota.step.size.bytes", tier, orgId, flags.options.DefaultStepSizeByOrg)
}

func (flags *launchdarkly) GetStepRateByOrg(orgId string) int {
	return flags.GetIntVariationByOrg("agent.quota.org.step.rate.seconds", orgId, flags.options.DefaultStepRateByOrg)
}

func (flags *launchdarkly) GetStepRateV2(tier string, orgId string) int {
	return flags.GetIntVariation("agent.quota.org.step.rate.seconds", tier, orgId, flags.options.DefaultStepRateByOrg)
}

func (flags *launchdarkly) GetStepRatePerApiByOrg(workflowId string) int {
	return flags.GetIntVariationByOrg("agent.quota.api.step.rate.seconds", workflowId, flags.options.DefaultStepRatePerApiByOrg)
}

func (flags *launchdarkly) GetStepRatePerApiV2(tier string, orgId string) int {
	return flags.GetIntVariation("agent.quota.api.step.rate.seconds", tier, orgId, flags.options.DefaultStepRatePerApiByOrg)
}

func (flags *launchdarkly) GetStepRatePerPluginV2(tier string, orgId string, pluginName string) int {
	return flags.GetIntVariationCustomDims("agent.quota.plugin.step.rate.seconds", orgId, map[string]string{"tier": tier, "plugin": pluginName}, flags.options.DefaultStepRatePerPluginByOrg)
}

func (flags *launchdarkly) GetStepRatePerUserByOrg(orgId string) int {
	return flags.GetIntVariationByOrg("agent.quota.user.step.rate.seconds", orgId, flags.options.DefaultStepRatePerUserByOrg)
}

func (flags *launchdarkly) GetStepRatePerUserV2(tier string, orgId string) int {
	return flags.GetIntVariation("agent.quota.user.step.rate.seconds", tier, orgId, flags.options.DefaultStepRatePerUserByOrg)
}

func (flags *launchdarkly) GetStepDurationByOrg(orgId string) int {
	return flags.GetIntVariationByOrg("agent.quota.org.step.duration.milliseconds", orgId, flags.options.DefaultStepDurationByOrg)
}

func (flags *launchdarkly) GetStepDurationV2(tier string, orgId string) int {
	return flags.GetIntVariation("agent.quota.org.step.duration.milliseconds", tier, orgId, flags.options.DefaultStepDurationByOrg)
}

func (flags *launchdarkly) GetMaxParallelPoolSizeByAPI(apiId string) int {
	return flags.GetIntVariationByOrg("agent.quota.api.parallel.pool.size.max", apiId, flags.options.DefaultMaxParallelPoolSizeByAPI)
}

func (flags *launchdarkly) GetMaxParallelPoolSizeV2(tier string, orgId string) int {
	return flags.GetIntVariation("agent.quota.api.parallel.pool.size.max", tier, orgId, flags.options.DefaultMaxParallelPoolSizeByAPI)
}

func (flags *launchdarkly) GetMaxStreamSendSizeByOrg(orgId string) int {
	return flags.GetIntVariationByOrg("agent.quota.org.stream.send.size.max", orgId, flags.options.DefaultMaxStreamSendSizeByOrg)
}

func (flags *launchdarkly) GetMaxStreamSendSizeV2(tier string, orgId string) int {
	return flags.GetIntVariation("agent.quota.org.stream.send.size.max", tier, orgId, flags.options.DefaultMaxStreamSendSizeByOrg)
}

func (flags *launchdarkly) GetComputeMinutesPerWeekV2(tier string, orgId string) float64 {
	return flags.GetFloatVariation("agent.quota.minutes.rate.week", tier, orgId, flags.options.DefaultMaxComputeMinutesPerWeek)
}

func (flags *launchdarkly) GetGoWorkerEnabled(tier string, orgId string) bool {
	return flags.GetBoolVariation("worker.go.enabled", tier, orgId, flags.options.DefaultGoWorkerEnabled)
}

func (flags *launchdarkly) GetJsBindingsUseWasmBindingsSandboxEnabled(tier string, orgId string) bool {
	// LaunchDarkly takes priority; CLI flag is used as fallback default
	return flags.GetBoolVariation("worker.js.bindings.use_wasm_sandbox", tier, orgId, flags.options.BindingsWasmSandboxEnabled)
}

func (flags *launchdarkly) GetEphemeralEnabledPlugins(tier string, orgId string) []string {
	return flags.GetStringSliceVariation("agent.worker.ephemeral.plugins.enabled", tier, orgId, flags.options.DefaultEphemeralEnabledPlugins)
}

func (flags *launchdarkly) GetEphemeralSupportedEvents(tier string, orgId string) []string {
	return flags.GetStringSliceVariation("agent.worker.ephemeral.supported.events", tier, orgId, flags.options.DefaultEphemeralSupportedEvents)
}

func (flags *launchdarkly) GetWorkflowPluginInheritanceEnabled(orgId string) bool {
	return flags.GetBoolVariationByOrg("agent.plugins.workflow.inherit_parameters.enabled", orgId, flags.options.DefaultWorkflowPluginInheritanceEnabled)
}

func (flags *launchdarkly) GetValidateSubjectTokenDuringOboFlowEnabled(orgId string) bool {
	return flags.GetBoolVariationByOrg("agent.plugins.auth.validate_subject_token_during_obo_flow.enabled", orgId, flags.options.DefaultValidateSubjectTokenDuringOboFlowEnabled)
}

func (flags *launchdarkly) GetUseAgentKeyForHydration(orgId string) bool {
	return flags.GetBoolVariationByOrg("server.security.require-agent-key-for-hydration", orgId, false)
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

	return flags.GetFloatVariation(flag, tier, orgId, fallback)
}
