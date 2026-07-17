package streams

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/superblocksteam/agent/pkg/utils"
)

const defaultAutoClaimMinIdle = 2 * time.Second

var errBusyGroupExists = errors.New("BUSYGROUP Consumer Group name already exists")

// GroupRedisClient is the Redis surface GroupReader uses.
type GroupRedisClient interface {
	XGroupCreateMkStream(ctx context.Context, stream, group, start string) *redis.StatusCmd
	XAutoClaim(ctx context.Context, a *redis.XAutoClaimArgs) *redis.XAutoClaimCmd
	XReadGroup(ctx context.Context, a *redis.XReadGroupArgs) *redis.XStreamSliceCmd
	XAck(ctx context.Context, stream, group string, ids ...string) *redis.IntCmd
}

// GroupReaderConfig configures a consumer-group reader over a fixed stream set.
type GroupReaderConfig struct {
	Group            string
	Consumer         string
	Streams          []string
	AutoClaimMinIdle time.Duration
	OnRead           ReadObserver
}

// XReadGroupMaxCountArgs enforces a cumulative message cap across streams (Redis COUNT is per-stream).
type XReadGroupMaxCountArgs struct {
	MaxCount int64
	Block    time.Duration
	NoAck    bool
}

// ReadStats reports how many messages were delivered from each read path on one poll.
type ReadStats struct {
	FromCache      int64
	FromAutoClaim  int64
	FromXReadGroup int64
	CacheSize      int64
}

// ReadObserver is invoked after each XReadGroupMaxCount poll with delivery stats (nil is a no-op).
type ReadObserver func(stats ReadStats)

type GroupReader struct {
	client           GroupRedisClient
	group            string
	consumer         string
	streams          []string // immutable after NewGroupReader
	autoClaimMinIdle time.Duration
	onRead           ReadObserver
	cursor           int
	cache            []cachedMessage
	mu               sync.RWMutex // protects cursor and cache only
}

type cachedMessage struct {
	stream string
	msg    redis.XMessage
}

func NewGroupReader(client GroupRedisClient, cfg GroupReaderConfig) *GroupReader {
	streams := make([]string, len(cfg.Streams))
	copy(streams, cfg.Streams)

	minIdle := cfg.AutoClaimMinIdle
	if minIdle <= 0 {
		minIdle = defaultAutoClaimMinIdle
	}

	onRead := cfg.OnRead
	if onRead == nil {
		onRead = func(stats ReadStats) {}
	}

	return &GroupReader{
		client:           client,
		group:            cfg.Group,
		consumer:         cfg.Consumer,
		streams:          streams,
		autoClaimMinIdle: minIdle,
		onRead:           onRead,
	}
}

func (r *GroupReader) finishRead(results []redis.XStream, stats ReadStats, err error) ([]redis.XStream, ReadStats, error) {
	r.onRead(stats)
	return results, stats, err
}

func (r *GroupReader) Streams() []string {
	out := make([]string, len(r.streams))
	copy(out, r.streams)
	return out
}

func (r *GroupReader) EnsureConsumerGroups(ctx context.Context) error {
	for _, stream := range r.streams {
		_, err := r.client.XGroupCreateMkStream(ctx, stream, r.group, "0").Result()
		if err == nil {
			continue
		}
		if isBusyGroupError(err) {
			continue
		}
		return fmt.Errorf("create consumer group on stream %q: %w", stream, err)
	}
	return nil
}

