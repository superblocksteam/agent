package javascript

import (
	goerror "errors"

	pkgengine "github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/errors"
	v8 "rogchap.com/v8go"
)

type value struct {
	console *pkgengine.Console
	engine  *engine
	err     error
	value   *v8.Value
	v8ctx   *v8.Context
}

func newValue(engine *engine, v8ctx *v8.Context, console *pkgengine.Console, val *v8.Value) *value {
	return &value{
		console: console,
		engine:  engine,
		value:   val,
		v8ctx:   v8ctx,
	}
}

func newValueWithError(engine *engine, console *pkgengine.Console, err error) *value {
	return &value{
		console: console,
		err:     err,
		engine:  engine,
	}
}

func (v *value) Result(options ...pkgengine.ResultOption) (any, error) {
	if v.err != nil {
		return nil, v.err
	}

	sandbox := v.engine.sandbox

	sandbox.mu.Lock()
	defer sandbox.mu.Unlock()

	if sandbox.iso == nil {
		return nil, ErrSandboxClosed
	}

	if _, ok := sandbox.engines[v.engine]; !ok {
		return nil, ErrEngineClosed
	}

	return v.resultLocked(options...)
}

func (v *value) resultLocked(options ...pkgengine.ResultOption) (any, error) {
	value := v.value

	applied := pkgengine.Apply(options...)

	// Used for conditional bindings
	if applied.AsBoolean || value.IsBoolean() {
		return value.Boolean(), nil
	}

	if value.IsString() {
		return value.String(), nil
	}

	if value.IsInt32() {
		return value.Int32(), nil
	}

	if value.IsUndefined() {
		return nil, nil
	}

	if value.IsObject() && value.IsArray() {
		length, err := value.Object().Get("length")
		if err != nil {
			return nil, errors.BindingError(err)
		}

		var arr []string
		{
			for i := 0; i < int(length.Int32()); i++ {
				entry, err := value.Object().GetIdx(uint32(i))
				if err != nil {
					return nil, errors.BindingError(err)
				}

				var data string

				// If not a string, we should stringify the v8 result for usage in our templating system
				// We could also do this recursively, but decided not to just to keep it simple and not
				// have to encapsulate all the possible v8 types in recursion
				if entry.IsString() && !applied.JSONEncodeArrayItems {
					data = entry.String()
				} else if entry.IsUndefined() || entry.IsNull() {
					data = ""
				} else {
					data, err = v8.JSONStringify(v.v8ctx, entry)
					if err != nil {
						return nil, err
					}
				}

				arr = append(arr, data)
			}
		}

		return arr, nil
	}

	// NOTE(frank): Here is where we'd handle other types.

	return nil, goerror.New("unsupported type")
}

func (v *value) JSON() (string, error) {
	if v.err != nil {
		return "", v.err
	}

	sandbox := v.engine.sandbox

	sandbox.mu.Lock()
	defer sandbox.mu.Unlock()

	if sandbox.iso == nil {
		return "", ErrSandboxClosed
	}

	if _, ok := sandbox.engines[v.engine]; !ok {
		return "", ErrEngineClosed
	}

	return v.jsonLocked()
}

func (v *value) jsonLocked() (string, error) {
	return v8.JSONStringify(v.v8ctx, v.value)
}

func (v *value) Err() error {
	return v.err
}

func (v *value) Console() *pkgengine.Console {
	return v.console
}
