package utils

import (
	"sort"
	"testing"

	"github.com/stretchr/testify/assert"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func Test_GetStructField(t *testing.T) {
	t.Parallel()
	var data *structpb.Struct
	data, _ = structpb.NewStruct(map[string]interface{}{
		"firstName": "John",
		"address": map[string]interface{}{
			"city": "New York",
		},
		"runSql": map[string]interface{}{
			"useParameterized": true,
		},
		"company": map[string]interface{}{
			"address": map[string]interface{}{
				"city": "New York",
			},
		},
	})

	subData, _ := structpb.NewStruct(map[string]interface{}{
		"address": map[string]interface{}{
			"city": "New York",
		},
	})

	corruptedData, _ := structpb.NewStruct(map[string]interface{}{
		"address": map[string]interface{}{
			"city":  "Washington DC",
			"state": nil,
		},
	})

	for _, test := range []struct {
		name        string
		data        *structpb.Struct
		path        string
		expected    *structpb.Value
		expectError bool
	}{
		{
			name: "nested access 1",
			data: data,
			path: "address.city",
			expected: &structpb.Value{
				Kind: &structpb.Value_StringValue{
					StringValue: "New York",
				},
			},
		},
		{
			name: "nested access 2",
			data: data,
			path: "company.address.city",
			expected: &structpb.Value{
				Kind: &structpb.Value_StringValue{
					StringValue: "New York",
				},
			},
		},
		{
			name:        "not exist",
			data:        data,
			path:        "companyaddresscity",
			expectError: true,
		},
		{
			name:        "not exist 2",
			data:        data,
			path:        "company.address.awefawefwa",
			expectError: true,
		},
		{
			name: "access top level",
			data: data,
			path: "firstName",
			expected: &structpb.Value{
				Kind: &structpb.Value_StringValue{
					StringValue: "John",
				},
			},
		},
		{
			name: "access struct",
			data: data,
			path: "company",
			expected: &structpb.Value{
				Kind: &structpb.Value_StructValue{
					StructValue: subData,
				},
			},
		},
		{
			name: "access bool",
			data: data,
			path: "runSql.useParameterized",
			expected: &structpb.Value{
				Kind: &structpb.Value_BoolValue{
					BoolValue: true,
				},
			},
		},
		{
			name:        "nil data",
			data:        nil,
			path:        "runSql.useParameterized",
			expectError: true,
		},
		{
			name:        "nil field value",
			data:        corruptedData,
			path:        "address.state.shortCode",
			expectError: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			actual, err := GetStructField(test.data, test.path)
			if !test.expectError {
				assert.NoError(t, err)
			}
			assert.Equal(t, test.expected, actual)
		})
	}
}

func Test_FindStringsInStruct(t *testing.T) {
	t.Parallel()

	nestedStruct, _ := structpb.NewStruct(map[string]interface{}{
		"code": "top-level string",
		"steps": []interface{}{
			"list string 1",
			"list string 2",
			map[string]interface{}{
				"source": "nested struct in list",
			},
		},
		"config": map[string]interface{}{
			"UploadStep": "nested struct",
		},
	})
	for _, test := range []struct {
		name     string
		data     *structpb.Value
		expected []string
	}{
		{
			name: "string value",
			data: &structpb.Value{
				Kind: &structpb.Value_StringValue{
					StringValue: "hello world",
				},
			},
			expected: []string{"hello world"},
		},
		{
			name: "struct value",
			data: &structpb.Value{
				Kind: &structpb.Value_StructValue{
					StructValue: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"firstName": {
								Kind: &structpb.Value_StringValue{
									StringValue: "John",
								},
							},
							"lastName": {
								Kind: &structpb.Value_StringValue{
									StringValue: "Doe",
								},
							},
						},
					},
				},
			},
			expected: []string{"John", "Doe"},
		},
		{
			name: "list value",
			data: &structpb.Value{
				Kind: &structpb.Value_ListValue{
					ListValue: &structpb.ListValue{
						Values: []*structpb.Value{
							{
								Kind: &structpb.Value_StringValue{
									StringValue: "hello",
								},
							},
							{
								Kind: &structpb.Value_StringValue{
									StringValue: "world",
								},
							},
						},
					},
				},
			},
			expected: []string{"hello", "world"},
		},
		{
			name: "complex struct",
			data: structpb.NewStructValue(nestedStruct),
			expected: []string{
				"top-level string",
				"list string 1",
				"list string 2",
				"nested struct in list",
				"nested struct",
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			var actual []string

			FindStringsInStruct(test.data, func(s string) {
				actual = append(actual, s)
			})

			sort.Strings(test.expected)
			sort.Strings(actual)

			assert.Equal(t, test.expected, actual)
		})
	}
}

func Test_ProtoToStructPb(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name     string
		data     proto.Message
		expected map[string]any
	}{
		{
			name:     "empty proto",
			data:     &apiv1.Blocks{},
			expected: map[string]any{},
		},
		{
			name: "convert proto to structpb",
			data: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Name: "test-step-1",
					},
				},
				Metadata: &commonv1.Metadata{
					Id:           "api-id",
					Name:         "test-api",
					Organization: "test-org-id",
				},
				Trigger: &apiv1.Trigger{
					Config: &apiv1.Trigger_Application_{
						Application: &apiv1.Trigger_Application{
							Id: "app-id",
						},
					},
				},
			},
			expected: map[string]any{
				"blocks": []any{
					map[string]any{
						"name": "test-step-1",
					},
				},
				"metadata": map[string]any{
					"id":           "api-id",
					"name":         "test-api",
					"organization": "test-org-id",
				},
				"trigger": map[string]any{
					"application": map[string]any{
						"id": "app-id",
					},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			expectedStruct, err := structpb.NewStruct(test.expected)
			assert.NoError(t, err)

			actual, err := ProtoToStructPb(test.data)

			assert.NoError(t, err)
			AssertProtoEqual(t, expectedStruct, actual)
		})
	}
}

func Test_StructPbToProto(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name      string
		data      map[string]any
		actual    proto.Message
		expected  proto.Message
		expectErr bool
	}{
		{
			name:     "empty struct",
			data:     map[string]any{},
			actual:   &apiv1.Blocks{},
			expected: &apiv1.Blocks{},
		},
		{
			name: "unexpected field in struct",
			data: map[string]any{
				"unknown": "value",
			},
			actual:    &apiv1.Trigger{},
			expectErr: true,
		},
		{
			name: "convert structpb to proto",
			data: map[string]any{
				"blocks": []any{
					map[string]any{
						"name": "test-step-1",
					},
				},
				"metadata": map[string]any{
					"id":           "api-id",
					"name":         "test-api",
					"organization": "test-org-id",
				},
				"trigger": map[string]any{
					"application": map[string]any{
						"id": "app-id",
					},
				},
			},
			actual: &apiv1.Api{},
			expected: &apiv1.Api{
				Blocks: []*apiv1.Block{
					{
						Name: "test-step-1",
					},
				},
				Metadata: &commonv1.Metadata{
					Id:           "api-id",
					Name:         "test-api",
					Organization: "test-org-id",
				},
				Trigger: &apiv1.Trigger{
					Config: &apiv1.Trigger_Application_{
						Application: &apiv1.Trigger_Application{
							Id: "app-id",
						},
					},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			dataStruct, err := structpb.NewStruct(test.data)
			assert.NoError(t, err)

			err = StructPbToProto(dataStruct, test.actual)

			if test.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				AssertProtoEqual(t, test.expected, test.actual)
			}
		})
	}
}
