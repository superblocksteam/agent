package hashicorpvault

import (
	"net/http"

	"github.com/hashicorp/vault-client-go"
	"go.uber.org/zap"
)

type loggingTransport struct {
	logger    *vaultLogger
	Transport http.RoundTripper
}

func (lt *loggingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	lt.logger.Debug("Sending request", "method", req.Method, "url", req.URL.String())

	resp, err := lt.Transport.RoundTrip(req)

	// Log the response
	if err != nil {
		lt.logger.Error("Received error", "error", err)
	} else {
		lt.logger.Debug("Received response", "url", req.URL.String(), "status_code", resp.StatusCode)
	}

	return resp, err
}

func NewLoggingTransport(logger *zap.Logger, transport http.RoundTripper) *loggingTransport {
	return &loggingTransport{
		logger:    &vaultLogger{logger},
		Transport: transport,
	}
}

func WithLoggingTransport(logger *zap.Logger) vault.ClientOption {
	return func(cc *vault.ClientConfiguration) error {
		var transport http.RoundTripper

		if cc.HTTPClient == nil {
			cc.HTTPClient = http.DefaultClient
			transport = http.DefaultTransport
		} else {
			transport = cc.HTTPClient.Transport
		}

		cc.HTTPClient.Transport = NewLoggingTransport(logger, transport)

		return nil
	}
}
