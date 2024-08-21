package pool

import (
	"go.uber.org/zap"
)

type Returnable[T any] interface {
	Return() chan T
}

type Handler[T Returnable[K], K any] func(T) K

func RoundTrip[T Returnable[K], K any](source <-chan T, handler Handler[T, K], options ...Option) error {
	config, err := config(options...)
	if err != nil {
		return err
	}

	for i := 0; i < config.size; i++ {
		go func() {
			for item := range source {
				if ch := item.Return(); ch != nil {
					ch <- handler(item)
				}
			}
		}()
	}

	return nil
}

func OneWay[T any](source chan T, handler func(T), options ...Option) error {
	config, err := config(options...)
	if err != nil {
		return err
	}

	for i := 0; i < config.size; i++ {
		go func() {
			for item := range source {
				handler(item)
			}
		}()
	}

	return nil
}

func config(options ...Option) (*Options, error) {
	// These are the default options.
	defaultSize := 4
	defaultLogger := zap.NewNop()

	// Apply the options. This may override the defaults.
	config := apply(append([]Option{Size(defaultSize), Logger(defaultLogger)}, options...)...)

	// Validate the options.
	if err := config.Validate(); err != nil {
		return nil, err
	}

	return config, nil
}
