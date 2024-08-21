package ssewatcher

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/superblocksteam/agent/internal/signature/reconciler"
	"github.com/superblocksteam/agent/internal/sse"

	"go.uber.org/zap"
)

const (
	eventShutdown             = "shutdown"
	eventSigningKeyJobUpdated = "signing-key-job-updated"
)

var (
	errSawOk    = errors.New("saw ok")
	errShutdown = errors.Join(errors.New("shutdown"), errSawOk)
)

type watcher struct {
	C <-chan reconciler.SigningKeyRotationEvent
	c chan reconciler.SigningKeyRotationEvent

	log     *zap.Logger
	client  *http.Client
	headers map[string]string
	options options
	url     string
}

func New(log *zap.Logger, url string, headers map[string]string, options ...Option) (*watcher, error) {
	ch := make(chan reconciler.SigningKeyRotationEvent)
	w := &watcher{
		C:       ch,
		c:       ch,
		log:     log.Named("signing/watcher"),
		headers: headers,
		options: defaults(),
		url:     url,
	}

	for _, o := range options {
		o(&w.options)
	}

	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.TLSClientConfig = w.options.tlsConfig

	w.client = &http.Client{
		Transport: transport,
	}
	transport.DisableCompression = true // server buffers responses with this enabled

	_, err := w.makeRequest(context.Background())
	if err != nil {
		return nil, fmt.Errorf("cannot create initial watcher request: %w", err)
	}
	return w, nil
}

func (w *watcher) makeRequest(ctx context.Context) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", w.url+"/api/v1/keyrotations/watch", nil)
	if err != nil {
		return nil, err
	}
	for k, v := range w.headers {
		req.Header.Add(k, v)
	}
	return req, nil
}

func (w *watcher) Run(ctx context.Context) error {
	log := w.log

	defer close(w.c)

	inBackoff := false
	for ctx.Err() == nil {
		if inBackoff {
			d := w.options.backoff.NextBackOff()
			log.Warn("watch backoff, sleeping", zap.Duration("sleep", d))
			time.Sleep(d)
		}

		req, err := w.makeRequest(ctx)
		if err != nil {
			// should not be here as it should be caught in constructor
			log.Error("cannot create watch requests, giving up", zap.Error(err))

			// breaks Run contract (only return context errors), but this should never happen so
			// whatever; better to blow up here incorrectly
			return err
		}

		err = watch(ctx, log, w.client, req, w.c)
		if err != nil {
			if errors.Is(err, errSawOk) {
				// if http.StatusOK seen, reset backoff
				inBackoff = false
			}

			if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
				continue
			} else if errors.Is(err, errShutdown) {
				log.Debug("received server shutdown, retrying")
				continue
			} else if errors.Is(err, io.EOF) {
				log.Debug("received EOF, retrying")
				continue
			} else {
				log.Error("watch error", zap.Error(err))
			}

			if !inBackoff {
				inBackoff = true
				w.options.backoff.Reset()
			}
		}
	}

	return ctx.Err()
}

func watch(ctx context.Context, log *zap.Logger, client *http.Client, req *http.Request, ch chan reconciler.SigningKeyRotationEvent) error {
	waitParse := func() {}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("cannot make watch request: %w", err)
	}
	defer func() {
		err := resp.Body.Close()
		if err != nil {
			log.Warn("error closing watch request", zap.Error(err))
		}
		waitParse()
	}()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("request status not-OK: %s (%d)",
			http.StatusText(resp.StatusCode),
			resp.StatusCode,
		)
	}

	log.Info("started watching for signing jobs")

	errc := make(chan error, 1)
	events := make(chan sse.Event)
	go func() {
		errc <- sse.Parse(log, resp.Body, events)
		close(events)
	}()
	waitParse = func() {
		err = <-errc
		if err != nil && !errors.Is(err, context.Canceled) {
			log.Warn("error parsing SSE", zap.Error(err))
		}
	}

	for ctx.Err() == nil {
		var event sse.Event
		var ok bool

		select {
		case <-ctx.Done():
			return errors.Join(ctx.Err(), errSawOk)
		case event, ok = <-events:
			if !ok {
				return errors.Join(io.EOF, errSawOk)
			}
		}

		if event.Name == eventShutdown {
			return errShutdown
		}

		if event.Name != eventSigningKeyJobUpdated {
			log.Warn("unknown event", zap.String("event.Name", event.Name))
			continue
		}

		skre, err := eventToSkre(event)
		if err != nil {
			log.Warn("issue parsing event",
				zap.Error(err),
				zap.Any("event", event),
			)
			continue
		}

		select {
		case <-ctx.Done():
			return errors.Join(ctx.Err(), errSawOk)
		case ch <- skre:
		}
	}

	return errors.Join(ctx.Err(), errSawOk)
}

/*
Example SSE for signing:
	event: signing-key-job-updated
	data: {"signingKeyId":"","status":null}
*/

func eventToSkre(event sse.Event) (reconciler.SigningKeyRotationEvent, error) {
	if event.Data == "" {
		return reconciler.SigningKeyRotationEvent{}, nil
	}

	var skre reconciler.SigningKeyRotationEvent
	err := json.Unmarshal([]byte(event.Data), &skre)
	if err != nil {
		return skre, err
	}
	return skre, nil
}
