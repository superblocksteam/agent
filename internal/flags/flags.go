package flags

import (
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"github.com/superblocksteam/run"
)

type Source int

const (
	SourceNoop = iota
	SourceLaunchDarkly
)

//go:generate mockery --name=Flags --output ./mock --structname Flags --filename mock_flags.go
type Flags interface {
	GetFlagSource() int

	GetStepSizeByOrg(string) int
	GetStepRateByOrg(string) int
	GetStepRatePerApiByOrg(string) int
	GetStepRatePerUserByOrg(string) int
	GetStepDurationByOrg(string) int
	GetMaxParallelPoolSizeByAPI(string) int
	GetMaxStreamSendSizeByOrg(string) int

	GetApiTimeoutV2(api *apiv1.Api, tier string) float64
	GetStepSizeV2(tier string, orgId string) int
	GetStepRateV2(tier string, orgId string) int
	GetStepRatePerApiV2(tier string, orgId string) int
	GetStepRatePerPluginV2(tier string, orgId string, pluginName string) int
	GetStepRatePerUserV2(tier string, orgId string) int
	GetStepDurationV2(tier string, orgId string) int
	GetMaxParallelPoolSizeV2(tier string, orgId string) int
	GetMaxStreamSendSizeV2(tier string, orgId string) int
	GetComputeMinutesPerWeekV2(tier string, orgId string) float64
	GetGoWorkerEnabled(tier string, orgId string) bool

	GetWorkflowPluginInheritanceEnabled(orgId string) bool
}

type Client interface {
	Flags
	run.Runnable
}
