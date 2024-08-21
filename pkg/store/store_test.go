package store

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestPairWithID(t *testing.T) {
	for _, test := range []struct {
		name  string
		value any
	}{
		{
			name:  "happy path",
			value: "frank",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			pair, err := PairWithID(test.value)
			assert.NoError(t, err)
			assert.NotNil(t, pair)
			assert.NotEmpty(t, pair.Key)
			assert.Equal(t, test.value, pair.Value)
		})
	}
}

func TestPair(t *testing.T) {
	for _, test := range []struct {
		name  string
		key   string
		value any
	}{
		{
			name:  "happy path",
			value: "frank",
			key:   "joey",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			pair := Pair(test.key, test.value)
			assert.NotNil(t, pair)
			assert.Equal(t, test.key, pair.Key)
			assert.Equal(t, test.value, pair.Value)
		})
	}
}
