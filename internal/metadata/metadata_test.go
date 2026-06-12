package metadata

import (
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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
		{
			tagsString: "databaseLifecycle:environments:deployed,profile:production",
			expected: map[string][]string{
				"databaseLifecycle:environments": {"deployed"},
				"profile":                        {"production"},
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

func TestGetTagsSetMap(t *testing.T) {
	t.Parallel()

	tagsSetMap := GetTagsSetMap("profile:staging,profile:production,region:us-east-1")
	require.Len(t, tagsSetMap, 2)
	require.NotNil(t, tagsSetMap["profile"])
	assert.True(t, tagsSetMap["profile"].Contains("staging"))
	assert.True(t, tagsSetMap["profile"].Contains("production"))
	require.NotNil(t, tagsSetMap["region"])
	assert.True(t, tagsSetMap["region"].Contains("us-east-1"))

	assert.Empty(t, GetTagsSetMap(""))
}
