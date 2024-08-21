package utils

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestApplyOptions(t *testing.T) {
	t.Parallel()

	type options struct {
		foo string
	}

	for _, test := range []struct {
		name    string
		options []func(*options) error
		applied *options
		err     bool
	}{
		{
			name: "no errors",
			options: []func(*options) error{
				func(o *options) error {
					o.foo = "foo"
					return nil
				},
			},
			applied: &options{
				foo: "foo",
			},
			err: false,
		},
		{
			name: "with errors",
			options: []func(*options) error{
				func(o *options) error {
					return errors.New("uh oh")
				},
			},
			applied: &options{},
			err:     true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			applied, err := ApplyOptions(test.options...)

			assert.Equal(t, test.err, err != nil)
			assert.Equal(t, test.applied, applied)
		})
	}
}
