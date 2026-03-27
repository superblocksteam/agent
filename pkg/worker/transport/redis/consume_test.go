package redis

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	goredis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

// makeMessages creates a buffered channel pre-loaded with redis.Message values.
func makeMessages(payloads ...string) chan *goredis.Message {
	ch := make(chan *goredis.Message, len(payloads))
	for _, p := range payloads {
		ch <- &goredis.Message{Payload: p}
	}
	return ch
}

// collectFromStream reads all values from a closed string channel.
func collectFromStream(stream <-chan string) []string {
	var out []string
	for s := range stream {
		out = append(out, s)
	}
	return out
}

// TestForwardDrainsBufferedMessages verifies that when the context is
// cancelled, any messages already buffered in the source channel are
// drained to dest before dest is closed.
func TestForwardDrainsBufferedMessages(t *testing.T) {
	t.Parallel()

	for _, tc := range []struct {
		name     string
		messages []string
	}{
		{
			name:     "drains single buffered message",
			messages: []string{"msg1"},
		},
		{
			name:     "drains multiple buffered messages",
			messages: []string{"msg1", "msg2", "msg3", "msg4", "msg5"},
		},
		{
			name:     "handles empty buffer",
			messages: nil,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			source := makeMessages(tc.messages...)
			dest := make(chan string, len(tc.messages)+1)
			ctx, cancel := context.WithCancel(context.Background())

			// Cancel immediately — simulates handleEvent returning and
			// triggering defer pubsubCancel().
			cancel()

			var wg sync.WaitGroup
			wg.Add(1)
			go func() {
				defer wg.Done()
				forward(ctx, source, dest, nil)
			}()
			wg.Wait()

			got := collectFromStream(dest)
			assert.Equal(t, tc.messages, got,
				"all buffered messages should be drained to dest before closing")
		})
	}
}

// TestForwardDeliversBeforeCancel verifies that messages arriving before
// context cancellation are always delivered.
func TestForwardDeliversBeforeCancel(t *testing.T) {
	t.Parallel()

	source := make(chan *goredis.Message, 10)
	dest := make(chan string, 10)
	ctx, cancel := context.WithCancel(context.Background())

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		forward(ctx, source, dest, nil)
	}()

	// Send messages while the forwarder is running.
	for i := range 5 {
		source <- &goredis.Message{Payload: fmt.Sprintf("msg%d", i)}
	}

	// Small delay so the forwarder processes them, then cancel.
	time.Sleep(10 * time.Millisecond)
	cancel()

	wg.Wait()

	got := collectFromStream(dest)
	assert.Len(t, got, 5, "all messages sent before cancel should be delivered")
}

// TestForwardCleanupCalled verifies that the cleanup function is called
// exactly once when the context is cancelled.
func TestForwardCleanupCalled(t *testing.T) {
	t.Parallel()

	source := makeMessages()
	dest := make(chan string, 1)
	ctx, cancel := context.WithCancel(context.Background())

	var cleanupCalls int
	cleanup := func() { cleanupCalls++ }

	cancel()

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		forward(ctx, source, dest, cleanup)
	}()
	wg.Wait()

	assert.Equal(t, 1, cleanupCalls, "cleanup should be called exactly once")
}

// TestForwardCleanupCloseSource verifies forward exits when cleanup closes
// source. This protects against busy-spin in the drain loop on closed channels.
func TestForwardCleanupCloseSource(t *testing.T) {
	t.Parallel()

	source := make(chan *goredis.Message, 2)
	source <- &goredis.Message{Payload: "msg1"}
	dest := make(chan string, 2)
	ctx, cancel := context.WithCancel(context.Background())

	cleanup := func() {
		close(source)
	}

	cancel()

	done := make(chan struct{})
	go func() {
		forward(ctx, source, dest, cleanup)
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(250 * time.Millisecond):
		t.Fatal("forward did not exit after cleanup closed source")
	}

	got := collectFromStream(dest)
	assert.Equal(t, []string{"msg1"}, got, "buffered messages should still be drained")
}