func (r *GroupReader) XReadGroupMaxCount(ctx context.Context, args XReadGroupMaxCountArgs) ([]redis.XStream, ReadStats, error) {
	if args.MaxCount < 1 {
		return nil, ReadStats{}, fmt.Errorf("MaxCount must be >= 1, got %d", args.MaxCount)
	}
	if len(r.streams) == 0 {
		return nil, ReadStats{}, nil
	}

	batch := newReadBatch(args.MaxCount)
	seen := utils.NewSet[string]()
	stats := ReadStats{}

	stats.CacheSize = r.takeFromCache(batch, seen, &stats.FromCache)
	if batch.remaining == 0 {
		return r.finishRead(batch.results, stats, nil)
	}

	remaining := batch.remaining
	claimed, err := r.pipelineAutoClaim(ctx, r.streams, remaining)
	if err != nil {
		if len(batch.results) > 0 {
			stats.CacheSize = r.cacheLen()
			return r.finishRead(batch.results, stats, fmt.Errorf("autoclaim: %w", err))
		}
		return nil, stats, err
	}

	stats.CacheSize = r.ingestStreams(batch, claimed, seen, &stats.FromAutoClaim)
	if batch.remaining == 0 {
		return r.finishRead(batch.results, stats, nil)
	}

	remaining = batch.remaining
	block := args.Block
	if len(batch.results) > 0 || args.Block <= 0 {
		block = 0
	}

	readStreams, err := r.xReadGroup(ctx, r.streams, ">", remaining, block, args.NoAck)
	if err != nil {
		if len(batch.results) > 0 {
			stats.CacheSize = r.cacheLen()
			return r.finishRead(batch.results, stats, fmt.Errorf("xreadgroup: %w", err))
		}
		return nil, stats, err
	}

	stats.CacheSize = r.ingestStreams(batch, readStreams, seen, &stats.FromXReadGroup)
	return r.finishRead(batch.results, stats, nil)
}

func (r *GroupReader) cacheLen() int64 {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return int64(len(r.cache))
}

// Ack acknowledges a message. alreadyAcked is true when the message was not pending.
func (r *GroupReader) Ack(ctx context.Context, stream, messageID string) (alreadyAcked bool, err error) {
	n, err := r.client.XAck(ctx, stream, r.group, messageID).Result()
	if err != nil {
		return false, err
	}

	return n == 0, nil
}

type readBatch struct {
	maxCount  int64
	remaining int64
	results   []redis.XStream
}

func newReadBatch(maxCount int64) *readBatch {
	return &readBatch{
		maxCount:  maxCount,
		remaining: maxCount,
	}
}

func (r *GroupReader) takeFromCache(batch *readBatch, seen *utils.Set[string], delivered *int64) int64 {
	if batch.remaining == 0 || len(r.cache) == 0 {
		return r.cacheLen()
	}

	r.mu.RLock()

	// Messages that will remain in the cache
	kept := make([]cachedMessage, 0, len(r.cache))
	for _, entry := range r.cache {
		// If the batch is full, keep all remaining messages in the cache
		if batch.remaining == 0 {
			kept = append(kept, entry)
			continue
		}

		// If the message has already been seen, skip it
		key := messageKey(entry.stream, entry.msg.ID)
		if seen.Contains(key) {
			continue
		}

		// Add the message to the batch and the seen set
		seen.Add(key)
		batch.results = appendStreamMessages(batch.results, entry.stream, []redis.XMessage{entry.msg})
		batch.remaining--
		*delivered++
	}

	r.mu.RUnlock()

	// Update the cache with the messages that will remain in the cache
	r.mu.Lock()
	defer r.mu.Unlock()

	r.cache = kept
	return int64(len(r.cache))
}

