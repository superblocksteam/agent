package metadata

import (
	"strings"

	"github.com/superblocksteam/agent/pkg/utils"
)

func GetTagsMap(tagsString string) map[string][]string {
	return parseTagsString(tagsString)
}

func GetTagsSetMap(tagsString string) map[string]*utils.Set[string] {
	tagsMap := parseTagsString(tagsString)
	if len(tagsMap) == 0 {
		return make(map[string]*utils.Set[string])
	}

	tagsSetMap := make(map[string]*utils.Set[string], len(tagsMap))
	for key, values := range tagsMap {
		tagsSetMap[key] = utils.NewSet(values...)
	}

	return tagsSetMap
}

func parseTagsString(tagsString string) map[string][]string {
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
