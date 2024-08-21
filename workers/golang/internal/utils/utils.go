package utils

import "strings"

func SanitizeAgentKey(key string) string {
	return strings.NewReplacer("/", "__", "+", "--").Replace(key)
}
