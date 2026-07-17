package streams

import (
	"context"
	"errors"
	"testing"
	"time"

	miniredis "github.com/alicebob/miniredis/v2"
	redismock "github.com/go-redis/redismock/v9"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

// sequentialOnlyClient implements GroupRedisClient without Pipeline(), forcing autoClaimSequential.
type sequentialOnlyClient struct {
	c *redis.Client
}

func (s *sequentialOnlyClient) XGroupCreateMkStream(ctx context.Context, stream, group, start string) *redis.StatusCmd {
	return s.c.XGroupCreateMkStream(ctx, stream, group, start)
}

func (s *sequentialOnlyClient) XAutoClaim(ctx context.Context, a *redis.XAutoClaimArgs) *redis.XAutoClaimCmd {
	return s.c.XAutoClaim(ctx, a)
}

func (s *sequentialOnlyClient) XReadGroup(ctx context.Context, a *redis.XReadGroupArgs) *redis.XStreamSliceCmd {
	return s.c.XReadGroup(ctx, a)
}

func (s *sequentialOnlyClient) XAck(ctx context.Context, stream, group string, ids ...string) *redis.IntCmd {
	return s.c.XAck(ctx, stream, group, ids...)
}

func TestXReadGroupMaxCountRejectsInvalidMaxCount(t *testing.T) {
	_, reader, _ := setupGroupReaderTest(t, []string{"s1"})

	_, _, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 0,
		Block:    0,
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), "MaxCount must be >= 1")
}

func TestXReadGroupMaxCountEmptyStreams(t *testing.T) {
	client := redis.NewClient(&redis.Options{Addr: "127.0.0.1:1"})
	t.Cleanup(func() { _ = client.Close() })

	reader := NewGroupReader(client, GroupReaderConfig{
		Group:    "group1",
		Consumer: "worker1",
		Streams:  nil,
	})

	streams, stats, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Nil(t, streams)
	require.Equal(t, ReadStats{}, stats)
}

func TestStreamsReturnsCopy(t *testing.T) {
	_, reader, _ := setupGroupReaderTest(t, []string{"s1", "s2"})

	got := reader.Streams()
	require.Equal(t, []string{"s1", "s2"}, got)
	got[0] = "mutated"
	require.Equal(t, []string{"s1", "s2"}, reader.Streams())
}

func TestEnsureConsumerGroupsReturnsError(t *testing.T) {
	client, mock := redismock.NewClientMock()
	t.Cleanup(func() { _ = client.Close() })

	mock.ExpectXGroupCreateMkStream("s1", "group1", "0").SetErr(errors.New("redis down"))

	reader := NewGroupReader(client, GroupReaderConfig{
		Group:    "group1",
		Consumer: "worker1",
		Streams:  []string{"s1"},
	})
	err := reader.EnsureConsumerGroups(context.Background())
	require.Error(t, err)
	require.Contains(t, err.Error(), "redis down")
}

func TestAckReturnsError(t *testing.T) {
	client, mock := redismock.NewClientMock()
	t.Cleanup(func() { _ = client.Close() })

	mock.ExpectXAck("s1", "group1", "1-0").SetErr(errors.New("ack failed"))

	reader := NewGroupReader(client, GroupReaderConfig{
		Group:    "group1",
		Consumer: "worker1",
		Streams:  []string{"s1"},
	})
	alreadyAcked, err := reader.Ack(context.Background(), "s1", "1-0")
	require.Error(t, err)
	require.False(t, alreadyAcked)
}

func TestReadObserverReportsCacheSource(t *testing.T) {
	_, reader, client := setupGroupReaderTest(t, []string{"s1", "s2"})
	addStreamMessage(t, client, "s1", "data", "a")
	addStreamMessage(t, client, "s2", "data", "b")

	_, _, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)

	var observed ReadStats
	reader.onRead = func(stats ReadStats) {
		observed = stats
	}

	streams, stats, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Equal(t, 1, messageCount(streams))
	require.Equal(t, int64(1), stats.FromCache)
	require.Equal(t, int64(0), stats.FromAutoClaim)
	require.Equal(t, int64(0), stats.FromXReadGroup)
	require.Equal(t, int64(1), observed.FromCache)
}

