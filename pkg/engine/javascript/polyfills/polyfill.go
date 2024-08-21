package polyfills

import (
	"context"

	v8 "rogchap.com/v8go"
)

type Polyfill interface {
	Inject(context.Context, *v8.Context, *v8.Object) error
}
