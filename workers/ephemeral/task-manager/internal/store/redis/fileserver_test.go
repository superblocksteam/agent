package redis

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFetchFileFromServer(t *testing.T) {
	for _, test := range []struct {
		name       string
		handler    http.HandlerFunc
		agentKey   string
		path       string
		wantBody   []byte
		wantErr    string
		wantHeader string // expected x-superblocks-agent-key header value
	}{
		{
			name: "returns file content",
			handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, "/tmp/upload-abc", r.URL.Query().Get("location"))
				w.Write([]byte("file content"))
			}),
			agentKey: "simple-key",
			path:     "/tmp/upload-abc",
			wantBody: []byte("file content"),
		},
		{
			name: "sanitizes agent key with slashes and plus signs",
			handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, "org__key--val", r.Header.Get("x-superblocks-agent-key"))
				w.Write([]byte("ok"))
			}),
			agentKey: "org/key+val",
			path:     "/tmp/f",
			wantBody: []byte("ok"),
		},
		{
			name: "returns error on 404",
			handler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusNotFound)
			}),
			path:    "/tmp/missing",
			wantErr: "file server returned status 404",
		},
		{
			name: "returns error on 500",
			handler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusInternalServerError)
			}),
			path:    "/tmp/err",
			wantErr: "file server returned status 500",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(test.handler)
			t.Cleanup(server.Close)

			body, err := FetchFileFromServer(context.Background(), server.URL, test.agentKey, test.path)
			if test.wantErr != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), test.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.wantBody, body)
		})
	}
}

func TestFetchFileFromServerV2Format(t *testing.T) {
	chunk1 := base64.StdEncoding.EncodeToString([]byte("hello "))
	chunk2 := base64.StdEncoding.EncodeToString([]byte("world"))
	responseBody := fmt.Sprintf(
		"{\"result\":{\"data\":\"%s\"}}\n{\"result\":{\"data\":\"%s\"}}\n",
		chunk1, chunk2,
	)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte(responseBody))
	}))
	t.Cleanup(server.Close)

	body, err := FetchFileFromServer(context.Background(), server.URL+"/v2/files", "key", "/path")
	require.NoError(t, err)
	assert.Equal(t, []byte("hello world"), body)
}

func TestFetchFileFromServerUnreachable(t *testing.T) {
	_, err := FetchFileFromServer(context.Background(), "http://127.0.0.1:1", "key", "/path")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to fetch file")
}

func TestFetchFileFromServerCancelledContext(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("data"))
	}))
	t.Cleanup(server.Close)

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := FetchFileFromServer(ctx, server.URL, "key", "/path")
	require.Error(t, err)
}
