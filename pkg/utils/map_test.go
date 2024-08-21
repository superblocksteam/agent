package utils

import (
	"reflect"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestMap_FromGoMap(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name string
		data map[string]int
	}{
		{
			name: "Convert nil map",
			data: nil,
		},
		{
			name: "Convert empty map",
			data: map[string]int{},
		},
		{
			name: "Convert map with single item",
			data: map[string]int{"a": 1},
		},
		{
			name: "Convert populated map",
			data: map[string]int{"a": 1, "b": 2, "c": 3},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m := NewMapFromGoMap[int](test.data)

			if test.data == nil {
				if m == nil {
					t.Error("Expected non-nil map, but got nil map")
				}

				if m.Size() != 0 {
					t.Errorf("Expected map size to be 0, but got %d", m.Size())
				}
			} else if m.Size() != len(test.data) {
				t.Errorf("Expected map size to be %d, but got %d", len(test.data), m.Size())
			}

			for k, expected := range test.data {
				val, ok := m.Get(k)
				if !ok || val != expected {
					t.Errorf("Expected key %s to have value %d, but got %d", k, expected, val)
				}
			}
		})
	}
}

func TestMap_PutGet(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name    string
		data    map[string]int
		putData map[string]int
	}{
		{
			name:    "Put and Get single item",
			data:    map[string]int{},
			putData: map[string]int{"a": 1},
		},
		{
			name:    "Put and Get multiple items",
			data:    map[string]int{},
			putData: map[string]int{"a": 1, "b": 2, "c": 3},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m := NewMap[int]()
			for k, v := range test.putData {
				m.Put(k, v)
			}

			for k, expected := range test.putData {
				val, ok := m.Get(k)
				if !ok || val != expected {
					t.Errorf("Expected key %s to have value %d, but got %d", k, expected, val)
				}
			}
		})
	}
}

func TestMap_Del(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name        string
		data        map[string]int
		delKey      string
		expectedLen int
	}{
		{
			name:        "Delete existing key",
			data:        map[string]int{"a": 1, "b": 2, "c": 3},
			delKey:      "b",
			expectedLen: 2,
		},
		{
			name:        "Delete non-existent key",
			data:        map[string]int{"a": 1, "b": 2, "c": 3},
			delKey:      "d",
			expectedLen: 3,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m := NewMap[int]()
			for k, v := range test.data {
				m.Put(k, v)
			}

			m.Del(test.delKey)

			_, ok := m.Get(test.delKey)
			if ok {
				t.Errorf("Expected key %s to be deleted", test.delKey)
			}

			if m.Size() != test.expectedLen {
				t.Errorf("Expected map size to be %d, but got %d", test.expectedLen, m.Size())
			}
		})
	}
}

func TestMap_KeysValuesSize(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name         string
		data         map[string]int
		expectedKeys []string
	}{
		{
			name:         "Empty map",
			data:         map[string]int{},
			expectedKeys: []string{},
		},
		{
			name:         "Non-empty map",
			data:         map[string]int{"a": 1, "b": 2, "c": 3},
			expectedKeys: []string{"a", "b", "c"},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m := NewMap[int]()
			for k, v := range test.data {
				m.Put(k, v)
			}

			if m.Size() != len(test.expectedKeys) {
				t.Errorf("Expected map size to be %d, but got %d", len(test.expectedKeys), m.Size())
			}

			keys := m.Keys().Contents()
			for _, key := range keys {
				if _, ok := test.data[key]; !ok {
					t.Errorf("Unexpected key %s in map keys", key)
				}
			}

			values := m.Values()
			for _, value := range values.Contents() {
				found := false
				for _, expected := range test.data {
					if value == expected {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("Unexpected value %d in map values", value)
				}
			}
		})
	}
}

func TestMap_Clone(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name    string
		data    map[string]int
		newData map[string]int
	}{
		{
			name:    "Clone empty map",
			data:    map[string]int{},
			newData: map[string]int{"a": 1},
		},
		{
			name:    "Clone non-empty map",
			data:    map[string]int{"a": 1, "b": 2, "c": 3},
			newData: map[string]int{"d": 4, "e": 5},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m := NewMap[int]()
			for k, v := range test.data {
				m.Put(k, v)
			}

			cloned := m.Clone()

			for k, expected := range test.data {
				val, ok := cloned.Get(k)
				if !ok || val != expected {
					t.Errorf("Expected key %s to have value %d, but got %d", k, expected, val)
				}
			}

			for k, v := range test.newData {
				cloned.Put(k, v)
			}

			for k := range test.newData {
				if _, ok := m.Get(k); ok {
					t.Errorf("Expected key %s to not be in the original map", k)
				}
			}
		})
	}
}

