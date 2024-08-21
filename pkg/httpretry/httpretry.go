package httpretry

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/jonboulle/clockwork"
	"go.uber.org/zap"
)

type httpretry struct {
	log          *zap.Logger
	options      options
	roundTripper http.RoundTripper
	stats        stats
}

type stats struct {
	nretries int
}

var _ http.RoundTripper = &httpretry{}

type ErrorRetriable interface {
	error
	Temporary() bool
	Timeout() bool
}

// New returns an |httpretry| which implements |http.RoundTripper|.
//
// |defaultRoundTripper| can simply be |http.DefaultTransport| or any other |http.RoundTripper|.
func New(log *zap.Logger, defaultRoundTripper http.RoundTripper, options ...Option) *httpretry {
	h := &httpretry{
		log:          log.Named("httpretry"),
		options:      defaults(),
		roundTripper: defaultRoundTripper,
	}

	for _, o := range options {
		o(&h.options)
	}

	return h
}

func (h *httpretry) RoundTrip(req *http.Request) (*http.Response, error) {
	b := h.options.backoff
	clock := h.options.clock
	ctx := req.Context()
	log := h.log

	attempt := 0
	backoffReset := false
	lastCode := 0
	var lastError error
	var lastRetryAfter *time.Duration
	var retryStart time.Time
	for ctx.Err() == nil {
		if attempt > 0 {
			if retryStart.IsZero() {
				retryStart = clock.Now()
			}

			h.stats.nretries++
			log.Debug("http request will be retried",
				zap.String("url", req.URL.String()),
				zap.String("method", req.Method),

				zap.Error(lastError),
				zap.Int("attempt", attempt),
				zap.Int("statusCode", lastCode),
				zap.String("statusCodeText", http.StatusText(lastCode)),

				zap.Duration("retryDuration", clock.Now().Sub(retryStart)),
			)

			var toSleep time.Duration
			if lastRetryAfter != nil {
				backoffReset = false // if resp contains retry-after header, reset backoff
				toSleep = *lastRetryAfter
			} else {
				if !backoffReset {
					backoffReset = true
					b.Reset()
				}

				toSleep = b.NextBackOff()
			}

			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-clock.After(toSleep):
			}
		}

		attempt++
		resp, err := h.roundTripper.RoundTrip(req)
		lastError = err
		if err != nil {
			var errRetry ErrorRetriable
			if errors.As(err, &errRetry) {
				if errRetry.Temporary() || errRetry.Timeout() {
					continue
				}
			}
			return nil, err
		}

		lastCode = resp.StatusCode
		switch resp.StatusCode {
		// list duplicated, search: httpretry-retriable-status-codes
		case http.StatusRequestTimeout:
		case http.StatusTooManyRequests:
		case http.StatusInternalServerError:
		case http.StatusBadGateway:
		case http.StatusServiceUnavailable:
		case http.StatusGatewayTimeout:
		default:
			return resp, nil
		}

		lastRetryAfter = parseRetryAfterHeader(log, clock, resp.Header.Get("retry-after"))
	}

	return nil, ctx.Err()
}

func parseRetryAfterHeader(log *zap.Logger, clock clockwork.Clock, v string) *time.Duration {
	if v == "" {
		return nil
	}

	seconds, errStrconv := strconv.ParseInt(v, 10, 64)
	if errStrconv != nil {
		t, errParseTime := http.ParseTime(v)
		if errParseTime != nil {
			log.Warn("unable to parse retry-after header",
				zap.String("value", v),
				zap.NamedError("errStrconv", errStrconv),
				zap.NamedError("errParseTime", errParseTime),
			)
			return nil
		}

		td := t.Sub(clock.Now())
		return &td
	}

	sd := time.Second * time.Duration(seconds)
	return &sd
}
