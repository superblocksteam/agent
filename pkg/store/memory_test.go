package store

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestRead(t *testing.T) {
	for _, test := range []struct {
		name   string
		seed   map[string]ttl[any]
		keys   []string
		values []any
	}{
		{
			name:   "no keys",
			seed:   map[string]ttl[any]{},
			keys:   nil,
			values: nil,
		},
		{
			name:   "they all exist",
			seed:   map[string]ttl[any]{"foo": {value: "bar"}},
			keys:   []string{"foo"},
			values: []any{"bar"},
		},
		{
			name:   "some exist",
			seed:   map[string]ttl[any]{"foo": {value: "bar"}},
			keys:   []string{"foo", "bar"},
			values: []any{"bar", nil},
		},
		{
			name:   "expired",
			seed:   map[string]ttl[any]{"foo": {value: "bar"}, "expired": {expired: time.Now().Add(-1 * time.Hour), value: "hi"}},
			keys:   []string{"foo", "bar"},
			values: []any{"bar", nil},
		},
	} {
		store := Memory()

		for k, v := range test.seed {
			store.(*mockStore).data.Put(k, v)
		}

		result, err := store.Read(context.Background(), test.keys...)
		assert.NoError(t, err, test.name)
		assert.Equal(t, result, test.values, test.name)
	}
}

func TestWrite(t *testing.T) {
	for _, test := range []struct {
		name  string
		data  map[string]ttl[any]
		pairs []*KV
	}{
		{
			name:  "no pairs",
			data:  map[string]ttl[any]{},
			pairs: nil,
		},
		{
			name: "some pairs",
			data: map[string]ttl[any]{"foo": {value: "bar"}, "frank": {value: 28}},
			pairs: []*KV{
				{Key: "foo", Value: "bar"},
				{Key: "frank", Value: 28},
			},
		},
		{
			name: "nil values",
			data: map[string]ttl[any]{"foo": {value: "bar"}, "frank": {value: nil}},
			pairs: []*KV{
				{Key: "foo", Value: "bar"},
				{Key: "frank", Value: nil},
			},
		},
	} {
		store := Memory()
		assert.NoError(t, store.Write(context.Background(), test.pairs...), test.name)
		assert.Equal(t, test.data, store.(*mockStore).data.ToGoMap(), test.name)
	}
}

func TestDelete(t *testing.T) {
	for _, test := range []struct {
		name string
		seed map[string]any
		keys []string
	}{
		{
			name: "does not exist",
			seed: map[string]any{},
			keys: []string{"foo"},
		},
		{
			name: "does exist",
			seed: map[string]any{"foo": "bar"},
			keys: []string{"foo"},
		},
		{
			name: "multiple",
			seed: map[string]any{"foo": "bar", "frank": "greco"},
			keys: []string{"foo", "frank", "absent"},
		},
		{
			name: "nil key",
			seed: map[string]any{"foo": "bar"},
			keys: nil,
		},
	} {
		store := Memory()
		assert.NoError(t, store.Delete(context.Background(), test.keys...), test.name)

		for _, key := range test.keys {
			_, ok := store.(*mockStore).data.Get(key)
			assert.False(t, ok, test.name)
		}
	}
}
