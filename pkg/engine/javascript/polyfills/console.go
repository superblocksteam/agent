package polyfills

import (
	"context"

	"github.com/superblocksteam/agent/pkg/engine"
	polyfill "go.kuoruan.net/v8go-polyfills/console"
	v8 "rogchap.com/v8go"
)

type console struct {
	sink *engine.Console
}

func Console(sink *engine.Console) Polyfill {
	return &console{
		sink: sink,
	}
}

func (consoleObj *console) Inject(_ context.Context, v8ctx *v8.Context, obj *v8.Object) error {
	isolate := v8ctx.Isolate()

	logConsole := polyfill.NewConsole(
		polyfill.WithOutput(consoleObj.sink.Stdout),
	)

	errorConsole := polyfill.NewConsole(
		polyfill.WithOutput(consoleObj.sink.Stderr),
	)

	local := v8.NewObjectTemplate(isolate)

	// NOTE: (joey) this is so that:
	// console.log({foo: "bar"}) ->  {foo: "bar"}
	// and not
	// console.log({foo: "bar"}) ->  [object Object]
	serializeObjects := func(original v8.FunctionCallback) v8.FunctionCallback {
		return func(info *v8.FunctionCallbackInfo) *v8.Value {
			args := info.Args()
			for i, arg := range args {
				if arg.IsObject() {
					json, err := arg.MarshalJSON()
					if err != nil {
						args[i], err = v8.NewValue(isolate, "[Serialization Error]")
						// NOTE: (joey) do we just want to error here or is this sufficient?
					} else {
						args[i], err = v8.NewValue(isolate, string(json))
					}
				}
			}
			return original(info)
		}
	}

	for _, f := range []struct {
		name string
		fn   func() v8.FunctionCallback
	}{
		{name: "log", fn: func() v8.FunctionCallback { return serializeObjects(logConsole.GetLogFunctionCallback()) }},
		{name: "info", fn: func() v8.FunctionCallback { return serializeObjects(logConsole.GetLogFunctionCallback()) }},
		{name: "debug", fn: func() v8.FunctionCallback { return serializeObjects(logConsole.GetLogFunctionCallback()) }},
		{name: "warn", fn: func() v8.FunctionCallback { return serializeObjects(errorConsole.GetLogFunctionCallback()) }},
		{name: "error", fn: func() v8.FunctionCallback { return serializeObjects(errorConsole.GetLogFunctionCallback()) }},
		{name: "dir", fn: func() v8.FunctionCallback { return serializeObjects(logConsole.GetLogFunctionCallback()) }},
	} {
		fn := v8.NewFunctionTemplate(isolate, f.fn())
		if err := local.Set(f.name, fn, v8.ReadOnly); err != nil {
			return err
		}
	}

	instance, err := local.NewInstance(v8ctx)
	if err != nil {
		return err
	}

	if err := obj.Set("console", instance); err != nil {
		return err
	}

	return nil
}
