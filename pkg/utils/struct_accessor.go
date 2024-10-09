package utils

import (
	"fmt"
	"strings"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func GetStructField(data *structpb.Struct, path string) (*structpb.Value, error) {
	if data == nil {
		return nil, fmt.Errorf("invalid data, data cannot be nil")
	}

	sections := strings.Split(path, ".")
	if len(sections) == 0 {
		return nil, fmt.Errorf("invalid input path '%s'", path)
	}

	cur := &structpb.Value{
		Kind: &structpb.Value_StructValue{
			StructValue: data,
		},
	}

	for i, s := range sections {
		fieldValue, ok := cur.GetStructValue().Fields[s]
		if !ok {
			return nil, fmt.Errorf("failed to access field '%s' from path '%s'", s, path)
		}

		if i != len(sections)-1 {
			if _, ok := fieldValue.GetKind().(*structpb.Value_StructValue); !ok {
				return nil, fmt.Errorf("failed to access field '%s' (that is not a struct) from path '%s'", s, path)
			}
		}
		cur = fieldValue
	}

	return cur, nil
}

func FindStringsInStruct(value *structpb.Value, f func(string)) {
	switch value.GetKind().(type) {
	case *structpb.Value_StringValue:
		f(value.GetStringValue())

	case *structpb.Value_StructValue:
		for _, v := range value.GetStructValue().GetFields() {
			FindStringsInStruct(v, f)
		}

	case *structpb.Value_ListValue:
		for _, v := range value.GetListValue().GetValues() {
			FindStringsInStruct(v, f)
		}
	}
}

func ProtoToStructPb(message proto.Message, options *protojson.MarshalOptions) (*structpb.Struct, error) {
	if options == nil {
		options = &protojson.MarshalOptions{}
	}

	data, err := (*options).Marshal(message)
	if err != nil {
		return nil, err
	}

	var s structpb.Struct
	if err := protojson.Unmarshal(data, &s); err != nil {
		return nil, err
	}

	return &s, nil
}

func StructPbToProto[T proto.Message](s *structpb.Struct, m T) error {
	data, err := protojson.Marshal(s)
	if err != nil {
		return err
	}

	if err := protojson.Unmarshal(data, m); err != nil {
		return err
	}

	return nil
}
