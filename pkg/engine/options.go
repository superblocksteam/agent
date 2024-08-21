package engine

import (
	utils "github.com/superblocksteam/agent/pkg/engine/javascript/utils"
)

type ResultOption func(*ResultConfig)

type ResultConfig struct {
	JSONEncodeArrayItems bool
	AsBoolean            bool
	Source               *string
}

func Apply(options ...ResultOption) ResultConfig {
	config := ResultConfig{}

	for _, option := range options {
		option(&config)
	}

	return config
}

// If we resolve without this option, then {{ ['a', 'b', 'c'] }} would result in .
// [a,b,c]. This is what we may want in some use cases. However, in other use cases,
// we may want ['a', 'b', 'c']. This option controls this rending behavior.
func WithJSONEncodeArrayItems() ResultOption {
	return func(config *ResultConfig) {
		config.JSONEncodeArrayItems = true
	}
}

func WithAsBoolean() ResultOption {
	return func(config *ResultConfig) {
		config.AsBoolean = true
	}
}

func WithResolved(source string) ResultOption {
	return func(config *ResultConfig) {
		config.Source = &source
	}
}

type ResolveOption func(*ResolveConfig)

type ResolveConfig struct {
	GetFileFunc utils.GetFileFunc
}

func ApplyResolve(options ...ResolveOption) ResolveConfig {
	config := ResolveConfig{}

	for _, option := range options {
		option(&config)
	}

	return config
}

func WithGetFileFunc(getFileFunc utils.GetFileFunc) ResolveOption {
	return func(config *ResolveConfig) {
		config.GetFileFunc = getFileFunc
	}
}
