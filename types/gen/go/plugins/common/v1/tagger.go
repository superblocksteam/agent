package v1

import "github.com/golang/protobuf/jsonpb"

var (
	marshaler = &jsonpb.Marshaler{}
)

func (x *SQLMetadata_Minified) Tags() (map[string][]byte, error) {
	data := make(map[string][]byte)

	for name, value := range x.Tables {
		encoding, err := marshaler.MarshalToString(value)
		if err != nil {
			return nil, err
		}

		data[name] = []byte(encoding)
	}

	return data, nil
}
