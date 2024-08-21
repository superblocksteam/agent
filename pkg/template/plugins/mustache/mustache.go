package mustache

import (
	"bytes"
	"errors"
	"strings"

	"github.com/superblocksteam/agent/pkg/template/plugins"
)

var (
	Instance = func(input string) plugins.Plugin {
		return Plugin(input)
	}
)

type mustache struct {
	input string
	start int
	pos   int
	value string
}

const (
	open  = "{{"
	close = "}}"
)

func Plugin(input string) plugins.Plugin {
	return &mustache{
		input: input,
	}
}

// NOTE(frank): ChatGPT wrote this code. I'm serious.
func (s *mustache) Scan() bool {
	if s.pos >= len(s.input) {
		return false
	}

	startIndex := strings.Index(s.input[s.pos:], open)
	if startIndex == -1 {
		return false
	}

	startIndex += s.pos
	endIndex := strings.Index(s.input[startIndex+2:], close)
	if endIndex == -1 {
		return false
	}

	endIndex += startIndex + 2
	s.start = startIndex
	s.value = s.input[startIndex+2 : endIndex]
	s.pos = endIndex
	return true
}

func (s *mustache) Text() string {
	return s.input[s.start : s.pos+2]
}

func (s *mustache) Value() string {
	return s.value
}

// NOTE(frank): The library `github.com/cbroglie/mustache` is an option. However,
// we'd need to fork it as it doesn't handle simple things like whitespace between
// the open/close tokens and the text.
func (s *mustache) Render(processed []string) (string, error) {
	if s.Scan() {
		return "", errors.New("render can only be invoked after a full scan")
	}

	// reset
	s.start = 0
	s.pos = 0
	s.value = ""

	// this will keep track of the result
	buf := bytes.Buffer{}
	idx := 0
	prevStart := s.start

	for s.Scan() {
		buf.WriteString(s.input[prevStart:s.start])

		if len(processed) > idx {
			buf.WriteString(processed[idx])
		}

		idx++
		prevStart = s.pos + 2
	}

	if prevStart < len(s.input) {
		buf.WriteString(s.input[prevStart:])
	}

	return buf.String(), nil
}
