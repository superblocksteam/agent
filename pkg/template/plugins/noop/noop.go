package noop

import (
	"errors"

	"github.com/superblocksteam/agent/pkg/template/plugins"
)

var (
	Instance = func(input string) plugins.Plugin {
		return Plugin(input)
	}
)

type noop struct {
	input   string
	scanned bool
}

func Plugin(input string) plugins.Plugin {
	return &noop{
		input: input,
	}
}

func (n *noop) Scan() bool {
	if n.scanned {
		return false
	}

	n.scanned = true
	return true
}

func (n *noop) Text() string {
	return n.input
}

func (n *noop) Value() string {
	return n.input
}

func (n *noop) Render(processed []string) (string, error) {
	// This is a noop plugin, so we don't need to render anything.
	// We just return the first processed value.
	if len(processed) == 0 {
		return "", errors.New("noop plugin does not support empty processed values")
	}

	if len(processed) > 1 {
		return "", errors.New("noop plugin does not support multiple processed values")
	}

	return processed[0], nil
}
