package flags

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/internal/flags/options"
	"github.com/superblocksteam/agent/pkg/flagsclient"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

func TestGetApiTimeoutByOrgTier(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name                   string
		tier                   string
		api                    *apiv1.Api
		shouldCallLaunchDarkly bool
		expected               float64
		expectedOrg            string
		expectedFlag           string
	}{
		{
			name:     "nil api",
			tier:     "TRIAL",
			api:      nil,
			expected: 500,
		},
		{
			name:     "nil trigger",
			tier:     "TRIAL",
			api:      &apiv1.Api{},
			expected: 500,
		},
		{
			name: "application",
			tier: "TRIAL",
			api: &apiv1.Api{
				Trigger:  &apiv1.Trigger{Config: &apiv1.Trigger_Application_{}},
				Metadata: &commonv1.Metadata{Organization: "asdf"},
			},
			shouldCallLaunchDarkly: true,
			expected:               1000,
			expectedOrg:            "asdf",
			expectedFlag:           "agent.quota.api.timeout.trigger.application.milliseconds",
		},
		{
			name: "workflow",
			tier: "ENTERPRISE",
			api: &apiv1.Api{
				Trigger:  &apiv1.Trigger{Config: &apiv1.Trigger_Workflow_{}},
				Metadata: &commonv1.Metadata{Organization: "asdf"},
			},
			shouldCallLaunchDarkly: true,
			expected:               4000,
			expectedOrg:            "asdf",
			expectedFlag:           "agent.quota.api.timeout.trigger.workflow.milliseconds",
		},
		{
			name: "job",
			tier: "FREE",
			api: &apiv1.Api{
				Trigger:  &apiv1.Trigger{Config: &apiv1.Trigger_Job_{}},
				Metadata: &commonv1.Metadata{Organization: "asdf"},
			},
			shouldCallLaunchDarkly: true,
			expected:               6000,
			expectedOrg:            "asdf",
			expectedFlag:           "agent.quota.api.timeout.trigger.job.milliseconds",
		},
		{
			name:     "malformed trigger",
			tier:     "TRIAL",
			api:      &apiv1.Api{Trigger: &apiv1.Trigger{}},
			expected: 500,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			anyDefaultTimeout := float64(500)

			mockFlagsClient := flagsclient.NewMockFlagsClient(t)
			if test.shouldCallLaunchDarkly {
				mockFlagsClient.On("GetFloatVariation", test.expectedFlag, test.tier, test.expectedOrg, anyDefaultTimeout).Return(test.expected).Once()
			}

			client := LaunchDarkly(mockFlagsClient, options.WithDefaultApiTimeout(anyDefaultTimeout))

			assert.Equal(t, test.expected, client.GetApiTimeoutV2(test.api, test.tier), test.name)
		})
	}
}
