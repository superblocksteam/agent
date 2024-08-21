package polyfills

import (
	"context"

	v8 "rogchap.com/v8go"
)

func injectPolyfill(fn func() Polyfill) (*v8.Object, *v8.Isolate, *v8.Context) {
	iso := v8.NewIsolate()
	v8ctx := v8.NewContext(iso)
	globals := v8ctx.Global()
	fn().Inject(context.Background(), v8ctx, globals)
	return globals, iso, v8ctx
}

func getValuers(iso *v8.Isolate, inputParams []any) ([]v8.Valuer, error) {
	var valuers []v8.Valuer
	for _, v := range inputParams {
		newValue, err := v8.NewValue(iso, v)
		if err != nil {
			return nil, err
		}
		valuers = append(valuers, newValue)
	}
	return valuers, nil
}

func callPolyfillFunctionWithParams(v8obj *v8.Object, iso *v8.Isolate, funcName string, inputParams []any) (*v8.Value, error) {
	funcValue, err := v8obj.Get(funcName)
	if err != nil {
		return nil, err
	}

	actualFunc, err := funcValue.AsFunction()
	if err != nil {
		return nil, err
	}

	valuers, err := getValuers(iso, inputParams)
	if err != nil {
		return nil, err
	}

	result, err := actualFunc.Call(v8obj, valuers...)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func injectAndCallPolyfillFunction(polyfillFunc func() Polyfill, funcName string, inputParams []any) (*v8.Value, error) {
	v8obj, iso, _ := injectPolyfill(polyfillFunc)
	return callPolyfillFunctionWithParams(v8obj, iso, funcName, inputParams)
}
