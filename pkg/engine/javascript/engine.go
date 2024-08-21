package javascript

import (
	"bytes"
	"context"
	goerror "errors"
	"fmt"
	"strconv"
	"strings"
	"sync"

	esbuild "github.com/evanw/esbuild/pkg/api"
	pkgengine "github.com/superblocksteam/agent/pkg/engine"
	polyfills "github.com/superblocksteam/agent/pkg/engine/javascript/polyfills"
	jsutils "github.com/superblocksteam/agent/pkg/engine/javascript/utils"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	v8 "rogchap.com/v8go"
)

type engine struct {
	sandbox *sandbox
	v8ctx   *v8.Context
}

func newEngine(ctx context.Context, sandbox *sandbox) *engine {
	v8ctx, _ := tracer.Observe(ctx, "v8.context", nil, func(context.Context, trace.Span) (*v8.Context, error) {
		return v8.NewContext(sandbox.iso), nil
	}, nil)

	return &engine{
		sandbox: sandbox,
		v8ctx:   v8ctx,
	}
}

func (e *engine) Resolve(ctx context.Context, code string, variables utils.Map[*transportv1.Variable], options ...pkgengine.ResolveOption) pkgengine.Value {
	sandbox := e.sandbox

	sandbox.mu.Lock()
	defer sandbox.mu.Unlock()

	if sandbox.iso == nil {
		return newValueWithError(e, nil, ErrSandboxClosed)
	}

	if _, ok := sandbox.engines[e]; !ok {
		return newValueWithError(e, nil, ErrEngineClosed)
	}

	result, _ := tracer.Observe(ctx, "engine.resolve", nil, func(context.Context, trace.Span) (pkgengine.Value, error) {
		value := e.resolveLocked(ctx, code, variables, options...)
		return value, value.Err()
	}, nil)

	if e.sandbox.options.AfterFunc != nil {
		e.sandbox.options.AfterFunc(result.Err())
	}

	return result
}

