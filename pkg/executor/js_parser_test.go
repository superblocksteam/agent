package executor

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestJsImportParser_GetImportedModules(t *testing.T) {
	t.Parallel()

	nestedStruct, _ := structpb.NewStruct(map[string]interface{}{
		"code": "var _ = require('lodash')\nconsole.log(_.Trim('hello world'))",
		"steps": []interface{}{
			"console.log('Hello World')",
			"var moment = require('moment')\nconsole.log(moment().format('YYYY-MM-DD'))",
			map[string]interface{}{
				"code": "var api = require('lib')\nconsole.log(api.flushResults())",
			},
		},
		"config": map[string]interface{}{
			"UploadStep": "var axios = require('axios')\nconsole.log(axios({{Step1.url}}))",
		},
	})

	testCases := []struct {
		name         string
		actionConfig *structpb.Struct
		expected     map[string]bool
	}{
		{
			name:         "Nil struct returns empty map",
			actionConfig: nil,
			expected:     map[string]bool{},
		},
		{
			name:         "Empty struct returns empty map",
			actionConfig: &structpb.Struct{},
			expected:     map[string]bool{},
		},
		{
			name: "Struct with empty fields returns empty map",
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{},
			},
			expected: map[string]bool{},
		},
		{
			name: "Struct with nil field values returns empty map",
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"config": nil,
					"body": {
						Kind: &structpb.Value_NullValue{},
					},
				},
			},
			expected: map[string]bool{},
		},
		{
			name:         "Traverses nested structs and lists",
			actionConfig: nestedStruct,
			expected: map[string]bool{
				"lodash": true,
				"axios":  true,
				"moment": true,
				"lib":    true,
			},
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			modulesFound, err := getImportedModules(testCase.actionConfig)

			assert.Equal(t, testCase.expected, modulesFound)
			assert.NoError(t, err)
		})
	}
}

func TestJsImportParser_GetImportedModules_ReturnsError(t *testing.T) {
	t.Parallel()

	nestedStruct, _ := structpb.NewStruct(map[string]interface{}{
		"code": "var _ = require(lodash')\nconsole.log(_.Trim('hello world'))",
		"steps": []interface{}{
			"console.log('Hello World, we require(d) help!!!')",
			"var moment = require('moment')\nconsole.log(moment().format('YYYY-MM-DD'))",
			map[string]interface{}{
				"code": "var api = require(getlib())\nconsole.log(api.flushResults())",
			},
		},
	})

	testCases := []struct {
		name            string
		actionConfig    *structpb.Struct
		expectedNumErrs int
	}{
		{
			name:            "Returns all errors from traversing nested structs and lists",
			actionConfig:    nestedStruct,
			expectedNumErrs: 3,
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			_, err := getImportedModules(testCase.actionConfig)

			assert.Error(t, err)

			errs, ok := err.(interface{ Unwrap() []error })
			assert.True(t, ok, "error does not implement Unwrap() []error")
			assert.Len(t, errs.Unwrap(), testCase.expectedNumErrs)
		})
	}
}

func TestJsImportParser_GetImportedModulesInString_Matches(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name     string
		code     string
		expected map[string]bool
	}{
		{
			name:     "Empty code returns empty map",
			code:     "",
			expected: map[string]bool{},
		},
		{
			name: "Function calls ending in require",
			code: `
				console.log("Modules can be imported in many ways, including:");
				const result = multirequire('lodash', 'moment', 'axios')
				console.log(result)`,
			expected: map[string]bool{},
		},
		{
			name: "Match standard require statements",
			code: `
				var _ = require('lodash')
				var moment = require("moment")

				/* Javascript Step */
				var axios = require('axios')
				const result = axios({{Step1.url}})
				console.log(_.Trim(result) + moment().format('YYYY-MM-DD')))`,
			expected: map[string]bool{
				"lodash": true,
				"moment": true,
				"axios":  true,
			},
		},
		{
			name: "Match standard require statements with backticks",
			code: "var moment = require(`moment`)\n\nconsole.log(moment.now())",
			expected: map[string]bool{
				"moment": true,
			},
		},
		{
			name: "Match multiline require statement",
			code: `
				var AWS = require(
					
					
					'aws-sdk'				);

				return new AWS.S3();`,
			expected: map[string]bool{
				"aws-sdk": true,
			},
		},
		{
			name: "Match dynamic string require statement",
			code: `
				var AWS = require(
					'aws' + '-sdk'
				);

				return new AWS.S3();`,
			expected: map[string]bool{
				"aws' + '-sdk": true,
			},
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			retModules, err := getImportedModulesInString(testCase.code)

			assert.Equal(t, testCase.expected, retModules)
			assert.NoError(t, err)
		})
	}
}

func TestJsImportParser_GetImportedModulesInString_DoesNotMatch(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name string
		code string
	}{
		{
			name: "Require statement with no string (replaced with function call)",
			code: `
				var _ = require(getModuleName())
				console.log(_.Trim({{Step1.output}}))`,
		},
		{
			name: "Invoking another modules require function",
			code: `
				const result = {{Step1.list}}.map(item => const parser = module.require('parser'); parser.parse(item))
				console.log(result)`,
		},
		{
			name: "Reassigning require function to another variable",
			code: `
				const import = require;

				for (const module of {{Step1.list}}) {
					const mod = import('local-' + module + '-module');
					mod.doSomething();
				}
				return;`,
		},
		{
			name: "Require keyword outside the context of loading modules",
			code: `
				// Use require to load the module into the global scope
				const fs = require('fs');

				fs.readFile({{Step1.filename}}, callback);
				return;`,
		},
		{
			name: "Quoted require statements",
			code: `
				console.log("Modules can be imported in many ways, including:");
				console.log("var _ = " + "require('lodash')');
				console.log(result)`,
		},
		{
			name: "Backtick quoted require statements",
			code: "console.log(`var _ = ` + `require('lodash')`)",
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			_, err := getImportedModulesInString(testCase.code)

			assert.EqualError(t, err, "could not parse all module imports")
		})
	}
}

