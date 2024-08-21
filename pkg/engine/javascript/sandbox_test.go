package javascript

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/metrics"
	pkgengine "github.com/superblocksteam/agent/pkg/engine"
	engineUtils "github.com/superblocksteam/agent/pkg/engine/javascript/utils"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"

	"go.uber.org/zap/zaptest"
)

type args struct {
	options *Options
}

func init() {
	metrics.RegisterMetrics()
}

func validArgs(t *testing.T) *args {
	t.Helper()
	return &args{
		options: &Options{
			Logger: zaptest.NewLogger(t),
			Store:  store.Memory(),
		},
	}
}

func testEngine(t *testing.T, args *args) (pkgengine.Sandbox, pkgengine.Engine) {
	t.Helper()
	sandbox := testSandbox(t, args)
	engine, err := sandbox.Engine(context.Background())
	require.NoError(t, err)
	return sandbox, engine
}

func testSandbox(t *testing.T, args *args) pkgengine.Sandbox {
	t.Helper()
	return Sandbox(context.Background(), args.options)
}

func verifyResolve(t *testing.T, args *args, engine pkgengine.Engine, expectedError error) {
	t.Helper()
	ctx := context.Background()
	v := engine.Resolve(ctx, `1;`, nil)
	require.NotNil(t, v)

	one, err := v.Result()
	if expectedError == nil {
		require.NoError(t, err)
		require.Equal(t, int32(1), one)
	} else {
		require.ErrorIs(t, err, expectedError)
	}

	json, err := v.JSON()
	if expectedError == nil {
		require.NoError(t, err)
		require.Equal(t, "1", json)
	} else {
		require.ErrorIs(t, err, expectedError)
	}
}

func verifyValueError(t *testing.T, args *args, value pkgengine.Value, expectedError error) {
	verifyValueErrorExceptErrConsole(t, args, value, expectedError)

	require.ErrorIs(t, value.Err(), expectedError)
	require.Nil(t, value.Console())
}

func verifyValueErrorExceptErrConsole(t *testing.T, args *args, value pkgengine.Value, expectedError error) {
	require.NotNil(t, value)

	result, err := value.Result()
	require.Equal(t, nil, result)
	require.ErrorIs(t, err, expectedError)

	json, err := value.JSON()
	require.Equal(t, "", json)
	require.ErrorIs(t, err, expectedError)
}

func TestSandbox(t *testing.T) {
	t.Parallel()
	args := validArgs(t)

	sandbox, engine := testEngine(t, args)
	defer sandbox.Close()
	defer engine.Close()

	verifyResolve(t, args, engine, nil)
}

func TestSandboxEngineFailedApi(t *testing.T) {
	t.Parallel()
	args := validArgs(t)

	sandbox, engine := testEngine(t, args)
	defer sandbox.Close()
	defer engine.Close()

	broken := errors.New("broken")
	value := engine.Failed(broken)
	verifyValueError(t, args, value, broken)
}

func TestSandboxAfterFuncIsCalled(t *testing.T) {
	t.Parallel()
	args := validArgs(t)

	var errs []string
	args.options.AfterFunc = func(err error) {
		s := ""
		if err != nil {
			s = err.Error()
		}
		errs = append(errs, s)
	}

	sandbox, engine := testEngine(t, args)
	defer sandbox.Close()
	defer engine.Close()

	verifyResolve(t, args, engine, nil)

	_, err := engine.Resolve(context.Background(), `busted;`, nil).Result()
	require.Error(t, err)

	require.Equal(t, []string{"", "ReferenceError: busted is not defined"}, errs)
}

func TestSandboxErrClosed(t *testing.T) {
	t.Parallel()
	args := validArgs(t)

	sandbox := testSandbox(t, args)
	sandbox.Close()

	engine, err := sandbox.Engine(context.Background())
	require.NotNil(t, engine)
	require.ErrorIs(t, err, ErrSandboxClosed)
	engine.Close()

	verifyResolve(t, args, engine, ErrSandboxClosed)

	broken := errors.New("broken")
	value := engine.Failed(broken)
	verifyValueError(t, args, value, broken)
}

