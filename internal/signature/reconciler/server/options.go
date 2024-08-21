package server

var defaults = options{
	batchSize: 200,
}

type options struct {
	batchSize int32
}

type Option func(o *options)

func WithBatchSize(size int32) Option {
	return func(o *options) {
		o.batchSize = size
	}
}
