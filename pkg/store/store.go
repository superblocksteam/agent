package store

import (
	"context"
	"time"

	"github.com/superblocksteam/agent/pkg/utils"
)

type KV struct {
	Key     string
	Value   any
	TTL     time.Duration
	MaxSize int64
}

func Pair(key string, value any) *KV {
	return &KV{
		Key:   key,
		Value: value,
	}
}

func PairWithID(value any) (*KV, error) {
	uuid, err := utils.UUID()
	if err != nil {
		return nil, err
	}

	return &KV{
		Key:   uuid,
		Value: value,
	}, nil
}

//go:generate mockery --name=Store --output ./mock --filename store.go --outpkg mock --structname Store
type Store interface {
	Read(context.Context, ...string) ([]any, error)
	Write(context.Context, ...*KV) error
	Delete(context.Context, ...string) error
	Expire(context.Context, time.Duration, ...string) error
	Decr(context.Context, string) error
	Copy(context.Context, string, string) error
	Scan(context.Context, string) ([]string, error)

	KeyGeneration
}

type KeyGeneration interface {
	// NOTE(frank): This is used so we can have determinism in tests.
	// I don't like it in this interface. Explore other options
	Key(string, string) (string, error)
}