func TestSandboxErrEngineClosed(t *testing.T) {
	t.Parallel()
	args := validArgs(t)

	sandbox, engine := testEngine(t, args)
	defer sandbox.Close()
	engine.Close()
	engine.Close() // is re-entrant without issue

	verifyResolve(t, args, engine, ErrEngineClosed)
}

func TestSandboxCloseEnsuresEngineClosed(t *testing.T) {
	t.Parallel()
	args := validArgs(t)

	sandbox, engine := testEngine(t, args)
	verifyResolve(t, args, engine, nil)
	sandbox.Close()
	verifyResolve(t, args, engine, ErrSandboxClosed)
	sandbox.Close() // is re-entrant without issue
	engine.Close()  // is re-entrant without issue
}

func TestSandboxCloseValuesInvalid(t *testing.T) {
	t.Parallel()
	args := validArgs(t)
	ctx := context.Background()

	sandbox, engine := testEngine(t, args)

	value := engine.Resolve(ctx, `1;`, nil)
	engine.Close()

	verifyValueErrorExceptErrConsole(t, args, value, ErrEngineClosed)

	engine, err := sandbox.Engine(ctx)
	require.NoError(t, err)

	value = engine.Resolve(ctx, `1;`, nil)
	sandbox.Close()

	verifyValueErrorExceptErrConsole(t, args, value, ErrSandboxClosed)
}

func TestSandboxThreadSafety(t *testing.T) {
	t.Parallel()
	args := validArgs(t)

	ctx := context.Background()

	sandbox := testSandbox(t, args)

	engines := []pkgengine.Engine{}
	for i := 0; i < 5; i++ {
		engine, err := sandbox.Engine(ctx)
		require.NoError(t, err)
		engines = append(engines, engine)
	}

	// expected return value of js is the index in the go slice
	js := []string{
		`0;`,
		`(() => {
			var now = new Date().getTime();
			while (new Date().getTime() - now < 10) {};
			return 1;
		})()`,
	}

	var wg sync.WaitGroup
	defer wg.Wait()
	for i := 0; i < 1000; i++ {
		i := i
		engine := engines[i%len(engines)]
		jsi := i % len(js)
		code := js[jsi]

		if i == 500 {
			engine.Close()
		} else if i == 750 {
			sandbox.Close()
		}

		wg.Add(1)
		go func() {
			defer wg.Done()
			a, err := engine.Resolve(ctx, code, nil).Result()
			if err != nil {
				if !(errors.Is(err, ErrEngineClosed) || errors.Is(err, ErrSandboxClosed)) {
					t.Fatalf("unexpected error: %v", err)
				}
				return
			}

			require.NoErrorf(t, err, "i %d", i)
			require.Equalf(t, int32(jsi), a, "i %d", i)
		}()
	}
}

func TestSandboxEngineResolveLots(t *testing.T) {
	t.Parallel()
	args := validArgs(t)
	sandbox, e := testEngine(t, args)
	defer sandbox.Close()
	defer e.Close()

	ctx := context.Background()

	// really gross hack because the js code in the `.Resolve` does not
	// make it easy to set up a variable to be used across RunScript calls
	e.(*engine).v8ctx.Global().Set("result", int32(0))

	n := 1000
	values := make([]pkgengine.Value, n)
	for i := range values {
		values[i] = e.Resolve(ctx, "result++", nil)
	}

	for i, value := range values {
		v, err := value.Result()
		require.NoError(t, err)
		require.Equal(t, int32(i), v)
	}
}

