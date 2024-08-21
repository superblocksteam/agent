package errors

type BindingErrorOptions struct {
	includeLocation bool
}

type BindingErrorOption func(*BindingErrorOptions)

func Apply(options ...BindingErrorOption) *BindingErrorOptions {
	config := &BindingErrorOptions{}

	for _, option := range options {
		option(config)
	}

	return config
}

func WithLocation() BindingErrorOption {
	return func(config *BindingErrorOptions) {
		config.includeLocation = true
	}
}
