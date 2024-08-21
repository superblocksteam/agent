package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetStringMapString(t *testing.T) {
	for _, test := range []struct {
		name     string
		viper    map[string]string
		env      string
		expected map[string]string
		err      bool
	}{
		{
			name:     "viper with no env",
			viper:    map[string]string{"foo": "bar"},
			env:      "",
			expected: map[string]string{"foo": "bar"},
		},
		{
			name:     "viper with env",
			viper:    map[string]string{"foo": "bar"},
			env:      "bar=foo",
			expected: map[string]string{"foo": "bar"},
		},
		{
			name:     "viper with env",
			env:      "bar=foo=",
			expected: map[string]string{"bar": "foo="},
		},
		{
			name: "viper with env",
			env:  "bar=",
			err:  true,
		},
		{
			name:     "env",
			env:      "bar=foo",
			expected: map[string]string{"bar": "foo"},
		},
		{
			name:     "nothing",
			env:      "",
			expected: nil,
		},
		{
			name:     "malformed",
			env:      "bar:foo",
			expected: nil,
			err:      true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			actual, err := GetStringMapString(test.viper, test.env)

			if test.err {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)
			assert.Equal(t, test.expected, actual)
		})
	}
}