func TestNodeGlobalParser_ContainsForbiddenNodeGlobal(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name             string
		jsCode           string
		expectedResponse bool
	}{
		{
			name:             "Empty string returns false",
			jsCode:           "",
			expectedResponse: false,
		},
		{
			name:             "String without forbidden strings returns false",
			jsCode:           "baz",
			expectedResponse: false,
		},
		{
			name:             "String with forbidden strings returns true",
			jsCode:           "WritableStream",
			expectedResponse: true,
		},
		{
			name:             "String with forbidden strings within other string returns false",
			jsCode:           "xWritableStreamx",
			expectedResponse: false,
		},
		{
			name:             "String with forbidden strings in different case returns false",
			jsCode:           "writablestream",
			expectedResponse: false,
		},
		{
			name:             "String with forbidden strings as an empty function call return true",
			jsCode:           "WritableStream()",
			expectedResponse: true,
		},
		{
			name:             "String with forbidden strings as a non-empty function call return true",
			jsCode:           "WritableStream(baz, qux)",
			expectedResponse: true,
		},
		{
			name:             "String with forbidden strings as a dot call return true",
			jsCode:           "WritableStream.baz",
			expectedResponse: true,
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			resp, err := containsForbiddenNodeGlobal(testCase.jsCode)

			assert.Nil(t, err)
			assert.Equal(t, testCase.expectedResponse, resp)
		})
	}
}

func TestNodeGlobalParser_TestSpecificNodeGlobals(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name             string
		nodeGlobals      []string
		expectedResponse bool
	}{
		{
			name:             "Ensure all unsupported node globals are flagged",
			nodeGlobals:      unsupportedNodeGlobals,
			expectedResponse: true,
		},
		{
			name:             "Ensure non-node globals are not flagged",
			nodeGlobals:      []string{"foo", "bar"},
			expectedResponse: false,
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			for _, unsupportedGlobal := range testCase.nodeGlobals {
				respRaw, err := containsForbiddenNodeGlobal(unsupportedGlobal)
				assert.Nil(t, err)
				respEmptyCall, err := containsForbiddenNodeGlobal(fmt.Sprintf(unsupportedGlobal, "()"))
				assert.Nil(t, err)
				respParamCall, err := containsForbiddenNodeGlobal(fmt.Sprintf(unsupportedGlobal, "(foo, bar)"))
				assert.Nil(t, err)
				respDotNotation, err := containsForbiddenNodeGlobal(fmt.Sprintf(unsupportedGlobal, ".foo"))
				assert.Nil(t, err)
				assert.Equal(t, testCase.expectedResponse, respRaw)
				assert.Equal(t, testCase.expectedResponse, respEmptyCall)
				assert.Equal(t, testCase.expectedResponse, respParamCall)
				assert.Equal(t, testCase.expectedResponse, respDotNotation)
			}
		})
	}
}

func TestNodeGlobalParser_ContainsUnsupportedNodeGlobal(t *testing.T) {
	t.Parallel()

	nestedStructWithoutGlobals, _ := structpb.NewStruct(map[string]interface{}{
		"code": "console.log('hello world')",
		"steps": []interface{}{
			"console.log('Hello World')",
			"console.log('foo')",
			map[string]interface{}{
				"code": "console.log('baz')",
			},
		},
		"config": map[string]interface{}{
			"UploadStep": "console.log('bar')",
		},
	})

	nestedStructWithGlobals, _ := structpb.NewStruct(map[string]interface{}{
		"code": "const foo = new WritableStream();",
		"steps": []interface{}{
			"console.log('Hello World')",
			"console.log('foo')",
			map[string]interface{}{
				"code": "console.log('baz')",
			},
		},
		"config": map[string]interface{}{
			"UploadStep": "console.log('bar')",
		},
	})

	testCases := []struct {
		name             string
		actionConfig     *structpb.Struct
		expectedResponse bool
	}{
		{
			name:             "nil config returns false",
			actionConfig:     nil,
			expectedResponse: false,
		},
		{
			name:             "empty config returns false",
			actionConfig:     &structpb.Struct{},
			expectedResponse: false,
		},
		{
			name: "config with empty fields returns false",
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{},
			},
			expectedResponse: false,
		},
		{
			name: "config with nil field values returns false",
			actionConfig: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"config": nil,
					"body": {
						Kind: &structpb.Value_NullValue{},
					},
				},
			},
			expectedResponse: false,
		},
		{
			name:             "Traverses nested structs and lists",
			actionConfig:     nestedStructWithoutGlobals,
			expectedResponse: false,
		},
		{
			name:             "config with unsupported global raises true",
			actionConfig:     nestedStructWithGlobals,
			expectedResponse: true,
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			resp, _ := containsUnsupportedNodeGlobal(testCase.actionConfig)

			assert.Equal(t, testCase.expectedResponse, resp)
		})
	}
}
