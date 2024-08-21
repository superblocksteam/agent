package redis

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/go-redis/redismock/v9"
	redis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	storev1 "github.com/superblocksteam/agent/types/gen/go/store/v1"
	"google.golang.org/protobuf/proto"
)

func TestRead(t *testing.T) {

	for _, test := range []struct {
		name   string
		keys   []string
		mock   []any
		values []any
	}{
		{
			name:   "normal",
			keys:   []string{"key1", "key2"},
			mock:   []any{"value1", "value2"},
			values: []any{"value1", "value2"},
		},
		{
			name:   "nil",
			keys:   []string{"key1"},
			mock:   []any{redis.Nil},
			values: []any{nil},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := redismock.NewClientMock()
			defer db.Close()

			// NOTE(frank): This reads as, "assert that we are making this call and return this mock value."
			mock.ExpectMGet(test.keys...).SetVal(test.mock)

			values, err := New(db).Read(context.Background(), test.keys...)

			assert.NoError(t, err)
			assert.Equal(t, test.values, values)
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestWrite(t *testing.T) {
	for _, test := range []struct {
		name  string
		err   error
		pairs []*store.KV
		mock  func(mock redismock.ClientMock)
	}{
		{
			name:  "nothing",
			pairs: []*store.KV{},
			mock:  func(mock redismock.ClientMock) {},
		},
		{
			name: "normal",
			pairs: []*store.KV{
				{Key: "key1", Value: "value1"},
				{Key: "key2", Value: "value2"},
			},
			mock: func(mock redismock.ClientMock) {
				mock.ExpectTxPipeline()
				mock.ExpectSet("key1", "value1", 0).SetVal("OK")
				mock.ExpectSet("key2", "value2", 0).SetVal("OK")
				mock.ExpectTxPipelineExec()

			},
		},
		{
			name: "too big",
			pairs: []*store.KV{
				{Key: "key1", Value: strings.Repeat("a", 100), MaxSize: 1},
			},
			mock: func(mock redismock.ClientMock) {},
			err:  &sberrors.QuotaError{Msg: "value size (100) exceeds max size (1)"},
		},
		{
			name: "proto",
			pairs: []*store.KV{
				{Key: "key1", Value: &storev1.Pair{
					Key: "key",
				}},
			},
			mock: func(mock redismock.ClientMock) {
				mock.ExpectTxPipeline()
				mock.ExpectSet("key1", &utils.BinaryProtoWrapper[proto.Message]{
					Message: &storev1.Pair{
						Key: "key",
					},
				}, 0).SetVal("OK")
				mock.ExpectTxPipelineExec()

			},
		},
		{
			name: "exec fails",
			pairs: []*store.KV{
				{Key: "key1", Value: "value1"},
			},
			mock: func(mock redismock.ClientMock) {
				mock.ExpectTxPipeline()
				mock.ExpectSet("key1", "value1", 0).SetVal("OK")
				mock.ExpectTxPipelineExec().SetErr(errors.New("test error"))
			},
			err: errors.New("test error"),
		},
		{
			name: "set fails",
			pairs: []*store.KV{
				{Key: "key1", Value: "value1"},
			},
			mock: func(mock redismock.ClientMock) {
				mock.ExpectTxPipeline()
				mock.ExpectSet("key1", "value1", 0).SetErr(errors.New("test error"))
			},
			err: errors.New("test error"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := redismock.NewClientMock()
			defer db.Close()

			test.mock(mock)

			err := New(db).Write(context.Background(), test.pairs...)

			if test.err != nil {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestWriteDefaultTtl(t *testing.T) {
	db, mock := redismock.NewClientMock()
	defer db.Close()

	ttl := 2 * time.Second
	mock.ExpectTxPipeline()
	mock.ExpectSet("k1", "v1", ttl).SetVal("OK")
	mock.ExpectSet("k2", "v2", ttl*2).SetVal("OK")
	mock.ExpectTxPipelineExec()

	pairs := []*store.KV{
		{Key: "k1", Value: "v1"},
		{Key: "k2", Value: "v2", TTL: ttl * 2},
	}
	err := New(db, WithDefaultTtl(ttl)).Write(context.Background(), pairs...)
	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestDelete(t *testing.T) {

	for _, test := range []struct {
		name string
		keys []string
		mock func(mock redismock.ClientMock)
	}{
		{
			name: "nothing",
			mock: func(mock redismock.ClientMock) {},
		},
		{
			name: "normal",
			keys: []string{"key1", "key2"},
			mock: func(mock redismock.ClientMock) {
				mock.ExpectDel("key1", "key2").SetVal(2)
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := redismock.NewClientMock()
			defer db.Close()

			test.mock(mock)

			err := New(db).Delete(context.Background(), test.keys...)

			assert.NoError(t, err)
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestCopy(t *testing.T) {

	for _, test := range []struct {
		name        string
		source      string
		destination string
		err         error
		mock        func(mock redismock.ClientMock)
	}{
		{
			name:        "normal",
			source:      "key1",
			destination: "key2",
			mock: func(mock redismock.ClientMock) {
				mock.ExpectCopy("key1", "key2", 0, false).SetVal(1)
			},
		},
		{
			name:        "failed value",
			source:      "key1",
			destination: "key2",
			mock: func(mock redismock.ClientMock) {
				mock.ExpectCopy("key1", "key2", 0, false).SetVal(0)
			},
			err: errors.New("copy did not succeed: key1 -> key2"),
		},
		{
			name:        "failed copy",
			source:      "key1",
			destination: "key2",
			mock: func(mock redismock.ClientMock) {
				mock.ExpectCopy("key1", "key2", 0, false).SetErr(errors.New("test error"))
			},
			err: errors.New("test error"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := redismock.NewClientMock()
			defer db.Close()

			test.mock(mock)

			err := New(db).Copy(context.Background(), test.source, test.destination)

			if test.err != nil {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestExpire(t *testing.T) {

	for _, test := range []struct {
		name     string
		keys     []string
		duration time.Duration
		err      error
		mock     func(mock redismock.ClientMock)
	}{
		{
			name:     "normal",
			keys:     []string{"key1"},
			duration: time.Second,
			mock: func(mock redismock.ClientMock) {
				mock.ExpectExpire("key1", time.Second).SetVal(true)
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := redismock.NewClientMock()
			defer db.Close()

			test.mock(mock)

			err := New(db).Expire(context.Background(), test.duration, test.keys...)

			assert.NoError(t, err)
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestScan(t *testing.T) {

	for _, test := range []struct {
		name   string
		prefix string
		values []string
		err    error
		mock   func(mock redismock.ClientMock)
	}{
		{
			name:   "normal",
			prefix: "prefix",
			values: []string{"prefix1", "prefix2"},
			mock: func(mock redismock.ClientMock) {
				mock.ExpectScan(0, "prefix*", 500).SetVal([]string{"prefix1", "prefix2"}, 0)
			},
		},
		{
			name:   "failed",
			prefix: "prefix",
			values: []string{"prefix1", "prefix2"},
			mock: func(mock redismock.ClientMock) {
				mock.ExpectScan(0, "prefix*", 500).SetErr(errors.New("test error"))
			},
			err: errors.New("test error"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := redismock.NewClientMock()
			defer db.Close()

			test.mock(mock)

			values, err := New(db).Scan(context.Background(), test.prefix)

			if test.err != nil {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.values, values)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestDecr(t *testing.T) {

	for _, test := range []struct {
		name string
		key  string
		mock func(mock redismock.ClientMock)
	}{
		{
			name: "normal",
			key:  "key1",
			mock: func(mock redismock.ClientMock) {
				mock.ExpectDecr("key1").SetVal(1)
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := redismock.NewClientMock()
			defer db.Close()

			test.mock(mock)

			err := New(db).Decr(context.Background(), test.key)

			assert.NoError(t, err)
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}
