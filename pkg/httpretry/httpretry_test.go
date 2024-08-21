package httpretry

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zaptest"
)

const (
	zero = time.Duration(0)
)

var (
	broken   = errors.New("broken")
	errRetry = &fakeError{true, true}
)

type args struct {
	clock clockwork.FakeClock
	req   *http.Request
	rt    *fakeRoundTripper
}

func validArgs(t *testing.T) *args {
	return validArgsWithContext(t, context.Background())
}

func validArgsWithContext(t *testing.T, ctx context.Context) *args {
	req, err := http.NewRequestWithContext(ctx, "GET", "http://127.0.0.1/bogus-url", nil)
	require.NoError(t, err)

	return &args{
		clock: clockwork.NewFakeClock(),
		req:   req,
		rt:    newFakeRoundTripper(),
	}
}

func verify(t *testing.T, args *args, expectedError error, statusCode int, maxDuration time.Duration, stats *stats) {
	log := zaptest.NewLogger(t)

	h := New(log, args.rt, WithClock(args.clock))

	start := args.clock.Now()
	resp, err := h.RoundTrip(args.req)
	end := args.clock.Now()
	require.LessOrEqual(t, end.Sub(start), maxDuration, "roundtrip took longer than expected")
	if expectedError == nil {
		require.NoError(t, err)
	} else {
		require.ErrorIs(t, err, expectedError)
		return
	}

	require.Equal(t, statusCode, resp.StatusCode)
	if stats != nil {
		require.Equal(t, *stats, h.stats)
	}
}

// verifyGo simply runs verify in a goroutine. Returns channel that is closed when verify go
// routine has finished.
func verifyGo(t *testing.T, args *args, expectedError error, statusCode int, maxDuration time.Duration, stats *stats) <-chan struct{} {
	wait := make(chan struct{})

	go func() {
		defer close(wait)
		verify(t, args, expectedError, statusCode, maxDuration, stats)
	}()

	t.Cleanup(func() {
		<-wait
	})

	return wait
}

func TestOk(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	verify(t, args, nil, http.StatusOK, zero, &stats{nretries: 0})
}

func TestRetryForever(t *testing.T) {
	for i, variation := range []func(args *args){
		func(args *args) {
			args.rt.err = errRetry
		},
		func(args *args) {
			args.rt.resp.StatusCode = http.StatusRequestTimeout
		},
	} {
		t.Run(fmt.Sprintf("variation[%d]", i), func(t *testing.T) {
			t.Parallel()
			args := validArgs(t)
			variation(args)

			wait := verifyGo(t, args, nil, http.StatusOK, time.Hour*101, nil)
			args.clock.BlockUntil(1)

			for i := 0; i < 100; i++ { // 100h of retries
				args.clock.Advance(time.Hour)
				select {
				case <-wait:
					t.Fatalf("wait returned early at %d hours", i)
				case <-time.After(time.Millisecond):
				}
				args.clock.BlockUntil(1)
			}

			args.rt.SetErr(nil)
			args.rt.SetStatusCode(http.StatusOK)
			args.clock.Advance(time.Hour)
			<-wait
		})
	}
}

func TestRetriableError(t *testing.T) {
	t.Parallel()

	for i, err := range []error{&fakeError{true, false}, &fakeError{false, true}} {
		t.Run(fmt.Sprintf("error[%d]", i), func(t *testing.T) {
			args := validArgs(t)
			args.rt.err = err

			wait := verifyGo(t, args, nil, http.StatusOK, time.Second, &stats{nretries: 1})
			args.clock.BlockUntil(1)
			args.rt.SetErr(nil)
			args.clock.Advance(time.Second)
			<-wait
		})
	}
}

func TestRetriableStatusCodes(t *testing.T) {
	t.Parallel()

	for _, code := range []int{
		// list duplicated, search: httpretry-retriable-status-codes
		http.StatusRequestTimeout,
		http.StatusTooManyRequests,
		http.StatusInternalServerError,
		http.StatusBadGateway,
		http.StatusServiceUnavailable,
		http.StatusGatewayTimeout,
	} {
		t.Run(fmt.Sprintf("code[%s]", http.StatusText(code)), func(t *testing.T) {
			args := validArgs(t)
			args.rt.resp.StatusCode = code

			wait := verifyGo(t, args, nil, http.StatusOK, time.Second, &stats{nretries: 1})
			args.clock.BlockUntil(1)
			args.rt.SetStatusCode(http.StatusOK)
			args.clock.Advance(time.Second)
			<-wait
		})
	}
}

func TestRetryAfterVariations(t *testing.T) {
	now := time.Now()
	seconds := 300
	for _, value := range []string{
		fmt.Sprintf("%d", seconds),
		now.Add(time.Second * time.Duration(seconds)).Format(time.RFC850),
	} {
		t.Run(value, func(t *testing.T) {
			t.Parallel()

			args := validArgs(t)
			args.clock = clockwork.NewFakeClockAt(now)
			args.rt.resp.StatusCode = http.StatusRequestTimeout
			args.rt.resp.Header.Set("retry-after", value)

			wait := verifyGo(t, args, nil, http.StatusOK, time.Second*time.Duration(seconds), &stats{nretries: 1})
			args.clock.BlockUntil(1)
			args.rt.SetStatusCode(http.StatusOK)

			for i := 0; i < seconds-1; i++ {
				args.clock.Advance(time.Second)
				select {
				case <-wait:
					t.Fatalf("wait returned early at %d seconds", i)
				case <-time.After(time.Millisecond):
				}
				args.clock.BlockUntil(1)
			}

			args.clock.Advance(time.Second)
			t.Logf("elapsed %ds", int(args.clock.Now().Sub(now).Truncate(time.Second).Seconds()))
			<-wait
		})
	}
}

func TestRetryAfterInvalid(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.rt.resp.StatusCode = http.StatusRequestTimeout
	args.rt.resp.Header.Set("retry-after", "invalid")

	wait := verifyGo(t, args, nil, http.StatusOK, time.Second, &stats{nretries: 1})
	args.clock.BlockUntil(1)
	args.rt.SetStatusCode(http.StatusOK)
	args.clock.Advance(time.Second)
	<-wait
}

func TestErrNonRetriableUnknownError(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.rt.err = broken
	verify(t, args, broken, 0, zero, &stats{nretries: 0})
}

func TestErrNonRetriableError(t *testing.T) {
	t.Parallel()

	err := &fakeError{false, false}
	args := validArgs(t)
	args.rt.err = err
	verify(t, args, err, 0, zero, &stats{nretries: 0})
}

func TestErrContextCanceled(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	args := validArgsWithContext(t, ctx)
	verify(t, args, context.Canceled, 0, zero, &stats{nretries: 0})
}

func TestErrRetriedRequestThenContextCanceled(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	args := validArgsWithContext(t, ctx)
	args.rt.err = errRetry

	wait := verifyGo(t, args, context.Canceled, 0, zero, &stats{nretries: 1})
	args.clock.BlockUntil(1)
	cancel()
	<-wait
}
