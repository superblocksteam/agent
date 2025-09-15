package utils

import (
	"fmt"
	"strings"
)

const (
	defaultSeparator      = ", "
	defaultEscapeSequence = "__SEPARATOR_ESCAPE__"

	noOpSeparator      = ", "
	noOpEscapeSequence = ", "
)

var (
	NoOpTokenJoiner = &TokenJoiner{
		separator:      noOpSeparator,
		escapeSequence: noOpEscapeSequence,
	}
)

type Option func(*options)

type options struct {
	separator      string
	escapeSequence string
}

func WithSeparator(separator string) Option {
	return func(t *options) {
		t.separator = separator
	}
}

func WithEscapeSequence(escapeSequence string) Option {
	return func(t *options) {
		t.escapeSequence = escapeSequence
	}
}

type TokenJoiner struct {
	separator      string
	escapeSequence string
}

func NewTokenJoiner(opts ...Option) (*TokenJoiner, error) {
	joinerOpts := &options{
		separator:      defaultSeparator,
		escapeSequence: defaultEscapeSequence,
	}

	for _, opt := range opts {
		opt(joinerOpts)
	}

	if strings.Contains(joinerOpts.separator, joinerOpts.escapeSequence) {
		return nil, fmt.Errorf("separator \"%s\" cannot contain \"%s\"", joinerOpts.separator, joinerOpts.escapeSequence)
	}

	return &TokenJoiner{
		separator:      joinerOpts.separator,
		escapeSequence: joinerOpts.escapeSequence,
	}, nil
}

func (t *TokenJoiner) Join(tokens []string) string {
	escapedTokens := make([]string, len(tokens))
	for i, token := range tokens {
		escapedTokens[i] = t.escapeSeparator(token)
	}

	return strings.Join(escapedTokens, t.separator)
}

func (t *TokenJoiner) Split(input string) []string {
	escapedTokens := strings.Split(input, t.separator)

	unescapedTokens := make([]string, len(escapedTokens))
	for i, token := range escapedTokens {
		unescapedTokens[i] = t.unescapeSeparator(token)
	}

	return unescapedTokens
}

func (t *TokenJoiner) escapeSeparator(input string) string {
	return strings.ReplaceAll(input, t.separator, t.escapeSequence)
}

func (t *TokenJoiner) unescapeSeparator(input string) string {
	return strings.ReplaceAll(input, t.escapeSequence, t.separator)
}
