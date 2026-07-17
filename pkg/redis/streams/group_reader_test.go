package streams

import (
	"context"
	"testing"
	"time"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

func setupGroupReaderTest(t *testing.T, streamKeys []string) (*miniredis.Miniredis, *GroupReader, *redis.Client) {
	t.Helper()

	mr, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	reader := NewGroupReader(client, GroupReaderConfig{
		Group:    "group1",
		Consumer: "worker1",
		Streams:  streamKeys,
	})

	ctx := context.Background()
	require.NoError(t, reader.EnsureConsumerGroups(ctx))

	t.Cleanup(func() {
		_ = client.Close()
		mr.Close()
	})

	return mr, reader, client
}

func addStreamMessage(t *testing.T, client *redis.Client, stream, field, value string) {
	t.Helper()
	_, err := client.XAdd(context.Background(), &redis.XAddArgs{
		Stream: stream,
		Values: map[string]any{field: value},
	}).Result()
	require.NoError(t, err)
}

func TestReadObserverInvoked(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	t.Cleanup(mr.Close)

	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = client.Close() })

	var observed ReadStats
	reader := NewGroupReader(client, GroupReaderConfig{
		Group:    "group1",
		Consumer: "worker1",
		Streams:  []string{"s1"},
		OnRead: func(stats ReadStats) {
			observed = stats
		},
	})
	require.NoError(t, reader.EnsureConsumerGroups(context.Background()))

	addStreamMessage(t, client, "s1", "data", "m1")
	_, _, err = reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Equal(t, int64(0), observed.FromCache)
	require.Equal(t, int64(0), observed.FromAutoClaim)
	require.Equal(t, int64(1), observed.FromXReadGroup)
}

func TestXReadGroupMaxCountSingleStream(t *testing.T) {
	_, reader, client := setupGroupReaderTest(t, []string{"s1"})
	addStreamMessage(t, client, "s1", "data", "m1")
	addStreamMessage(t, client, "s1", "data", "m2")

	streams, _, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 2,
		Block:    0,
	})
	require.NoError(t, err)
	require.Len(t, streams, 1)
	require.Len(t, streams[0].Messages, 2)
}

func TestXReadGroupMaxCountCapsAcrossStreams(t *testing.T) {
	_, reader, client := setupGroupReaderTest(t, []string{"s1", "s2"})
	addStreamMessage(t, client, "s1", "data", "a1")
	addStreamMessage(t, client, "s1", "data", "a2")
	addStreamMessage(t, client, "s2", "data", "b1")
	addStreamMessage(t, client, "s2", "data", "b2")

	streams, _, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 2,
		Block:    0,
	})
	require.NoError(t, err)

	total := 0
	for _, s := range streams {
		total += len(s.Messages)
	}
	require.Equal(t, 2, total, "must not exceed MaxCount across streams")
}

func TestXReadGroupMaxCountSweepDoesNotSkipStreams(t *testing.T) {
	_, reader, client := setupGroupReaderTest(t, []string{"s0", "s1", "s2"})
	addStreamMessage(t, client, "s0", "data", "m0")
	addStreamMessage(t, client, "s1", "data", "m1")
	addStreamMessage(t, client, "s2", "data", "m2")

	streams, _, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 2,
		Block:    0,
	})
	require.NoError(t, err)
	require.Len(t, streams, 2)
	require.Equal(t, "s0", streams[0].Stream)
	require.Equal(t, "s1", streams[1].Stream)

	// Cursor advanced past s1; next read should come from s2.
	streams, _, err = reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Len(t, streams, 1)
	require.Equal(t, "s2", streams[0].Stream)
}

func TestXReadGroupMaxCountRoundRobinCursor(t *testing.T) {
	_, reader, client := setupGroupReaderTest(t, []string{"s1", "s2"})

	streams, _, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Empty(t, streams)

	addStreamMessage(t, client, "s1", "data", "only-s1")
	streams, _, err = reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Len(t, streams, 1)
	require.Equal(t, "s1", streams[0].Stream)

	addStreamMessage(t, client, "s2", "data", "only-s2")
	streams, _, err = reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Len(t, streams, 1)
	require.Equal(t, "s2", streams[0].Stream, "cursor should rotate to s2 after s1 delivered")
}

func TestXReadGroupMaxCountBlocksOnAnyStream(t *testing.T) {
	_, reader, client := setupGroupReaderTest(t, []string{"s1", "s2"})

	var gotStreams []redis.XStream
	var gotErr error
	done := make(chan struct{})
	go func() {
		defer close(done)
		gotStreams, _, gotErr = reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
			MaxCount: 1,
			Block:    2 * time.Second,
		})
	}()

	time.Sleep(100 * time.Millisecond)
	addStreamMessage(t, client, "s2", "data", "blocked")

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("read did not complete after message arrived on non-cursor stream")
	}

	require.NoError(t, gotErr)
	require.Len(t, gotStreams, 1)
	require.Equal(t, "s2", gotStreams[0].Stream)
}

func TestXReadGroupMaxCountBlocksOnCursorStream(t *testing.T) {
	_, reader, client := setupGroupReaderTest(t, []string{"s1", "s2"})

	var gotStreams []redis.XStream
	var gotErr error
	done := make(chan struct{})
	go func() {
		defer close(done)
		gotStreams, _, gotErr = reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
			MaxCount: 1,
			Block:    2 * time.Second,
		})
	}()

	time.Sleep(100 * time.Millisecond)
	addStreamMessage(t, client, "s1", "data", "blocked")

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("read did not complete after message arrived on cursor stream")
	}

	require.NoError(t, gotErr)
	require.Len(t, gotStreams, 1)
	require.Equal(t, "s1", gotStreams[0].Stream)
}