func TestTimeout(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name        string
		template    string
		result      any
		err         error
		seed        map[string]any
		data        map[string]any
		variables   map[string]*transportv1.Variable
		stdout      string
		stderr      string
		getFileFunc engineUtils.GetFileFunc
		timeout     time.Duration
	}{
		{
			name:     "path where violation occurrs in `RunScript` triggering an isolate termination",
			template: "(() => { const start = Date.now(); while (Date.now() - start < 2000) { continue; } })()",
			result:   nil,
			timeout:  1 * time.Second,
			err:      new(sberrors.QuotaError),
		},
		{
			name:     "happy path post isolate termination",
			template: "(() => { const start = Date.now(); while (Date.now() - start < 2000) { continue; } })()",
			result:   nil,
			timeout:  3 * time.Second,
		},
		{
			name:     "path where violation occurrs in promise resolution; no isolate termination",
			template: "new Promise((resolve) => { const start = Date.now(); while (Date.now() - start < 2000) { continue; }; return resolve(); })",
			result:   nil,
			timeout:  1 * time.Second,
			err:      new(sberrors.QuotaError),
		},
		{
			name:     "happy path with promise",
			template: "await new Promise((resolve) => { const start = Date.now(); while (Date.now() - start < 1000) { continue; }; return resolve(5); })",
			result:   int32(5),
			timeout:  2 * time.Second,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			args := validArgs(t)
			sandbox, engine := testEngine(t, args)
			defer sandbox.Close()
			defer engine.Close()

			ctx, cancel := context.WithTimeout(context.Background(), test.timeout)
			defer cancel()

			result, err := engine.Resolve(ctx, test.template, nil).Result()
			if test.err != nil {
				require.Equal(t, test.err.Error(), err.Error())
				require.IsType(t, test.err, err)
				return
			}

			require.NoError(t, err)
			require.Equal(t, test.result, result)
		})
	}
}

