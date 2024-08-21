package hashicorpvault

import (
	"errors"
	"net/http"
	"sort"
	"testing"

	"github.com/hashicorp/vault-client-go"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

type mockRoundTripper struct {
	ReceivedReqs []*http.Request
	ReturnValue  *http.Response
	ErrorValue   error
}

func (m *mockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	m.ReceivedReqs = append(m.ReceivedReqs, req)
	return m.ReturnValue, m.ErrorValue
}

func TestRoundTrip(t *testing.T) {
	testCases := []struct {
		name         string
		resp         *http.Response
		err          error
		expectedLogs map[zapcore.Level][]observer.LoggedEntry
	}{
		{
			name: "success",
			resp: &http.Response{StatusCode: 200},
			err:  nil,
			expectedLogs: map[zapcore.Level][]observer.LoggedEntry{
				zap.DebugLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Sending request",
							Level:   zap.DebugLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "vault"),
							zap.String("method", "GET"),
							zap.String("url", "http://example.com"),
						},
					},
					{
						Entry: zapcore.Entry{
							Message: "Received response",
							Level:   zap.DebugLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "vault"),
							zap.String("url", "http://example.com"),
							zap.Int("status_code", 200),
						},
					},
				},
			},
		},
		{
			name: "request fails",
			resp: nil,
			err:  errors.New("403: permission denied"),
			expectedLogs: map[zapcore.Level][]observer.LoggedEntry{
				zap.DebugLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Sending request",
							Level:   zap.DebugLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "vault"),
							zap.String("method", "GET"),
							zap.String("url", "http://example.com"),
						},
					},
				},
				zap.ErrorLevel: {
					{
						Entry: zapcore.Entry{
							Message: "Received error",
							Level:   zap.ErrorLevel,
						},
						Context: []zapcore.Field{
							zap.String("component", "vault"),
							zap.Any("error", errors.New("403: permission denied")),
						},
					},
				},
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			observedCore, observedLogs := observer.New(zap.DebugLevel)
			observedLogger := zap.New(observedCore)

			transport := &mockRoundTripper{
				ReturnValue: tc.resp,
				ErrorValue:  tc.err,
			}
			lt := NewLoggingTransport(observedLogger, transport)

			req, _ := http.NewRequest("GET", "http://example.com", nil)
			resp, err := lt.RoundTrip(req)

			assert.Equal(t, tc.resp, resp)
			assert.Equal(t, tc.err, err)

			var totalExepectedLogs int
			for level, expected := range tc.expectedLogs {
				totalExepectedLogs += len(expected)

				received := observedLogs.FilterLevelExact(level).AllUntimed()
				assert.Len(t, received, len(expected))

				sort.Slice(expected, func(i, j int) bool { return expected[i].Message < expected[j].Message })
				sort.Slice(received, func(i, j int) bool { return received[i].Message < received[j].Message })

				for i, log := range received {
					assert.Equal(t, expected[i].Entry, log.Entry)
					assert.ElementsMatch(t, expected[i].Context, log.Context)
				}
			}
			assert.Len(t, observedLogs.All(), totalExepectedLogs)
		})
	}
}

func TestWithLoggingTransport(t *testing.T) {
	testCases := []struct {
		name         string
		clientConfig *vault.ClientConfiguration
	}{
		{
			name:         "no http client",
			clientConfig: &vault.ClientConfiguration{},
		},
		{
			name: "existing http client",
			clientConfig: &vault.ClientConfiguration{
				HTTPClient: &http.Client{},
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			noopLogger := zap.NewNop()
			existingClient := tc.clientConfig.HTTPClient

			err := WithLoggingTransport(noopLogger)(tc.clientConfig)

			assert.NoError(t, err)
			if existingClient == nil {
				assert.NotNil(t, tc.clientConfig.HTTPClient)
			} else {
				assert.Same(t, existingClient, tc.clientConfig.HTTPClient)
			}
		})
	}
}
