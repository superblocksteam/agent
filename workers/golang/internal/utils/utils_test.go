package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSanitizeAgentKey(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name        string
		inputKey    string
		expectedKey string
	}{
		{
			name:        "replaces slash with double underscores",
			inputKey:    "agent/123",
			expectedKey: "agent__123",
		},
		{
			name:        "replaces plus with double dashes",
			inputKey:    "agent+123",
			expectedKey: "agent--123",
		},
		{
			name:        "replaces both slash and plus",
			inputKey:    "agent/12+3",
			expectedKey: "agent__12--3",
		},
		{
			name:        "no replacement needed",
			inputKey:    "agent123",
			expectedKey: "agent123",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			sanitizedKey := SanitizeAgentKey(tc.inputKey)
			assert.Equal(t, tc.expectedKey, sanitizedKey)
		})
	}
}
