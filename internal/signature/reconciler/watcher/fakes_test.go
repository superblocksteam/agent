package ssewatcher

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/sse"
)

const authorizationToken = "token"

type fakeHandler struct {
	bytes    chan []byte
	closeOne chan struct{}
	events   chan sse.Event
	initial  sse.Event
	proto    string
	t        *testing.T
}

type writerFlusher interface {
	io.Writer
	http.Flusher
}

func newFakeHandler(t *testing.T) *fakeHandler {
	f := &fakeHandler{
		bytes:    make(chan []byte),
		closeOne: make(chan struct{}),
		events:   make(chan sse.Event),
		initial: sse.Event{
			Name: eventSigningKeyJobUpdated,
			Data: `{"signingKeyId": "fake-key-id", "status": "fake-status"}`,
		},
		t: t,
	}
	return f
}

func (f *fakeHandler) CloseOne() {
	f.closeOne <- struct{}{}
}

func (f *fakeHandler) ServeHTTP(resp http.ResponseWriter, req *http.Request) {
	t := f.t
	tlogf := func(format string, args ...any) {
		t.Logf("handler: "+format, args...)
	}

	require.Equal(t, f.proto, req.Proto, "wrong http protocol for test")

	tlogf("request received\nheaders=%v", req.Header)

	if req.Header.Get("authorization") != "Bearer "+authorizationToken {
		tlogf("status=unauthorized")
		resp.WriteHeader(http.StatusUnauthorized)
		return
	}

	w, ok := resp.(writerFlusher)
	if !ok {
		t.Fatalf("wrong response type")
	}

	if strings.Contains(req.Header.Get("accept-encoding"), "gzip") {
		// specifically refers to transport.DisableCompression = true in go http client
		t.Fatal("compliant clients disable accept-encoding gzip or buffering leads to timeouts")
	}

	resp.Header().Set("content-type", "text/event-stream")
	resp.Header().Set("cache-control", "no-cache")
	resp.Header().Set("connection", "keep-alive")

	tlogf("status=ok")
	resp.WriteHeader(http.StatusOK)

	buf := marshalEvent(f.initial)
	_, err := w.Write(buf)
	require.NoError(t, err)
	w.Flush()
	tlogf("wrote event\n`%s`\n", string(buf))

	for {
		select {
		case <-req.Context().Done():
			// NOTE: this became a data race within go and I'm not sure why
			// to reproduce: go test ./internal/signature/reconciler/watcher -count=100 -race
			// tlogf("context done")
			return
		case buf := <-f.bytes:
			_, err := w.Write(buf)
			require.NoError(t, err)
			w.Flush()
			tlogf("wrote bytes\n`%s`\n", string(buf))
		case <-f.closeOne:
			tlogf("closing")
			return
		case event := <-f.events:
			buf := marshalEvent(event)
			_, err := w.Write(buf)
			require.NoError(t, err)
			w.Flush()
			tlogf("wrote event\n`%s`\n", string(buf))
		}
	}
}

func marshalEvent(e sse.Event) []byte {
	buf := []byte{}
	if e.Name != "" {
		buf = append(buf, []byte(fmt.Sprintf("event: %s\n", e.Name))...)
	}
	if e.Data != "" {
		buf = append(buf, []byte("data: "+e.Data+"\n")...)
	}
	buf = append(buf, []byte("\n")...) // end event

	return buf
}
