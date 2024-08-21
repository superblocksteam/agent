package store

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/superblocksteam/agent/pkg/utils"
)

type ttl[T any] struct {
	expired time.Time
	value   T
}

type mockStore struct {
	data utils.Map[ttl[any]]
	key  func(string, string) (string, error)
}

func Memory() Store {
	return Mock(Key)
}

func Mock(key func(string, string) (string, error)) Store {
	return &mockStore{
		data: utils.NewMap[ttl[any]](),
		key:  key,
	}
}

func (store *mockStore) Read(ctx context.Context, keys ...string) ([]any, error) {
	if len(keys) == 0 {
		return nil, nil
	}

	results := make([]any, len(keys))

	for i := 0; i < len(keys); i++ {
		val, ok := store.data.Get(keys[i])
		if !ok {
			results[i] = nil
			continue
		}

		if !val.expired.IsZero() && val.expired.Before(time.Now()) {
			store.data.Del(keys[i])
			results[i] = nil
			continue
		}

		results[i] = val.value
	}

	return results, nil
}

func (store *mockStore) Write(ctx context.Context, pairs ...*KV) error {
	if len(pairs) == 0 {
		return nil
	}

	for _, pair := range pairs {
		var item ttl[any]
		{
			if pair.TTL == 0 {
				item = ttl[any]{
					value: pair.Value,
				}
			} else {
				item = ttl[any]{
					expired: time.Now().Add(pair.TTL),
					value:   pair.Value,
				}
			}
		}

		store.data.Put(pair.Key, item)
	}

	return nil
}

func (store *mockStore) Delete(ctx context.Context, keys ...string) error {
	for _, key := range keys {
		store.data.Del(key)
	}

	return nil
}

func (store *mockStore) Copy(ctx context.Context, src string, dest string) error {
	results, err := store.Read(ctx, src)
	if err != nil {
		return err
	}

	if len(results) == 0 {
		return errors.New("source key not found")
	}

	return store.Write(ctx, Pair(dest, results[0]))
}

func (store *mockStore) Expire(ctx context.Context, duration time.Duration, keys ...string) error {
	for _, key := range keys {
		val, ok := store.data.Get(key)
		if !ok {
			continue
		}

		val.expired = time.Now().Add(duration)
		store.data.Put(key, val)
	}

	return nil
}

func (store *mockStore) Key(prefix, value string) (string, error) {
	return store.key(prefix, value)
}

// NOTE(frank): This should be atomic.
func (store *mockStore) Decr(ctx context.Context, key string) error {
	val, ok := store.data.Get(key)
	if !ok {
		return errors.New("key not found")
	}

	number, ok := val.value.(int)
	if !ok {
		return errors.New("value is not a number")
	}

	val.value = number - 1
	store.data.Put(key, val)

	return nil
}

func (store *mockStore) Scan(ctx context.Context, prefix string) ([]string, error) {
	var arr []string
	{
		for _, key := range store.data.Keys().Contents() {
			if strings.HasPrefix(key, prefix) {
				arr = append(arr, key)
			}
		}
	}

	return arr, nil
}
