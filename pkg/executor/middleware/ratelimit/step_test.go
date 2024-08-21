package ratelimit

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/flags"
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"

	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/executor/options"
	mockflags "github.com/superblocksteam/agent/pkg/flags/mock"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.uber.org/zap/zaptest"

	"github.com/superblocksteam/agent/pkg/store"
)

func dummyStepFunc(*context.Context, *apiv1.Step, ...options.Option) (*transportv1.Performance, string, error) {
	return nil, "", nil
}

func TestSkipLimits(t *testing.T) {
	for _, test := range []struct {
		name   string
		source int
		isNil  bool
	}{
		{
			name:  "nil test",
			isNil: true,
		},
		{
			name:   "noop test",
			source: flags.SourceNoop,
			isNil:  false,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockStore := store.Memory()
			var mFlags flags.Flags
			if !test.isNil {

				mf := new(mockflags.Flags)
				// Shouldn't need to mock anything else since they shouldn't be called
				mf.On("GetFlagSource").Return(test.source)
				mFlags = mf
			}

			myMiddleWare := StepMiddleware(
				zaptest.NewLogger(t),
				mockStore,
				mFlags,
				"org1",
				"123",
				"TRIAL",
				"foo@superblockshq.com",
				v1.UserType_USER_TYPE_SUPERBLOCKS,
				true,
			)

			ctx := &context.Context{}
			_, _, err := myMiddleWare(dummyStepFunc)(ctx, &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			})

			assert.NoError(t, err)
		})
	}
}

func TestRateWithUserLimit(t *testing.T) {
	for _, test := range []struct {
		name              string
		orgId             string
		requesterEmail    string
		requesterType     v1.UserType
		apiId             string
		step              *apiv1.Step
		orgLimitPerSec    int
		apiLimitPerSec    int
		pluginLimitPerSec int
		userLimitPerSec   int
		repeat            int
		enforceUserLimit  bool
		hasError          bool
	}{
		{
			name:           "no limit hit",
			orgId:          "org1",
			requesterEmail: "a@b.com",
			requesterType:  v1.UserType_USER_TYPE_SUPERBLOCKS,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    5,
			apiLimitPerSec:    5,
			pluginLimitPerSec: 5,
			userLimitPerSec:   5,
			repeat:            4,
			enforceUserLimit:  true,
			hasError:          false,
		},
		{
			name:           "no limit hit (user limit not enforced)",
			orgId:          "org1",
			requesterEmail: "a@b.com",
			requesterType:  v1.UserType_USER_TYPE_SUPERBLOCKS,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    5,
			apiLimitPerSec:    5,
			pluginLimitPerSec: 5,
			userLimitPerSec:   5,
			repeat:            4,
			enforceUserLimit:  false,
			hasError:          false,
		},
		{
			name:           "org level limit hit",
			orgId:          "org1",
			requesterEmail: "a@b.com",
			requesterType:  v1.UserType_USER_TYPE_SUPERBLOCKS,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    5,
			apiLimitPerSec:    20,
			pluginLimitPerSec: 20,
			userLimitPerSec:   20,
			repeat:            10,
			enforceUserLimit:  true,
			hasError:          true,
		},
		{
			name:           "org level limit hit (user limit not enforced)",
			orgId:          "org1",
			requesterEmail: "a@b.com",
			requesterType:  v1.UserType_USER_TYPE_SUPERBLOCKS,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    5,
			apiLimitPerSec:    20,
			pluginLimitPerSec: 20,
			userLimitPerSec:   20,
			repeat:            10,
			enforceUserLimit:  false,
			hasError:          true,
		},
		{
			name:           "user level limit hit",
			orgId:          "org1",
			requesterEmail: "a@b.com",
			requesterType:  v1.UserType_USER_TYPE_SUPERBLOCKS,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    20,
			apiLimitPerSec:    20,
			pluginLimitPerSec: 20,
			userLimitPerSec:   5,
			repeat:            10,
			enforceUserLimit:  true,
			hasError:          true,
		},
		{
			name:           "api level limit hit",
			orgId:          "org1",
			requesterEmail: "",
			requesterType:  v1.UserType_USER_TYPE_EXTERNAL,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    20,
			apiLimitPerSec:    5,
			pluginLimitPerSec: 20,
			userLimitPerSec:   20,
			repeat:            10,
			enforceUserLimit:  false,
			hasError:          true,
		},
		{
			name:           "user level limit should not be enforced",
			orgId:          "org1",
			requesterEmail: "a@b.com",
			requesterType:  v1.UserType_USER_TYPE_EXTERNAL,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    20,
			apiLimitPerSec:    20,
			pluginLimitPerSec: 20,
			userLimitPerSec:   5,
			repeat:            10,
			enforceUserLimit:  false,
			hasError:          false,
		},
		{
			name:           "fall back to api limit still works",
			orgId:          "org1",
			requesterEmail: "a@b.com",
			requesterType:  v1.UserType_USER_TYPE_EXTERNAL,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    20,
			apiLimitPerSec:    5,
			pluginLimitPerSec: 20,
			userLimitPerSec:   20,
			repeat:            10,
			enforceUserLimit:  false,
			hasError:          true,
		},
		{
			name:           "plugin level limit hit",
			orgId:          "org1",
			requesterEmail: "a@b.com",
			requesterType:  v1.UserType_USER_TYPE_SUPERBLOCKS,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    20,
			apiLimitPerSec:    20,
			pluginLimitPerSec: 5,
			userLimitPerSec:   20,
			repeat:            10,
			enforceUserLimit:  true,
			hasError:          true,
		},
		{
			name:           "plugin level limit hit (user limit not enforced)",
			orgId:          "org1",
			requesterEmail: "a@b.com",
			requesterType:  v1.UserType_USER_TYPE_SUPERBLOCKS,
			apiId:          "123",
			step: &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			},
			orgLimitPerSec:    20,
			apiLimitPerSec:    20,
			pluginLimitPerSec: 5,
			userLimitPerSec:   20,
			repeat:            10,
			enforceUserLimit:  false,
			hasError:          true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockStore := store.Memory()
			mFlags := new(mockflags.Flags)
			mFlags.On("GetStepRateV2", mock.Anything, mock.Anything).Return(test.orgLimitPerSec)
			mFlags.On("GetStepRatePerApiV2", mock.Anything, mock.Anything).Return(test.apiLimitPerSec)
			mFlags.On("GetStepRatePerPluginV2", mock.Anything, mock.Anything, mock.Anything).Return(test.pluginLimitPerSec)
			mFlags.On("GetStepRatePerUserV2", mock.Anything, mock.Anything).Return(test.userLimitPerSec)
			mFlags.On("GetFlagSource").Return(flags.SourceLaunchDarkly)

			myMiddleWare := StepMiddleware(
				zaptest.NewLogger(t),
				mockStore,
				mFlags,
				test.orgId,
				test.apiId,
				"TRIAL",
				test.requesterEmail,
				test.requesterType,
				test.enforceUserLimit,
			)

			ctx := &context.Context{}
			hasErr := false
			for i := 0; i < test.repeat; i++ {
				_, _, err := myMiddleWare(dummyStepFunc)(ctx, test.step)
				if err != nil && strings.HasPrefix(err.Error(), "QuotaError") {
					hasErr = true
				}
			}

			assert.Equal(t, test.hasError, hasErr)
		})
	}
}

