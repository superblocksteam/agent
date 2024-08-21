package options

type Options struct {
	Stream                    chan<- string
	ApiTimeoutErrorPrecedence bool
	ApiTimeoutError           error
}

type Option func(*Options)

func Apply(options ...Option) *Options {
	ops := new(Options)

	for _, op := range options {
		op(ops)
	}

	return ops
}

func Receive(ch chan<- string) Option {
	return func(o *Options) {
		o.Stream = ch
	}
}

func ApiTimeoutErrorPrecedence(b bool, err error) Option {
	return func(o *Options) {
		o.ApiTimeoutErrorPrecedence = b
		o.ApiTimeoutError = err
	}
}