func TestEnsureConsumerGroupsIdempotent(t *testing.T) {
	_, reader, _ := setupGroupReaderTest(t, []string{"s1"})
	require.NoError(t, reader.EnsureConsumerGroups(context.Background()))
}

func TestAck(t *testing.T) {
	_, reader, client := setupGroupReaderTest(t, []string{"s1"})
	addStreamMessage(t, client, "s1", "data", "payload")

	streams, _, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Len(t, streams[0].Messages, 1)

	msgID := streams[0].Messages[0].ID
	alreadyAcked, err := reader.Ack(context.Background(), "s1", msgID)
	require.NoError(t, err)
	require.False(t, alreadyAcked)

	alreadyAcked, err = reader.Ack(context.Background(), "s1", msgID)
	require.NoError(t, err)
	require.True(t, alreadyAcked)

	pending, err := client.XPending(context.Background(), "s1", "group1").Result()
	require.NoError(t, err)
	require.EqualValues(t, 0, pending.Count)
}

func TestXReadGroupMaxCountOverflowCachedForNextPoll(t *testing.T) {
	_, reader, client := setupGroupReaderTest(t, []string{"s1", "s2", "s3"})
	addStreamMessage(t, client, "s1", "data", "a")
	addStreamMessage(t, client, "s2", "data", "b")
	addStreamMessage(t, client, "s3", "data", "c")

	streams, _, err := reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Equal(t, 1, messageCount(streams))

	streams, _, err = reader.XReadGroupMaxCount(context.Background(), XReadGroupMaxCountArgs{
		MaxCount: 1,
		Block:    0,
	})
	require.NoError(t, err)
	require.Equal(t, 1, messageCount(streams))
}

func TestXReadGroupMaxCountAutoClaimsIdlePending(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	streams := []string{"s1"}
	minIdle := time.Second

	staleWorker := NewGroupReader(client, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "stale-worker",
		Streams:          streams,
		AutoClaimMinIdle: minIdle,
	})
	reader := NewGroupReader(client, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "worker1",
		Streams:          streams,
		AutoClaimMinIdle: minIdle,
	})

	ctx := context.Background()
	require.NoError(t, staleWorker.EnsureConsumerGroups(ctx))

	addStreamMessage(t, client, "s1", "data", "stale")

	staleRead, _, err := staleWorker.XReadGroupMaxCount(ctx, XReadGroupMaxCountArgs{MaxCount: 1, Block: 0})
	require.NoError(t, err)
	require.Equal(t, 1, messageCount(staleRead))

	mr.SetTime(time.Now().Add(2 * minIdle))

	reclaimed, _, err := reader.XReadGroupMaxCount(ctx, XReadGroupMaxCountArgs{MaxCount: 1, Block: 0})
	require.NoError(t, err)
	require.Equal(t, 1, messageCount(reclaimed))
	require.Equal(t, staleRead[0].Messages[0].ID, reclaimed[0].Messages[0].ID)

	t.Cleanup(func() {
		_ = client.Close()
		mr.Close()
	})
}

func TestRaceAutoclaimBeforeDeliverSkipsAlreadyAcked(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	streams := []string{"s1", "s2"}
	minIdle := time.Second

	worker1 := NewGroupReader(client, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "worker1",
		Streams:          streams,
		AutoClaimMinIdle: minIdle,
	})
	worker2 := NewGroupReader(client, GroupReaderConfig{
		Group:            "group1",
		Consumer:         "worker2",
		Streams:          streams,
		AutoClaimMinIdle: minIdle,
	})

	ctx := context.Background()
	require.NoError(t, worker1.EnsureConsumerGroups(ctx))

	addStreamMessage(t, client, "s1", "data", "m1")
	addStreamMessage(t, client, "s2", "data", "m2")

	first, _, err := worker1.XReadGroupMaxCount(ctx, XReadGroupMaxCountArgs{MaxCount: 1, Block: 0})
	require.NoError(t, err)
	require.Equal(t, 1, messageCount(first))

	firstStream := first[0].Stream
	firstID := first[0].Messages[0].ID
	alreadyAcked, err := worker1.Ack(ctx, firstStream, firstID)
	require.NoError(t, err)
	require.False(t, alreadyAcked)

	mr.SetTime(time.Now().Add(2 * minIdle))

	reclaimed, _, err := worker2.XReadGroupMaxCount(ctx, XReadGroupMaxCountArgs{MaxCount: 1, Block: 0})
	require.NoError(t, err)
	require.Equal(t, 1, messageCount(reclaimed))

	reclaimedStream := reclaimed[0].Stream
	reclaimedID := reclaimed[0].Messages[0].ID

	alreadyAcked, err = worker2.Ack(ctx, reclaimedStream, reclaimedID)
	require.NoError(t, err)
	require.False(t, alreadyAcked)

	cached, _, err := worker1.XReadGroupMaxCount(ctx, XReadGroupMaxCountArgs{MaxCount: 1, Block: 0})
	require.NoError(t, err)
	require.Equal(t, 1, messageCount(cached))
	require.Equal(t, reclaimedID, cached[0].Messages[0].ID)

	alreadyAcked, err = worker1.Ack(ctx, reclaimedStream, reclaimedID)
	require.NoError(t, err)
	require.True(t, alreadyAcked, "cached delivery must detect message already acked by another worker")

	t.Cleanup(func() {
		_ = client.Close()
		mr.Close()
	})
}

func messageCount(streams []redis.XStream) int {
	total := 0
	for _, stream := range streams {
		total += len(stream.Messages)
	}
	return total
}
