package redis

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"time"

	"github.com/pkg/errors"
	redis "github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/protobuf/proto"

	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
)

type redisStore struct {
	client        *redis.Client
	config        config
	scanBatchSize int64
}

func New(client *redis.Client, opts ...Option) store.Store {
	rs := &redisStore{
		client:        client,
		config:        defaults,
		scanBatchSize: 500,
	}

	for _, o := range opts {
		o(&rs.config)
	}

	return rs
}

func (s *redisStore) Read(ctx context.Context, keys ...string) ([]any, error) {
	return tracer.Observe(ctx, "store.read", map[string]any{
		"store.keys": keys,
		"store.type": "redis",
	}, func(ctx context.Context, span trace.Span) ([]any, error) { return s.read(ctx, keys...) }, nil)
}

func (s *redisStore) Write(ctx context.Context, pairs ...*store.KV) error {
	var keys []string

	for _, pair := range pairs {
		keys = append(keys, pair.Key)

		if s.config.defaultTtl != emptyDuration && pair.TTL == emptyDuration {
			pair.TTL = s.config.defaultTtl
		}
	}

	_, err := tracer.Observe(ctx, "store.write", map[string]any{
		"store.type": "redis",
		"keys":       keys,
	}, func(ctx context.Context, span trace.Span) (any, error) { return nil, s.write(ctx, pairs...) }, nil)
	return err
}

func (s *redisStore) read(ctx context.Context, keys ...string) ([]any, error) {
	results, err := s.client.MGet(ctx, keys...).Result()

	for i := 0; i < len(results); i++ {
		if results[i] == redis.Nil {
			results[i] = nil
		}
	}

	return results, err
}

func (s *redisStore) write(ctx context.Context, pairs ...*store.KV) error {
	if len(pairs) < 1 {
		return nil
	}

	tx := s.client.TxPipeline()

	for _, pair := range pairs {
		data := pair.Value

		if protoData, ok := data.(proto.Message); ok {
			data = &utils.BinaryProtoWrapper[proto.Message]{
				Message: protoData,
			}
		}

		var size int64
		{
			if tmp, err := json.Marshal(pair.Value); err != nil {
				pair.MaxSize = 0
			} else {
				size = int64(binary.Size(tmp))
			}
		}

		if pair.MaxSize > 0 && size > pair.MaxSize {
			tx.Discard()
			return &sberrors.QuotaError{Msg: fmt.Sprintf("value size (%d) exceeds max size (%d)", size, pair.MaxSize)}
		}

		tx.Set(ctx, pair.Key, data, pair.TTL)
	}

	if _, err := tx.Exec(ctx); err != nil {
		return err
	}

	return nil
}

func (s *redisStore) Delete(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}

	return s.client.Del(ctx, keys...).Err()
}

func (s *redisStore) Copy(ctx context.Context, src string, dst string) error {
	copyRes := s.client.Copy(ctx, src, dst, s.client.Options().DB, false)
	if copyRes.Err() != nil {
		return copyRes.Err()
	}

	if copyRes.Val() == 0 {
		return errors.Wrap(sberrors.ErrInternal, fmt.Sprintf("copy did not succeed: %s -> %s", src, dst))
	}

	return nil
}

func (s *redisStore) Expire(ctx context.Context, duration time.Duration, keys ...string) error {
	_, err := s.client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		for _, key := range keys {
			pipe.Expire(ctx, key, duration)
		}

		return nil
	})

	return err
}

func (s *redisStore) Key(prefix, _ string) (string, error) {
	return store.Key(prefix, "")
}

func (s *redisStore) Decr(ctx context.Context, key string) error {
	return s.client.Decr(ctx, key).Err()
}

func (s *redisStore) Scan(ctx context.Context, prefix string) (arr []string, err error) {
	var cursor uint64
	{
		for {
			batch := []string{}

			batch, cursor, err = s.client.Scan(ctx, cursor, prefix+"*", s.scanBatchSize).Result()
			if err != nil {
				return nil, err
			}

			arr = append(arr, batch...)

			if cursor == 0 {
				break
			}
		}
	}

	return arr, nil
}
