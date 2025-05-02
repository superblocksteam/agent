package ssewatcher

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/signature/reconciler"
	"github.com/superblocksteam/agent/internal/sse"
	"github.com/superblocksteam/agent/pkg/utils"

	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

type args struct {
	handler *fakeHandler
	headers map[string]string
	log     *zap.Logger
	logs    *observer.ObservedLogs
	options []Option
}

type makeServer func(args *args) *httptest.Server

func must(skre reconciler.SigningKeyRotationEvent, err error) reconciler.SigningKeyRotationEvent {
	if err != nil {
		panic(err)
	}
	return skre
}

func validArgs(t *testing.T) *args {
	log, logs := utils.NewZapTestObservedLogger(t)

	args := &args{
		handler: newFakeHandler(t),
		headers: map[string]string{
			"authorization": "Bearer " + authorizationToken,
		},
		log:  log,
		logs: logs,
	}

	return args
}

func start(t *testing.T, args *args, server *httptest.Server, expectedErrMsg string) (*watcher, context.CancelFunc) {
	watcher, err := New(args.log, server.URL, args.headers, args.options...)
	if expectedErrMsg == "" {
		require.NoError(t, err)
	} else {
		require.EqualError(t, err, expectedErrMsg)
		return nil, nil
	}

	var wg sync.WaitGroup
	ctx, cancel := context.WithCancel(context.Background())

	t.Cleanup(func() {
		cancel()
		wg.Wait()
	})

	wg.Add(1)
	go func() {
		defer wg.Done()
		err := watcher.Run(ctx)
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("unexpected Run error: %v", err)
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		// watch for test failures from server and propagate cancellation
		for {
			select {
			case <-ctx.Done():
				return
			case <-time.After(10 * time.Millisecond):
				if t.Failed() {
					cancel()
				}
			}
		}
	}()

	return watcher, cancel
}

func verify(t *testing.T, args *args, server *httptest.Server, expectedErrMsg string) (*watcher, context.CancelFunc) {
	watcher, cancel := start(t, args, server, expectedErrMsg)

	skre, ok := <-watcher.C
	require.True(t, ok, "watcher channel closed when it should not be")
	require.Equal(t, must(eventToSkre(args.handler.initial)), skre)

	return watcher, cancel
}

func paramServer(t *testing.T, test func(t *testing.T, makeServer makeServer)) {
	t.Run("http1.1", func(t *testing.T) {
		test(t, func(args *args) *httptest.Server {
			args.handler.proto = "HTTP/1.1"
			server := httptest.NewServer(args.handler)
			t.Cleanup(server.Close)
			return server
		})
	})

	t.Run("http2", func(t *testing.T) {
		test(t, func(args *args) *httptest.Server {
			args.handler.proto = "HTTP/2.0"
			server := httptest.NewUnstartedServer(args.handler)
			server.EnableHTTP2 = true
			server.StartTLS()
			t.Cleanup(server.Close)

			pool := x509.NewCertPool()
			pool.AddCert(server.Certificate())
			args.options = append(args.options, WithTlsConfig(&tls.Config{
				RootCAs: pool,
			}))
			return server
		})
	})
}

func TestOk(t *testing.T) {
	paramServer(t, func(t *testing.T, makeServer makeServer) {
		t.Parallel()
		args := validArgs(t)
		_, cancel := verify(t, args, makeServer(args), "")
		cancel()
	})
}

func TestOkServerRestart(t *testing.T) {
	paramServer(t, func(t *testing.T, makeServer makeServer) {
		t.Parallel()
		args := validArgs(t)
		watcher, cancel := verify(t, args, makeServer(args), "")

		args.handler.CloseOne()

		skre, ok := <-watcher.C
		require.True(t, ok, "watcher channel closed when it should not be")
		require.Equal(t, must(eventToSkre(args.handler.initial)), skre)

		cancel()

		utils.RequireLogContains(t, args.logs, zap.DebugLevel, "received EOF, retrying")
	})
}

func TestOkShutdownRestart(t *testing.T) {
	paramServer(t, func(t *testing.T, makeServer makeServer) {
		t.Parallel()
		args := validArgs(t)
		watcher, cancel := verify(t, args, makeServer(args), "")

		args.handler.events <- sse.Event{
			Name: eventShutdown,
		}

		skre, ok := <-watcher.C
		require.True(t, ok, "watcher channel closed when it should not be")
		require.Equal(t, must(eventToSkre(args.handler.initial)), skre)

		cancel()

		utils.RequireLogContains(t, args.logs, zap.DebugLevel, "received server shutdown, retrying")
	})
}

