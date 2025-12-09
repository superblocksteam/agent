package tracer

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/observability/obsup"
	"go.uber.org/zap/zaptest"
)

func startMockOtlpServer(t *testing.T) string {
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/traces", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/v1/logs", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	server := &http.Server{Handler: mux}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		server.Serve(listener)
	}()

	t.Cleanup(func() {
		server.Shutdown(context.Background())
		wg.Wait()
	})

	return fmt.Sprintf("127.0.0.1:%d", listener.Addr().(*net.TCPAddr).Port)
}

func TestPrepareReturnsLoggerProvider(t *testing.T) {
	addr := startMockOtlpServer(t)
	logger := zaptest.NewLogger(t)

	result, err := Prepare(logger, obsup.Options{
		ServiceName:    "test",
		ServiceVersion: "v1",
		OtlpUrl:        "http://" + addr,
	})
	require.NoError(t, err)
	require.NotNil(t, result.LoggerProvider)
	require.NotNil(t, result.Runnable)

	require.NoError(t, result.Runnable.Close(context.Background()))
}

func TestPrepareReturnsNilLoggerProviderWithoutUrl(t *testing.T) {
	logger := zaptest.NewLogger(t)

	result, err := Prepare(logger, obsup.Options{
		ServiceName:    "test",
		ServiceVersion: "v1",
		OtlpUrl:        "",
	})
	require.NoError(t, err)
	require.Nil(t, result.LoggerProvider)
	require.NotNil(t, result.Runnable)

	require.NoError(t, result.Runnable.Close(context.Background()))
}

func TestPrepareRunnable(t *testing.T) {
	logger := zaptest.NewLogger(t)

	result, err := Prepare(logger, obsup.Options{
		ServiceName:    "test",
		ServiceVersion: "v1",
	})
	require.NoError(t, err)

	require.Equal(t, "tracer", result.Runnable.Name())
	require.True(t, result.Runnable.Alive())
	require.NoError(t, result.Runnable.Close(context.Background()))
}

func TestTracerRunBlocksUntilClose(t *testing.T) {
	logger := zaptest.NewLogger(t)

	result, err := Prepare(logger, obsup.Options{
		ServiceName:    "test",
		ServiceVersion: "v1",
	})
	require.NoError(t, err)

	runDone := make(chan struct{})
	go func() {
		result.Runnable.Run(context.Background())
		close(runDone)
	}()

	// Verify Run hasn't returned yet
	select {
	case <-runDone:
		t.Fatal("Run returned before Close was called")
	case <-time.After(100 * time.Millisecond):
		// Expected: Run is still blocking
	}

	// Call Close, verify Run returns
	require.NoError(t, result.Runnable.Close(context.Background()))

	select {
	case <-runDone:
		// Expected: Run returned after Close
	case <-time.After(1 * time.Second):
		t.Fatal("Run did not return after Close was called")
	}
}

func TestTracerCloseCallsShutdown(t *testing.T) {
	addr := startMockOtlpServer(t)
	logger := zaptest.NewLogger(t)

	result, err := Prepare(logger, obsup.Options{
		ServiceName:    "test",
		ServiceVersion: "v1",
		OtlpUrl:        "http://" + addr,
	})
	require.NoError(t, err)
	require.NotNil(t, result.Runnable)

	// Close should call the shutdown function without error
	err = result.Runnable.Close(context.Background())
	require.NoError(t, err)
}

func TestTracerFields(t *testing.T) {
	logger := zaptest.NewLogger(t)

	result, err := Prepare(logger, obsup.Options{
		ServiceName:    "test",
		ServiceVersion: "v1",
	})
	require.NoError(t, err)

	// Fields() should return a slice (even if empty)
	fields := result.Runnable.Fields()
	require.NotNil(t, fields)

	require.NoError(t, result.Runnable.Close(context.Background()))
}
