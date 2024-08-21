package javascript

import (
	"strings"

	"github.com/superblocksteam/agent/pkg/engine/javascript/bundles"
	"github.com/superblocksteam/agent/pkg/utils"
	"rogchap.com/v8go"
	v8 "rogchap.com/v8go"
)

type _cached struct {
	data   *v8go.CompilerCachedData
	file   string
	bundle string
}

var cache = utils.NewMap[_cached]()

func PreCompileBundles() error {
	iso := v8go.NewIsolate()
	defer iso.Dispose()

	v8ctx := v8go.NewContext(iso)
	defer v8ctx.Close()

	for file, props := range map[string]struct {
		trigger string
		bundle  string
	}{
		"lodash.js": {"_.", bundles.Lodash}, // NOTE(frank): There's an edge case `const lodash = _; _.concat;`. We're going to live with this for now.
		"momen.js":  {"moment", bundles.Moment},
	} {
		script, err := iso.CompileUnboundScript(props.bundle, file, v8go.CompileOptions{})
		if err != nil {
			return err
		}

		// NOTE(frank): I don't know if this has to be run. The repo exmaple does it so I'm doing it.
		if _, err := script.Run(v8ctx); err != nil {
			return err
		}

		cache.Put(props.trigger, _cached{
			data:   script.CreateCodeCache(),
			file:   file,
			bundle: props.bundle,
		})
	}

	return nil
}

func LoadBundles(v8ctx *v8go.Context, code string) error {
	iter := cache.Iterator()
	for iter.HasNext() {
		trigger, props := iter.Next()
		if !strings.Contains(code, trigger) {
			continue
		}

		script, err := v8ctx.Isolate().CompileUnboundScript(props.bundle, props.file, v8.CompileOptions{CachedData: props.data})
		if err != nil {
			return err
		}

		if _, err := script.Run(v8ctx); err != nil {
			return err
		}
	}

	return nil
}