func TestOkContextCancelStopsSend(t *testing.T) {
	paramServer(t, func(t *testing.T, makeServer makeServer) {
		t.Parallel()
		args := validArgs(t)
		watcher, cancel := start(t, args, makeServer(args), "")

		time.Sleep(100 * time.Millisecond)
		cancel()

		_, ok := <-watcher.C
		require.False(t, ok, "watcher channel should be empty")
	})
}

func TestErrInvalidEvent(t *testing.T) {
	paramServer(t, func(t *testing.T, makeServer makeServer) {
		t.Parallel()
		args := validArgs(t)
		watcher, cancel := verify(t, args, makeServer(args), "")

		args.handler.events <- sse.Event{
			Name: "invalid-event",
		}

		select {
		case <-watcher.C:
			t.Fatalf("read from watcher channel unexpected")
		case <-time.After(200 * time.Millisecond):
		}

		cancel()

		_, ok := <-watcher.C
		require.False(t, ok, "watcher channel should be empty")

		utils.RequireLogContains(t, args.logs, zap.WarnLevel, "unknown event")
	})
}

func TestErrMalformedData(t *testing.T) {
	paramServer(t, func(t *testing.T, makeServer makeServer) {
		t.Parallel()
		args := validArgs(t)
		watcher, cancel := verify(t, args, makeServer(args), "")

		args.handler.events <- sse.Event{
			Name: eventSigningKeyJobUpdated,
			Data: "not-json",
		}

		select {
		case <-watcher.C:
			t.Fatalf("read from watcher channel unexpected")
		case <-time.After(200 * time.Millisecond):
		}

		cancel()

		_, ok := <-watcher.C
		require.False(t, ok, "watcher channel should be empty")

		utils.RequireLogContains(t, args.logs, zap.WarnLevel, "issue parsing event")
	})
}

func TestErrEmptyData(t *testing.T) {
	paramServer(t, func(t *testing.T, makeServer makeServer) {
		t.Parallel()
		args := validArgs(t)
		watcher, cancel := verify(t, args, makeServer(args), "")

		args.handler.events <- sse.Event{
			Name: eventSigningKeyJobUpdated,
			Data: "",
		}

		skre, ok := <-watcher.C
		require.True(t, ok, "watcher channel have messages")
		require.Equal(t, reconciler.SigningKeyRotationEvent{}, skre)

		cancel()
	})
}

func TestErrEmptyEventName(t *testing.T) {
	paramServer(t, func(t *testing.T, makeServer makeServer) {
		t.Parallel()
		args := validArgs(t)
		watcher, cancel := verify(t, args, makeServer(args), "")

		args.handler.events <- sse.Event{
			Name: "",
			Data: "{}",
		}

		select {
		case <-watcher.C:
			t.Fatalf("read from watcher channel unexpected")
		case <-time.After(200 * time.Millisecond):
		}

		cancel()

		_, ok := <-watcher.C
		require.False(t, ok, "watcher channel should be empty")
	})
}

func TestErrStatusCode(t *testing.T) {
	paramServer(t, func(t *testing.T, makeServer makeServer) {
		t.Parallel()
		args := validArgs(t)
		args.headers["authorization"] = "unauthorized"
		watcher, cancel := start(t, args, makeServer(args), "")

		time.Sleep(100 * time.Millisecond)
		cancel()

		_, ok := <-watcher.C
		require.False(t, ok, "watcher channel should not have messages")
		utils.RequireLogContains(t, args.logs, zap.ErrorLevel, "watch error")
		utils.RequireLogErrorEqual(t, args.logs, zap.ErrorLevel,
			"request status not-OK: Unauthorized (401)",
		)
	})
}

func TestErrBadRequest(t *testing.T) {
	t.Parallel()
	args := validArgs(t)
	// bad protocol scheme, makeRequest should fail
	start(t, args, &httptest.Server{URL: "://"},
		`cannot create initial watcher request: parse ":///api/v1/keyrotations/watch": missing protocol scheme`,
	)
}
