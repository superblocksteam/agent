package middleware

import (
	"github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/executor/options"
	v1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

type Middleware[T any] func(T) T

func Chain[T any](inner T, middleware ...Middleware[T]) T {
	if len(middleware) == 0 {
		return inner
	}

	wrapped := inner

	// loop in reverse to preserve middleware order
	for i := len(middleware) - 1; i >= 0; i-- {
		wrapped = middleware[i](wrapped)
	}

	return wrapped
}

type StepFunc func(*context.Context, *v1.Step, ...options.Option) (*transportv1.Performance, string, error)

type BlockFunc func(*context.Context, *v1.Block, ...options.Option) (*context.Context, string, error)
