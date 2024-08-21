package executor

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/superblocksteam/agent/pkg/utils"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

var (
	simpleModuleImportRegex     *regexp.Regexp
	allRequireStatementsRegex   *regexp.Regexp
	unsupportedNodeGlobalsRegex *regexp.Regexp
	unsupportedNodeGlobals      = []string{
		"AbortController",
		"Buffer",
		"clearImmediate",
		"clearInterval",
		"clearTimeout",
		"crypto",
		"DOMException",
		"Event",
		"EventTarget",
		"exports",
		"File",
		"FormData",
		"Headers",
		"MessageChannel",
		"MessageEvent",
		"MessagePort",
		"module",
		"Navigator",
		"navigator",
		"performance",
		"process",
		"queueMicrotask",
		"ReadableStream",
		"Response",
		"Request",
		"setImmediate",
		"setInterval",
		"setTimeout",
		"structuredClone",
		"TextDecoder",
		"TextDecoderStream",
		"TextEncoder",
		"TextEncoderStream",
		"TransformStream",
		"TransformStreamDefaultController",
		"URL",
		"URLSearchParams",
		"WebAssembly",
		"WebSocket",
		"WritableStream",
		"WritableStreamDefaultController",
		"WritableStreamDefaultWriter",
	}
)

func init() {
	compileRegex()
}

func compileRegex() {
	var err error
	nodeGlobalsPattern := fmt.Sprintf(`\b(%s)\b`, strings.Join(unsupportedNodeGlobals, "|"))
	unsupportedNodeGlobalsRegex, err = regexp.Compile(nodeGlobalsPattern)
	if err != nil {
		panic(err)
	}
	allRequireStatementsRegex, err = regexp.Compile(`\brequire\b`)
	if err != nil {
		panic(err)
	}
	simpleModuleImportRegex, err = regexp.Compile(`[^\.'"` + "`" + `][^\S\r\n]*\brequire\(\s*['"` + "`" + `](.+)['"` + "`" + `]\s*\)`)
	if err != nil {
		panic(err)
	}
}

func getImportedModules(config *structpb.Struct) (map[string]bool, error) {
	result := make(map[string]bool)
	errs := make([]error, 0)

	for _, value := range config.GetFields() {
		utils.FindStringsInStruct(value, func(str string) {
			if res, err := getImportedModulesInString(str); err != nil {
				errs = append(errs, err)
			} else {
				for k, v := range res {
					result[k] = v
				}
			}
		})
	}

	return result, errors.Join(errs...)
}

func getImportedModulesInString(code string) (map[string]bool, error) {
	result := make(map[string]bool)

	numImports := len(allRequireStatementsRegex.FindAllString(code, -1))
	if numImports == 0 {
		return result, nil
	}

	matches := simpleModuleImportRegex.FindAllStringSubmatch(code, -1)
	if len(matches) != numImports {
		return nil, fmt.Errorf("could not parse all module imports")
	}

	for _, match := range matches {
		module := strings.TrimSpace(match[1])
		result[module] = true
	}

	return result, nil
}

func containsUnsupportedNodeGlobal(config *structpb.Struct) (bool, error) {
	var compileError error
	containsUnsupportedNodeGlobal := false
	for _, value := range config.GetFields() {
		utils.FindStringsInStruct(value, func(str string) {
			contains, err := containsForbiddenNodeGlobal(str)
			if err != nil {
				compileError = err
			}
			if contains {
				containsUnsupportedNodeGlobal = true
			}
		})
	}

	return containsUnsupportedNodeGlobal, compileError
}

func containsForbiddenNodeGlobal(jsCode string) (bool, error) {
	return len(unsupportedNodeGlobalsRegex.FindStringIndex(jsCode)) != 0, nil
}

func canRouteToV8(actionConfig *structpb.Struct, v8SupportedModules map[string]bool, logger *zap.Logger) bool {
	importedModules, err := getImportedModules(actionConfig)
	if err != nil {
		logger.Info("failed to parse plugin code for imported modules", zap.Error(err))
		return false
	}

	for module := range importedModules {
		if !v8SupportedModules[module] {
			return false
		}
	}

	containsUnsupported, err := containsUnsupportedNodeGlobal(actionConfig)
	if err != nil {
		logger.Info("error checking for unsupported node globals", zap.Error(err))
		return false
	}
	if containsUnsupported {
		return false
	}

	return true
}