func (r *GroupReader) ingestStreams(batch *readBatch, streams []redis.XStream, seen *utils.Set[string], delivered *int64) int64 {
	if len(streams) == 0 {
		return r.cacheLen()
	}

	byStream := make(map[string][]redis.XMessage, len(streams))
	for _, stream := range streams {
		if len(stream.Messages) == 0 {
			continue
		}
		byStream[stream.Stream] = append(byStream[stream.Stream], stream.Messages...)
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	lastDeliveredIdx := -1
	for i := 0; i < len(r.streams); i++ {
		idx := (r.cursor + i) % len(r.streams)
		stream := r.streams[idx]
		messages, ok := byStream[stream]
		if !ok {
			continue
		}

		for len(messages) > 0 {
			msg := messages[0]
			messages = messages[1:]

			// If the message has already been seen, skip it
			key := messageKey(stream, msg.ID)
			if seen.Contains(key) {
				continue
			}

			seen.Add(key)

			// If the batch is not full add the message to the batch, otherwise add it to the cache
			if batch.remaining > 0 {
				batch.results = appendStreamMessages(batch.results, stream, []redis.XMessage{msg})
				batch.remaining--
				*delivered++
				lastDeliveredIdx = idx
			} else {
				r.cache = append(r.cache, cachedMessage{stream: stream, msg: msg})
			}
		}
	}

	if lastDeliveredIdx >= 0 {
		r.cursor = (lastDeliveredIdx + 1) % len(r.streams)
	}

	return int64(len(r.cache))
}

func (r *GroupReader) pipelineAutoClaim(ctx context.Context, streams []string, count int64) ([]redis.XStream, error) {
	if count <= 0 || len(streams) == 0 {
		return nil, nil
	}

	pipeClient, ok := r.client.(interface {
		Pipeline() redis.Pipeliner
	})
	if !ok {
		return r.autoClaimSequential(ctx, streams, count)
	}

	pipe := pipeClient.Pipeline()
	cmds := make([]*redis.XAutoClaimCmd, len(streams))
	for i, stream := range streams {
		cmds[i] = pipe.XAutoClaim(ctx, &redis.XAutoClaimArgs{
			Stream:   stream,
			Group:    r.group,
			Consumer: r.consumer,
			MinIdle:  r.autoClaimMinIdle,
			Start:    "0-0",
			Count:    count,
		})
	}

	if _, err := pipe.Exec(ctx); err != nil && err != redis.Nil {
		return nil, err
	}

	var out []redis.XStream
	for i, cmd := range cmds {
		messages, _, err := cmd.Result()
		if err != nil && err != redis.Nil {
			return nil, err
		}
		if err == redis.Nil || len(messages) == 0 {
			continue
		}
		out = append(out, redis.XStream{
			Stream:   streams[i],
			Messages: messages,
		})
	}

	return out, nil
}

func (r *GroupReader) autoClaimSequential(ctx context.Context, streams []string, count int64) ([]redis.XStream, error) {
	var out []redis.XStream
	for _, stream := range streams {
		messages, _, err := r.client.XAutoClaim(ctx, &redis.XAutoClaimArgs{
			Stream:   stream,
			Group:    r.group,
			Consumer: r.consumer,
			MinIdle:  r.autoClaimMinIdle,
			Start:    "0-0",
			Count:    count,
		}).Result()

		if err != nil && err != redis.Nil {
			return nil, err
		}
		if err == redis.Nil || len(messages) == 0 {
			continue
		}

		out = append(out, redis.XStream{Stream: stream, Messages: messages})
	}
	return out, nil
}

func (r *GroupReader) xReadGroup(
	ctx context.Context,
	streamKeys []string,
	lastID string,
	count int64,
	block time.Duration,
	noAck bool,
) ([]redis.XStream, error) {
	if len(streamKeys) == 0 {
		return nil, nil
	}

	streamArgs := make([]string, 0, len(streamKeys)*2)
	for _, key := range streamKeys {
		streamArgs = append(streamArgs, key)
	}
	for range streamKeys {
		streamArgs = append(streamArgs, lastID)
	}

	redisBlock := block
	if block == 0 {
		redisBlock = -1
	}

	streams, err := r.client.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    r.group,
		Consumer: r.consumer,
		Streams:  streamArgs,
		Count:    count,
		Block:    redisBlock,
		NoAck:    noAck,
	}).Result()

	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return streams, nil
}

func messageKey(stream, id string) string {
	return stream + "|" + id
}

func appendStreamMessages(results []redis.XStream, stream string, messages []redis.XMessage) []redis.XStream {
	if len(messages) == 0 {
		return results
	}

	for i := range results {
		if results[i].Stream == stream {
			results[i].Messages = append(results[i].Messages, messages...)
			return results
		}
	}

	return append(results, redis.XStream{
		Stream:   stream,
		Messages: messages,
	})
}

func isBusyGroupError(err error) bool {
	return err != nil && strings.Contains(err.Error(), errBusyGroupExists.Error())
}
