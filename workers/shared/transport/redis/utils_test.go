package redis

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStreamKeys(t *testing.T) {
	t.Parallel()

	for _, tt := range []struct {
		name                   string
		plugins                []string
		workerGroup            string
		buckets                []string
		variants               []string
		events                 []string
		includeStandardStreams bool
		expected               []string
	}{
		{
			name:                   "standard streams only",
			plugins:                []string{"postgres"},
			workerGroup:            "main",
			buckets:                []string{"bucketName"},
			variants:               nil,
			events:                 []string{"execute"},
			includeStandardStreams: true,
			expected: []string{
				"agent.main.bucket.bucketName.plugin.postgres.event.execute",
			},
		},
		{
			name:                   "standard streams empty variants slice",
			plugins:                []string{"postgres"},
			workerGroup:            "main",
			buckets:                []string{"bucketName"},
			variants:               []string{},
			events:                 []string{"execute"},
			includeStandardStreams: true,
			expected: []string{
				"agent.main.bucket.bucketName.plugin.postgres.event.execute",
			},
		},
		{
			name:                   "single variant without standard",
			plugins:                []string{"postgres"},
			workerGroup:            "main",
			buckets:                []string{"bucketName"},
			variants:               []string{"ephemeral"},
			events:                 []string{"execute"},
			includeStandardStreams: false,
			expected: []string{
				"agent.main.bucket.bucketName.ephemeral.plugin.postgres.event.execute",
			},
		},
		{
			name:                   "variant plus standard",
			plugins:                []string{"postgres"},
			workerGroup:            "main",
			buckets:                []string{"bucketName"},
			variants:               []string{"ephemeral"},
			events:                 []string{"execute"},
			includeStandardStreams: true,
			expected: []string{
				"agent.main.bucket.bucketName.ephemeral.plugin.postgres.event.execute",
				"agent.main.bucket.bucketName.plugin.postgres.event.execute",
			},
		},
		{
			name:                   "multiple variants without standard",
			plugins:                []string{"python"},
			workerGroup:            "main",
			buckets:                []string{"BA", "BE"},
			variants:               []string{"ephemeral", "canary"},
			events:                 []string{"execute"},
			includeStandardStreams: false,
			expected: []string{
				"agent.main.bucket.BA.ephemeral.plugin.python.event.execute",
				"agent.main.bucket.BE.ephemeral.plugin.python.event.execute",
				"agent.main.bucket.BA.canary.plugin.python.event.execute",
				"agent.main.bucket.BE.canary.plugin.python.event.execute",
			},
		},
		{
			name:                   "non-execute events use BA bucket for each variant",
			plugins:                []string{"postgres"},
			workerGroup:            "workerGroup",
			buckets:                []string{"ignoredForNonExecute"},
			variants:               []string{"ephemeral"},
			events:                 []string{"stream"},
			includeStandardStreams: false,
			expected: []string{
				"agent.workerGroup.bucket.BA.ephemeral.plugin.postgres.event.stream",
			},
		},
		{
			name:                   "execute and non-execute with variant and standard",
			plugins:                []string{"postgres"},
			workerGroup:            "main",
			buckets:                []string{"bucketName"},
			variants:               []string{"ephemeral"},
			events:                 []string{"execute", "metadata"},
			includeStandardStreams: true,
			expected: []string{
				"agent.main.bucket.bucketName.ephemeral.plugin.postgres.event.execute",
				"agent.main.bucket.BA.ephemeral.plugin.postgres.event.metadata",
				"agent.main.bucket.bucketName.plugin.postgres.event.execute",
				"agent.main.bucket.BA.plugin.postgres.event.metadata",
			},
		},
		{
			name:                   "no streams when variants empty and standard disabled",
			plugins:                []string{"postgres"},
			workerGroup:            "main",
			buckets:                []string{"bucketName"},
			variants:               nil,
			events:                 []string{"execute"},
			includeStandardStreams: false,
			expected:               []string{},
		},
		{
			name:                   "without events",
			plugins:                []string{"postgres", "javascript"},
			workerGroup:            "main",
			buckets:                []string{"bucketName"},
			variants:               []string{"ephemeral"},
			events:                 []string{},
			includeStandardStreams: true,
			expected:               []string{},
		},
		{
			name:                   "without plugins",
			plugins:                []string{},
			workerGroup:            "main",
			buckets:                []string{"bucketName"},
			variants:               []string{"ephemeral"},
			events:                 []string{"execute"},
			includeStandardStreams: true,
			expected:               []string{},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := StreamKeys(tt.plugins, tt.workerGroup, tt.buckets, tt.variants, tt.events, tt.includeStandardStreams)
			assert.ElementsMatch(t, tt.expected, got)
		})
	}
}
