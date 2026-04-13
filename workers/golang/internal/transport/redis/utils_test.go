package redis

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStreamKeys(t *testing.T) {
	for _, tt := range []struct {
		name                   string
		workerGroup            string
		buckets                []string
		variants               []string
		events                 []string
		includeStandardStreams bool
		expected               []string
		plugins                []string
	}{
		{
			name:                   "happy path",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucketName"},
			variants:               nil,
			events:                 []string{"execute"},
			includeStandardStreams: true,
			plugins:                []string{"postgres"},
			expected:               []string{"agent.workerGroup.bucket.bucketName.plugin.postgres.event.execute"},
		},
		{
			name:                   "happy path ephemeral variant only",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucketName"},
			variants:               []string{"ephemeral"},
			events:                 []string{"execute"},
			includeStandardStreams: false,
			plugins:                []string{"postgres"},
			expected:               []string{"agent.workerGroup.bucket.bucketName.ephemeral.plugin.postgres.event.execute"},
		},
		{
			name:                   "with multiple events",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucketName"},
			variants:               nil,
			events:                 []string{"execute", "stream"},
			includeStandardStreams: true,
			plugins:                []string{"postgres"},
			expected: []string{
				"agent.workerGroup.bucket.bucketName.plugin.postgres.event.execute",
				"agent.workerGroup.bucket.BA.plugin.postgres.event.stream",
			},
		},
		{
			name:                   "with multiple plugins",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucketName"},
			variants:               nil,
			events:                 []string{"execute"},
			includeStandardStreams: true,
			plugins:                []string{"postgres", "javascript"},
			expected: []string{
				"agent.workerGroup.bucket.bucketName.plugin.postgres.event.execute",
				"agent.workerGroup.bucket.bucketName.plugin.javascript.event.execute",
			},
		},
		{
			name:                   "with multiple events and plugins ephemeral variant only",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucketName"},
			variants:               []string{"ephemeral"},
			events:                 []string{"execute", "metadata"},
			includeStandardStreams: false,
			plugins:                []string{"postgres", "javascript"},
			expected: []string{
				"agent.workerGroup.bucket.bucketName.ephemeral.plugin.postgres.event.execute",
				"agent.workerGroup.bucket.BA.ephemeral.plugin.postgres.event.metadata",
				"agent.workerGroup.bucket.bucketName.ephemeral.plugin.javascript.event.execute",
				"agent.workerGroup.bucket.BA.ephemeral.plugin.javascript.event.metadata",
			},
		},
		{
			name:                   "with multiple buckets and events and plugins ephemeral variant only",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucket1", "bucket2"},
			variants:               []string{"ephemeral"},
			events:                 []string{"execute", "metadata"},
			includeStandardStreams: false,
			plugins:                []string{"postgres", "javascript"},
			expected: []string{
				"agent.workerGroup.bucket.bucket1.ephemeral.plugin.postgres.event.execute",
				"agent.workerGroup.bucket.bucket2.ephemeral.plugin.postgres.event.execute",
				"agent.workerGroup.bucket.BA.ephemeral.plugin.postgres.event.metadata",
				"agent.workerGroup.bucket.bucket1.ephemeral.plugin.javascript.event.execute",
				"agent.workerGroup.bucket.bucket2.ephemeral.plugin.javascript.event.execute",
				"agent.workerGroup.bucket.BA.ephemeral.plugin.javascript.event.metadata",
			},
		},
		{
			name:                   "without events",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucketName"},
			variants:               nil,
			events:                 []string{},
			includeStandardStreams: true,
			plugins:                []string{"postgres", "javascript"},
			expected:               []string{},
		},
		{
			name:                   "without events ephemeral variant only",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucketName"},
			variants:               []string{"ephemeral"},
			events:                 []string{},
			includeStandardStreams: false,
			plugins:                []string{"postgres", "javascript"},
			expected:               []string{},
		},
		{
			name:                   "without plugins",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucketName"},
			variants:               nil,
			events:                 []string{"execute"},
			includeStandardStreams: true,
			plugins:                []string{},
			expected:               []string{},
		},
		{
			name:                   "without plugins ephemeral variant only",
			workerGroup:            "workerGroup",
			buckets:                []string{"bucketName"},
			variants:               []string{"ephemeral"},
			events:                 []string{"execute"},
			includeStandardStreams: false,
			plugins:                []string{},
			expected:               []string{},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			assert.ElementsMatch(t, tt.expected, StreamKeys(tt.plugins, tt.workerGroup, tt.buckets, tt.variants, tt.events, tt.includeStandardStreams))
		})
	}
}
