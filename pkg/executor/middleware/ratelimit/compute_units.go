package ratelimit

import (
	"context"
	"fmt"
	"math"
	"time"

	"go.uber.org/zap"

	imetrics "github.com/superblocksteam/agent/internal/metrics"
	contextPkg "github.com/superblocksteam/agent/pkg/context"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/executor/middleware"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/flags"
	"github.com/superblocksteam/agent/pkg/metrics"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/store"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

const (
	keyPrefixResetComputeUnits = "RATELIMIT.COMPUTE_UNITS.RESET"
	keyPrefixAllocComputeUnits = "RATELIMIT.COMPUTE_UNITS.ALLOC"
	computeMinutesPerWeekTag   = "compute-minutes-per-week"
	// divide by milliseconds since time.Duration is in nanoseconds
	weekInMilliseconds = int64(24 * time.Hour * 7 / time.Millisecond)
)

type computeUnitsRatelimit struct {
	logger  *zap.Logger
	store   store.Store
	flags   flags.Flags
	orgID   string
	orgTier string
}

func ComputeUnitsStepMiddleware(
	logger *zap.Logger,
	store store.Store,
	flags flags.Flags,
	orgID string,
	orgTier string,
) middleware.Middleware[middleware.StepFunc] {
	mw := &computeUnitsRatelimit{
		logger:  logger.With(zap.String("middleware", "compute-units-rate-limit")),
		store:   store,
		flags:   flags,
		orgID:   orgID,
		orgTier: orgTier,
	}

	return mw.middleware
}

// Inspiration from: https://medium.com/@SaiRahulAkarapu/rate-limiting-algorithms-using-redis-eb4427b47e33
func (mw *computeUnitsRatelimit) middleware(next middleware.StepFunc) middleware.StepFunc {
	return func(ctx *contextPkg.Context, step *apiv1.Step, ops ...options.Option) (*transportv1.Performance, string, error) {
		// Ensure we don't reuse context because we need to finish this even if the run context is cancelled
		storeCtx := context.Background()

		var computeMinutesPerWeek float64
		if mw.flags != nil {
			computeMinutesPerWeek = mw.flags.GetComputeMinutesPerWeekV2(mw.orgTier, mw.orgID)
		} else {
			computeMinutesPerWeek = math.MaxInt32
		}
		computeMillisecondsPerWeek := int64(computeMinutesPerWeek * 60 * 1000)

		logger := mw.logger.With(
			zap.String(observability.OBS_TAG_ORG_ID, mw.orgID),
			zap.Float64(computeMinutesPerWeekTag, computeMinutesPerWeek),
		)

		var orgReset int64
		var orgAlloc int64
		{
			results, err := mw.store.Read(
				storeCtx,
				resetKeyCompute(mw.orgID),
				allocKeyCompute(mw.orgID),
			)
			if err != nil {
				logger.Error("could not read rate limit keys", zap.Error(err))
				return nil, "", sberrors.ErrInternal
			}

			orgReset = getInt64(results[0], 0)
			orgAlloc = getInt64(results[1], int64(computeMillisecondsPerWeek))
		}

		logger = logger.With(
			zap.Int64("organization-alloc", orgAlloc),
			zap.Int64("organization-reset", orgReset),
		)

		if orgAlloc <= 0 {
			logger.Info("organization has run out of step compute units quota")
			return nil, "", sberrors.ComputeUnitsQuotaError(computeMinutesPerWeek)
		}

		// Run the step
		perf, key, err := next(ctx, step, ops...)

		metrics.CalculateElapsed(perf)
		stepTimeMilliseconds := int64(perf.GetPluginExecution().GetValue() / 1000)
		now := time.Now().UnixMilli()

		logger = logger.With(zap.Int64("step-time-ms", stepTimeMilliseconds))
		logger.Debug("current rate limit")

		keysWritten := []string{}

		if now-orgReset > weekInMilliseconds {
			logger.Debug("Resetting timer")
			keysWritten = append(keysWritten, resetKeyCompute(mw.orgID))
			mw.store.Write(storeCtx, store.Pair(resetKeyCompute(mw.orgID), int64ToString(now)))
			orgAlloc = int64(computeMillisecondsPerWeek)
		}

		nextOrgAlloc := orgAlloc - stepTimeMilliseconds
		logger.Debug("Reducing compute units quota", zap.Int64("organization-alloc", nextOrgAlloc))
		keysWritten = append(keysWritten, allocKeyCompute(mw.orgID))
		mw.store.Write(storeCtx, store.Pair(allocKeyCompute(mw.orgID), int64ToString(nextOrgAlloc)))

		imetrics.ComputeUnitsPerWeekMillisTotal.WithLabelValues(mw.orgID, mw.orgTier).Set(float64(computeMillisecondsPerWeek))
		imetrics.ComputeUnitsRemainingMillisTotal.WithLabelValues(mw.orgID, mw.orgTier).Set(float64(nextOrgAlloc))

		if nextOrgAlloc <= 0 {
			logger.Info("organization has run out of step compute units quota")
			return nil, "", sberrors.ComputeUnitsQuotaError(computeMinutesPerWeek)
		}

		if err := mw.store.Expire(storeCtx, 24*7*time.Hour, keysWritten...); err != nil {
			logger.Error("could not set expiration on rate limit keys", zap.Error(err))
		}

		return perf, key, err
	}
}

func allocKeyCompute(suffix string) string {
	return fmt.Sprintf("%s.%s", keyPrefixAllocComputeUnits, suffix)
}

func resetKeyCompute(suffix string) string {
	return fmt.Sprintf("%s.%s", keyPrefixResetComputeUnits, suffix)
}