// TestForwardSkipsNilMessagesBeforeCancel verifies nil messages are ignored in
// the main forward loop.
func TestForwardSkipsNilMessagesBeforeCancel(t *testing.T) {
	t.Parallel()

	source := make(chan *goredis.Message, 4)
	source <- nil
	source <- &goredis.Message{Payload: "msg1"}
	dest := make(chan string, 4)
	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan struct{})
	go func() {
		forward(ctx, source, dest, nil)
		close(done)
	}()

	cancel()

	select {
	case <-done:
	case <-time.After(250 * time.Millisecond):
		t.Fatal("forward did not exit after cancellation")
	}

	got := collectFromStream(dest)
	assert.Equal(t, []string{"msg1"}, got, "nil messages should be skipped")
}

// TestForwardDrainSkipsNilMessages verifies nil messages are ignored in the
// drain loop after cancellation.
func TestForwardDrainSkipsNilMessages(t *testing.T) {
	t.Parallel()

	source := make(chan *goredis.Message, 4)
	source <- nil
	source <- &goredis.Message{Payload: "msg1"}
	dest := make(chan string, 4)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	done := make(chan struct{})
	go func() {
		forward(ctx, source, dest, nil)
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(250 * time.Millisecond):
		t.Fatal("forward did not exit after cancellation")
	}

	got := collectFromStream(dest)
	assert.Equal(t, []string{"msg1"}, got, "nil messages should be skipped while draining")
}

// TestForwardSourceClosedBeforeCancel verifies cleanup still runs when the
// source channel closes before context cancellation.
func TestForwardSourceClosedBeforeCancel(t *testing.T) {
	t.Parallel()

	source := make(chan *goredis.Message)
	dest := make(chan string, 1)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var cleanupCalls int
	cleanup := func() { cleanupCalls++ }

	done := make(chan struct{})
	go func() {
		forward(ctx, source, dest, cleanup)
		close(done)
	}()

	close(source)

	select {
	case <-done:
	case <-time.After(250 * time.Millisecond):
		t.Fatal("forward did not exit after source channel closed")
	}

	_, ok := <-dest
	assert.False(t, ok, "dest should be closed when forward exits")
	assert.Equal(t, 1, cleanupCalls, "cleanup should be called once even when source closes first")
}

// TestForwardRaceCondition stress-tests the drain path under concurrent
// message publishing and context cancellation.
func TestForwardRaceCondition(t *testing.T) {
	t.Parallel()

	const iterations = 200

	for i := range iterations {
		source := make(chan *goredis.Message, 20)
		dest := make(chan string, 40)
		ctx, cancel := context.WithCancel(context.Background())

		// Publish messages concurrently with cancel.
		var pubWg sync.WaitGroup
		pubWg.Add(1)
		go func() {
			defer pubWg.Done()
			for j := range 10 {
				select {
				case source <- &goredis.Message{Payload: fmt.Sprintf("msg%d", j)}:
				default:
				}
			}
		}()

		go func() {
			time.Sleep(time.Duration(i%5) * time.Microsecond)
			cancel()
		}()

		var fwdWg sync.WaitGroup
		fwdWg.Add(1)
		go func() {
			defer fwdWg.Done()
			forward(ctx, source, dest, nil)
		}()

		pubWg.Wait()
		fwdWg.Wait()

		// Just verify no deadlock or panic. We can't assert exact count
		// due to timing, but the channel should be closed.
		for range dest {
		}
	}
}

func TestConsumeForwardsAndClosesStreamOnCancel(t *testing.T) {
	t.Parallel()

	mini, err := miniredis.Run()
	require.NoError(t, err)
	defer mini.Close()

	client := goredis.NewClient(&goredis.Options{Addr: mini.Addr()})
	defer client.Close()

	tnspt := &transport{
		options: &Options{
			redis:  client,
			logger: zap.NewNop(),
		},
	}

	ctx, cancel := context.WithCancel(context.Background())
	stream := make(chan string, 4)

	require.NoError(t, tnspt.consume(ctx, "test.topic", stream))
	require.NoError(t, client.Publish(context.Background(), "test.topic", "msg1").Err())

	select {
	case msg := <-stream:
		assert.Equal(t, "msg1", msg)
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timed out waiting for consume to forward published message")
	}

	cancel()

	select {
	case _, ok := <-stream:
		assert.False(t, ok, "stream should be closed after consume context cancellation")
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timed out waiting for consume to close stream channel")
	}
}
