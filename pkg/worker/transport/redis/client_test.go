package redis

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestHandler(t *testing.T) {
	for _, test := range []struct {
		name      string
		pings     []string
		sends     []string
		heartbeat time.Duration
		req       *structpb.Value
		fn        func(*structpb.Value) *structpb.Value
		err       error
	}{
		{
			name:      "normal",
			pings:     []string{"ping"},
			sends:     []string{`RESPONSE"hi"`},
			heartbeat: 30 * time.Millisecond,
			req:       structpb.NewStringValue("hi"),
			fn:        func(req *structpb.Value) *structpb.Value { return req },
		},
		{
			name:      "multiple pings",
			pings:     []string{"ping", "ping"},
			sends:     []string{`RESPONSE"hi"`},
			req:       structpb.NewStringValue("hi"),
			heartbeat: 30 * time.Millisecond,
			fn: func(req *structpb.Value) *structpb.Value {
				time.Sleep(40 * time.Millisecond)
				return req
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			pings := []string(nil)
			sends := []string(nil)

			err := Handle(context.Background(), func(ctx context.Context, s string) error {
				pings = append(pings, s)
				return nil
			}, func(ctx context.Context, s string) error {
				sends = append(sends, s)
				return nil
			}, test.req, test.heartbeat, test.fn)

			assert.Equal(t, test.err, err)
			assert.Equal(t, test.pings, pings)
			assert.Equal(t, test.sends, sends)
		})
	}
}
