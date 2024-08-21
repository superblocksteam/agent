package akeylesssecretsmanager

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNormalizePrefix(t *testing.T) {
	for _, tc := range []struct {
		name           string
		input          string
		expectedOutput string
	}{
		{
			name:           "empty string",
			input:          "",
			expectedOutput: "",
		},
		{
			name:           "leading whitespace",
			input:          " foo",
			expectedOutput: "/foo/",
		},
		{
			name:           "trailing whitespace",
			input:          "foo ",
			expectedOutput: "/foo/",
		},
		{
			name:           "leading and trailing whitespace",
			input:          " foo ",
			expectedOutput: "/foo/",
		},
		{
			name:           "single word, no slashes",
			input:          "foo",
			expectedOutput: "/foo/",
		},
		{
			name:           "single word, leading slash",
			input:          "/foo",
			expectedOutput: "/foo/",
		},
		{
			name:           "single word, trailing slash",
			input:          "foo/",
			expectedOutput: "/foo/",
		},
		{
			name:           "multiple words, no leading or trailing slashes",
			input:          "foo/bar",
			expectedOutput: "/foo/bar/",
		},
		{
			name:           "multiple words, leading slash",
			input:          "/foo/bar",
			expectedOutput: "/foo/bar/",
		},
		{
			name:           "multiple words, trailing slash",
			input:          "foo/bar/",
			expectedOutput: "/foo/bar/",
		},
	} {

		t.Run(tc.name, func(t *testing.T) {
			actualOutput := normalizePrefix(tc.input)
			assert.Equal(t, tc.expectedOutput, actualOutput)
		})
	}
}

func TestNormalizeSecretNameToAkeyless(t *testing.T) {
	for _, tc := range []struct {
		name           string
		input          string
		expectedOutput string
	}{
		{
			name:           "empty string",
			input:          "",
			expectedOutput: "",
		},
		{
			name:           "single word, no slashes",
			input:          "foo",
			expectedOutput: "/foo",
		},
		{
			name:           "single word, leading slash",
			input:          "/foo",
			expectedOutput: "/foo",
		},
		{
			name:           "multiple words, leading slash",
			input:          "/foo/bar",
			expectedOutput: "/foo/bar",
		},
	} {

		t.Run(tc.name, func(t *testing.T) {
			actualOutput := normalizeSecretNameToAkeyless(tc.input)
			assert.Equal(t, tc.expectedOutput, actualOutput)
		})
	}
}

func TestNormalizeSecretNameFromAkeyless(t *testing.T) {
	for _, tc := range []struct {
		name           string
		input          string
		expectedOutput string
	}{
		{
			name:           "empty string",
			input:          "",
			expectedOutput: "",
		},
		{
			name:           "single word, leading slash",
			input:          "/foo",
			expectedOutput: "foo",
		},
		{
			name:           "multiple words, leading slash",
			input:          "/foo/bar",
			expectedOutput: "/foo/bar",
		},
	} {

		t.Run(tc.name, func(t *testing.T) {
			actualOutput := normalizeSecretNameFromAkeyless(tc.input)
			assert.Equal(t, tc.expectedOutput, actualOutput)
		})
	}
}
