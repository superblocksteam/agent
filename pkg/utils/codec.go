package utils

import (
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

type BinaryProtoWrapper[T proto.Message] struct {
	Message T
}

func (b *BinaryProtoWrapper[T]) MarshalBinary() ([]byte, error) {
	marshaler := protojson.MarshalOptions{
		EmitUnpopulated: true,
	}
	return marshaler.Marshal(b.Message)
}

func (b *BinaryProtoWrapper[T]) UnmarshalBinary(data []byte) error {
	unmarshaler := protojson.UnmarshalOptions{
		DiscardUnknown: true,
	}
	return unmarshaler.Unmarshal(data, b.Message)
}
