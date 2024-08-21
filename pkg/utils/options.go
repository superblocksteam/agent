package utils

import "errors"

func ApplyOptions[T any](options ...func(*T) error) (out *T, err error) {
	out = new(T)

	for _, op := range options {
		err = errors.Join(err, op(out))
	}

	return
}
