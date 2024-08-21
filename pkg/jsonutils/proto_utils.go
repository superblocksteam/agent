package jsonutils

import (
	"encoding/json"
	"strconv"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

// Converts a JSON string to a structpb.Value by parsing it
// Fallback value is the string itself as a proto string
func ToProto(val string) (valPb *structpb.Value, err error) {
	if val == "" || val == "null" {
		return structpb.NewNullValue(), nil
	}

	switch val[0] {
	case '{':
		m := map[string]interface{}{}
		if err := json.Unmarshal([]byte(val), &m); err != nil {
			return nil, err
		}
		valPb, err = structpb.NewValue(m)
	case '[':
		m := []interface{}{}
		if err := json.Unmarshal([]byte(val), &m); err != nil {
			return nil, err
		}
		valPb, err = structpb.NewValue(m)
	default:
		if f, err := strconv.ParseFloat(val, 64); err == nil {
			valPb = structpb.NewNumberValue(f)
		} else if b, err := strconv.ParseBool(val); err == nil {
			valPb = structpb.NewBoolValue(b)
		} else {
			var r string
			// See if we can parse it as json since sometimes we will write json strings,
			// otherwise just treat it as a normal string
			if e := json.Unmarshal([]byte(val), &r); e != nil {
				valPb, err = structpb.NewValue(val)
			} else {
				valPb, err = structpb.NewValue(r)
			}
		}
	}
	return
}

func MapToProto[T any](data map[string]T, result proto.Message) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	unmarshaler := protojson.UnmarshalOptions{DiscardUnknown: true}
	return unmarshaler.Unmarshal(jsonData, result)
}

func ToStruct[T proto.Message](ptr T) (valPb *structpb.Struct, err error) {
	jsonData, err := protojson.Marshal(ptr)
	if err != nil {
		return nil, err
	}

	res := &structpb.Struct{}
	unmarshaler := protojson.UnmarshalOptions{DiscardUnknown: true}
	if err := unmarshaler.Unmarshal(jsonData, res); err != nil {
		return nil, err
	}
	return res, nil
}
