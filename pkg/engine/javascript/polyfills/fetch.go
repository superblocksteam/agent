package polyfills

import (
	"context"

	fetchLib "go.kuoruan.net/v8go-polyfills/fetch"
	v8 "rogchap.com/v8go"
)

type fetch struct{}

func Fetch() Polyfill {
	return &fetch{}
}

func (fl *fetch) Inject(_ context.Context, v8ctx *v8.Context, obj *v8.Object) error {
	isolate := v8ctx.Isolate()
	fetcher := fetchLib.NewFetcher()

	for _, f := range []struct {
		name string
		fn   func() v8.FunctionCallback
	}{
		{name: "fetch", fn: fetcher.GetFetchFunctionCallback},
	} {
		fn := v8.NewFunctionTemplate(isolate, f.fn())
		if err := obj.Set(f.name, fn.GetFunction(v8ctx)); err != nil {
			return err
		}
	}

	return nil
}
