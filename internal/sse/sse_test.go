package sse

import (
	"io"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/testutils"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

type args struct {
	events chan Event
	expect []Event
	log    *zap.Logger
	logs   *observer.ObservedLogs
	reader io.Reader
}

type fakeReader struct {
	delay io.Reader
}

func (f *fakeReader) Read(p []byte) (n int, err error) {
	if f.delay != nil {
		time.Sleep(10 * time.Millisecond)
		return f.delay.Read(p)
	} else {
		return 0, io.EOF
	}
}

func validArgs(t *testing.T) *args {
	log, logs := testutils.NewZapTestObservedLogger(t)
	return &args{
		events: make(chan Event),
		log:    log,
		logs:   logs,
		reader: strings.NewReader(`event: event-name
data: {}
data: {}
id: uuid
:comment

`),

		expect: []Event{
			{
				Name: "event-name",
				Data: "{}\n{}",
				Id:   "uuid",
			},
		},
	}
}

func verify(t *testing.T, args *args, expectedErr error) <-chan struct{} {
	var wg sync.WaitGroup
	t.Cleanup(wg.Wait)

	done := make(chan struct{})

	wg.Add(1)
	go func() {
		defer wg.Done()
		defer close(args.events)

		err := Parse(args.log, args.reader, args.events)
		if expectedErr == nil {
			require.NoError(t, err)
		} else {
			t.Logf("error: %v", err)
			require.ErrorIs(t, err, expectedErr)
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		defer close(done)

		events := []Event{}
		for event := range args.events {
			events = append(events, event)
		}
		d := cmp.Diff(args.expect, events)
		if d != "" {
			t.Fatalf("expected events diff\n%s", d)
		}
	}()

	return done
}

func TestOk(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	verify(t, args, nil)
}

func TestOkAnyOrder(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.reader = strings.NewReader(`id: uuid
data: {}
event: event-name
:comment
data: {}

`)
	verify(t, args, nil)
}

func TestOkEmpty(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.expect = []Event{}
	args.reader = strings.NewReader("\n\n\n\n\n")
	verify(t, args, nil)
}

func TestOkDelayRead(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.reader = &fakeReader{delay: args.reader}
	verify(t, args, nil)
}

func TestOkEof(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.expect = []Event{}
	args.reader = &fakeReader{}
	verify(t, args, nil)
}

func TestErrChoppedEvent(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.expect = []Event{}
	args.reader = strings.NewReader("event: chopped")
	verify(t, args, ErrChoppedEvent)
}

func TestErrMultiline(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.expect = []Event{
		{
			Name: "multiline",
			Data: "{",
		},
	}
	args.reader = strings.NewReader(`event: multiline
data: {
	"key": "value"
}

`)
	<-verify(t, args, nil)
	testutils.RequireLogContains(t, args.logs, zap.WarnLevel, "found garbage in SSE stream")
}

func TestErrGarbage(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.expect = []Event{}
	args.reader = strings.NewReader(`"key": "value"
}
`)
	verify(t, args, ErrGarbage)
}
