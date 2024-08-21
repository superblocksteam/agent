package v1

import (
	"context"
	"encoding/json"
	"fmt"

	structpb "google.golang.org/protobuf/types/known/structpb"
)

func (params *HttpParameters) Merge(other *HttpParameters) {
	if params == nil || other == nil {
		return
	}

	for k, v := range other.Query {
		(*params).Query[k] = v
	}

	for k, v := range other.Body {
		(*params).Body[k] = v
	}
}

func (params *HttpParameters) WithSuperblocksInjected(profile string) *HttpParameters {
	if params == nil {
		params = new(HttpParameters)
	}

	if params.Query == nil {
		params.Query = map[string]*structpb.Value{}
	}

	// NOTE(frank): We have constants for this but they're in a place that would
	// cause a circular import cycle. Need to extract into different package.
	params.Query["environment"] = structpb.NewStringValue(profile)
	params.Query["profile"] = structpb.NewStringValue(profile)

	return params
}

// AsInputs transforms every map value in HttpParameters, processes it with the given
// function and places it in a new map where strings are represented as *structpb.Value.
func (params *HttpParameters) AsInputs(ctx context.Context, process func(context.Context, string) (*string, error)) (inputs map[string]*structpb.Value, err error) {
	if params == nil {
		return
	}

	processValue := func(v *structpb.Value) (*structpb.Value, error) {
		switch v.Kind.(type) {
		case *structpb.Value_StringValue:
			raw, err := process(ctx, v.GetStringValue())
			if err != nil {
				return nil, fmt.Errorf("Could not render `%s`: %s", v.GetStringValue(), err.Error())
			}
			return structpb.NewStringValue(*raw), nil
		default:
			return v, nil
		}
	}

	inputs = map[string]*structpb.Value{}

	inputs["params"] = &structpb.Value{
		Kind: &structpb.Value_StructValue{
			StructValue: &structpb.Struct{
				Fields: map[string]*structpb.Value{},
			},
		},
	}
	inputs["body"] = &structpb.Value{
		Kind: &structpb.Value_StructValue{
			StructValue: &structpb.Struct{
				Fields: map[string]*structpb.Value{},
			},
		},
	}

	for k, v := range params.Query {
		fields := inputs["params"].GetStructValue().Fields
		fields[k], err = processValue(v)
		if err != nil {
			return nil, err
		}
	}

	for k, v := range params.Body {
		fields := inputs["body"].GetStructValue().Fields

		tmp, err := processValue(v)
		if err != nil {
			return nil, err
		}

		if _, ok := tmp.Kind.(*structpb.Value_StringValue); ok {
			var value structpb.Value

			if err := json.Unmarshal([]byte(tmp.GetStringValue()), &value); err != nil {
				fields[k] = tmp
			} else {
				fields[k] = &value
			}
		} else {
			fields[k] = tmp
		}
	}

	return inputs, nil
}
