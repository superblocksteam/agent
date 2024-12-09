package ratelimit

import (
	"math"

	"go.uber.org/zap"

	"github.com/superblocksteam/agent/internal/flags"
	"github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/executor/middleware"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/store"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

type blockRatelimit struct {
	logger  *zap.Logger
	store   store.Store
	flags   flags.Flags
	orgID   string
	apiId   string
	orgTier string
}

func BlockMiddleware(
	logger *zap.Logger,
	store store.Store,
	flags flags.Flags,
	orgID string,
	apiId string,
	orgTier string,
) middleware.Middleware[middleware.BlockFunc] {
	mw := &blockRatelimit{
		logger:  logger.With(zap.String("middleware", "ratelimit")),
		store:   store,
		orgID:   orgID,
		flags:   flags,
		apiId:   apiId,
		orgTier: orgTier,
	}

	return mw.middleware
}

func (mw *blockRatelimit) middleware(next middleware.BlockFunc) middleware.BlockFunc {
	return func(ctx *context.Context, block *apiv1.Block, ops ...options.Option) (*context.Context, string, error) {
		if mw.flags == nil {
			mw.logger.Error("flags not initialized")

			ctx.MaxStreamSendSize = math.MaxInt
			ctx.MaxParellelPoolSize = math.MaxInt

			return next(ctx, block, ops...)
		}

		ctx.MaxParellelPoolSize = mw.flags.GetMaxParallelPoolSizeV2(mw.orgTier, mw.orgID)
		ctx.MaxStreamSendSize = mw.flags.GetMaxStreamSendSizeV2(mw.orgTier, mw.orgID)

		return next(ctx, block, ops...)
	}
}
