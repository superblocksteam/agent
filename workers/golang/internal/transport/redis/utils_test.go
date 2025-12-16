package redis

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStreamKeys(t *testing.T) {
	for _, tt := range []struct {
		name        string
		workerGroup string
		bucket      string
		events      []string
		expected    []string
		plugins     []string
		ephemeral   bool
	}{
		{
			name:        "happy path",
			workerGroup: "workerGroup",
			bucket:      "bucketName",
			events:      []string{"execute"},
			plugins:     []string{"postgres"},
			expected:    []string{"agent.workerGroup.bucket.bucketName.plugin.postgres.event.execute"},
		},
		{
			name:        "happy path ephemeral",
			workerGroup: "workerGroup",
			bucket:      "bucketName",
			events:      []string{"execute"},
			plugins:     []string{"postgres"},
			ephemeral:   true,
			expected:    []string{"agent.workerGroup.bucket.bucketName.ephemeral.plugin.postgres.event.execute"},
		},
		{
			name:        "with multiple events",
			workerGroup: "workerGroup",
			bucket:      "bucketName",
			events:      []string{"execute", "stream"},
			plugins:     []string{"postgres"},
			expected: []string{
				"agent.workerGroup.bucket.bucketName.plugin.postgres.event.execute",
				"agent.workerGroup.bucket.bucketName.plugin.postgres.event.stream",
			},
		},
		{
			name:        "with multiple plugins",
			workerGroup: "workerGroup",
			bucket:      "bucketName",
			events:      []string{"execute"},
			plugins:     []string{"postgres", "javascript"},
			expected: []string{
				"agent.workerGroup.bucket.bucketName.plugin.postgres.event.execute",
				"agent.workerGroup.bucket.bucketName.plugin.javascript.event.execute",
			},
		},
		{
			name:        "with multiple events and plugins ephemeral",
			workerGroup: "workerGroup",
			bucket:      "bucketName",
			events:      []string{"execute", "metadata"},
			plugins:     []string{"postgres", "javascript"},
			ephemeral:   true,
			expected: []string{
				"agent.workerGroup.bucket.bucketName.ephemeral.plugin.postgres.event.execute",
				"agent.workerGroup.bucket.bucketName.ephemeral.plugin.postgres.event.metadata",
				"agent.workerGroup.bucket.bucketName.ephemeral.plugin.javascript.event.execute",
				"agent.workerGroup.bucket.bucketName.ephemeral.plugin.javascript.event.metadata",
			},
		},
		{
			name:        "without events",
			workerGroup: "workerGroup",
			bucket:      "bucketName",
			events:      []string{},
			plugins:     []string{"postgres", "javascript"},
			expected:    []string{},
		},
		{
			name:        "without events ephemeral",
			workerGroup: "workerGroup",
			bucket:      "bucketName",
			events:      []string{},
			plugins:     []string{"postgres", "javascript"},
			ephemeral:   true,
			expected:    []string{},
		},
		{
			name:        "without plugins",
			workerGroup: "workerGroup",
			bucket:      "bucketName",
			events:      []string{"execute"},
			plugins:     []string{},
			expected:    []string{},
		},
		{
			name:        "without plugins ephemeral",
			workerGroup: "workerGroup",
			bucket:      "bucketName",
			events:      []string{"execute"},
			plugins:     []string{},
			ephemeral:   true,
			expected:    []string{},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			assert.ElementsMatch(t, tt.expected, StreamKeys(tt.plugins, tt.workerGroup, tt.bucket, tt.events, tt.ephemeral))
		})
	}
}
