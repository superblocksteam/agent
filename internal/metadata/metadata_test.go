package metadata

import (
	"reflect"
	"testing"
)

func TestGetTagsMap(t *testing.T) {
	tests := []struct {
		tagsString string
		expected   map[string][]string
	}{
		{
			tagsString: "",
			expected:   map[string][]string{},
		},
		{
			tagsString: "key1:value1,key2:value2,key1:value3,key3:value4",
			expected: map[string][]string{
				"key1": {"value1", "value3"},
				"key2": {"value2"},
				"key3": {"value4"},
			},
		},
		{
			tagsString: "key1:,key2:value2,key3:",
			expected: map[string][]string{
				"key2": {"value2"},
			},
		},
		{
			tagsString: "   key1 : value1 , key2 : value2   ,   key1 : value3   ",
			expected: map[string][]string{
				"key1": {"value1", "value3"},
				"key2": {"value2"},
			},
		},
	}

	for _, test := range tests {
		result := GetTagsMap(test.tagsString)
		if !reflect.DeepEqual(result, test.expected) {
			t.Errorf("TagsMap mismatch.\nExpected: %#v\nGot: %#v", test.expected, result)
		}
	}
}
