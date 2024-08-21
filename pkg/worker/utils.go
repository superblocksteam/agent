package worker

import "context"

type ContextKey int

const (
	ContextKeyEstimate ContextKey = iota + 100 // NOTE(frank): I don't want to overlap with other iota context keys in other packages.
	ContextKeyEvent
)

func WithEvent(ctx context.Context, event Event) context.Context {
	return context.WithValue(ctx, ContextKeyEvent, event)
}

func EventFromContext(ctx context.Context) Event {
	if typed, ok := ctx.Value(ContextKeyEvent).(Event); ok {
		return typed
	}

	return EventUnknown
}
