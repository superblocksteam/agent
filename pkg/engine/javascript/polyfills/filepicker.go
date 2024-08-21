package polyfills

import (
	"context"
	b64 "encoding/base64"
	"errors"
	"fmt"
	"io"
	"slices"
	"strings"

	"github.com/superblocksteam/agent/pkg/engine"
	utils "github.com/superblocksteam/agent/pkg/engine/javascript/utils"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"go.uber.org/zap"
	v8 "rogchap.com/v8go"
)

type filepicker struct {
	name        string
	getFileFunc utils.GetFileFunc
	logger      *zap.Logger
	console     *engine.Console
}

func FilePicker(name string, getFileFunc utils.GetFileFunc, logger *zap.Logger, console *engine.Console) Polyfill {
	return &filepicker{
		name:        name,
		getFileFunc: getFileFunc,
		logger:      logger,
		console:     console,
	}
}

func (fp *filepicker) Inject(ctx context.Context, v8ctx *v8.Context, obj *v8.Object) error {
	isolate := v8ctx.Isolate()

	for _, f := range []struct {
		name string
		fn   v8.FunctionCallback
	}{
		{name: fp.name, fn: fp.GetReadContentsFunctionCallback(ctx)},
	} {
		fn := v8.NewFunctionTemplate(isolate, f.fn)
		if err := obj.Set(f.name, fn.GetFunction(v8ctx)); err != nil {
			return err
		}
	}

	return nil
}

func (fp *filepicker) GetReadContentsFunctionCallback(ctx context.Context) v8.FunctionCallback {
	return func(info *v8.FunctionCallbackInfo) *v8.Value {
		isolate := info.Context().Isolate()

		if err := fp.validate(info.Args()); err != nil {
			return isolate.ThrowException(Throw(isolate, err))
		}

		path, mode := info.Args()[0].String(), info.Args()[1].String()

		if info.Args()[2].Boolean() {
			// NOTE(frank): A v8 isolate is NOT THREAD SAFE!!. This means
			// that even though it is tempting, YOU MUST keep any
			// isolate logic outside of other go routines.
			reject := make(chan error, 1)
			resolve := make(chan string, 1)

			// async
			resolver, err := v8.NewPromiseResolver(info.Context())
			if err != nil {
				return isolate.ThrowException(Throw(isolate, err))
			}

			go func() {
				value, err := retrieve(ctx, fp.getFileFunc, path, mode)
				if err != nil {
					reject <- err
					return
				}

				resolve <- value
			}()

			select {
			case err := <-reject:
				resolver.Reject(Throw(isolate, err))
			case data := <-resolve:
				value, err := v8.NewValue(isolate, data)
				if err != nil {
					return isolate.ThrowException(Throw(isolate, err))
				}

				resolver.Resolve(value)
			}

			close(reject)
			close(resolve)

			return resolver.GetPromise().Value
		}

		value, err := retrieve(ctx, fp.getFileFunc, info.Args()[0].String(), info.Args()[1].String())
		if err != nil {
			return isolate.ThrowException(Throw(isolate, err))
		}

		result, err := v8.NewValue(isolate, value)
		if err != nil {
			return isolate.ThrowException(Throw(isolate, err))
		}

		return result
	}
}

func (fp *filepicker) validate(args []*v8.Value) error {
	if len(args) != 3 {
		fp.logger.Error("invalid number of arguments", zap.Int("expected", 3), zap.Int("actual", len(args)))
		return &sberrors.InternalError{}
	}

	// path
	if !args[0].IsString() {
		fp.logger.Error("internal path parameter must be a string")
		return &sberrors.InternalError{}
	}

	// mode
	if !args[1].IsString() && !args[1].IsUndefined() {
		fp.logger.Error("mode must be a string")
		return sberrors.BindingError(errors.New("mode must be a string"))
	}

	// warn if not valid mode
	// https://docs.superblocks.com/applications/components-library/file-picker
	mode := args[1].String()
	if mode != "undefined" { // no mode given (auto-detect)
		validModes := []string{"binary", "raw", "text"}

		if !slices.Contains(validModes, mode) {

			err := utils.Log(fp.console.Stdout, fmt.Sprintf("automatically detecting the mode since '%s' is not a valid mode [%s]", mode, "'"+strings.Join(validModes, "', '")+"'"))
			if err != nil {
				fp.logger.Error("could not log to stdout", zap.Error(err))

			}

		}
	}

	// async
	if !args[2].IsBoolean() {
		fp.logger.Error("internal async parameter must be a boolean")
		return &sberrors.InternalError{}
	}

	return nil
}

func retrieve(ctx context.Context, fn utils.GetFileFunc, path, mode string) (string, error) {
	if fn == nil {
		return "", errors.New("no function given to retrieve file")
	}

	fileReader, err := fn(ctx, path)
	if err != nil {
		return "", err
	}

	data, err := io.ReadAll(fileReader)
	if err != nil {
		return "", err
	}

	return serialize(data, mode)
}

func serialize(buffer []byte, mode string) (string, error) {
	if mode == "raw" {
		return string(buffer), nil
	}

	var check []byte
	{
		if len(buffer) > 1024 {
			check = buffer[:1024]
		} else {
			check = buffer
		}
	}

	if mode == "binary" || isBinaryString(check) {
		if mode == "text" {
			return "", errors.New("file is binary and cannot be converted to text")
		}

		return b64.StdEncoding.EncodeToString(buffer), nil
	}

	// mode=text or mode=auto
	return string(buffer), nil
}

func isBinaryString(b []byte) bool {
	for _, byteVal := range b {
		// Check if the byte is outside the range of common text characters in ASCII.
		if !isTextCharacter(byteVal) {
			return true // Non-text character found, likely binary data.
		}
	}
	return false // Only text characters found, not binary data.
}

func isTextCharacter(b byte) bool {
	return (b >= 0x20 && b < 0x7F) || // Printable ASCII characters (space to tilde).
		b == 0x09 || // Horizontal tab.
		b == 0x0A || // Line feed.
		b == 0x0D || // Carriage return.
		b == 0x1B // Escape character.
}
