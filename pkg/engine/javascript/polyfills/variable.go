package polyfills

import (
	"context"
	"strings"

	v8 "rogchap.com/v8go"

	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/store"
)

type variable struct {
	getFunctionName string
	setFunctionName string
	whitelist       []string
	store           store.Store
}

func Variable(get, set string, store store.Store, whitelist []string) Polyfill {
	return &variable{
		getFunctionName: get,
		setFunctionName: set,
		whitelist:       whitelist,
		store:           store,
	}
}

func (v *variable) Inject(ctx context.Context, v8ctx *v8.Context, obj *v8.Object) error {
	isolate := v8ctx.Isolate()

	for _, f := range []struct {
		name string
		fn   v8.FunctionCallback
	}{
		{name: v.getFunctionName, fn: v.get(ctx)},
		{name: v.setFunctionName, fn: v.set(ctx)},
	} {
		fn := v8.NewFunctionTemplate(isolate, f.fn)
		if err := obj.Set(f.name, fn.GetFunction(v8ctx)); err != nil {
			return err
		}
	}

	return nil
}

func (v *variable) get(ctx context.Context) v8.FunctionCallback {
	return func(info *v8.FunctionCallbackInfo) *v8.Value {
		isolate := info.Context().Isolate()

		resolver, err := v8.NewPromiseResolver(info.Context())
		if err != nil {
			return isolate.ThrowException(Throw(isolate, err))
		}

		empty, err := v8.NewValue(isolate, "[]")
		if err != nil {
			return isolate.ThrowException(Throw(isolate, err))
		}

		args := info.Args()

		if len(args) == 0 {
			resolver.Resolve(empty)
			return resolver.GetPromise().Value
		}

		var keys []string
		{
			for _, arg := range args {
				if !arg.IsString() || !v.isKeyAllowed(arg.String()) {
					resolver.Reject(Throw(isolate, errors.ErrInternal))
					return resolver.GetPromise().Value
				}

				keys = append(keys, arg.String())
			}
		}

		// NOTE(frank): A v8 isolate is NOT THREAD SAFE!!. This means
		// that even though it is tempting, YOU MUST keep any
		// isolate logic outside of other go routines.
		reject := make(chan error, 1)
		resolve := make(chan []string, 1)

		// NOTE(frank): I'm using a goroutine here because that's what is used in the v8 docs
		//				but we don't have to. I suspect it's potentially more performant though.
		go func(keys ...string) {
			results, err := v.store.Read(ctx, keys...)
			if err != nil {
				reject <- err
				return
			}

			if results == nil || len(results) != len(args) {
				reject <- errors.ErrInternal
				return
			}

			var parsed []string
			{
				for _, result := range results {
					if result == nil {
						parsed = append(parsed, `"null"`)
						continue
					}

					str, ok := result.(string)
					if !ok {
						reject <- errors.ErrInternal
						return
					}
					parsed = append(parsed, str)
				}
			}

			resolve <- parsed
		}(keys...)

		select {
		case err := <-reject:
			resolver.Reject(Throw(isolate, err))
		case results := <-resolve:

			// NOTE(frank): You can only use primitives in v8go's ObjectTemplate.Set().
			// Until we can do this, we'll need to pass some logic off to the JS.
			// https://github.com/rogchap/v8go/issues/375

			json, err := v8.NewValue(isolate, `[`+strings.Join(results, `, `)+`]`)
			if err != nil {
				return isolate.ThrowException(Throw(isolate, err))
			}

			resolver.Resolve(json)
		}

		close(reject)
		close(resolve)

		return resolver.GetPromise().Value
	}
}

func (v *variable) set(ctx context.Context) v8.FunctionCallback {
	return func(info *v8.FunctionCallbackInfo) *v8.Value {
		resolver, err := v8.NewPromiseResolver(info.Context())
		if err != nil {
			return info.Context().Isolate().ThrowException(Throw(info.Context().Isolate(), err))
		}

		if len(info.Args())%2 != 0 {
			resolver.Reject(Throw(info.Context().Isolate(), errors.ErrInternal))
			return resolver.GetPromise().Value
		}

		if len(info.Args()) == 0 {
			resolver.Resolve(v8.Undefined(info.Context().Isolate()))
			return resolver.GetPromise().Value
		}

		var keys []string
		var values []string
		{
			for i := 0; i < len(info.Args()); i++ {
				if i%2 == 0 {
					if key := info.Args()[i]; !key.IsString() || !v.isKeyAllowed(key.String()) {
						resolver.Reject(Throw(info.Context().Isolate(), errors.ErrInternal))
						return resolver.GetPromise().Value
					}

					keys = append(keys, info.Args()[i].String())
				} else {
					json, err := v8.JSONStringify(info.Context(), info.Args()[i])
					if err != nil {
						return info.Context().Isolate().ThrowException(Throw(info.Context().Isolate(), err))
					}

					// Important - undefined is not valid JSON, but null obviously is
					if json == "undefined" {
						json = "null"
					}

					values = append(values, json)
				}
			}
		}

		var pairs []*store.KV
		{
			for i := 0; i < len(keys); i++ {
				pairs = append(pairs, &store.KV{
					Key:   keys[i],
					Value: values[i],
					TTL:   constants.ExecutionVariableTTL,
				})
			}
		}

		// NOTE(frank): A v8 isolate is NOT THREAD SAFE!!. This means
		// that even though it is tempting, YOU MUST keep any
		// isolate logic outside of other go routines.
		reject := make(chan error, 1)
		resolve := make(chan struct{}, 1)

		go func() {
			if err := v.store.Write(ctx, pairs...); err != nil {
				reject <- err
				return
			}

			resolve <- struct{}{}
		}()

		select {
		case err := <-reject:
			resolver.Reject(Throw(info.Context().Isolate(), err))
		case <-resolve:
			resolver.Resolve(v8.Undefined(info.Context().Isolate()))
		}

		close(reject)
		close(resolve)

		return resolver.GetPromise().Value
	}
}

func (v *variable) isKeyAllowed(key string) bool {
	for _, allowed := range v.whitelist {
		if key == allowed {
			return true
		}
	}

	return false
}