func TestPluginRateWithMultipleOrgs(t *testing.T) {
	for _, test := range []struct {
		name              string
		pluginLimitPerSec int
		repeat            int
		existingOrgUsage  int
		enforceUserLimit  bool
		expectedErr       string
	}{
		{
			name:              "plugin level limit not hit, orgs usages are isolated",
			pluginLimitPerSec: 15,
			repeat:            10,
			existingOrgUsage:  10,
			enforceUserLimit:  true,
			expectedErr:       "",
		},
		{
			name:              "plugin level limit hit, orgs usages are isolated (user limit not enforced)",
			pluginLimitPerSec: 15,
			repeat:            10,
			existingOrgUsage:  20,
			enforceUserLimit:  false,
			expectedErr:       "",
		},
		{
			name:              "plugin level limit hit",
			pluginLimitPerSec: 10,
			repeat:            15,
			existingOrgUsage:  5,
			enforceUserLimit:  true,
			expectedErr:       "QuotaError: The plugin javascript has exceeded its block rate limit of 10 per second. Contact support to increase this quota.",
		},
		{
			name:              "plugin level limit hit (user limit not enforced)",
			pluginLimitPerSec: 5,
			repeat:            10,
			existingOrgUsage:  10,
			enforceUserLimit:  false,
			expectedErr:       "QuotaError: The plugin javascript has exceeded its block rate limit of 5 per second. Contact support to increase this quota.",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockStore := store.Memory()
			orgLimitPerSec := 100
			apiLimitPerSec := 100
			userLimitPerSec := 100

			mFlags := new(mockflags.Flags)
			mFlags.On("GetStepRateV2", mock.Anything, mock.Anything).Return(orgLimitPerSec)
			mFlags.On("GetStepRatePerApiV2", mock.Anything, mock.Anything).Return(apiLimitPerSec)
			mFlags.On("GetStepRatePerPluginV2", mock.Anything, mock.Anything, mock.Anything).Return(test.pluginLimitPerSec)
			mFlags.On("GetStepRatePerUserV2", mock.Anything, mock.Anything).Return(userLimitPerSec)
			mFlags.On("GetFlagSource").Return(flags.SourceLaunchDarkly)

			orgId := "org1"
			existingOrgId := "org2"
			javascriptStep := &apiv1.Step{
				Config: &apiv1.Step_Javascript{},
			}

			anyRequesterEmail := "a@b.com"
			anyRequesterType := v1.UserType_USER_TYPE_SUPERBLOCKS
			anyApiId := "123"
			anyExistingOrgTier := "FREE"
			anyOrgTier := "TRIAL"

			existingOrgMiddleWare := StepMiddleware(
				zaptest.NewLogger(t),
				mockStore,
				mFlags,
				existingOrgId,
				anyApiId,
				anyExistingOrgTier,
				anyRequesterEmail,
				anyRequesterType,
				test.enforceUserLimit,
			)

			// Initialize usage for the existing org
			ctx := &context.Context{}
			for i := 0; i < test.existingOrgUsage; i++ {
				existingOrgMiddleWare(dummyStepFunc)(ctx, javascriptStep)
			}

			myMiddleWare := StepMiddleware(
				zaptest.NewLogger(t),
				mockStore,
				mFlags,
				orgId,
				anyApiId,
				anyOrgTier,
				anyRequesterEmail,
				anyRequesterType,
				test.enforceUserLimit,
			)

			var lastErr error
			for i := 0; i < test.repeat; i++ {
				if _, _, err := myMiddleWare(dummyStepFunc)(ctx, javascriptStep); err != nil {
					lastErr = err
				}
			}

			if test.expectedErr != "" {
				assert.EqualError(t, lastErr, test.expectedErr)
			} else {
				assert.NoError(t, lastErr)
			}
		})
	}
}