func TestReadObserverReportsAutoClaimSource(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = client.Close(); mr.Close() })

	minIdle := time.Second
	staleWorker := NewGroupReader(client, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "stale",
		Streams:          []string{"s1"},
		AutoClaimMinIdle: minIdle,
	})
	var observed ReadStats
	reader := NewGroupReader(client, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "worker1",
		Streams:          []string{"s1"},
		AutoClaimMinIdle: minIdle,
		OnRead: func(stats ReadStats) {
			observed = stats
		},
	})

	ctx := context.Background()
	require.NoError(t, staleWorker.EnsureConsumerGroups(ctx))
	addStreamMessage(t, client, "s1", "data", "stale")

	_, _, err = staleWorker.XReadGroupMaxCount(ctx, XReadGroupMaxCountArgs{MaxCount: 1, Block: 0})
	require.NoError(t, err)

	mr.SetTime(time.Now().Add(2 * minIdle))

	_, stats, err := reader.XReadGroupMaxCount(ctx, XReadGroupMaxCountArgs{MaxCount: 1, Block: 0})
	require.NoError(t, err)
	require.Equal(t, int64(1), stats.FromAutoClaim)
	require.Equal(t, int64(0), stats.FromCache)
	require.Equal(t, int64(0), stats.FromXReadGroup)
	require.Equal(t, int64(1), observed.FromAutoClaim)
}

func TestAutoClaimSequentialReclaimsIdlePending(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = client.Close(); mr.Close() })

	minIdle := time.Second
	staleWorker := NewGroupReader(client, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "stale",
		Streams:          []string{"s1"},
		AutoClaimMinIdle: minIdle,
	})
	reader := NewGroupReader(&sequentialOnlyClient{c: client}, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "worker1",
		Streams:          []string{"s1"},
		AutoClaimMinIdle: minIdle,
	})

	ctx := context.Background()
	require.NoError(t, staleWorker.EnsureConsumerGroups(ctx))
	addStreamMessage(t, client, "s1", "data", "stale")

	_, _, err = staleWorker.XReadGroupMaxCount(ctx, XReadGroupMaxCountArgs{MaxCount: 1, Block: 0})
	require.NoError(t, err)

	mr.SetTime(time.Now().Add(2 * minIdle))

	claimed, err := reader.autoClaimSequential(ctx, []string{"s1"}, 1)
	require.NoError(t, err)
	require.Len(t, claimed, 1)
	require.Len(t, claimed[0].Messages, 1)
}

func TestPipelineAutoClaimFallsBackToSequential(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = client.Close(); mr.Close() })

	minIdle := time.Second
	staleWorker := NewGroupReader(client, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "stale",
		Streams:          []string{"s1"},
		AutoClaimMinIdle: minIdle,
	})
	reader := NewGroupReader(&sequentialOnlyClient{c: client}, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "worker1",
		Streams:          []string{"s1"},
		AutoClaimMinIdle: minIdle,
	})

	ctx := context.Background()
	require.NoError(t, staleWorker.EnsureConsumerGroups(ctx))
	addStreamMessage(t, client, "s1", "data", "stale")

	_, _, err = staleWorker.XReadGroupMaxCount(ctx, XReadGroupMaxCountArgs{MaxCount: 1, Block: 0})
	require.NoError(t, err)

	mr.SetTime(time.Now().Add(2 * minIdle))

	claimed, err := reader.pipelineAutoClaim(ctx, []string{"s1"}, 1)
	require.NoError(t, err)
	require.Len(t, claimed, 1)
	require.Len(t, claimed[0].Messages, 1)
}

