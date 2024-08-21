package remote

import (
	"context"
	"encoding/binary"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/avast/retry-go"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"

	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	intakev1 "github.com/superblocksteam/agent/types/gen/go/intake/v1"
	"github.com/superblocksteam/run"
)

type remote struct {
	// options is a reference to the provide options
	options *Options

	// buffer contains the current set of items that have not yet been flushed
	buffer *intakev1.Logs

	// mutex adds thread saftey to this emitter
	mutex sync.RWMutex

	// client is hte http client used to flush items
	intakeClient clients.IntakeClient

	// last is the time the last flush ocurred
	last time.Time

	// logger is the logger to use
	logger *zap.Logger

	// ticker is used to enforce flushMaxDuration
	ticker *time.Ticker

	final chan struct{}
	done  chan struct{}

	run.ForwardCompatibility
}

type Options struct {
	enabled          bool
	flushMaxItems    int
	flushMaxDuration time.Duration
	flushMaxSize     int
	maxRetries       int
	headers          http.Header
	whitelist        map[string]bool
}

func Emitter(intakeClient clients.IntakeClient, options ...Option) emitter.Emitter {
	ops := apply(options...)

	e := &remote{
		options: ops,
		buffer: &intakev1.Logs{
			Logs: []*structpb.Struct{},
		},
		intakeClient: intakeClient,
		mutex:        sync.RWMutex{},
		last:         time.Now(),
		ticker:       time.NewTicker(ops.flushMaxDuration),
		final:        make(chan struct{}),
		done:         make(chan struct{}),
	}

	e.options.whitelist[e.Trigger()] = true // NOTE(frank): Our trigger should always be a valid field.

	return e
}

func (l *remote) Write(time time.Time, level string, message string, fields map[string]any) error {
	filtered := map[string]any{}
	{
		for k, v := range fields {
			if _, ok := l.options.whitelist[k]; ok {
				filtered[k] = v
			}
		}
	}

	json, err := structpb.NewStruct(filtered)
	if err != nil {
		return err
	}

	// TODO(frank): Make these keys configurable.
	json.Fields["ts"] = structpb.NewNumberValue(float64(time.UnixMilli()))
	json.Fields["level"] = structpb.NewStringValue(level)
	json.Fields["msg"] = structpb.NewStringValue(message)

	l.mutex.Lock()
	l.buffer.Logs = append(l.buffer.Logs, json)
	l.mutex.Unlock()

	if l.full() {
		return l.Flush(nil)
	}

	return nil
}

// full determines whether the buffer is full. This method
// must be called before an invocation to Flush.
func (l *remote) full() bool {
	l.mutex.RLock()
	defer l.mutex.RUnlock()

	if len(l.buffer.Logs) > l.options.flushMaxItems {
		return true
	}

	if time.Since(l.last) > l.options.flushMaxDuration {
		return true
	}

	if binary.Size(l.buffer) > l.options.flushMaxSize {
		return true
	}

	return false
}

func (l *remote) Flush(notify chan struct{}) (err error) {
	// NOTE(frank): We need the lock for the entire method so that we
	// don't add to the buffer after we write but before we reset.
	l.mutex.Lock()
	defer l.mutex.Unlock()

	doNotify := func() {
		if notify != nil {
			notify <- struct{}{}
		}
	}

	if len(l.buffer.Logs) == 0 {
		doNotify()
		return nil
	}

	logger := l.logger.With(
		zap.Int("count", len(l.buffer.Logs)),
		zap.Int("batch.max_items", l.options.flushMaxItems),
		zap.Duration("batch.max_duration", l.options.flushMaxDuration),
		zap.Int("batch.max_size", l.options.flushMaxSize),
		zap.Int("batch.max_retries", l.options.maxRetries),
	)

	request := &intakev1.Logs{
		Logs: l.buffer.Logs,
	}

	go func() {
		if err := retry.Do(
			func() error {
				resp, err := l.intakeClient.SendRemoteLogs(context.Background(), nil, l.options.headers, request)
				if err != nil {
					logger.Debug("could not flush logs: received error from server", zap.Error(err))
					return err
				}
				if resp.StatusCode != http.StatusAccepted {
					logger.Debug("could not flush logs: got non-OK response from server", zap.Int("status_code", resp.StatusCode))
					err = fmt.Errorf("flushing logs received non-OK response from server")
				}
				return err
			},
			retry.Attempts(uint(l.options.maxRetries)),
		); err != nil {
			logger.Warn("could not flush remote logs: dropping", zap.Error(err))
		}
		doNotify()
	}()

	l.buffer.Logs = []*structpb.Struct{}
	l.last = time.Now()

	return nil
}

func (l *remote) Name() string {
	return "remote emitter"
}

func (l *remote) Run(context.Context) error {
	for {
		select {
		case <-l.done:
			// NOTE(frank): we do this here instead of in
			// Close because we want close to return asap.
			<-l.final
			return nil
		case <-l.ticker.C:
			l.Flush(nil)
		}
	}
}

func (l *remote) Close(context.Context) (err error) {
	l.ticker.Stop()
	close(l.done)

	if err := l.Flush(l.final); err != nil {
		return err
	}

	return
}

func (*remote) Alive() bool { return true }

func (l *remote) Logger(logger *zap.Logger) {
	(*l).logger = logger.With(zap.String("who", "emitter.remote"))
}

func (l *remote) Trigger() string { return "remote" }
func (l *remote) Enabled() bool   { return l.options.enabled }
