package redis

import (
	"context"
	"time"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

func Handle[T, K proto.Message](ctx context.Context, ping, send func(context.Context, string) error, req K, heartbeat time.Duration, fn func(K) T) error {
	done := make(chan struct{})
	stopped := make(chan struct{})

	go func() {
		ping(ctx, "ping")

		for {
			select {
			case <-done:
				close(stopped)
				return
			case <-time.After(heartbeat):
				ping(ctx, "ping")
			}
		}
	}()

	resp := fn(req)

	// tell pinger to stop
	close(done)

	// wait until pinger has stopped
	<-stopped

	data, err := (&protojson.MarshalOptions{
		Multiline:       false,
		AllowPartial:    true,
		UseProtoNames:   false,
		UseEnumNumbers:  false,
		EmitUnpopulated: false,
	}).Marshal(resp)
	if err != nil {
		return err
	}

	// send response
	return send(ctx, prefixResponse+string(data))
}
