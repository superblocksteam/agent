package ratelimit

import (
	"errors"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/superblocksteam/agent/pkg/context"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/executor/middleware"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/flags"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/plugin"
	"github.com/superblocksteam/agent/pkg/store"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

const (
	keyPrefixReset = "RATELIMIT.RESET"
	keyPrefixAlloc = "RATELIMIT.ALLOC"
)

type ratelimit struct {
	logger         *zap.Logger
	store          store.Store
	flags          flags.Flags
	orgID          string
	apiId          string
	orgTier        string
	requesterEmail string
	requesterType  commonv1.UserType
	applyUserQuota bool
}

func StepMiddleware(
	logger *zap.Logger,
	store store.Store,
	flags flags.Flags,
	orgID string,
	apiId string,
	orgTier string,
	requesterEmail string,
	requesterType commonv1.UserType,
	applyUserQuota bool,
) middleware.Middleware[middleware.StepFunc] {
	mw := &ratelimit{
		logger:         logger.With(zap.String("middleware", "ratelimit")),
		store:          store,
		flags:          flags,
		orgID:          orgID,
		apiId:          apiId,
		orgTier:        orgTier,
		requesterEmail: requesterEmail,
		requesterType:  requesterType,
		applyUserQuota: applyUserQuota,
	}

	return mw.middleware
}

// Inspiration from: https://medium.com/@SaiRahulAkarapu/rate-limiting-algorithms-using-redis-eb4427b47e33
func (mw *ratelimit) middleware(next middleware.StepFunc) middleware.StepFunc {
	return func(ctx *context.Context, block *apiv1.Step, ops ...options.Option) (*transportv1.Performance, string, error) {
		// FIXME:(bruce) We should be passing in NoopFlags everywhere if not necessary, but it seems like that's not currently being done
		if mw.flags == nil || mw.flags.GetFlagSource() == flags.SourceNoop {
			return next(ctx, block, ops...)
		}

		var pluginName string
		if p, ok := block.GetConfig().(plugin.Plugin); ok {
			pluginName = p.Name()
		}
		pluginStoreId := fmt.Sprintf("%s.PLUGIN.%s", mw.orgID, pluginName)

		orgRateLimitPerSec := mw.flags.GetStepRateV2(mw.orgTier, mw.orgID)
		userRateLimitPerSec := mw.flags.GetStepRatePerUserV2(mw.orgTier, mw.orgID)
		apiRateLimitPerSec := mw.flags.GetStepRatePerApiV2(mw.orgTier, mw.orgID)
		pluginRateLimitPerSec := mw.flags.GetStepRatePerPluginV2(mw.orgTier, mw.orgID, pluginName)

		now := time.Now().UnixMilli()

		requestLogger := mw.logger.With(
			zap.String("organization-id", mw.orgID),
			zap.String("user-email", mw.requesterEmail),
			zap.String("user-type", observability.GetUserTypeStringFromPb(mw.requesterType)),
			zap.String("api-id", mw.apiId),
			zap.String("plugin-name", pluginName),
			zap.Int("organization-limit", orgRateLimitPerSec),
			zap.Int("user-limit", userRateLimitPerSec),
			zap.Int("api-limit", apiRateLimitPerSec),
			zap.Int("plugin-limit", pluginRateLimitPerSec),
		)

		requestLogger.Debug("rate limiter starts")

		var orgReset int64
		var orgAlloc int64
		var userReset int64
		var userAlloc int64
		var apiReset int64
		var apiAlloc int64
		var pluginReset int64
		var pluginAlloc int64
		{
			results, err := mw.store.Read(
				ctx.Context,
				buildResetKey(mw.orgID),
				buildAllocKey(mw.orgID),
				buildResetKey(mw.requesterEmail),
				buildAllocKey(mw.requesterEmail),
				buildResetKey(mw.apiId),
				buildAllocKey(mw.apiId),
				buildResetKey(pluginStoreId),
				buildAllocKey(pluginStoreId),
			)
			if err != nil {
				requestLogger.Error("could not read rate limit keys", zap.Error(err))
				return nil, "", sberrors.ErrInternal
			}

			orgReset = getInt64(results[0], 0)
			orgAlloc = getInt64(results[1], int64(orgRateLimitPerSec))
			userReset = getInt64(results[2], 0)
			userAlloc = getInt64(results[3], int64(userRateLimitPerSec))
			apiReset = getInt64(results[4], 0)
			apiAlloc = getInt64(results[5], int64(apiRateLimitPerSec))
			pluginReset = getInt64(results[6], 0)
			pluginAlloc = getInt64(results[7], int64(pluginRateLimitPerSec))

			requestLogger = requestLogger.With(
				zap.Int64("organization-alloc", orgAlloc),
				zap.Int64("user-alloc", userAlloc),
				zap.Int64("api-alloc", apiAlloc),
				zap.Int64("plugin-alloc", pluginAlloc),
			)

			requestLogger.Debug("current rate limit")
		}

		keysWritten := []string{}
		var err error

		if keysWritten, err = mw.enforcePerSecRateLimit(ctx, requestLogger, mw.orgID, now, orgReset, orgAlloc, orgRateLimitPerSec, keysWritten); err != nil {
			requestLogger.Info("organization running out of step rate quota", zap.Error(err))
			return nil, "", sberrors.OrgStepRateQuotaError(orgRateLimitPerSec)
		}

		if mw.applyUserQuota {
			if keysWritten, err = mw.enforcePerSecRateLimit(ctx, requestLogger, mw.requesterEmail, now, userReset, userAlloc, userRateLimitPerSec, keysWritten); err != nil {
				requestLogger.Info("user running out of step rate quota", zap.Error(err))
				return nil, "", sberrors.UserStepRateQuotaError(mw.requesterEmail, userRateLimitPerSec)
			}
		} else {
			if keysWritten, err = mw.enforcePerSecRateLimit(ctx, requestLogger, mw.apiId, now, apiReset, apiAlloc, apiRateLimitPerSec, keysWritten); err != nil {
				requestLogger.Info("api running out of step rate quota", zap.Error(err))
				return nil, "", sberrors.ApiStepRateQuotaError(apiRateLimitPerSec)
			}
		}

		if keysWritten, err = mw.enforcePerSecRateLimit(ctx, requestLogger, pluginStoreId, now, pluginReset, pluginAlloc, pluginRateLimitPerSec, keysWritten); err != nil {
			requestLogger.Info("plugin running out of step rate quota", zap.Error(err))
			return nil, "", sberrors.PluginStepRateQuotaError(pluginName, pluginRateLimitPerSec)
		}

		if err := mw.store.Expire(ctx.Context, 1*time.Hour, keysWritten...); err != nil {
			requestLogger.Error("could not set expiration on rate limit keys", zap.Error(err))
		}

		return next(ctx, block, ops...)
	}
}

func (mw *ratelimit) enforcePerSecRateLimit(ctx *context.Context, logger *zap.Logger, resourceId string, nowMilli int64, lastResetTimeMilli int64, alloc int64, resourceRateLimit int, keysWritten []string) ([]string, error) {
	resetKey := buildResetKey(resourceId)
	allocKey := buildAllocKey(resourceId)

	var writeErrs error
	if nowMilli-lastResetTimeMilli > 1000 {
		keysWritten = append(keysWritten, resetKey, allocKey)
		writeErrs = mw.store.Write(ctx.Context, store.Pair(resetKey, int64ToString(nowMilli)))
		writeErrs = errors.Join(writeErrs, mw.store.Write(ctx.Context, store.Pair(allocKey, int64ToString(int64(resourceRateLimit-1)))))
	} else if alloc <= 0 {
		return keysWritten, fmt.Errorf("resource %s running out of step rate quota", resourceId)
	} else {
		keysWritten = append(keysWritten, allocKey)
		writeErrs = mw.store.Write(ctx.Context, store.Pair(allocKey, int64ToString(alloc-1)))
	}

	if writeErrs != nil {
		logger.Error("could not write rate limit keys", zap.Error(writeErrs))
	}

	return keysWritten, nil
}

func buildAllocKey(suffix string) string {
	return fmt.Sprintf("%s.%s", keyPrefixAlloc, suffix)
}

func buildResetKey(suffix string) string {
	return fmt.Sprintf("%s.%s", keyPrefixReset, suffix)
}
