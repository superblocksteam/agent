package ratelimit

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	javascriptv1 "github.com/superblocksteam/agent/types/gen/go/plugins/javascript/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"

	mockflags "github.com/superblocksteam/agent/internal/flags/mock"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/store"
)

func TestComputeUnitsRateLimit(t *testing.T) {
	metrics.RegisterMetrics()

	for _, test := range []struct {
		name                  string
		orgId                 string
		computeMinutesPerWeek float64
		initialReset          int64
		initialAlloc          int64
		shouldResetTimer      bool
		quotaErr              bool
	}{
		{
			name:                  "no limit hit - resets timer",
			orgId:                 "org1",
			computeMinutesPerWeek: 11,
			shouldResetTimer:      true,
		},
		{
			name:                  "no limit hit - only reduce alloc",
			orgId:                 "org1",
			computeMinutesPerWeek: 11,
			initialReset:          time.Now().UnixMilli() - time.Duration(1*time.Hour).Milliseconds(),
		},
		{
			name:                  "limit hit - timer reset",
			orgId:                 "org1",
			computeMinutesPerWeek: 5,
			shouldResetTimer:      true,
			quotaErr:              true,
		},
		{
			name:                  "limit hit - no timer reset",
			orgId:                 "org1",
			computeMinutesPerWeek: 5,
			initialReset:          time.Now().UnixMilli() - time.Duration(1*time.Hour).Milliseconds(),
			quotaErr:              true,
		},
		{
			name:                  "limit hit - already out of quota",
			orgId:                 "org1",
			computeMinutesPerWeek: 5,
			initialAlloc:          -1,
			quotaErr:              true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockStore := store.Memory()
			flags := new(mockflags.Flags)
			flags.On("GetComputeMinutesPerWeekV2", "TRIAL", test.orgId).Return(test.computeMinutesPerWeek, nil)

			l, _ := zap.NewDevelopment()

			myMiddleWare := ComputeUnitsStepMiddleware(
				l,
				mockStore,
				flags,
				test.orgId,
				"TRIAL",
			)

			ctx := &context.Context{}
			step := &apiv1.Step{
				Config: &apiv1.Step_Javascript{
					Javascript: &javascriptv1.Plugin{},
				},
			}

			mockStore.Write(ctx.Context, store.Pair(resetKeyCompute(test.orgId), int64ToString(test.initialReset)))
			if test.initialAlloc != 0 {
				mockStore.Write(ctx.Context, store.Pair(allocKeyCompute(test.orgId), int64ToString(test.initialAlloc)))
			}

			quotaErr := false
			_, _, err := myMiddleWare(dummyStepFuncPerf)(ctx, step)
			if err != nil && strings.HasPrefix(err.Error(), "QuotaError") {
				quotaErr = true
			}
			assert.Equal(t, test.quotaErr, quotaErr)

			storeRes, _ := mockStore.Read(ctx.Context, resetKeyCompute(test.orgId))
			if test.shouldResetTimer {
				assert.NotEqual(t, "0", storeRes[0])
				assert.NotEqual(t, int64ToString(test.initialReset), storeRes[0])
			} else {
				assert.Equal(t, int64ToString(test.initialReset), storeRes[0])
			}
		})
	}
}

func dummyStepFuncPerf(*context.Context, *apiv1.Step, ...options.Option) (*transportv1.Performance, string, error) {
	return &transportv1.Performance{
		PluginExecution: &transportv1.Performance_Observable{
			Value: float64((10 * time.Minute).Microseconds()),
		},
	}, "", nil
}
