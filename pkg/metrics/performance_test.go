package metrics

import (
	"testing"

	"github.com/stretchr/testify/assert"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

func TestMergeIntoParentPerf(t *testing.T) {
	testCases := []struct {
		name     string
		parent   *transportv1.Performance
		perf     *transportv1.Performance
		expected *transportv1.Performance
	}{
		{
			name:     "nil parent, nil perf returns nil",
			parent:   nil,
			perf:     nil,
			expected: nil,
		},
		{
			name:     "perf with error sets parent error",
			parent:   &transportv1.Performance{},
			perf:     &transportv1.Performance{Error: true},
			expected: &transportv1.Performance{Error: true},
		},
		{
			name:     "parent with error doesn't get unset by perf without error",
			parent:   &transportv1.Performance{Error: true},
			perf:     &transportv1.Performance{Error: false},
			expected: &transportv1.Performance{Error: true},
		},
		{
			name: "perf merged into parent, with parent data taking precedence",
			parent: &transportv1.Performance{
				Error: true,
				PluginExecution: &transportv1.Performance_Observable{
					Start:    1,
					End:      2,
					Value:    10,
					Bytes:    2,
					Estimate: 55,
				},
				QueueRequest:  nil,
				QueueResponse: &transportv1.Performance_Observable{Start: 3, End: 4},
				KvStoreFetch:  &transportv1.Performance_Observable{},
				KvStorePush:   nil,
				Total:         &transportv1.Performance_Observable{Value: 9005},
			},
			perf: &transportv1.Performance{
				Error: true,
				PluginExecution: &transportv1.Performance_Observable{
					Start:    23,
					End:      27,
					Value:    9001,
					Bytes:    14,
					Estimate: 227,
				},
				QueueRequest:  &transportv1.Performance_Observable{Start: 1, End: 2},
				QueueResponse: &transportv1.Performance_Observable{Value: 25},
				KvStoreFetch:  &transportv1.Performance_Observable{Value: 100, Bytes: 7},
				KvStorePush:   nil,
				Total:         nil,
			},
			expected: &transportv1.Performance{
				Error: true,
				PluginExecution: &transportv1.Performance_Observable{
					Start:    1,
					End:      2,
					Value:    10,
					Bytes:    2,
					Estimate: 55,
				},
				QueueRequest:  &transportv1.Performance_Observable{Start: 1, End: 2},
				QueueResponse: &transportv1.Performance_Observable{Start: 3, End: 4, Value: 25},
				KvStoreFetch:  &transportv1.Performance_Observable{Value: 100, Bytes: 7},
				KvStorePush:   nil,
				Total:         &transportv1.Performance_Observable{Value: 9005},
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual := tc.parent
			MergeIntoParentPerf(actual, tc.perf)

			assert.Equal(t, tc.expected, actual)
		})
	}
}

func TestMergeObservable(t *testing.T) {
	testCases := []struct {
		name     string
		dest     *transportv1.Performance_Observable
		src      *transportv1.Performance_Observable
		expected *transportv1.Performance_Observable
	}{
		{
			name:     "nil src, nil dest returns nil",
			dest:     nil,
			src:      nil,
			expected: nil,
		},
		{
			name:     "nil src returns dest",
			dest:     &transportv1.Performance_Observable{Start: 1, End: 2},
			src:      nil,
			expected: &transportv1.Performance_Observable{Start: 1, End: 2},
		},
		{
			name:     "nil dest, non-nil src creates new observable",
			dest:     nil,
			src:      &transportv1.Performance_Observable{Value: 10, Bytes: 2},
			expected: &transportv1.Performance_Observable{Value: 10, Bytes: 2},
		},
		{
			name: "src does not override populated dest",
			dest: &transportv1.Performance_Observable{
				Start:    1,
				End:      2,
				Value:    10,
				Bytes:    2,
				Estimate: 55,
			},
			src: &transportv1.Performance_Observable{
				Start:    23,
				End:      27,
				Value:    9001,
				Bytes:    14,
				Estimate: 227,
			},
			expected: &transportv1.Performance_Observable{
				Start:    1,
				End:      2,
				Value:    10,
				Bytes:    2,
				Estimate: 55,
			},
		},
		{
			name: "populated src sets default dest",
			dest: &transportv1.Performance_Observable{},
			src: &transportv1.Performance_Observable{
				Start:    23,
				End:      27,
				Value:    9001,
				Bytes:    14,
				Estimate: 227,
			},
			expected: &transportv1.Performance_Observable{
				Start:    23,
				End:      27,
				Value:    9001,
				Bytes:    14,
				Estimate: 227,
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual := MergeObservable(tc.dest, tc.src)

			assert.Equal(t, tc.expected, actual)
		})
	}
}
