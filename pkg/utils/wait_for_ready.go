package utils

import (
	"context"
	"errors"
	"net"
	"testing"
	"time"

	"k8s.io/apimachinery/pkg/util/wait"
)

// RandomLocalhostPort returns a random localhost port that is available.
// Imperfect as its not guaranteed to defeat races to listeners of the port.
// But probably good enough for most testing use cases.
func RandomLocalhostPort(tb testing.TB) int {
	tb.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		tb.Fatalf("RandomLocalhostPort listen error: %s", err.Error())
	}

	port := listener.Addr().(*net.TCPAddr).Port
	_ = listener.Close()

	return port
}

// WaitForReadyTimeout takes an addr of the format "host:port". It
// continuously polls the addr until it is able to connect. It's purpose is
// for usage in tests only, hence it takes a |testing.TB|. It is fatal to the
// test if fails.
func WaitForReadyTimeout(tb testing.TB, interval, timeout time.Duration, addr string) {
	tb.Helper()

	err := wait.PollUntilContextTimeout(
		context.Background(),
		interval,
		timeout,
		true, // immediate
		func(ctx context.Context) (bool, error) {
			conn, err := net.DialTimeout("tcp", addr, 100*time.Millisecond)
			if err != nil {
				var operr *net.OpError
				if errors.As(err, &operr) {
					tb.Logf("WaitForReadyTimeout OpError: %s", operr.Error())
					return false, nil
				} else {
					return true, err
				}
			}
			_ = conn.Close()
			return true, nil
		},
	)
	if err != nil {
		tb.Fatalf("WaitForReadyTimeout(%s, %s, %q): %s",
			interval,
			timeout,
			addr,
			err.Error(),
		)
	}
}
