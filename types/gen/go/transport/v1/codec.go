package v1

import (
	"bytes"

	"github.com/golang/protobuf/jsonpb"
)

func (r *Response) UnmarshalBinary(data []byte) error {
	return (&jsonpb.Unmarshaler{
		AllowUnknownFields: true,
	}).Unmarshal(bytes.NewReader(data), r)
}

// The Redis library that we're using only implicitely
// marshals very basic, non-nested types. Hence, we need
// a way to wrap a more complex type into something that
// we can implement a BinaryEnocder for.
func (r *Request) MarshalBinary() ([]byte, error) {
	writer := &bytes.Buffer{}

	if err := (&jsonpb.Marshaler{
		EmitDefaults: true,
	}).Marshal(writer, r); err != nil {
		return nil, err
	}

	return writer.Bytes(), nil
}
