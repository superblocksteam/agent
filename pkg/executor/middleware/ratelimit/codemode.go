package ratelimit

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/superblocksteam/agent/internal/flags"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/store"
)

const (
	keyPrefixCodeModeReset = "RATELIMIT.CODEMODE.RESET"
	keyPrefixCodeModeAlloc = "RATELIMIT.CODEMODE.ALLOC"
)

type CodeModeQuotaParams struct {
	OrgID   string
	OrgTier string
	ApiID   string
}

func CheckCodeModeRateLimit(
	ctx context.Context,
	logger *zap.Logger,
	s store.Store,
	f flags.Flags,
	params *CodeModeQuotaParams,
) error {
	if f == nil || f.GetFlagSource() == flags.SourceNoop {
		return nil
	}

	raw := f.GetCodeModeRatePerApiV2(params.OrgTier, params.OrgID)

	rateConfig, err := ParseRateLimit(raw)
	if err != nil {
		logger.Warn("invalid code-mode rate-limit configuration from flags; allowing request",
			zap.String("middleware", "codemode-ratelimit"),
			zap.String("organization-id", params.OrgID),
			zap.String("organization-tier", params.OrgTier),
			zap.String("api-id", params.ApiID),
			zap.Any("raw-config", raw),
			zap.Error(err),
		)
		return nil
	}

	if rateConfig.Value < 0 {
		rateConfig.Value = 0
	}

	windowDuration, err := rateConfig.WindowDuration()
	if err != nil {
		logger.Warn("invalid code-mode rate-limit window; allowing request",
			zap.String("middleware", "codemode-ratelimit"),
			zap.String("organization-id", params.OrgID),
			zap.String("organization-tier", params.OrgTier),
			zap.String("api-id", params.ApiID),
			zap.Int("rate-limit-value", rateConfig.Value),
			zap.String("rate-limit-units", rateConfig.Units),
			zap.Error(err),
		)
		return nil
	}

	if rateConfig.Value == 0 {
		logger.Warn("code-mode executions disabled for organization",
			zap.String("middleware", "codemode-ratelimit"),
			zap.String("organization-id", params.OrgID),
			zap.String("organization-tier", params.OrgTier),
			zap.String("api-id", params.ApiID),
		)
		return sberrors.ApiCodeModeDisabledQuotaError()
	}

	now := time.Now().UnixMilli()
	windowMillis := int64(windowDuration / time.Millisecond)

	requestLogger := logger.With(
		zap.String("middleware", "codemode-ratelimit"),
		zap.String("organization-id", params.OrgID),
		zap.String("api-id", params.ApiID),
		zap.Int("rate-limit-value", rateConfig.Value),
		zap.String("rate-limit-units", rateConfig.Units),
		zap.Int64("window-millis", windowMillis),
	)

	resetKey := buildCodeModeResetKey(params.ApiID)
	allocKey := buildCodeModeAllocKey(params.ApiID)

	results, err := s.Read(ctx, resetKey, allocKey)
	if err != nil {
		requestLogger.Error("could not read code-mode rate limit keys", zap.Error(err))
		return sberrors.ErrInternal
	}

	lastReset := getInt64(results[0], 0)
	alloc := getInt64(results[1], int64(rateConfig.Value))

	var keysWritten []string
	var writeErrs error

	if now-lastReset > windowMillis {
		keysWritten = append(keysWritten, resetKey, allocKey)
		writeErrs = s.Write(ctx, store.Pair(resetKey, int64ToString(now)))
		writeErrs = errors.Join(writeErrs, s.Write(ctx, store.Pair(allocKey, int64ToString(int64(rateConfig.Value-1)))))
	} else if alloc <= 0 {
		requestLogger.Warn("api exceeded code-mode execution rate")
		return sberrors.ApiCodeModeRateQuotaError(rateConfig.Value, rateConfig.Units)
	} else {
		keysWritten = append(keysWritten, allocKey)
		writeErrs = s.Write(ctx, store.Pair(allocKey, int64ToString(alloc-1)))
	}

	if writeErrs != nil {
		requestLogger.Error("could not write code-mode rate limit keys", zap.Error(writeErrs))
	}

	if err := s.Expire(ctx, 2*windowDuration, keysWritten...); err != nil {
		requestLogger.Error("could not set expiration on code-mode rate limit keys", zap.Error(err))
	}

	return nil
}

func buildCodeModeResetKey(suffix string) string {
	return fmt.Sprintf("%s.%s", keyPrefixCodeModeReset, suffix)
}

func buildCodeModeAllocKey(suffix string) string {
	return fmt.Sprintf("%s.%s", keyPrefixCodeModeAlloc, suffix)
}
