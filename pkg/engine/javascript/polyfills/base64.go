package polyfills

import (
	"context"

	b64 "go.kuoruan.net/v8go-polyfills/base64"
	v8 "rogchap.com/v8go"
)

type base64 struct{}

func Base64() Polyfill {
	return &base64{}
}

func (l *base64) Inject(_ context.Context, v8ctx *v8.Context, obj *v8.Object) error {
	isolate := v8ctx.Isolate()
	b := b64.NewBase64()

	for _, f := range []struct {
		name string
		fn   func() v8.FunctionCallback
	}{
		{name: "atob", fn: b.GetAtobFunctionCallback},
		{name: "btoa", fn: b.GetBtoaFunctionCallback},
	} {
		fn := v8.NewFunctionTemplate(isolate, f.fn())
		if err := obj.Set(f.name, fn.GetFunction(v8ctx)); err != nil {
			return err
		}
	}

	return nil
}
