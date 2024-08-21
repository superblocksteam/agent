package polyfills

import v8 "rogchap.com/v8go"

func Throw(isolate *v8.Isolate, err error) *v8.Value {
	val, err := v8.NewValue(isolate, err.Error())
	if err != nil {
		return v8.Null(isolate)
	}

	return val
}
