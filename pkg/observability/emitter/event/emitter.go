package event

import (
	"context"
	"sync"
	"time"

	"github.com/avast/retry-go"
	cloudevents "github.com/cloudevents/sdk-go/v2"
	e "github.com/cloudevents/sdk-go/v2/event"
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

type eventEmitter struct {
	options   *Options
	logger    *zap.Logger
	mutex     *sync.RWMutex
	ticker    *time.Ticker
	lastFlush time.Time
	buffer    []*cloudevents.Event
	final     chan struct{}
	done      chan struct{}

	run.ForwardCompatibility
}

type Options struct {
	Enabled          bool
	FlushMaxDuration time.Duration
	FlushMaxItems    int
	IntakeClient     clients.IntakeClient
	AgentId          string
}

func Emitter(options ...Option) emitter.Emitter {
	ops := apply(options...)

	return &eventEmitter{
		options:   ops,
		ticker:    time.NewTicker(ops.FlushMaxDuration),
		lastFlush: time.Now(),
		mutex:     &sync.RWMutex{},
		final:     make(chan struct{}),
		done:      make(chan struct{}),
	}
}

func (l *eventEmitter) Write(time time.Time, level string, message string, fields map[string]any) error {
	cloudEvent := cloudevents.NewEvent()

	if fields["type"] == ExecuteEventType {
		eventData := fields["data"]
		cloudEvent.SetID(fields["id"].(string))
		cloudEvent.SetSource("orchestrator")
		cloudEvent.SetType(ExecuteEventType)
		cloudEvent.SetSpecVersion("1")
		cloudEvent.SetTime(time.UTC())
		cloudEvent.SetData(e.ApplicationJSON, eventData)
	} else {
		l.logger.Error("Unknown event type", zap.String("type", message))
		return nil
	}

	l.mutex.Lock()
	l.buffer = append(l.buffer, &cloudEvent)
	l.mutex.Unlock()

	if l.full() {
		return l.Flush(nil)
	}

	return nil
}

func (l *eventEmitter) Name() string {
	return "event emitter"
}

func (l *eventEmitter) Flush(notify chan struct{}) error {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	doNotify := func() {
		if notify != nil {
			notify <- struct{}{}
		}
	}

	if len(l.buffer) == 0 {
		doNotify()
		return nil
	}

	cloudEvents := l.buffer
	l.buffer = []*cloudevents.Event{}
	l.lastFlush = time.Now()

	go func() {
		err := retry.Do(
			func() error {
				var err error
				l.logger.Info("flushing events", zap.Int("count", len(cloudEvents)))
				_, err = l.options.IntakeClient.LogCloudEvents(context.Background(), &l.options.FlushMaxDuration, cloudEvents)
				return err
			},
			retry.Delay(time.Second),
			retry.Attempts(3), // make this configurable?
		)
		if err != nil {
			l.logger.Warn("could not flush logs; dropping", zap.Error(err))
		}
		doNotify()
	}()

	return nil
}

func (l *eventEmitter) Run(context.Context) error {
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

func (l *eventEmitter) Close(context.Context) (err error) {
	l.ticker.Stop()
	close(l.done)

	if err := l.Flush(l.final); err != nil {
		return err
	}

	return
}

func (*eventEmitter) Alive() bool { return true }

func (l *eventEmitter) Logger(logger *zap.Logger) {
	(*l).logger = logger.With(zap.String("who", "emitter.events"))
}

func (l *eventEmitter) Trigger() string { return "_event" }

func (l *eventEmitter) Enabled() bool { return l.options.Enabled }

func (l *eventEmitter) full() bool {
	if len(l.buffer) >= l.options.FlushMaxItems {
		return true
	}

	if time.Since(l.lastFlush) > l.options.FlushMaxDuration {
		return true
	}

	return false
}
