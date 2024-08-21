package utils

import (
	"context"
	"errors"
	"fmt"
	"strings"

	sberrors "github.com/superblocksteam/agent/pkg/errors"

	v8 "rogchap.com/v8go"
)

func ResolvePromise(ctx context.Context, v8ctx *v8.Context, v *v8.Value, bindingErrorOptions []sberrors.BindingErrorOption) (*v8.Value, error) {
	if !v.IsPromise() {
		return v, nil
	}

	for {
		// If the context is canceled or has timed out, we should
		// not continue to make progress on the promise.
		if ctx.Err() == context.DeadlineExceeded {
			return nil, new(sberrors.QuotaError)
		}
		switch p, _ := v.AsPromise(); p.State() {
		case v8.Fulfilled:
			return p.Result(), nil
		case v8.Rejected:
			return nil, sberrors.BindingError(getErrorFromResult(p.Result()), bindingErrorOptions...)
		case v8.Pending:
			v8ctx.PerformMicrotaskCheckpoint()
		default:
			return nil, fmt.Errorf("illegal v8.Promise state %d", p)

		}
	}
}

func getErrorFromResult(result *v8.Value) error {
	if !result.IsNativeError() {
		return errors.New(result.DetailString())
	}

	jsObj := result.Object()
	stack, err := jsObj.Get("stack")
	if err != nil || !stack.IsString() {
		return errors.New(result.DetailString())
	}

	stackStr := stack.String()
	lines := strings.Split(stackStr, "\n")
	if len(lines) < 2 {
		return errors.New(result.DetailString())
	}

	return &v8.JSError{
		Message:    lines[0],
		Location:   strings.TrimPrefix(strings.TrimSpace(lines[1]), "at "),
		StackTrace: stackStr,
	}
}