func (e *engine) resolveLocked(ctx context.Context, code string, variables utils.Map[*transportv1.Variable], options ...pkgengine.ResolveOption) pkgengine.Value {
	logger := e.sandbox.options.Logger
	opts := pkgengine.ApplyResolve(options...)
	v8ctx := e.v8ctx

	unwrapped := utils.IdempotentUnwrap(code)

	/*
		// Instantiate ADVANCED variable.
		const one = {
			get: async () => JSON.parse(await ofuscated_read_function('REF.MY_VAR_ONE'))[0],
			set: async value => await sb165('REF.MY_VAR_ONE', value),
		};

		// Retrieve initial values for SIMPLE variables.
		const ofuscated_values_variable = JSON.parse(await ofuscated_read_function('REF.MY_VAR_TWO'));

		// Instantiate part of a SIMPLE variable.
		const two = {
			value: ofuscated_values_variable['0']
			// The set method will be instantiated later.
		};

		// Instantiate manager variable for READWRITE variables.
		const ofuscated_manager_variable = [
			{ changed: false, ref: 'REF.MY_VAR_TWO', get: () => two.value },
		];

		// Instantiate the readContentsAsync method for FILEPICKER variables.
		const myFilePicker = obfuscated_filepicker_variable['0'];
		for (let i = 0; i < myFilePicker.files.length; i++) {
			myFilePicker.files[i].readContentsAsync = async mode => {
				return await obfuscated_read_contents_async_function(myFilePicker.files[i].path, mode, true);
			};
			myFilePicker.files[i].readContents = mode => {
				return obfuscated_read_contents_async_function(myFilePicker.files[i].path, mode, false);
			};
		}

		// Instantiate the set method of all SIMPLE variables now that we have the manager.
		two.set = value => {
			two.value = value;
			ofuscated_manager_variable['0'].changed = true;
		};

		try {
			return await (async () => customer code )();
		} finally {
			await ofuscated_write_function(
				...ofuscated_manager_variable
				.filter(v => v.changed)
				.map(v => [v.ref, v.get()])
				.flat()
			);
		}

	*/

	// Appending 'sb' since JS functions cannot start with a number.
	getFunctionName := utils.Random("sb", 0, 100)
	setFunctionName := utils.Random("sb", 101, 200)
	simpleValuesVarName := utils.Random("sb", 401, 500)
	managerVarName := utils.Random("sb", 501, 600)
	filepickerReadContentsVarName := utils.Random("sb", 601, 700)

	// NOTE(frank): Use this insanely cool tokenizer to improve this implementaiton.
	//				https://github.com/tdewolff/parse/tree/master/js

	// NOTE(frank): There are many ways to do this. We can use esbuild or v8go.
	//				It appears cleaner to use esbuild at this time.
	var globals string
	var whitelist []string
	{
		globalBuf := bytes.Buffer{}
		simpleBuf := bytes.Buffer{}
		setBuf := bytes.Buffer{}
		whitelist = []string{}
		args := []string{}
		manager := []string{}
		simpleWriteIdx := 0
		simpleIdx := 0

		globalBuf.WriteString(";") // Just so we don't interfere with any code that may come before.

		if variables != nil {
			for _, name := range variables.Keys().Contents() {
				if !strings.Contains(code, name) {
					continue
				}

				variable, _ := variables.Get(name)
				whitelist = append(whitelist, variable.Key)

				switch variable.Type {
				case apiv1.Variables_TYPE_SIMPLE, apiv1.Variables_TYPE_NATIVE, apiv1.Variables_TYPE_FILEPICKER:
					args = append(args, `'`+variable.Key+`'`)

					if variable.Type == apiv1.Variables_TYPE_SIMPLE {
						simpleBuf.WriteString(`const ` + name + ` = { value: ` + simpleValuesVarName + `['` + strconv.Itoa(simpleIdx) + `'] };`)
					} else {
						simpleBuf.WriteString(`const ` + name + ` = ` + simpleValuesVarName + `['` + strconv.Itoa(simpleIdx) + `'];`)
					}

					if variable.Type == apiv1.Variables_TYPE_FILEPICKER {
						simpleBuf.WriteString(`for (let i = 0; i < ` + name + `.files.length; i++) {` + name + `.files[i].readContentsAsync = async(mode) => { return await ` + filepickerReadContentsVarName + `(` + name + `?.files[i]?.path, mode, true); };` + name + `.files[i].readContents = (mode) => { return ` + filepickerReadContentsVarName + `(` + name + `?.files[i]?.path, mode, false); }}`)
					}

					if variable.Mode == apiv1.Variables_MODE_READWRITE {
						manager = append(manager, `{ changed: false, ref: '`+variable.Key+`', get: () => `+name+`.value }`)
						setBuf.WriteString(name + `.set = value => { ` + name + `.value = value; ` + managerVarName + `['` + strconv.Itoa(simpleWriteIdx) + `'].changed = true; };`)
						simpleWriteIdx++
					}

					simpleIdx++
				case apiv1.Variables_TYPE_ADVANCED:
					globalBuf.WriteString("const " + name + " = { get: async () => (JSON.parse(await " + getFunctionName + "('" + variable.Key + "')))[0], set: async (value) => await " + setFunctionName + "('" + variable.Key + "', value) };")
				}
			}
		}

		globalBuf.WriteString(`const ` + simpleValuesVarName + ` = JSON.parse(await ` + getFunctionName + `(` + strings.Join(args, ", ") + `));`)
		globalBuf.WriteString(simpleBuf.String())
		globalBuf.WriteString(`const ` + managerVarName + ` = [` + strings.Join(manager, ", ") + `];`)
		globalBuf.WriteString(setBuf.String())

		globals = globalBuf.String()
	}

	var minified string
	{
		result, err := tracer.Observe(ctx, "esbuild.transform", nil, func(context.Context, trace.Span) (esbuild.TransformResult, error) {
			script := fmt.Sprintf("(async () => {%s;try {return await (async () => {return %s})();} finally {await %s(...%s.filter(v => v.changed).map(v => [v.ref, v.get()]).flat());}})()", globals, unwrapped, setFunctionName, managerVarName)

			result := esbuild.Transform(script, esbuild.TransformOptions{
				MinifyWhitespace:  true,
				MinifyIdentifiers: false, // As long as we're polyfilling `get()`, we can't minify the identifiers. We can potentially mangle.
				MinifySyntax:      true,
				LogLimit:          0,
				Format:            esbuild.FormatESModule,
				Platform:          esbuild.PlatformBrowser,
				TreeShaking:       esbuild.TreeShakingFalse,
				Target:            esbuild.ES2022,
			})

			if len(result.Errors) > 0 {
				return result, errors.BindingError(goerror.New(result.Errors[0].Text), e.sandbox.options.BindingErrorOptions...)
			}

			return result, nil
		}, nil)

		if err != nil {
			logger.Error("esbuild could not transform the code", zap.Error(err))
			return e.Failed(err)
		}

		// The above transform options are appending a newline to the end.
		// I haven't figured out how to remove so this is a workaround.
		if len(result.Code) > 1 && result.Code[len(result.Code)-1] == 10 {
			result.Code = result.Code[:len(result.Code)-1]
		}

		minified = string(result.Code)
	}

	// NOTE(frank): We don't use console in the orchestrator. If we run into
	//              performance issues we can take in a flag to disable this.
	console := &pkgengine.Console{
		Stderr: &bytes.Buffer{},
		Stdout: &bytes.Buffer{},
	}

	// NOTE(frank): BAD! CHANGE! ME! This is interesting. We're not using the provided context.
	// I think the reason why is we want an execution specific polyfill. This isn't the
	// most performant thing to do though. With some minor investigation, we can remove
	// this logic and keep all of this setup in sandbox.Engine where it's supposed to live.
	//
	//
	// When this note is resolved, non of this code will be here (it'll be in sandbox.Engine) and we'd
	// just use v8ctx.RunScript(minified, "code.js") below.
	{
		for _, polyfill := range []polyfills.Polyfill{
			polyfills.Base64(),
			polyfills.Variable(getFunctionName, setFunctionName, e.sandbox.options.Store, whitelist),
			polyfills.Console(console),
			polyfills.Fetch(),
			polyfills.FilePicker(filepickerReadContentsVarName, opts.GetFileFunc, logger, console),
		} {
			if err := polyfill.Inject(ctx, v8ctx, v8ctx.Global()); err != nil {
				return e.Failed(err)
			}
		}

		if err := LoadBundles(v8ctx, unwrapped); err != nil {
			return e.Failed(err)
		}
	}

	result, _ := tracer.Observe(ctx, "v8.run", map[string]any{
		"v8.script": minified,
	}, func(ctx context.Context, _ trace.Span) (*value, error) {
		// If no quota error ocurrs, we use this channel to break out
		// of the manager that is watching for context cancelation.
		done := make(chan struct{})

		var wg sync.WaitGroup
		defer wg.Wait()

		wg.Add(1)
		go func() {
			defer wg.Done()

			select {
			case <-ctx.Done(): // the context was canceled before the execution finished
				if ctx.Err() == context.DeadlineExceeded {
					e.sandbox.iso.TerminateExecution()
				}
			case <-done: // the execution finished before the context was canceled
				return
			}
		}()

		val, err := v8ctx.RunScript(minified, "code.js")
		close(done)

		if ctx.Err() == context.DeadlineExceeded {
			err = new(errors.QuotaError)
		} else {
			err = errors.BindingError(err, e.sandbox.options.BindingErrorOptions...)
		}

		if err == nil {
			if val.IsPromise() {
				val, err = jsutils.ResolvePromise(ctx, v8ctx, val, e.sandbox.options.BindingErrorOptions)
				if err != nil {
					return newValueWithError(e, console, err), err
				}
			}
			return newValue(e, v8ctx, console, val), nil
		} else {
			return newValueWithError(e, console, err), err
		}
	}, nil)

	return result
}

func (e *engine) Failed(err error) pkgengine.Value {
	return newValueWithError(e, nil, err)
}

func (e *engine) Close() {
	sandbox := e.sandbox

	sandbox.mu.Lock()
	defer sandbox.mu.Unlock()

	if sandbox.iso == nil {
		return
	}

	if _, ok := sandbox.engines[e]; !ok {
		return
	}

	e.closeLocked()
}

func (e *engine) closeLocked() {
	e.v8ctx.Close()
	e.v8ctx = nil

	delete(e.sandbox.engines, e)
}
