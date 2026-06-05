package metadata

import "strings"

func GetTagsMap(tagsString string) map[string][]string {
	if len(tagsString) == 0 {
		return make(map[string][]string)
	}

	tagsMap := make(map[string][]string)
	kvPairs := strings.Split(tagsString, ",")
	for _, tag := range kvPairs {
		separatorIndex := strings.LastIndex(tag, ":")
		if separatorIndex == -1 {
			continue
		}
		key := strings.TrimSpace(tag[:separatorIndex])
		value := strings.TrimSpace(tag[separatorIndex+1:])
		if key == "" || value == "" {
			continue
		}
		tagsMap[key] = append(tagsMap[key], value)
	}

	return tagsMap
}
