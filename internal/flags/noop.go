package flags

import (
	"context"
	"math"

	"github.com/superblocksteam/agent/internal/flags/options"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"github.com/superblocksteam/run"
)

type noopFlags struct {
	ctx     context.Context
	cancel  context.CancelFunc
	options options.Options

	run.ForwardCompatibility
}

func (flags *noopFlags) GetStepSizeByOrg(orgId string) int {
	return math.MaxInt32
}

func (flags *noopFlags) GetStepRateByOrg(orgId string) int {
	return math.MaxInt32
}

func (flags *noopFlags) GetStepRatePerApiByOrg(workflowId string) int {
	return math.MaxInt32
}

func (flags *noopFlags) GetStepRatePerUserByOrg(orgId string) int {
	return math.MaxInt32
}

func (flags *noopFlags) GetStepDurationByOrg(orgId string) int {
	return math.MaxInt32
}

func (flags *noopFlags) GetMaxParallelPoolSizeByAPI(string) int {
	return math.MaxInt32
}

func (flags *noopFlags) GetMaxStreamSendSizeByOrg(orgId string) int {
	return math.MaxInt32
}

func (flags *noopFlags) GetApiTimeoutV2(*apiv1.Api, string) float64 {
	return float64(flags.options.DefaultApiTimeout)
}

func (flags *noopFlags) GetStepSizeV2(tier string, orgId string) int {
	return math.MaxInt32
}
func (flags *noopFlags) GetStepRateV2(tier string, orgId string) int {
	return math.MaxInt32
}
func (flags *noopFlags) GetStepRatePerApiV2(tier string, orgId string) int {
	return math.MaxInt32
}
func (flags *noopFlags) GetStepRatePerPluginV2(tier string, orgId string, pluginId string) int {
	return flags.options.DefaultStepRatePerPluginByOrg
}
func (flags *noopFlags) GetStepRatePerUserV2(tier string, orgId string) int {
	return math.MaxInt32
}
func (flags *noopFlags) GetStepDurationV2(tier string, orgId string) int {
	return math.MaxInt32
}
func (flags *noopFlags) GetMaxParallelPoolSizeV2(tier string, orgId string) int {
	return math.MaxInt32
}
func (flags *noopFlags) GetMaxStreamSendSizeV2(_, _ string) int {
	return math.MaxInt32
}
func (flags *noopFlags) GetComputeMinutesPerWeekV2(string, string) float64 {
	return float64(math.MaxInt32)
}

func (flags *noopFlags) GetGoWorkerEnabled(string, string) bool {
	return flags.options.DefaultGoWorkerEnabled
}

func (flags *noopFlags) GetJsBindingsUseWasmBindingsSandboxEnabled(string, string) bool {
	return flags.options.BindingsWasmSandboxEnabled
}

func (flags *noopFlags) GetPureJsUseWasmSandboxEnabled(string, string) bool {
	return flags.options.PureJsWasmSandboxEnabled
}

func (flags *noopFlags) GetEphemeralEnabledPlugins(tier string, orgId string) []string {
	return flags.options.DefaultEphemeralEnabledPlugins
}

func (flags *noopFlags) GetEphemeralSupportedEvents(tier string, orgId string) []string {
	return flags.options.DefaultEphemeralSupportedEvents
}

func (flags *noopFlags) GetWorkflowPluginInheritanceEnabled(string) bool {
	return flags.options.DefaultWorkflowPluginInheritanceEnabled
}

func (flags *noopFlags) GetValidateSubjectTokenDuringOboFlowEnabled(orgId string) bool {
	return flags.options.DefaultValidateSubjectTokenDuringOboFlowEnabled
}

func (flags *noopFlags) GetUseAgentKeyForHydration(string) bool {
	return false
}

func (flags *noopFlags) GetFlagSource() int {
	return SourceNoop
}

func (flags *noopFlags) Run(context.Context) error {
	<-flags.ctx.Done()
	return nil
}

func (*noopFlags) Alive() bool { return true }

func (flags *noopFlags) Close(context.Context) error {
	flags.cancel()
	return nil
}

func NoopFlags(ops ...options.Option) Client {
	settings := options.Apply(ops...)

	ctx, cancel := context.WithCancel(context.Background())

	return &noopFlags{
		ctx:     ctx,
		cancel:  cancel,
		options: settings,
	}
}
