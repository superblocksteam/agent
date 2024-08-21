package metadata

import "strings"

func GetTagsMap(tagsString string) map[string][]string {
	if len(tagsString) == 0 {
		return make(map[string][]string)
	}

	tagsMap := make(map[string][]string)
	kvPairs := strings.Split(tagsString, ",")
	for _, tag := range kvPairs {
		parts := strings.Split(tag, ":")
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if key == "" || value == "" {
			continue
		}
		tagsMap[key] = append(tagsMap[key], value)
	}

	return tagsMap
}