func TestResolve(t *testing.T) {
	t.Parallel()
	assert.NoError(t, PreCompileBundles())

	// set up an HTTP server to make fetch requests to
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json; utf-8")
		_, _ = w.Write([]byte(`{"status": true}`))
	}))

	for _, test := range []struct {
		name                string
		template            string
		result              any
		err                 error
		seed                map[string]any
		data                map[string]any
		variables           map[string]*transportv1.Variable
		stdout              string
		stderr              string
		resolveOptions      []pkgengine.ResolveOption
		bindingErrorOptions []sberrors.BindingErrorOption
	}{
		{
			name:                "VALIDATION invalid javascript",
			template:            "{{ frank_should_be_a_javascript_token }}",
			err:                 sberrors.BindingError(errors.New("Error on line 1:\\nReferenceError: frank_should_be_a_javascript_token is not defined")),
			bindingErrorOptions: []sberrors.BindingErrorOption{sberrors.WithLocation()},
		},
		{
			name:     "VALIDATION invalid javascript no binding error options",
			template: "{{ frank_should_be_a_javascript_token }}",
			err:      sberrors.BindingError(errors.New("ReferenceError: frank_should_be_a_javascript_token is not defined")),
		},
		{
			name:     "EMPTY binding",
			template: "{{ }}",
			result:   nil,
		},
		{
			name:     "BASIC boolean 1",
			template: "{{ true }}",
			result:   true,
		},
		{
			name:     "BASIC boolean 2",
			template: "{{ false }}",
			result:   false,
		},
		{
			name:     "BASIC number 1",
			template: "{{ 5 }}",
			result:   int32(5),
		},
		{
			name:     "BASIC number 2",
			template: "{{ 0 }}",
			result:   int32(0),
		},
		{
			name:     "BASIC number 3",
			template: "{{ -5 }}",
			result:   int32(-5),
		},
		{
			name:     "BASIC array 1",
			template: "{{[1, 2, 3]}}",
			result:   []string{"1", "2", "3"},
		},
		{
			name:     "BASIC array 2",
			template: "{{ [{one: 1}, {two: 2}, {three: 3}] }}",
			result:   []string{`{"one":1}`, `{"two":2}`, `{"three":3}`},
		},
		{
			name:     "BASIC array 3",
			template: "{{ (() => { let arr = []; arr.push(1); return arr })() }}",
			result:   []string{"1"},
		},
		{
			name:     "BASIC array of strings",
			template: "{{ ['one', 'two', 'three'] }}",
			result:   []string{"one", "two", "three"},
		},
		{
			name:     "BASIC array of strings and other",
			template: "{{ ['one', 2, { body: 'hello'} ] }}",
			result:   []string{"one", "2", "{\"body\":\"hello\"}"},
		},
		{
			name:     "BASIC array of undefined, null",
			template: "{{ [undefined, null] }}",
			result:   []string{"", ""},
		},
		{
			name:     "BASIC expression 1",
			template: "{{ (() => true && true)() }}",
			result:   true,
		},
		{
			name:     "BASIC expression 1",
			template: "{{ (() => 1 + 2 + 3 - 1)() }}",
			result:   int32(5),
		},
		{
			name:     "BASIC undefined",
			template: "{{ undefined }}",
			result:   nil,
		},
		{
			name:     "VARIABLES basic",
			template: "{{ await myVarOne.get() + ' ' + myVarTwo.value + myVarThree === 'HELLO WORLD!' }}",
			result:   true,
			variables: map[string]*transportv1.Variable{
				"myVarOne": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_ADVANCED,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
				"myVarTwo": {
					Key:  "REF.MY_VAR_TWO",
					Type: apiv1.Variables_TYPE_SIMPLE,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
				"myVarThree": {
					Key:  "REF.MY_VAR_THREE",
					Type: apiv1.Variables_TYPE_NATIVE,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE":   `"HELLO"`,
				"REF.MY_VAR_TWO":   `"WORLD"`,
				"REF.MY_VAR_THREE": `"!"`,
			},
		},
		{
			name:     "VARIABLES set",
			template: "{{ (async () => {await myVarOne.set(5); myVarTwo.set('FRANK'); myVarThree.set(undefined); return myVarTwo.value === 'FRANK'})() }}",
			result:   true,
			variables: map[string]*transportv1.Variable{
				"myVarOne": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_ADVANCED,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
				"myVarTwo": {
					Key:  "REF.MY_VAR_TWO",
					Type: apiv1.Variables_TYPE_SIMPLE,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
				"myVarThree": {
					Key:  "REF.MY_VAR_THREE",
					Type: apiv1.Variables_TYPE_SIMPLE,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE":   `"HELLO"`,
				"REF.MY_VAR_TWO":   `"WORLD"`,
				"REF.MY_VAR_THREE": `"asdf"`,
			},
			data: map[string]any{
				"REF.MY_VAR_ONE":   "5",
				"REF.MY_VAR_TWO":   `"FRANK"`,
				"REF.MY_VAR_THREE": "null",
			},
		},
		{
			name:     "VARIABLES no return",
			template: "{{ myVarTwo.set('FRANK') }}",
			result:   nil,
			variables: map[string]*transportv1.Variable{
				"myVarTwo": {
					Key:  "REF.MY_VAR_TWO",
					Type: apiv1.Variables_TYPE_SIMPLE,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_TWO": `"WORLD"`,
			},
			data: map[string]any{
				"REF.MY_VAR_TWO": `"FRANK"`,
			},
		},
		{
			name:                "VARIABLES set before throw",
			template:            "{{ (async () => {await myVarOne.set(5); myVarTwo.set('FRANK'); throw Error('Uh Oh!')})() }}",
			err:                 sberrors.BindingError(errors.New("Error on line 1:\\nError: Uh Oh!")),
			bindingErrorOptions: []sberrors.BindingErrorOption{sberrors.WithLocation()},
			variables: map[string]*transportv1.Variable{
				"myVarOne": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_ADVANCED,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
				"myVarTwo": {
					Key:  "REF.MY_VAR_TWO",
					Type: apiv1.Variables_TYPE_SIMPLE,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `"HELLO"`,
				"REF.MY_VAR_TWO": `"WORLD"`,
			},
			data: map[string]any{
				"REF.MY_VAR_ONE": "5",
				"REF.MY_VAR_TWO": `"FRANK"`,
			},
		},
		{
			name:     "ERROR variable not advanced",
			template: "{{ await myVarTwo.set(5) }}",
			result:   nil,
			variables: map[string]*transportv1.Variable{
				"myVarTwo": {
					Key:  "REF.MY_VAR_TWO",
					Type: apiv1.Variables_TYPE_SIMPLE,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `"HELLO"`,
				"REF.MY_VAR_TWO": `"WORLD"`,
			},
		},
		{
			name:     "VARIABLES readonly",
			template: "{{ myVarOne.set('FRANK') }}",
			result:   "FRANK",
			variables: map[string]*transportv1.Variable{
				"myVarOne": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_SIMPLE,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `"HELLO"`,
			},
			err:                 sberrors.BindingError(errors.New("Error on line 1:\\nTypeError: myVarOne.set is not a function")),
			bindingErrorOptions: []sberrors.BindingErrorOption{sberrors.WithLocation()},
		},
		{
			name:     "VARIABLES comprehensive",
			template: "{{ (await one.get()).foo.bar === 'car' && two.value.foo.bar === 'car' && three.foo.bar === 'car' && !two.set({ car: { bar: 'foo' }}) && !(await one.set({ car: { bar: 'foo' }})) }}",
			result:   true,
			variables: map[string]*transportv1.Variable{
				"one": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_ADVANCED,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
				"two": {
					Key:  "REF.MY_VAR_TWO",
					Type: apiv1.Variables_TYPE_SIMPLE,
					Mode: apiv1.Variables_MODE_READWRITE,
				},
				"three": {
					Key:  "REF.MY_VAR_THREE",
					Type: apiv1.Variables_TYPE_NATIVE,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE":   `{"foo":{"bar":"car"}}`,
				"REF.MY_VAR_TWO":   `{"foo":{"bar":"car"}}`,
				"REF.MY_VAR_THREE": `{"foo":{"bar":"car"}}`,
			},
			data: map[string]any{
				"REF.MY_VAR_ONE":   `{"car":{"bar":"foo"}}`,
				"REF.MY_VAR_TWO":   `{"car":{"bar":"foo"}}`,
				"REF.MY_VAR_THREE": `{"foo":{"bar":"car"}}`,
			},
		},
		{
			name:     "MODULE lodash 1",
			template: "{{ _.reduce([1, 2], (sum, n) => sum + n, 0) }}",
			result:   int32(3),
		},
		{
			name:     "UTILITY base64",
			template: "{{ btoa('Kirkland') + atob('S2lya2xhbmQ=') }}",
			result:   "S2lya2xhbmQ=Kirkland",
		},
		{
			name:     "UTILITY moment",
			template: "{{ (() => { const now = moment().seconds(); return now >= 0 && now < 60 })() }}",
			result:   true,
		},
		{
			name:     "UTILITY console.log",
			template: "console.log('Hello World!')",
			result:   nil,
			stdout:   "Hello World!\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.log object",
			template: "console.log({foo: 'bar'})",
			result:   nil,
			stdout:   `{"foo":"bar"}` + "\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.log 2 objects",
			template: "console.log({foo: 'bar'}, {baz: 'qux'})",
			result:   nil,
			stdout:   `{"foo":"bar"} {"baz":"qux"}` + "\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.log nested objects",
			template: "console.log({foo: {bar: 'baz'}, qux: 1.1})",
			result:   nil,
			stdout:   `{"foo":{"bar":"baz"},"qux":1.1}` + "\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.log object with function attributes",
			template: "console.log({foo: new Array(), bar: new Map()})",
			result:   nil,
			stdout:   `{"foo":[],"bar":{}}` + "\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.log functions",
			template: "console.log(new Array(), new Map())",
			result:   nil,
			stdout:   "[] {}\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.log with error",
			template: "console.log('Hello World!'); throw new Error('Exception raised');",
			result:   nil,
			stdout:   "Hello World!\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.error",
			template: "console.error('Hello World!')",
			result:   nil,
			stdout:   "",
			stderr:   "Hello World!\n",
		},
		{
			name:     "UTILITY console.error with error",
			template: "console.error('Hello World!'); throw new Error('Exception raised');",
			result:   nil,
			stdout:   "",
			stderr:   "Hello World!\n",
		},
		{
			name:     "UTILITY console.info",
			template: "console.info('Hello World!')",
			result:   nil,
			stdout:   "Hello World!\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.info with error",
			template: "console.info('Hello World!'); throw new Error('Exception raised');",
			result:   nil,
			stdout:   "Hello World!\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.debug",
			template: "console.debug('Hello World!')",
			result:   nil,
			stdout:   "Hello World!\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.debug with error",
			template: "console.debug('Hello World!'); throw new Error('Exception raised');",
			result:   nil,
			stdout:   "Hello World!\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.warn",
			template: "console.warn('Hello World!')",
			result:   nil,
			stdout:   "",
			stderr:   "Hello World!\n",
		},
		{
			name:     "UTILITY console.warn with error",
			template: "console.warn('Hello World!'); throw new Error('Exception raised');",
			result:   nil,
			stdout:   "",
			stderr:   "Hello World!\n",
		},
		{
			name:     "UTILITY console.dir with no params",
			template: "console.dir()",
			result:   nil,
			stdout:   "",
			stderr:   "",
		},

		{
			name:     "UTILITY console.dir with 1 param - string",
			template: "console.dir('foo')",
			result:   nil,
			stdout:   "foo\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.dir with 1 param - number",
			template: "console.dir(1.1)",
			result:   nil,
			stdout:   "1.1\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.dir with 1 param - boolean",
			template: "console.dir(true)",
			result:   nil,
			stdout:   "true\n",
			stderr:   "",
		},
		{
			name:     "UTILITY console.dir with 1 param - hydrated object",
			template: "console.dir({foo: 'bar', baz: 1})",
			result:   nil,
			stdout:   `{"foo":"bar","baz":1}` + "\n",
			stderr:   "",
		},
		{
			name:     "FETCH returns JSON",
			template: fmt.Sprintf("(async () => { try { return JSON.stringify(await (await fetch('%s')).json()); } catch (e) { console.error(e); } })()", srv.URL),
			result:   `{"status":true}`,
		},
		{
			name:     "VARIABLES filepicker readContents",
			template: "myPolyfill.files[0].readContents()",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContents mode raw",
			template: "myPolyfill.files[0].readContents('raw')",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContents mode binary",
			template: "myPolyfill.files[0].readContents('binary')",
			result:   "aGVsbG8gd29ybGQ=",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContents mode text",
			template: "myPolyfill.files[0].readContents('text')",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContents with undefined mode uses auto-detect",
			template: "myPolyfill.files[0].readContents(undefined)",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContents with extra parameters ignores them",
			template: "myPolyfill.files[0].readContents('text', 'foo', 'bar')",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContents with malformed mode uses auto-detect",
			template: "myPolyfill.files[0].readContents('foobar')",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
			stdout: "automatically detecting the mode since 'foobar' is not a valid mode ['binary', 'raw', 'text']",
		},
		{
			name:     "VARIABLES filepicker readContents getFileFunc returns error",
			template: "await myPolyfill.files[0].readContents()",
			result:   nil,
			err:      sberrors.BindingError(errors.New("foo")),
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return nil, errors.New("foo")
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContentsAsync",
			template: "await myPolyfill.files[0].readContentsAsync()",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContentsAsync with large file (5mb)",
			template: "await Promise.resolve(myPolyfill.files[0].readContentsAsync()).then(function(value) { return value; })",
			result:   strings.Repeat("a", 5*1024*1024), // 5MB of 'a's
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					largeFileContent := make([]byte, 5*1024*1024) // 5MB
					for i := range largeFileContent {
						largeFileContent[i] = 'a' // Filling with 'a's
					}
					return bytes.NewReader(largeFileContent), nil
				}),
			},
		},

		{
			name:     "VARIABLES filepicker readContentsAsync with mode raw",
			template: "await myPolyfill.files[0].readContentsAsync('raw')",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContentsAsync with mode binary",
			template: "await myPolyfill.files[0].readContentsAsync('binary')",
			result:   "aGVsbG8gd29ybGQ=",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContentsAsync with mode text",
			template: "await myPolyfill.files[0].readContentsAsync('text')",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContentsAsync with undefined mode uses auto-detect",
			template: "await myPolyfill.files[0].readContentsAsync(undefined)",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContentsAsync with extra parameters ignores them",
			template: "await myPolyfill.files[0].readContentsAsync('text', 'foo', 'bar')",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
		},
		{
			name:     "VARIABLES filepicker readContentsAsync with malformed mode uses auto-detect",
			template: "await myPolyfill.files[0].readContentsAsync('foobar')",
			result:   "hello world",
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return bytes.NewReader([]byte("hello world")), nil
				}),
			},
			stdout: "automatically detecting the mode since 'foobar' is not a valid mode ['binary', 'raw', 'text']",
		},
		{
			name:     "VARIABLES filepicker readContentsAsync getFileFunc returns error",
			template: "await myPolyfill.files[0].readContentsAsync()",
			result:   nil,
			err:      sberrors.BindingError(errors.New("foo")),
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
			resolveOptions: []pkgengine.ResolveOption{
				pkgengine.WithGetFileFunc(func(ctx context.Context, path string) (io.Reader, error) {
					return nil, errors.New("foo")
				}),
			},
		},
		{
			name:     "VARIABLES filepicker no file func given raises error",
			template: "await myPolyfill.files[0].readContentsAsync()",
			result:   nil,
			err:      sberrors.BindingError(errors.New("no function given to retrieve file")),
			variables: map[string]*transportv1.Variable{
				"myPolyfill": {
					Key:  "REF.MY_VAR_ONE",
					Type: apiv1.Variables_TYPE_FILEPICKER,
					Mode: apiv1.Variables_MODE_READ,
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `{"files":[{"path":"/foo/bar/"}]}`,
			},
		},
		{
			name:     "non-awaited promise",
			template: "typeof new Promise((resolve) => resolve(5)) === 'object'",
			result:   true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			args := validArgs(t)
			args.options.BindingErrorOptions = test.bindingErrorOptions
			ctx := context.Background()

			for k, v := range test.seed {
				require.NoError(t, args.options.Store.Write(ctx, store.Pair(k, v)))
			}

			variables := utils.NewMap[*transportv1.Variable]()
			if test.variables != nil {
				for k, v := range test.variables {
					variables.Put(k, v)
				}
			}

			sandbox, engine := testEngine(t, args)
			defer sandbox.Close()
			defer engine.Close()

			value := engine.Resolve(ctx, test.template, variables, test.resolveOptions...)

			result, err := value.Result()
			console := value.Console()

			require.NotNil(t, console)

			stdout, _ := io.ReadAll(console.Stdout)
			require.Equal(t, test.stdout, string(stdout))

			stderr, _ := io.ReadAll(console.Stderr)
			require.Equal(t, test.stderr, string(stderr))

			for k, v := range test.data {
				results, err := args.options.Store.Read(ctx, k)
				require.NoError(t, err)
				require.Len(t, results, 1)
				require.Equal(t, results[0], v)
			}

			if test.err != nil {
				require.Equal(t, test.err.Error(), err.Error())
				require.IsType(t, test.err, err)
				return
			}

			require.NoError(t, err)
			require.Equal(t, test.result, result)
		})
	}
}
