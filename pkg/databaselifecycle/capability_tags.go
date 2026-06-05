package databaselifecycle

import "slices"

const (
	capabilityTagOperations          = "databaseLifecycle:operations"
	capabilityTagEngines             = "databaseLifecycle:engines"
	capabilityTagEnvironmentProfiles = "databaseLifecycle:environmentProfiles"
	environmentProfileSeparator      = ":"
)

func (config LifecycleConfig) CapabilityTags() map[string][]string {
	values := map[string]map[string]struct{}{
		capabilityTagOperations:          {},
		capabilityTagEngines:             {},
		capabilityTagEnvironmentProfiles: {},
	}

	for _, entry := range config.Entries {
		for _, profile := range entry.Profiles {
			addCapabilityTag(values, capabilityTagEnvironmentProfiles, entry.Environment+environmentProfileSeparator+profile)
		}
		for _, engine := range entry.Engines {
			addCapabilityTag(values, capabilityTagEngines, engine)
		}
		for operation := range entry.ModuleSelectors {
			addCapabilityTag(values, capabilityTagOperations, operation)
		}
	}

	tags := make(map[string][]string)
	for key, set := range values {
		if len(set) > 0 {
			tags[key] = sortedCapabilityValues(set)
		}
	}
	return tags
}

func CapabilityTagsFromEnv(getenv func(string) string) (map[string][]string, error) {
	rawConfig := getenv(envConfig)
	if rawConfig == "" {
		return map[string][]string{}, nil
	}
	config, err := parseLifecycleConfig(rawConfig)
	if err != nil {
		return nil, err
	}
	return config.CapabilityTags(), nil
}

func MergeCapabilityTags(tags map[string][]string, capabilityTags map[string][]string) map[string][]string {
	if tags == nil {
		tags = make(map[string][]string)
	}

	for key, values := range capabilityTags {
		replacement := make(map[string]struct{})
		for _, value := range values {
			if value != "" {
				replacement[value] = struct{}{}
			}
		}
		if len(replacement) > 0 {
			tags[key] = sortedCapabilityValues(replacement)
		} else {
			delete(tags, key)
		}
	}
	return tags
}

func addCapabilityTag(values map[string]map[string]struct{}, key string, value string) {
	if value != "" {
		values[key][value] = struct{}{}
	}
}

func sortedCapabilityValues(values map[string]struct{}) []string {
	sorted := make([]string, 0, len(values))
	for value := range values {
		sorted = append(sorted, value)
	}
	slices.Sort(sorted)
	return sorted
}