func TestXReadGroupMaxCountPartialErrorAfterCacheDelivery(t *testing.T) {
	client, mock := redismock.NewClientMock()
	t.Cleanup(func() { _ = client.Close() })

	reader := NewGroupReader(&sequentialOnlyClient{c: client}, GroupReaderConfig{
		Group:    "group1",
		Consumer: "worker1",
		Streams:  []string{"s1", "s2"},
	})

	// Seed overflow cache (one cached message on s2).
	reader.mu.Lock()
	reader.cache = []cachedMessage{
		{stream: "s2", msg: redis.XMessage{ID: "2-0", Values: map[string]any{"data": "cached"}}},
	}
	reader.mu.Unlock()

	var observed ReadStats
	reader.onRead = func(stats ReadStats) {
		observed = stats
	}

	mock.ExpectXAutoClaim(&redis.XAutoClaimArgs{
		Stream: "s1", Group: "group1", Consumer: "worker1",
		MinIdle: defaultAutoClaimMinIdle, Start: "0-0", Count: 1,
	}).SetErr(errors.New("autoclaim unavailable"))

	streams, stats, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 2,
		Block:    0,
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), "autoclaim:")
	require.Equal(t, 1, messageCount(streams))
	require.Equal(t, "s2", streams[0].Stream)
	require.Equal(t, int64(1), stats.FromCache)
	require.Equal(t, int64(1), observed.FromCache)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestXReadGroupMaxCountOverflowCachesRemainderOnSingleStream(t *testing.T) {
	client, mock := redismock.NewClientMock()
	t.Cleanup(func() { _ = client.Close() })

	reader := NewGroupReader(client, GroupReaderConfig{
		Group:    "group1",
		Consumer: "worker1",
		Streams:  []string{"s1"},
	})

	mock.ExpectXAutoClaim(&redis.XAutoClaimArgs{
		Stream: "s1", Group: "group1", Consumer: "worker1",
		MinIdle: defaultAutoClaimMinIdle, Start: "0-0", Count: 2,
	}).SetVal([]redis.XMessage{}, "0-0")
	mock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams: []string{"s1", ">"}, Group: "group1", Consumer: "worker1",
		Count: 2, Block: -1,
	}).SetVal([]redis.XStream{{
		Stream: "s1",
		Messages: []redis.XMessage{
			{ID: "1-0", Values: map[string]any{"data": "a"}},
			{ID: "1-1", Values: map[string]any{"data": "b"}},
			{ID: "1-2", Values: map[string]any{"data": "c"}},
		},
	}})

	streams, stats, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 2,
		Block:    0,
	})
	require.NoError(t, err)
	require.Equal(t, 2, messageCount(streams))
	require.Equal(t, int64(1), stats.CacheSize)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestXReadGroupMaxCountPartialErrorAfterAutoClaimDelivery(t *testing.T) {
	client, mock := redismock.NewClientMock()
	t.Cleanup(func() { _ = client.Close() })

	reader := NewGroupReader(&sequentialOnlyClient{c: client}, GroupReaderConfig{
		Group:    "group1",
		Consumer: "worker1",
		Streams:  []string{"s1"},
	})

	mock.ExpectXAutoClaim(&redis.XAutoClaimArgs{
		Stream: "s1", Group: "group1", Consumer: "worker1",
		MinIdle: defaultAutoClaimMinIdle, Start: "0-0", Count: 3,
	}).SetVal([]redis.XMessage{
		{ID: "1-0", Values: map[string]any{"data": "claimed-a"}},
		{ID: "1-1", Values: map[string]any{"data": "claimed-b"}},
	}, "0-0")

	mock.ExpectXReadGroup(&redis.XReadGroupArgs{
		Streams:  []string{"s1", ">"},
		Group:    "group1",
		Consumer: "worker1",
		Count:    1,
		Block:    -1,
	}).SetErr(errors.New("xreadgroup unavailable"))

	streams, stats, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 3,
		Block:    0,
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), "xreadgroup:")
	require.Equal(t, 2, messageCount(streams))
	require.Equal(t, int64(2), stats.FromAutoClaim)
	require.Equal(t, int64(0), stats.FromXReadGroup)
	require.NoError(t, mock.ExpectationsWereMet())
}
