package legacyexpression

import (
	"errors"
	"strings"

	"github.com/superblocksteam/agent/pkg/template/plugins"
)

type expressionWrappers struct {
	openingTag string
	closingTag string
}

type expressionType int32

const (
	expressionTypeUnknown expressionType = iota
	temlateLiteral
	iife
)

type legacyExpression struct {
	input   string
	scanned bool
	value   string
	start   int
	pos     int
}

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
	return &legacyExpression{
		input: input.GetData(),
	}
}

func (le *legacyExpression) Scan() bool {
	if le.scanned {
		le.value = ""
		return false
	}

	trimmedInput := strings.TrimSpace(le.input)
	whitespaceOffset := strings.Index(le.input, trimmedInput)

	// If the input is an IIFE, we can just return the input as is
	if strings.HasPrefix(trimmedInput, wrappers[iife].openingTag) && strings.HasSuffix(trimmedInput, wrappers[iife].closingTag) {
		le.scanned = true
		le.value = le.input
		le.start = 0
		le.pos = len(le.input)
		return true
	}

	// If the input is not wrapped in backticks, then it's not an expression and we can skip it
	if !strings.HasPrefix(trimmedInput, wrappers[temlateLiteral].openingTag) || !strings.HasSuffix(trimmedInput, wrappers[temlateLiteral].closingTag) {
		le.scanned = true
		le.value = ""
		le.start = 0
		le.pos = len(le.input)
		return false
	}

	// The input is a template literal, and we want to extract the outer most ${} expressions (these are the expressions
	// that will be wrapped with legacy binding syntax)
	literal := trimmedInput[1 : len(trimmedInput)-1]

	// Adjust the current `le.pos` to match the same character in the trimmed literal string
	var literalStartIndex int
	{
		// If the current position is less than the start of the template literal
		// set the index to the beginning of the template literal
		if le.pos < (whitespaceOffset + 1) {
			literalStartIndex = 0
		} else {
			literalStartIndex = le.pos - whitespaceOffset - 1 // -1 for the backtick
		}
	}
	for i := literalStartIndex; (i + 1) < len(literal); i++ {
		if literal[i:i+2] == "${" {
			bracketCount := 1
			for j := i + 2; j < len(literal); j++ {
				switch literal[j] {
				case '{':
					bracketCount++
				case '}':
					bracketCount--
				}

				if bracketCount == 0 {
					// Set start and pos such that start is the index of the opening '${' and pos is the index after the closing '}'
					// so that `le.input[le.start:le.pos]` is the value of the expression e.g. '${<expression>}'

					le.start = whitespaceOffset + 1 + i   // +1 for the backtick
					le.pos = whitespaceOffset + 1 + j + 1 // +1 for the backtick, +1 to include closing '}'
					le.value = le.input[le.start:le.pos]

					return true
				}
			}
		}
	}

	le.scanned = true
	le.pos = len(le.input)
	le.value = ""
	return false
}

func (le *legacyExpression) Text() string {
	return le.input
}

func (le *legacyExpression) Value() string {
	return le.value
}

func (le *legacyExpression) Render(processed []string) (string, error) {
	if le.Scan() {
		return "", errors.New("render can only be invoked after a full scan")
	}

	// Reset internal state
	le.scanned = false
	le.start = 0
	le.pos = 0
	le.value = ""

	result := strings.Builder{}
	idx := 0
	prevStart := le.start

	for le.Scan() {
		result.WriteString(le.input[prevStart:le.start])

		if idx < len(processed) {
			result.WriteString(processed[idx])
		}

		idx++
		prevStart = le.pos
	}

	if prevStart < len(le.input) {
		result.WriteString(le.input[prevStart:])
	}

	// Remove backticks from the final result if the result is wrapped in them
	return trimBackticks(result.String()), nil
}

func trimBackticks(input string) string {
	result := input
	trimmed := strings.TrimSpace(input)

	if !strings.HasPrefix(trimmed, wrappers[temlateLiteral].openingTag) || !strings.HasSuffix(trimmed, wrappers[temlateLiteral].closingTag) {
		return result
	}

	buf := strings.Builder{}

	openingTagIndex := strings.Index(input, wrappers[temlateLiteral].openingTag)
	closingTagIndex := strings.LastIndex(input, wrappers[temlateLiteral].closingTag)

	// If the opening and closing tags are the same, then we don't need to trim them
	if openingTagIndex == closingTagIndex {
		return result
	}

	closingTagLen := len(wrappers[temlateLiteral].closingTag)

	templateLiteralTags := wrappers[temlateLiteral].openingTag + wrappers[temlateLiteral].closingTag

	buf.WriteString(input[0:openingTagIndex])
	buf.WriteString(strings.Trim(trimmed, templateLiteralTags))
	buf.WriteString(input[closingTagIndex+closingTagLen:])

	return buf.String()
}
