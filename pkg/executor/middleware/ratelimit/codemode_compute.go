package ratelimit

import (
	"context"
	"math"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.uber.org/zap"

	"github.com/superblocksteam/agent/internal/flags"
	imetrics "github.com/superblocksteam/agent/internal/metrics"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/store"
)

const (
	keyPrefixCodeModeComputeReset = "RATELIMIT.COMPUTE_UNITS.RESET"
	keyPrefixCodeModeComputeAlloc = "RATELIMIT.COMPUTE_UNITS.ALLOC"
	codeModeWeekMillis            = int64(24 * time.Hour * 7 / time.Millisecond)
)

// DeductCodeModeComputeMinutes checks and deducts execution time from the
// org's weekly compute budget. It reuses the same Redis keys as the legacy
// compute_units middleware so budgets are shared across execution paths.
func DeductCodeModeComputeMinutes(
	ctx context.Context,
	logger *zap.Logger,
	s store.Store,
	f flags.Flags,
	orgID string,
	orgTier string,
	executionMillis int64,
) error {
	if f == nil || f.GetFlagSource() == flags.SourceNoop {
		return nil
	}

	computeMinutesPerWeek := f.GetComputeMinutesPerWeekV2(orgTier, orgID)
	if computeMinutesPerWeek >= float64(math.MaxInt32) {
		return nil
	}
	computeMillisPerWeek := int64(computeMinutesPerWeek * 60 * 1000)

	computeLogger := logger.With(
		zap.String("middleware", "codemode-compute-units"),
		zap.String("organization-id", orgID),
		zap.Float64("compute-minutes-per-week", computeMinutesPerWeek),
		zap.Int64("execution-millis", executionMillis),
	)

	storeCtx := context.Background()

	resetKey := keyPrefixCodeModeComputeReset + "." + orgID
	allocKey := keyPrefixCodeModeComputeAlloc + "." + orgID

	results, err := s.Read(storeCtx, resetKey, allocKey)
	if err != nil {
		computeLogger.Error("could not read compute unit keys", zap.Error(err))
		return sberrors.ErrInternal
	}

	orgReset := getInt64(results[0], 0)
	orgAlloc := getInt64(results[1], computeMillisPerWeek)

	if orgAlloc <= 0 {
		computeLogger.Warn("organization has exhausted weekly compute budget")
		return sberrors.ComputeUnitsQuotaError(computeMinutesPerWeek)
	}

	now := time.Now().UnixMilli()
	keysWritten := []string{}

	if now-orgReset > codeModeWeekMillis {
		keysWritten = append(keysWritten, resetKey)
		s.Write(storeCtx, store.Pair(resetKey, int64ToString(now)))
		orgAlloc = computeMillisPerWeek
	}

	nextAlloc := orgAlloc - executionMillis
	keysWritten = append(keysWritten, allocKey)
	s.Write(storeCtx, store.Pair(allocKey, int64ToString(nextAlloc)))

	imetrics.RecordGauge(storeCtx, imetrics.ComputeUnitsPerWeekMillisTotal, computeMillisPerWeek,
		attribute.String("organization_id", orgID),
		attribute.String("tier", orgTier),
	)
	imetrics.RecordGauge(storeCtx, imetrics.ComputeUnitsRemainingMillisTotal, nextAlloc,
		attribute.String("organization_id", orgID),
		attribute.String("tier", orgTier),
	)

	if nextAlloc <= 0 {
		computeLogger.Warn("organization has exhausted weekly compute budget")
		return sberrors.ComputeUnitsQuotaError(computeMinutesPerWeek)
	}

	if err := s.Expire(storeCtx, 24*7*time.Hour, keysWritten...); err != nil {
		computeLogger.Error("could not set expiration on compute unit keys", zap.Error(err))
	}

	return nil
}
