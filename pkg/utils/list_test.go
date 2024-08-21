package utils

import (
	"reflect"
	"testing"
)

func TestList_Add(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name        string
		items       []int
		expectedLen int
	}{
		{
			name:        "Add single item",
			items:       []int{1},
			expectedLen: 1,
		},
		{
			name:        "Add multiple items",
			items:       []int{1, 2, 3},
			expectedLen: 3,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			list := NewList[int]()
			for _, item := range test.items {
				list.Add(item)
			}

			if len(list.Contents()) != test.expectedLen {
				t.Errorf("Expected list length to be %d, but got %d", test.expectedLen, len(list.Contents()))
			}
		})
	}
}

func TestList_AddContents(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name          string
		items         []int
		expectedItems []int
	}{
		{
			name:          "Add items to empty list",
			items:         []int{1, 2, 3},
			expectedItems: []int{1, 2, 3},
		},
		{
			name:          "Add items to non-empty list",
			items:         []int{1, 2, 3, 4, 5},
			expectedItems: []int{1, 2, 3, 4, 5},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			list := NewList[int]()
			for _, item := range test.items {
				list.Add(item)
			}

			contents := list.Contents()
			if !reflect.DeepEqual(contents, test.expectedItems) {
				t.Errorf("Expected contents to be %v, but got %v", test.expectedItems, contents)
			}
		})
	}
}
