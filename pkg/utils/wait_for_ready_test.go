package utils

import (
	"fmt"
	"net"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestRandomLocalhostPort(t *testing.T) {
	t.Parallel()

	require.Greater(t, RandomLocalhostPort(t), 0)
}

func TestWaitForReadyTimeout(t *testing.T) {
	t.Parallel()

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)

	var wg sync.WaitGroup
	defer func() {
		if ln != nil {
			_ = ln.Close()
		}
		wg.Wait()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		t.Logf("accept 1")
		conn, err := ln.Accept()
		require.NoError(t, err)
		_ = conn.Close()
	}()

	port := ln.Addr().(*net.TCPAddr).Port
	addr := fmt.Sprintf("127.0.0.1:%d", port)
	WaitForReadyTimeout(t, 100*time.Millisecond, time.Second, addr)
	t.Logf("ready 1")

	wg.Wait()

	_ = ln.Close()
	ln = nil

	wg.Add(1)
	done := make(chan struct{})
	go func() {
		defer wg.Done()
		WaitForReadyTimeout(t, 100*time.Millisecond, time.Second, addr)
		t.Logf("ready 2")
		close(done)
	}()

	time.Sleep(300 * time.Millisecond)

	ln, err = net.Listen("tcp", addr)
	require.NoError(t, err)

	wg.Add(1)
	go func() {
		defer wg.Done()
		t.Logf("accept 2")
		conn, err := ln.Accept()
		require.NoError(t, err)
		_ = conn.Close()
	}()

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("timed out")
	}
}