func TestMap_Merge(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name         string
		data1        map[string]int
		data2        map[string]int
		expectedData map[string]int
	}{
		{
			name:         "Merge empty maps",
			data1:        map[string]int{},
			data2:        map[string]int{},
			expectedData: map[string]int{},
		},
		{
			name:         "Merge non-empty maps",
			data1:        map[string]int{"a": 1, "b": 2},
			data2:        map[string]int{"c": 3, "d": 4},
			expectedData: map[string]int{"a": 1, "b": 2, "c": 3, "d": 4},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m1 := NewMap[int]()
			for k, v := range test.data1 {
				m1.Put(k, v)
			}

			m2 := NewMap[int]()
			for k, v := range test.data2 {
				m2.Put(k, v)
			}

			merged := m1.Merge(m2)

			for k, expected := range test.expectedData {
				val, ok := merged.Get(k)
				if !ok || val != expected {
					t.Errorf("Expected key %s to have value %d, but got %d", k, expected, val)
				}
			}
		})
	}
}

func TestMap_ToGoMap(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name string
		data map[string]int
	}{
		{
			name: "Convert empty map",
			data: map[string]int{},
		},
		{
			name: "Convert non-empty map",
			data: map[string]int{"a": 1, "b": 2, "c": 3},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m := NewMap[int]()
			for k, v := range test.data {
				m.Put(k, v)
			}

			gomap := m.ToGoMap()

			for k, expected := range test.data {
				val, ok := gomap[k]
				if !ok || val != expected {
					t.Errorf("Expected key %s to have value %d, but got %d", k, expected, val)
				}
			}
		})
	}
}

func TestMap_Iterator(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name string
		data map[string]int
	}{
		{
			name: "Iterate over empty map",
			data: map[string]int{},
		},
		{
			name: "Iterate over map with single item",
			data: map[string]int{"a": 1},
		},
		{
			name: "Iterate over map with multiple items",
			data: map[string]int{"a": 1, "b": 2, "c": 3},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m := NewMap[int]()
			for k, v := range test.data {
				m.Put(k, v)
			}

			iter := m.Iterator()

			results := map[string]int{}

			for iter.HasNext() {
				k, v := iter.Next()
				results[k] = v
			}

			if !reflect.DeepEqual(test.data, results) {
				t.Errorf("Expected map and iterated values to be the same, got %+v and %+v", test.data, results)
			}
		})
	}
}

func TestMap_ConcurrentIteratorAccess(t *testing.T) {
	t.Parallel()

	m := NewMap[int]()
	m.Put("key", 0)

	var wg sync.WaitGroup
	defer wg.Wait()

	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 10; i++ {
			mi := m.Iterator()
			for mi.HasNext() {
				k, v := mi.Next()
				t.Logf("k %s, v %d", k, v)

				// gives other go routine time to make progress
				// not required to force race, just shows how concurrent
				// modifications to the map show up here
				time.Sleep(time.Millisecond)
			}
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 10; i++ {
			v, ok := m.Get("key")
			require.True(t, ok)
			v++
			m.Put("key", v)

			// gives other go routine time to make progress
			// not required to force race
			time.Sleep(time.Millisecond)
		}
	}()
}

func TestCopyGoMap(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name string
		data map[string]int
	}{
		{
			name: "Copy nil map",
			data: nil,
		},
		{
			name: "Copy empty map",
			data: map[string]int{},
		},
		{
			name: "Copy map with single item",
			data: map[string]int{"a": 1},
		},
		{
			name: "Copy populated map",
			data: map[string]int{"a": 1, "b": 2, "c": 3},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			m := CopyGoMap(test.data)

			if reflect.ValueOf(test.data).Pointer() == reflect.ValueOf(m).Pointer() {
				t.Error("Expected map to be a copy, but it is the same map")
			}

			if len(test.data) != len(m) {
				t.Errorf("Expected map size to be %d, but got %d", len(test.data), len(m))
			}

			for k, expected := range test.data {
				val, ok := m[k]
				if !ok || val != expected {
					t.Errorf("Expected key %s to have value %d, but got %d", k, expected, val)
				}
			}
		})
	}
}
