// Package expression implements the expression plugin for the template engine.
// It supports the following types of expressions:
// - Template literals: `<expression>`
// - IIFE: (() => <expression>)()
//
// The expression plugin will return true for the Scan method if the input is a valid expression, false otherwise.
package expression

import (
	"errors"
	"strings"

	"github.com/superblocksteam/agent/pkg/template/plugins"
)

type expressionWrappers struct {
	openingTag string
	closingTag string
}

type expression struct {
	input   string
	scanned bool
	value   string
}

type expressionType int32

const (
	expressionTypeUnknown expressionType = iota
	temlateLiteral
	iife
)

var (
	Instance = func(input *plugins.Input) plugins.Plugin {
		return Plugin(input)
	}

	wrappers = map[expressionType]*expressionWrappers{
		temlateLiteral: {
			openingTag: "`",
			closingTag: "`",
		},
		iife: {
			openingTag: "(() =>",
			closingTag: ")()",
		},
	}
)

func Plugin(input *plugins.Input) plugins.Plugin {
	return &expression{
		input: input.GetData(),
	}
}

func (e *expression) Scan() bool {
	if e.scanned {
		return false
	}

	e.scanned = true
	trimmedInput := strings.TrimSpace(e.input)

	for _, w := range wrappers {
		if strings.HasPrefix(trimmedInput, w.openingTag) && strings.HasSuffix(trimmedInput, w.closingTag) {
			e.value = e.input
			return true
		}
	}

	return false
}

func (e *expression) Text() string {
	return e.input
}

func (e *expression) Value() string {
	return e.value
}

func (e *expression) Render(processed []string) (string, error) {
	if len(processed) == 0 {
		return "", errors.New("expression plugin does not support empty processed values")
	}

	if len(processed) > 1 {
		return "", errors.New("expression plugin does not support multiple processed values")
	}

	return processed[0], nil
}
