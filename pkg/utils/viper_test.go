package utils

import (
	"testing"

	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
)

func TestGetStringSlice(t *testing.T) {
	for _, test := range []struct {
		name     string
		raw      []string
		expected []string
	}{
		{
			name:     "already split values are preserved",
			raw:      []string{"a", "b", "c"},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "comma-separated string is split",
			raw:      []string{"a,b,c"},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "mixed split and unsplit",
			raw:      []string{"a,b", "c"},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "whitespace is trimmed",
			raw:      []string{" a , b , c "},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "empty strings are filtered",
			raw:      []string{"a,,b", "", "c"},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "empty input returns nil",
			raw:      []string{},
			expected: nil,
		},
		{
			name:     "single value",
			raw:      []string{"only"},
			expected: []string{"only"},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			key := "test.stringslice." + test.name
			viper.Set(key, test.raw)
			actual := GetStringSlice(key)
			assert.Equal(t, test.expected, actual)
		})
	}
}

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
