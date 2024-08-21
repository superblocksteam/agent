package redis

import (
	"errors"

	"context"

	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/worker"
	"google.golang.org/protobuf/proto"

	redis "github.com/redis/go-redis/v9"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

func UnwrapOneRedisProtoMessageFromStream[T proto.Message](streams []redis.XStream, zero func() T, stream, location string) (T, error) {
	if len(streams) != 1 {
		return zero(), errors.New("expected exactly one stream")
	}

	if streams[0].Stream != stream {
		return zero(), errors.New("unexpected stream")
	}

	if len(streams[0].Messages) != 1 {
		return zero(), errors.New("expected exactly one message from stream")
	}

	if streams[0].Messages[0].Values == nil {
		return zero(), errors.New("message is malformed")
	}

	messages, err := UnwrapRedisProtoMessages[T]([]redis.XMessage{
		streams[0].Messages[0],
	}, zero, location)
	if err != nil {
		return zero(), err
	}

	return messages[0], nil
}

func UnwrapRedisProtoMessages[T proto.Message](messages []redis.XMessage, zero func() T, location string) ([]T, error) {
	data := make([]T, len(messages))

	for idx, msg := range messages {
		var raw []byte
		{
			val, ok := msg.Values[location]
			if !ok {
				continue
			}

			typed, ok := val.(string)
			if !ok {
				continue
			}

			raw = []byte(typed)
		}

		wrapper := utils.BinaryProtoWrapper[T]{
			Message: zero(),
		}

		if err := wrapper.UnmarshalBinary(raw); err != nil {
			return nil, err
		}

		data[idx] = wrapper.Message
	}

	return data, nil
}

func SendWorkerMessage(ctx context.Context, redisClient *redis.Client, stream string, inbox string, bucket string, pluginName string, reqData *transportv1.Request_Data_Data) (string, error) {
	return redisClient.XAdd(ctx, &redis.XAddArgs{
		Stream:     stream,
		NoMkStream: true,
		Values: map[string]any{
			"data": &transportv1.Request{
				Inbox: inbox,
				Topic: inbox,
				Data: &transportv1.Request_Data{
					Pinned: &transportv1.Request_Data_Pinned{
						Bucket:  bucket,
						Name:    pluginName,
						Version: "v0.0.1", // NOTE(frank): The version is meaningless here!
						Event:   string(worker.EventFromContext(ctx)),
						Carrier: tracer.Propagate(ctx),
					},
					Data: reqData,
				},
			},
		},
	}).Result()
}
